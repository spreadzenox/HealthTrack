/**
 * Routes App Attest du relais (I6-RELAIS-5d-1), pour l'app iPhone :
 * - POST /v1/attest/challenge → `{ challenge, expiresInSec }` : défi de 32 octets aléatoires (base64), lié à
 *   l'installation (`X-Install-Id`), valable 5 minutes et utilisable une seule fois ;
 * - POST /v1/attest/register  → `{ keyId, attestation, challenge }` : l'iPhone envoie l'attestation de sa clé
 *   (DCAppAttestService.attestKey avec SHA-256(défi)) ; le relais brûle le défi, fait vérifier l'attestation par le
 *   registre (src/attestregistry.js) et lie la clé à l'installation. Réponse `{ ok: true, environment }`.
 *
 * Les routes n'existent que si APP_ATTEST_MODE vaut `observe` ou `enforce` et qu'un Team ID est réglé (APPLE_TEAM_ID) :
 * par défaut (`off`), rien ne change. Les défis vivent en mémoire de l'instance : si Cloud Run envoie les deux appels
 * sur deux instances, l'enregistrement échoue (`challenge`) et l'iPhone redemande un défi.
 * Journaux : statut, raison du refus et empreinte de l'installation, jamais le défi, la clé ni l'attestation.
 */
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { AppAttestError } from './appattest.js'

export const APP_ATTEST_MODES = ['off', 'observe', 'enforce']
export const CHALLENGE_TTL_MS = 5 * 60_000
/** Taille maximale des champs de l'enregistrement (l'attestation fait environ 5 Ko en base64). */
const MAX_FIELD_CHARS = 24 * 1024

export const appAttestModeOf = (value) => {
  const mode = String(value ?? '').trim().toLowerCase()
  return APP_ATTEST_MODES.includes(mode) ? mode : 'off'
}

/** Défis en mémoire : `issue(installId)` → base64 ; `consume(installId, challenge)` → vrai une seule fois. */
export function createChallengeStore({ now = Date.now, ttlMs = CHALLENGE_TTL_MS, max = 10_000 } = {}) {
  /** défi (base64) → { install, until } ; ordre d'insertion = ordre d'éviction */
  const pending = new Map()
  const prune = (t) => {
    for (const [key, entry] of pending) {
      if (entry.until > t && pending.size < max) break
      pending.delete(key)
    }
  }
  return {
    issue(installId) {
      const t = now()
      prune(t)
      const challenge = randomBytes(32).toString('base64')
      pending.set(challenge, { install: String(installId), until: t + ttlMs })
      return challenge
    },
    consume(installId, challenge) {
      if (typeof challenge !== 'string' || !pending.has(challenge)) return false
      const entry = pending.get(challenge)
      // Brûlé à la première présentation, réussie ou non : un défi ne sert jamais deux fois
      pending.delete(challenge)
      const a = Buffer.from(entry.install)
      const b = Buffer.from(String(installId))
      return entry.until > now() && a.length === b.length && timingSafeEqual(a, b)
    },
    size: () => pending.size,
  }
}

const isField = (value) => typeof value === 'string' && value.length > 0 && value.length <= MAX_FIELD_CHARS
/** Assertion d'une requête : quelques centaines d'octets en base64 ; keyId : 32 octets en base64. */
const MAX_ASSERTION_CHARS = 4096
const isHeader = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max
/** Analyse de test du workflow de déploiement, comptée à part dans le bilan. */
const isCiInstall = (installId) => String(installId).startsWith('ci-smoke-')

/**
 * @param {{ registry: ReturnType<import('./attestregistry.js').createAttestRegistry>,
 *   challenges?: ReturnType<typeof createChallengeStore>, mode?: string, log?: Function, hash?: Function }} deps
 */
export function createAttestRoutes({ registry, challenges = createChallengeStore(), mode = 'observe', log = () => {}, hash = (id) => id }) {
  const effective = appAttestModeOf(mode)
  return {
    mode: effective,
    challenge(installId) {
      return { status: 200, payload: { challenge: challenges.issue(installId), expiresInSec: Math.round(CHALLENGE_TTL_MS / 1000) } }
    },
    async register(installId, body) {
      const { keyId, attestation, challenge } = body ?? {}
      if (!isField(keyId) || !isField(attestation) || !isField(challenge)) {
        return { status: 400, payload: { error: 'bad_request', message: 'keyId, attestation et challenge attendus.' } }
      }
      const entry = { event: 'appattest', op: 'register', mode: effective, install: hash(installId) }
      if (!challenges.consume(installId, challenge)) {
        log({ ...entry, status: 'rejected', reason: 'challenge' })
        return { status: 403, payload: { error: 'attest', reason: 'challenge' } }
      }
      try {
        const result = await registry.register({ installId, keyId, attestation, challenge: Buffer.from(challenge, 'base64') })
        log({ ...entry, status: result.already ? 'already' : 'registered', environment: result.environment, category: result.category, persisted: result.persisted })
        return { status: 200, payload: { ok: true, environment: result.environment } }
      } catch (err) {
        if (err instanceof AppAttestError) {
          log({ ...entry, status: 'rejected', reason: err.reason })
          return { status: 403, payload: { error: 'attest', reason: err.reason } }
        }
        log({ ...entry, status: 'unavailable', httpStatus: err?.status ?? null })
        return { status: 503, payload: { error: 'unavailable', message: 'Réessayez dans un instant.' } }
      }
    },

    /**
     * Vérifie l'assertion d'une requête iPhone (I6-RELAIS-5d-2), appelée par la garde d'intégrité.
     * `attest` = en-têtes X-AppAttest-Key / X-AppAttest-Assertion / X-AppAttest-Time ; `body` = corps brut (octets).
     * Statuts : attest_passed, attest_missing, attest_rejected, attest_unavailable. `ok` ne vaut faux qu'en `enforce`,
     * pour une assertion absente ou refusée ; un registre injoignable (Firestore) ne bloque jamais.
     * Journal `event: 'integrity'`, `platform: 'ios'` (même bilan que Play Integrity), jamais la clé ni l'assertion.
     * @returns {Promise<{ ok: boolean, mode: string, status: string }>}
     */
    async verify(installId, { attest = {}, body = Buffer.alloc(0) } = {}) {
      const { keyId, assertion, time } = attest ?? {}
      const entry = { event: 'integrity', platform: 'ios', mode: effective, ci: isCiInstall(installId), install: hash(installId) }
      const done = (status, extra = {}) => {
        log({ ...entry, status, ...extra })
        const blocked = status === 'attest_missing' || status === 'attest_rejected'
        return { ok: !(effective === 'enforce' && blocked), mode: effective, status }
      }
      if (!isHeader(keyId, 64) || !isHeader(assertion, MAX_ASSERTION_CHARS) || !isHeader(time, 16)) return done('attest_missing')
      try {
        const result = await registry.check({ installId, keyId, assertion, time, body })
        return done('attest_passed', { environment: result.environment, persisted: result.persisted })
      } catch (err) {
        if (err instanceof AppAttestError) return done('attest_rejected', { reasons: [err.reason] })
        return done('attest_unavailable', { httpStatus: err?.status ?? null })
      }
    },
  }
}
