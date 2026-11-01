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
 * - POST /v1/bench/analyze      → banc Silver / Gold (GOLD-b5, .github/workflows/bench-gold.yml) : jeton OIDC du compte
 *   de la CI obligatoire ; `{ tier: 'silver' | 'gold', dish, kind, image | description }`. Même chemin que l'analyse
 *   (modèles, plafond global du jour et par minute, plafond Gold du jour, budget du mois) ; la réponse dit quel
 *   niveau a réellement répondu (`served`) pour que le banc écarte une mesure Gold servie par Flash-Lite.
 *
 * Play Integrity (src/integrity.js) : en-tête facultatif `X-Integrity-Token` sur l'analyse ; selon INTEGRITY_MODE, un
 * verdict refusé est seulement journalisé (observe) ou bloque l'analyse avec une 403 `integrity` (enforce). Seules les
 * requêtes Android sont concernées : `X-Platform: ios` (app iPhone) n'est jamais bloqué.
 *
 * Crédits : en-têtes facultatifs `X-Credits` (dernier état donné par le relais) et `X-Purchase-Token` (jeton
 * Google Play, pour retrouver le premium après un redémarrage du relais). Les réponses d'analyse et de crédits
 * portent `credits: { plan, remaining, resetAt, state, … }`.
 *
 * Rien n'est stocké : la photo ou le texte ne vivent que le temps de la requête, et les journaux ne contiennent que
 * le type d'analyse, le modèle, la durée et le statut (jamais le contenu, ni l'identifiant d'installation en clair).
 *
 * Niveaux (31/10) : Gold appelle d'abord le dernier Flash (GOLD_MODELS, réflexion MEDIUM, délai d'environ 25 s) puis
 * Flash-Lite en secours ; Silver et gratuit appellent Flash-Lite. Les jetons de chaque appel (entrée, cache, réflexion,
 * sortie) et son coût sont journalisés et cumulés par mois (src/costs.js) : au-delà de 15 € de Vertex dans le mois,
 * Gold repasse sur Flash-Lite ; au-delà de 19 €, plus d'analyse jusqu'au mois suivant.
 */
import { createHash } from 'node:crypto'
import { HttpError, readJson } from './http.js'
import { stripJpegMetadata } from './jpeg.js'
import { parseClientState } from './credits.js'
import { dayKey } from './quota.js'
import { readUsage } from './costs.js'
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

/** Refus Play Integrity (mode enforce) : app modifiée, appareil non certifié, ou app installée hors de Google Play. */
export const INTEGRITY_MESSAGE =
  "L'analyse IA n'est disponible que dans l'app installée depuis Google Play, sur un téléphone certifié. Mettez l'app à jour depuis le Play Store, puis réessayez."

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
export function createHandler({ quota, vertex, ingredientNames, credits = null, billing = null, integrity = null, billingQuota = null, benchAuth = null, goldVertex = null, costs = null, goldDailyCap = 40, goldInstalls = [], allowedOrigins = [], log = () => {}, now = Date.now }) {
  const origins = new Set(allowedOrigins)
  /** installId → { premium, source, until } : droits relus récemment (mémoire seulement). */
  const premiumCache = new Map()
  /** Empreintes (hashInstallId) des installations qui gardent Gold hors période de lancement (GOLD_INSTALLS). */
  const goldSet = new Set(goldInstalls)
  /** Analyses Gold du jour (UTC) sur cette instance : borne le coût d'une journée ; le cumul du mois, lui, est durable. */
  const goldDay = { day: '', count: 0 }

  function rememberEntitlement(installId, payload) {
    const t = now()
    const expires = Date.parse(payload?.launchUntil ?? payload?.expiresAt ?? '')
    const horizon = t + PREMIUM_CACHE_MS
    const until = payload?.premium && Number.isFinite(expires) ? Math.min(expires, horizon) : horizon
    premiumCache.set(installId, { premium: Boolean(payload?.premium), source: payload?.premium ? payload?.source ?? null : null, tier: payload?.premium ? payload?.tier ?? null : null, until })
  }

  /** Droits de cette installation : cache, sinon une relecture (bornée par billingQuota) auprès de Google Play. */
  async function entitlementOf(installId, purchaseToken) {
    const cached = premiumCache.get(installId)
    const fallback = { premium: Boolean(cached?.premium), source: cached?.source ?? null, tier: cached?.tier ?? null }
    if (cached && cached.until > now()) return fallback
    if (!billing) return { premium: false, source: null, tier: null }
    const slot = billingQuota ? billingQuota.take(installId) : { ok: true }
    if (!slot.ok) return fallback
    try {
      const result = await billing.verify(purchaseToken ? { purchaseToken } : {}, installId)
      rememberEntitlement(installId, result.payload)
      const premium = Boolean(result.payload?.premium)
      return { premium, source: premium ? result.payload?.source ?? null : null, tier: premium ? result.payload?.tier ?? null : null }
    } catch (err) {
      log({ event: 'premium_lookup_failed', status: err?.status ?? null })
      return fallback
    }
  }

  /**
   * Niveau de l'analyse : Gold pendant la période de lancement (toute installation play premium par `launch`), pour un
   * abonnement au produit Gold (`halcya_gold`, niveau relu chez Google) et pour les installations de GOLD_INSTALLS ;
   * Silver pour l'abonnement historique ; sinon gratuit. Silver et gratuit gardent Flash-Lite.
   */
  function tierOf(installId, entitlement) {
    if (!entitlement.premium) return goldSet.has(hashInstallId(installId)) ? 'gold' : 'free'
    if (entitlement.source === 'launch' || entitlement.tier === 'gold' || goldSet.has(hashInstallId(installId))) return 'gold'
    return 'silver'
  }

  /** Gold sert le dernier Flash seulement sous les plafonds : coût du mois (15 €) et analyses Gold du jour. */
  function goldSlot() {
    if (!goldVertex) return { ok: false, why: 'off' }
    if (costs && !costs.goldAllowed()) return { ok: false, why: 'month_budget' }
    const day = dayKey(now())
    if (goldDay.day !== day) Object.assign(goldDay, { day, count: 0 })
    if (goldDay.count >= goldDailyCap) return { ok: false, why: 'day_cap' }
    goldDay.count += 1
    return { ok: true }
  }

  /** Note les jetons de chaque appel facturé (jamais le contenu) et ajoute leur coût au cumul du mois. */
  async function account(spent, tier) {
    let eur = 0
    for (const { model, usageMetadata } of spent ?? []) {
      const usage = readUsage(usageMetadata)
      let cost = null
      if (costs) {
        try {
          cost = await costs.add(model, usage)
        } catch (err) {
          log({ event: 'costs_store_failed', op: 'add', status: err?.status ?? null })
        }
      }
      if (cost !== null) eur += cost
      log({ event: 'usage', model, tier, ...usage, ...(cost !== null ? { eur: Number(cost.toFixed(5)) } : {}) })
    }
    return eur
  }

  async function generate(request, tier) {
    const args = { systemInstruction: request.systemInstruction, parts: request.parts, schema: RESPONSE_SCHEMA }
    if (tier === 'gold') {
      const slot = goldSlot()
      if (slot.ok) {
        try {
          const out = await goldVertex.generateJson(args)
          const eur = await account(out.spent, tier)
          return { ...out, eur, served: 'gold' }
        } catch (err) {
          // Délai dépassé, modèle indisponible ou plafond chez Google : Flash-Lite prend le relais
          await account(err?.spent, tier)
          log({ event: 'gold_fallback', status: err?.status ?? null, reason: err?.name === 'TimeoutError' ? 'timeout' : 'error', message: String(err?.message ?? err).slice(0, 200) })
        }
      } else {
        log({ event: 'gold_fallback', reason: slot.why })
      }
    }
    try {
      const out = await vertex.generateJson(args)
      const eur = await account(out.spent, tier)
      return { ...out, eur, served: 'lite' }
    } catch (err) {
      await account(err?.spent, tier)
      throw err
    }
  }

  const purchaseTokenHeader = (req) => {
    const raw = String(req.headers['x-purchase-token'] ?? '')
    return /^[A-Za-z0-9._-]{20,4096}$/.test(raw) ? raw : null
  }
  const reportedCredits = (req) => parseClientState(req.headers['x-credits'])

  // Registre durable des crédits (Firestore) : une panne ne bloque jamais l'analyse, on continue en mémoire
  async function hydrateCredits(installId) {
    try {
      await credits.hydrate?.(installId)
    } catch (err) {
      log({ event: 'credits_store_failed', op: 'get', status: err?.status ?? null })
    }
  }
  async function persistCredits(installId) {
    try {
      await credits.persist?.(installId)
    } catch (err) {
      log({ event: 'credits_store_failed', op: 'set', status: err?.status ?? null })
    }
  }

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
        headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Install-Id, X-Credits, X-Purchase-Token, X-Integrity-Token, X-Integrity-Status, X-Test-Device, X-Platform'
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
      const entitlement = await entitlementOf(installId, purchaseTokenHeader(req))
      const { premium } = entitlement
      await hydrateCredits(installId)
      send(res, 200, { credits: credits.peek(installId, { premium, tier: tierOf(installId, entitlement), reported: reportedCredits(req) }) }, origin)
      return
    }

    if (benchAuth && path === '/v1/bench/analyze') {
      if (req.method !== 'POST') {
        send(res, 405, { error: 'method', message: 'POST attendu.' }, origin)
        return
      }
      const started = now()
      let slotId = null
      try {
        if (!(await benchAuth(req.headers.authorization))) throw new HttpError(401, 'unauthenticated', 'Banc réservé à la CI.')
        const body = await readJson(req, MAX_BODY_BYTES)
        const tier = body?.tier
        if (tier !== 'gold' && tier !== 'silver') throw new HttpError(400, 'bad_tier', 'Niveau attendu : silver ou gold.')
        const dish = typeof body?.dish === 'string' ? body.dish : ''
        if (!/^[A-Za-z0-9_-]{1,40}$/.test(dish)) throw new HttpError(400, 'bad_dish', 'Identifiant de plat attendu.')
        const request = buildRequest(body, ingredientNames)
        if (costs) {
          try {
            await costs.hydrate()
          } catch (err) {
            log({ event: 'costs_store_failed', op: 'get', status: err?.status ?? null })
          }
          if (costs.stopped()) {
            send(res, 429, { error: 'quota', scope: 'global', reason: 'month_budget' }, origin)
            return
          }
        }
        // Un « identifiant d'installation » par plat : le banc compte dans les plafonds global et par minute
        const slot = quota.take(`bench-${dish}`)
        if (!slot.ok) {
          send(res, 429, { error: 'quota', scope: slot.scope, resetAt: slot.resetAt }, origin)
          return
        }
        slotId = `bench-${dish}`
        const { parsed, model, location, eur, served } = await generate(request, tier)
        log({ event: 'bench', kind: request.kind, model, location, tier, served, eur: Number(eur.toFixed(5)), status: 200, ms: now() - started })
        send(res, 200, { parsed, model, served, eur: Number(eur.toFixed(5)), ms: now() - started }, origin)
      } catch (err) {
        if (err instanceof HttpError) {
          send(res, err.status, { error: err.code, message: err.message }, origin)
          return
        }
        if (slotId && !err?.billed) quota.refund(slotId)
        log({ event: 'error', route: path, status: err?.status ?? null, message: String(err?.message ?? err).slice(0, 300) })
        send(res, err?.status === 429 ? 503 : 502, { error: 'upstream', status: err?.status ?? null }, origin)
      }
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
    let tier = 'free'
    try {
      installId = String(req.headers['x-install-id'] ?? '')
      if (!INSTALL_ID.test(installId)) throw new HttpError(400, 'install_id', 'Identifiant d\'installation manquant.')
      // Appareil de test de Google (Firebase Test Lab : robots du rapport de pré-lancement de la Play Console), signalé
      // par l'app (INSTALLS-21). Seulement pour les bilans : il ne change aucun droit, le falsifier n'apporte rien
      const testDevice = req.headers['x-test-device'] === '1'

      const body = await readJson(req, MAX_BODY_BYTES)
      const request = buildRequest(body, ingredientNames)
      kind = request.kind

      if (integrity) {
        const check = await integrity.check(installId, req.headers['x-integrity-token'], { clientStatus: req.headers['x-integrity-status'], testDevice, platform: req.headers['x-platform'] })
        if (!check.ok) throw new HttpError(403, 'integrity', INTEGRITY_MESSAGE)
      }

      // Budget Vertex du mois épuisé (19 € par défaut, sur 20 €) : plus d'analyse jusqu'au mois suivant
      if (costs) {
        try {
          await costs.hydrate()
        } catch (err) {
          log({ event: 'costs_store_failed', op: 'get', status: err?.status ?? null })
        }
        if (costs.stopped()) {
          log({ event: 'quota', scope: 'global', reason: 'month_budget' })
          send(res, 429, { error: 'quota', scope: 'global', message: QUOTA_MESSAGES.global }, origin)
          return
        }
      }

      const slot = quota.take(installId)
      if (!slot.ok) {
        log({ event: 'quota', scope: slot.scope, install: hashInstallId(installId) })
        send(res, 429, { error: 'quota', scope: slot.scope, message: QUOTA_MESSAGES[slot.scope], resetAt: slot.resetAt }, origin)
        return
      }
      reserved = true

      if (credits) {
        const entitlement = await entitlementOf(installId, purchaseTokenHeader(req))
        premium = entitlement.premium
        tier = tierOf(installId, entitlement)
        await hydrateCredits(installId)
        credit = credits.take(installId, { premium, tier, reported: reportedCredits(req) })
        if (credit.ok) await persistCredits(installId)
        if (!credit.ok) {
          quota.refund(installId)
          reserved = false
          const { ok: _ok, scope, ...state } = credit
          log({ event: 'quota', scope, install: hashInstallId(installId) })
          send(res, 429, { error: 'quota', scope, message: QUOTA_MESSAGES[scope], resetAt: credit.resetAt, credits: state }, origin)
          return
        }
      }

      const { parsed, model, location, eur, served } = await generate(request, tier)
      log({ event: 'analyze', kind, model, location, tier, served, eur: Number(eur.toFixed(5)), status: 200, ms: now() - started, install: hashInstallId(installId) })
      // Nouvelle installation qui prend son premier crédit (CREDITS-INSTALLS) : compté par jour, sans identifiant ;
      // l'analyse de test du workflow (« ci-smoke-<run> », une installation neuve à chaque fois) n'est pas comptée
      if (credit?.firstUse && !installId.startsWith('ci-smoke-')) log({ event: 'first_credit', plan: credit.plan, ...(testDevice ? { testlab: true } : {}) })
      const payload = { parsed, model, quota: { remaining: slot.remaining, resetAt: slot.resetAt } }
      if (credit) {
        const { ok: _ok, firstUse: _first, ...state } = credit
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
        if (credit?.ok) {
          credits.refund(installId, { premium })
          await persistCredits(installId)
        }
      }
      log({ event: 'error', kind, status: err?.status ?? null, ms: now() - started, message: String(err?.message ?? err).slice(0, 300) })
      const status = err?.status === 429 ? 503 : 502
      send(res, status, { error: 'upstream', message: "L'analyse IA n'a pas abouti. Réessayez dans un instant." }, origin)
    }
  }
}
