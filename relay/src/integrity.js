/**
 * Play Integrity (jalon 6b-2) : le relais vérifie que les demandes d'analyse IA viennent bien de la variante play
 * installée depuis Google Play, sur un vrai appareil, et non d'un script qui inventerait des identifiants
 * d'installation pour toucher sans fin les crédits offerts.
 *
 * - L'app joint un jeton de requête « standard » (`X-Integrity-Token`), lié à son identifiant d'installation par
 *   `requestHash` (requestHashFor) ; le relais le fait décoder par Google (`decodeIntegrityToken`, sous l'identité
 *   relay-runtime, projet Cloud relié dans la Play Console) puis lit le verdict (evaluateVerdict).
 * - Un verdict accepté vaut pour l'installation pendant VERDICT_CACHE_MS (mémoire seulement) : un décodage par jour et
 *   par installation, loin du quota gratuit de Google (10 000 / jour).
 * - Modes (INTEGRITY_MODE) : `off` (rien), `observe` (par défaut : vérifie et journalise, ne bloque jamais),
 *   `enforce` (une analyse sans verdict accepté est refusée). On passe à `enforce` quand les journaux montrent que
 *   les vrais téléphones passent.
 * - Rien n'est stocké ni journalisé du jeton ou du verdict, sauf les raisons d'un refus.
 * - Limite assumée : une réinstallation sur un vrai téléphone redonne un identifiant neuf ; les plafonds par jour du
 *   relais bornent ce cas (et les crédits durables de P24 le fermeront).
 */
import { createHash } from 'node:crypto'

const API = 'https://playintegrity.googleapis.com/v1'
export const PLAYINTEGRITY_SCOPE = 'https://www.googleapis.com/auth/playintegrity'

/** Jetons Play Integrity : longues chaînes base64url (JWE). */
const INTEGRITY_TOKEN = /^[A-Za-z0-9._-]{100,16384}$/

/** Un jeton standard plus vieux que ça est refusé (Google conseille quelques minutes). */
export const MAX_TOKEN_AGE_MS = 10 * 60_000
/** Durée pendant laquelle un verdict accepté couvre l'installation. */
export const VERDICT_CACHE_MS = 24 * 60 * 60_000
/** Durée pendant laquelle un refus n'est pas redemandé à Google (évite qu'un script fasse décoder sans fin). */
export const REJECT_CACHE_MS = 10 * 60_000

export const INTEGRITY_MODES = ['off', 'observe', 'enforce']

/** `requestHash` que l'app passe à Play Integrity : empreinte de l'identifiant d'installation (aucune donnée perso). */
export const requestHashFor = (installId) => createHash('sha256').update(`halcya-integrity:${installId}`).digest('hex')

export const isIntegrityToken = (value) => INTEGRITY_TOKEN.test(String(value ?? ''))

/**
 * Raison donnée par l'app quand elle n'a pas de jeton (en-tête `X-Integrity-Status`, 6b-2c-2) : `timeout`, `backoff`,
 * `no_plugin`, `bad_token` ou `error:<code>` (code d'erreur de Google Play, chiffres ou majuscules). Toute autre
 * valeur devient `other` : rien de libre ne finit dans les journaux.
 */
const CLIENT_STATUS = /^(timeout|backoff|no_plugin|bad_token|error:[A-Z0-9_-]{1,24})$/
export const clientIntegrityStatus = (value) => {
  if (value === undefined || value === null || value === '') return 'none'
  const text = String(value)
  return CLIENT_STATUS.test(text) ? text : 'other'
}

/** Analyse de test du workflow de déploiement : jamais de jeton, à séparer des vrais téléphones dans le bilan. */
const isCiInstall = (installId) => String(installId).startsWith('ci-smoke-')

export class IntegrityApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

/** Client minimal de l'API Play Integrity (décodage d'un jeton côté Google). */
export function createIntegrityClient({ packageName, getToken, fetchImpl = fetch, timeoutMs = 10_000 }) {
  return {
    async decode(integrityToken) {
      const token = await getToken()
      const res = await fetchImpl(`${API}/${encodeURIComponent(packageName)}:decodeIntegrityToken`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrity_token: integrityToken }),
        signal: AbortSignal.timeout(timeoutMs),
      })
      const text = await res.text()
      if (!res.ok) {
        let message = text
        try {
          message = JSON.parse(text).error?.message || text
        } catch { /* texte brut */ }
        throw new IntegrityApiError(String(message).slice(0, 300), res.status)
      }
      return JSON.parse(text).tokenPayloadExternal ?? {}
    },
  }
}

/**
 * Lit un verdict décodé. Exige : bon paquet, bon `requestHash`, jeton récent, app reconnue par Google Play et appareil
 * qui passe l'intégrité de base. La licence (`appLicensingVerdict`) est journalisée mais pas exigée : une installation
 * de test interne ou un téléphone sans compte Play actif ne doit pas perdre l'IA.
 */
export function evaluateVerdict(payload, { packageName, requestHash, now = Date.now() }) {
  const reasons = []
  const details = payload?.requestDetails ?? {}
  if (details.requestPackageName !== packageName) reasons.push('package')
  if (details.requestHash !== requestHash) reasons.push('request_hash')
  const ts = Number(details.timestampMillis)
  if (!Number.isFinite(ts) || now - ts > MAX_TOKEN_AGE_MS || ts - now > MAX_TOKEN_AGE_MS) reasons.push('stale')
  const app = payload?.appIntegrity?.appRecognitionVerdict
  if (app !== 'PLAY_RECOGNIZED') reasons.push(`app_${String(app ?? 'missing').toLowerCase()}`)
  const device = payload?.deviceIntegrity?.deviceRecognitionVerdict
  if (!Array.isArray(device) || !device.includes('MEETS_DEVICE_INTEGRITY')) reasons.push('device')
  return {
    ok: reasons.length === 0,
    reasons,
    licensed: payload?.accountDetails?.appLicensingVerdict === 'LICENSED',
  }
}

/**
 * Garde Play Integrity du relais. `check(installId, token, { clientStatus })` → `{ ok, mode, status }` ; `ok` vaut toujours `true` hors
 * du mode `enforce`. `status` : 'off' | 'trusted' (cache) | 'passed' | 'missing' | 'rejected' | 'unavailable'.
 */
export function createIntegrityGuard({ client, packageName, mode = 'observe', log = () => {}, now = Date.now, hash = (id) => id }) {
  const effective = INTEGRITY_MODES.includes(mode) ? mode : 'observe'
  /** installId → { ok, until } */
  const cache = new Map()
  const result = (ok, status) => ({ ok: effective === 'enforce' ? ok : true, mode: effective, status })

  function prune(t) {
    if (cache.size < 10_000) return
    for (const [id, entry] of cache) if (entry.until <= t) cache.delete(id)
  }

  return {
    mode: effective,
    async check(installId, integrityToken, { clientStatus } = {}) {
      if (effective === 'off' || !client) return { ok: true, mode: 'off', status: 'off' }
      const t = now()
      const cached = cache.get(installId)
      if (cached && cached.until > t) {
        return result(cached.ok, cached.ok ? 'trusted' : 'rejected')
      }
      if (!isIntegrityToken(integrityToken)) {
        log({ event: 'integrity', status: 'missing', mode: effective, client: clientIntegrityStatus(clientStatus), ci: isCiInstall(installId), install: hash(installId) })
        return result(false, 'missing')
      }
      try {
        const payload = await client.decode(integrityToken)
        const verdict = evaluateVerdict(payload, { packageName, requestHash: requestHashFor(installId), now: t })
        prune(t)
        cache.set(installId, { ok: verdict.ok, until: t + (verdict.ok ? VERDICT_CACHE_MS : REJECT_CACHE_MS) })
        log({ event: 'integrity', status: verdict.ok ? 'passed' : 'rejected', mode: effective, reasons: verdict.reasons, licensed: verdict.licensed, ci: isCiInstall(installId), install: hash(installId) })
        return result(verdict.ok, verdict.ok ? 'passed' : 'rejected')
      } catch (err) {
        // Google injoignable : on ne punit pas l'utilisateur (les plafonds du relais restent en place)
        log({ event: 'integrity', status: 'unavailable', mode: effective, httpStatus: err?.status ?? null, message: String(err?.message ?? err).slice(0, 200) })
        return { ok: true, mode: effective, status: 'unavailable' }
      }
    },
  }
}
