/**
 * Routes du relais :
 * - GET  /health            → { ok: true } (vérification du déploiement ; pas /healthz : Cloud Run réserve les chemins
 *   qui finissent par « z ») ;
 * - POST /v1/meal/analyze    → analyse d'un repas, photo (`{ kind: 'photo', image: { mimeType, data } }`) ou
 *   description (`{ kind: 'text', description }`), en-tête `X-Install-Id` obligatoire (identifiant aléatoire de
 *   l'installation). Réponse : `{ parsed, model, quota: { remaining, resetAt } }`, `parsed` étant le JSON du modèle,
 *   décodé par l'app comme dans l'appel direct.
 *
 * - POST /v1/subscription/verify → droits premium de la variante play (`{ purchaseToken? }`, en-tête `X-Install-Id`),
 *   relus chez Google Play (src/billing.js) ;
 * - POST /pubsub/rtdn          → notifications d'abonnement Google Play (push Pub/Sub authentifié) ;
 * - GET  /v1/credits            → crédits d'analyse IA de l'installation (src/credits.js), sans rien consommer.
 *
 * Crédits : en-têtes facultatifs `X-Credits` (dernier état donné par le relais) et `X-Purchase-Token` (jeton
 * Google Play, pour retrouver le premium après un redémarrage du relais). Les réponses d'analyse et de crédits
 * portent `credits: { plan, remaining, resetAt, state, … }`.
 *
 * Rien n'est stocké : la photo ou le texte ne vivent que le temps de la requête, et les journaux ne contiennent que
 * le type d'analyse, le modèle, la durée et le statut (jamais le contenu, ni l'identifiant d'installation en clair).
 */
import { createHash } from 'node:crypto'
import { HttpError, readJson } from './http.js'
import { stripJpegMetadata } from './jpeg.js'
import { parseClientState } from './credits.js'
import { MEAL_TEXT_MAX_LENGTH, RESPONSE_SCHEMA, photoInstruction, textInstruction, textUserPart } from './prompts.js'

/** Taille maximale du corps JSON (photo en base64 comprise). */
export const MAX_BODY_BYTES = 6 * 1024 * 1024
/** Taille maximale de la photo décodée (l'app l'envoie réduite à 1 280 px, ~200–400 Ko). */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

const INSTALL_ID = /^[A-Za-z0-9_-]{16,64}$/

const QUOTA_MESSAGES = {
  install: "Vous avez utilisé toutes vos analyses IA d'aujourd'hui. Elles reviennent demain.",
  global: "Le service d'analyse IA a atteint sa limite du jour. Réessayez demain.",
  minute: "Beaucoup de demandes en ce moment : réessayez dans une minute.",
  credits: "Vous avez utilisé toutes vos analyses IA gratuites. De nouvelles arrivent au début du mois prochain.",
  premium_day: "Vous avez utilisé vos analyses IA du jour. Elles reviennent demain.",
}

/** Durée pendant laquelle le relais se fie à un droit premium (ou à son absence) déjà relu chez Google Play. */
export const PREMIUM_CACHE_MS = 60 * 60_000

/** Empreinte courte de l'identifiant d'installation, pour compter sans l'écrire en clair dans les journaux. */
export const hashInstallId = (id) => createHash('sha256').update(id).digest('hex').slice(0, 12)

/** Taille maximale des corps des routes d'abonnement (jeton d'achat, message Pub/Sub). */
const SMALL_BODY_BYTES = 64 * 1024

/** Valide la demande et prépare les parties envoyées au modèle. */
export function buildRequest(body, ingredientNames) {
  if (body?.kind === 'photo') {
    const { mimeType, data } = body.image ?? {}
    if (mimeType !== 'image/jpeg' || typeof data !== 'string' || !data) {
      throw new HttpError(400, 'bad_image', 'Photo attendue au format JPEG.')
    }
    const bytes = Buffer.from(data, 'base64')
    if (bytes.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'too_large', 'Photo trop volumineuse.')
    const clean = stripJpegMetadata(bytes)
    if (!clean) throw new HttpError(400, 'bad_image', 'Photo illisible.')
    return {
      kind: 'photo',
      systemInstruction: photoInstruction(ingredientNames),
      parts: [{ inlineData: { mimeType: 'image/jpeg', data: clean.toString('base64') } }],
    }
  }
  if (body?.kind === 'text') {
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    if (!description) throw new HttpError(400, 'empty', 'Décrivez votre repas en quelques mots.')
    if (description.length > MEAL_TEXT_MAX_LENGTH) {
      throw new HttpError(400, 'too_long', `Description limitée à ${MEAL_TEXT_MAX_LENGTH} caractères.`)
    }
    return {
      kind: 'text',
      systemInstruction: textInstruction(ingredientNames),
      parts: [{ text: textUserPart(description) }],
    }
  }
  throw new HttpError(400, 'bad_kind', 'Type d\'analyse inconnu (photo ou text).')
}

/**
 * @param {{ quota: ReturnType<import('./quota.js').createQuota>, vertex: ReturnType<import('./vertex.js').createVertexClient>,
 *   ingredientNames: string[], billing?: ReturnType<import('./billing.js').createBillingRoutes>,
 *   billingQuota?: ReturnType<import('./quota.js').createQuota>, allowedOrigins?: string[],
 *   log?: (entry: object) => void, now?: () => number }} deps
 */
export function createHandler({ quota, vertex, ingredientNames, credits = null, billing = null, billingQuota = null, allowedOrigins = [], log = () => {}, now = Date.now }) {
  const origins = new Set(allowedOrigins)
  /** installId → { premium, until } : droits relus récemment (mémoire seulement). */
  const premiumCache = new Map()

  function rememberEntitlement(installId, payload) {
    const t = now()
    const expires = Date.parse(payload?.launchUntil ?? payload?.expiresAt ?? '')
    const horizon = t + PREMIUM_CACHE_MS
    const until = payload?.premium && Number.isFinite(expires) ? Math.min(expires, horizon) : horizon
    premiumCache.set(installId, { premium: Boolean(payload?.premium), until })
  }

  /** Premium de cette installation : cache, sinon une relecture (bornée par billingQuota) auprès de Google Play. */
  async function isPremium(installId, purchaseToken) {
    const cached = premiumCache.get(installId)
    if (cached && cached.until > now()) return cached.premium
    if (!billing) return false
    const slot = billingQuota ? billingQuota.take(installId) : { ok: true }
    if (!slot.ok) return Boolean(cached?.premium)
    try {
      const result = await billing.verify(purchaseToken ? { purchaseToken } : {}, installId)
      rememberEntitlement(installId, result.payload)
      return Boolean(result.payload?.premium)
    } catch (err) {
      log({ event: 'premium_lookup_failed', status: err?.status ?? null })
      return Boolean(cached?.premium)
    }
  }

  const purchaseTokenHeader = (req) => {
    const raw = String(req.headers['x-purchase-token'] ?? '')
    return /^[A-Za-z0-9._-]{20,4096}$/.test(raw) ? raw : null
  }
  const reportedCredits = (req) => parseClientState(req.headers['x-credits'])

  function send(res, status, payload, origin) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    if (origin && origins.has(origin)) {
      headers['Access-Control-Allow-Origin'] = origin
      headers.Vary = 'Origin'
    }
    res.writeHead(status, headers)
    res.end(JSON.stringify(payload))
  }

  return async function handle(req, res) {
    const origin = req.headers.origin
    const path = new URL(req.url, 'http://relay').pathname

    if (req.method === 'OPTIONS') {
      const headers = { 'Access-Control-Max-Age': '600', Vary: 'Origin' }
      if (origin && origins.has(origin)) {
        headers['Access-Control-Allow-Origin'] = origin
        headers['Access-Control-Allow-Methods'] = 'POST, GET'
        headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Install-Id, X-Credits, X-Purchase-Token'
      }
      res.writeHead(204, headers)
      res.end()
      return
    }

    if (req.method === 'GET' && path === '/health') {
      send(res, 200, { ok: true }, origin)
      return
    }

    if (billing && (path === '/v1/subscription/verify' || path === '/pubsub/rtdn')) {
      if (req.method !== 'POST') {
        send(res, 405, { error: 'method', message: 'POST attendu.' }, origin)
        return
      }
      try {
        let result
        if (path === '/pubsub/rtdn') {
          result = await billing.rtdn(await readJson(req, SMALL_BODY_BYTES), req.headers.authorization)
        } else {
          const installId = String(req.headers['x-install-id'] ?? '')
          if (!INSTALL_ID.test(installId)) throw new HttpError(400, 'install_id', 'Identifiant d\'installation manquant.')
          const body = await readJson(req, SMALL_BODY_BYTES)
          const slot = billingQuota ? billingQuota.take(installId) : { ok: true }
          if (!slot.ok) {
            send(res, 429, { error: 'quota', scope: slot.scope, message: QUOTA_MESSAGES.minute, resetAt: slot.resetAt }, origin)
            return
          }
          result = await billing.verify(body, installId)
          if (result.status === 200) rememberEntitlement(installId, result.payload)
        }
        if (result.status === 204) {
          res.writeHead(204, { 'Cache-Control': 'no-store' })
          res.end()
        } else {
          send(res, result.status, result.payload, origin)
        }
      } catch (err) {
        if (err instanceof HttpError) {
          log({ event: 'rejected', route: path, code: err.code, status: err.status })
          send(res, err.status, { error: err.code, message: err.message }, origin)
          return
        }
        log({ event: 'error', route: path, status: err?.status ?? null, message: String(err?.message ?? err).slice(0, 300) })
        send(res, 502, { error: 'upstream', message: 'Google Play ne répond pas. Réessayez dans un instant.' }, origin)
      }
      return
    }

    if (credits && path === '/v1/credits') {
      if (req.method !== 'GET') {
        send(res, 405, { error: 'method', message: 'GET attendu.' }, origin)
        return
      }
      const installId = String(req.headers['x-install-id'] ?? '')
      if (!INSTALL_ID.test(installId)) {
        send(res, 400, { error: 'install_id', message: 'Identifiant d\'installation manquant.' }, origin)
        return
      }
      const premium = await isPremium(installId, purchaseTokenHeader(req))
      send(res, 200, { credits: credits.peek(installId, { premium, reported: reportedCredits(req) }) }, origin)
      return
    }

    if (path !== '/v1/meal/analyze') {
      send(res, 404, { error: 'not_found', message: 'Adresse inconnue.' }, origin)
      return
    }
    if (req.method !== 'POST') {
      send(res, 405, { error: 'method', message: 'POST attendu.' }, origin)
      return
    }

    const started = now()
    let kind = null
    let installId = null
    let reserved = false
    let credit = null
    let premium = false
    try {
      installId = String(req.headers['x-install-id'] ?? '')
      if (!INSTALL_ID.test(installId)) throw new HttpError(400, 'install_id', 'Identifiant d\'installation manquant.')

      const body = await readJson(req, MAX_BODY_BYTES)
      const request = buildRequest(body, ingredientNames)
      kind = request.kind

      const slot = quota.take(installId)
      if (!slot.ok) {
        log({ event: 'quota', scope: slot.scope, install: hashInstallId(installId) })
        send(res, 429, { error: 'quota', scope: slot.scope, message: QUOTA_MESSAGES[slot.scope], resetAt: slot.resetAt }, origin)
        return
      }
      reserved = true

      if (credits) {
        premium = await isPremium(installId, purchaseTokenHeader(req))
        credit = credits.take(installId, { premium, reported: reportedCredits(req) })
        if (!credit.ok) {
          quota.refund(installId)
          reserved = false
          const { ok: _ok, scope, ...state } = credit
          log({ event: 'quota', scope, install: hashInstallId(installId) })
          send(res, 429, { error: 'quota', scope, message: QUOTA_MESSAGES[scope], resetAt: credit.resetAt, credits: state }, origin)
          return
        }
      }

      const { parsed, model, location } = await vertex.generateJson({
        systemInstruction: request.systemInstruction,
        parts: request.parts,
        schema: RESPONSE_SCHEMA,
      })
      log({ event: 'analyze', kind, model, location, status: 200, ms: now() - started, install: hashInstallId(installId) })
      const payload = { parsed, model, quota: { remaining: slot.remaining, resetAt: slot.resetAt } }
      if (credit) {
        const { ok: _ok, ...state } = credit
        payload.credits = state
      }
      send(res, 200, payload, origin)
    } catch (err) {
      if (err instanceof HttpError) {
        log({ event: 'rejected', kind, code: err.code, status: err.status })
        send(res, err.status, { error: err.code, message: err.message }, origin)
        return
      }
      // Échec côté Vertex : l'appel n'est rendu au quota que s'il n'a rien coûté
      if (reserved && !err?.billed) {
        quota.refund(installId)
        if (credit?.ok) credits.refund(installId, { premium })
      }
      log({ event: 'error', kind, status: err?.status ?? null, ms: now() - started, message: String(err?.message ?? err).slice(0, 300) })
      const status = err?.status === 429 ? 503 : 502
      send(res, status, { error: 'upstream', message: "L'analyse IA n'a pas abouti. Réessayez dans un instant." }, origin)
    }
  }
}
