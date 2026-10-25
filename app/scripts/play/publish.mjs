/**
 * Envoi de l'AAB de la variante play sur une piste de test Google Play (jalon 3c, journal/INFRA.md).
 *
 * API Android Publisher v3, par « edit » : ouvrir un edit → lire la langue par défaut de la fiche → importer
 * l'AAB → placer la version sur la piste (test interne par défaut) avec ses notes de version → valider l'edit.
 * Jamais la piste de production : seul le propriétaire promeut une version (« Promouvoir la version »).
 *
 * Le jeton d'accès (portée androidpublisher) vient de la connexion sans clé de la CI ; il n'est jamais écrit.
 * Les symboles de débogage natifs sont dans l'AAB (debugSymbolLevel) : Play les extrait seul.
 */

export const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'
export const UPLOAD_API = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications'
/** Pistes autorisées : jamais « production ». */
export const ALLOWED_TRACKS = ['internal', 'alpha']
export const NOTES_MAX = 500
/** Groupe Google des testeurs du test fermé (piste alpha), ajouté à la piste s'il manque. */
export const ALPHA_TESTERS_GROUP = 'halcya-testeurs@googlegroups.com'

export class PlayApiError extends Error {
  constructor(step, status, message) {
    super(`${step} : HTTP ${status} — ${message}`)
    this.step = step
    this.status = status
    this.apiMessage = message
  }
}

/** Accès refusé (compte de service pas encore invité ou invitation pas encore propagée côté API). */
export function isAccessDenied(err) {
  return err instanceof PlayApiError && (err.status === 401 || err.status === 403)
}

/**
 * Notes de version (≤ 500 caractères, limite de Play) depuis les entrées « Nouveautés » les plus récentes :
 * un titre par ligne, de la plus récente à la plus ancienne, sans couper une ligne en deux.
 */
export function buildReleaseNotes(entries, max = NOTES_MAX) {
  const sorted = [...entries].sort((a, b) => (b.id ?? '').localeCompare(a.id ?? ''))
  const lines = []
  let len = 0
  for (const e of sorted) {
    if (!e.title) continue
    const line = `• ${e.title}`
    const add = (lines.length ? 1 : 0) + line.length
    if (len + add > max) break
    lines.push(line)
    len += add
  }
  return lines.join('\n')
}

/** Délais (ms) entre les réessais d'une panne passagère de Play ; quatre essais en tout, ~35 s au pire. */
export const RETRY_DELAYS_MS = [5000, 10000, 20000]
const TRANSIENT = new Set([429, 500, 502, 503, 504])
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Enveloppe `fetchImpl` pour réessayer les pannes passagères (5xx, 429) — par ex. le 503 « service
 * unavailable » du 24/10 qui a fait échouer l'envoi de la version 394. Les refus (4xx) ne sont jamais
 * réessayés ; après le dernier délai, la dernière réponse est rendue telle quelle.
 */
export function withRetry(fetchImpl, { delays = RETRY_DELAYS_MS, sleep = wait } = {}) {
  return async (url, init) => {
    let res = await fetchImpl(url, init)
    for (const ms of delays) {
      if (!TRANSIENT.has(res.status)) break
      await sleep(ms)
      res = await fetchImpl(url, init)
    }
    return res
  }
}

export async function call(fetchImpl, step, url, { method = 'GET', token, body, contentType = 'application/json' } = {}) {
  const res = await fetchImpl(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { 'Content-Type': contentType } : {}) },
    body: body === undefined ? undefined : contentType === 'application/json' ? JSON.stringify(body) : body,
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  if (!res.ok) throw new PlayApiError(step, res.status, json?.error?.message ?? text.slice(0, 300))
  return json
}

/**
 * Publie `aab` (octets) en `versionCode` sur `track`. Renvoie un objet décrivant ce qui s'est passé
 * (`outcome` : 'published' | 'already-uploaded'), ou lève une PlayApiError.
 * Cas gérés : app encore « brouillon » côté Play (version créée en brouillon), validation qui demande
 * changesNotSentForReview, versionCode déjà envoyé (relance d'un run). Sur la piste alpha, un versionCode déjà
 * envoyé en test interne est réutilisé (c'est la promotion de la version candidate) et le groupe des testeurs est
 * ajouté à la piste s'il n'y est pas.
 */
export async function publishBundle({ packageName, aab, versionCode, track = 'internal', notes, token, testersGroup = ALPHA_TESTERS_GROUP, fetchImpl = fetch, sleep, log = () => {} }) {
  if (!ALLOWED_TRACKS.includes(track)) throw new Error(`Piste « ${track} » refusée : seules ${ALLOWED_TRACKS.join(', ')} sont autorisées.`)
  fetchImpl = withRetry(fetchImpl, { sleep })
  const base = `${API}/${packageName}/edits`
  const edit = await call(fetchImpl, 'Ouverture de l’edit', base, { method: 'POST', token, body: {} })
  const editUrl = `${base}/${edit.id}`
  const abandon = () => call(fetchImpl, 'Abandon de l’edit', editUrl, { method: 'DELETE', token }).catch(() => {})
  try {
    const details = await call(fetchImpl, 'Lecture de la fiche', `${editUrl}/details`, { token })
    const language = details?.defaultLanguage || 'fr-FR'
    log(`Edit ${edit.id} ouvert, langue de la fiche : ${language}`)

    let reusedBundle = false
    try {
      const bundle = await call(fetchImpl, 'Import de l’AAB', `${UPLOAD_API}/${packageName}/edits/${edit.id}/bundles?uploadType=media`, {
        method: 'POST',
        token,
        body: aab,
        contentType: 'application/octet-stream',
      })
      log(`AAB importé : versionCode ${bundle?.versionCode}, sha256 ${bundle?.sha256 ?? '?'}`)
    } catch (err) {
      if (err instanceof PlayApiError && /version code .*already been used|already been used/i.test(err.apiMessage)) {
        if (track === 'internal') {
          await abandon()
          return { outcome: 'already-uploaded', versionCode, track }
        }
        reusedBundle = true
        log(`versionCode ${versionCode} déjà envoyé : la même version est placée sur la piste ${track}.`)
      } else {
        throw err
      }
    }

    const release = (status) => ({
      track,
      releases: [
        {
          name: String(versionCode),
          versionCodes: [String(versionCode)],
          status,
          ...(notes ? { releaseNotes: [{ language, text: notes }] } : {}),
        },
      ],
    })
    let status = 'completed'
    try {
      await call(fetchImpl, `Piste ${track}`, `${editUrl}/tracks/${track}`, { method: 'PUT', token, body: release(status) })
    } catch (err) {
      if (!(err instanceof PlayApiError && /draft/i.test(err.apiMessage))) throw err
      status = 'draft'
      log('Play n’accepte que des versions brouillon pour l’instant : version créée en brouillon.')
      await call(fetchImpl, `Piste ${track} (brouillon)`, `${editUrl}/tracks/${track}`, { method: 'PUT', token, body: release(status) })
    }

    let testersAdded = false
    if (track === 'alpha' && testersGroup) {
      const testers = await call(fetchImpl, 'Lecture des testeurs alpha', `${editUrl}/testers/${track}`, { token })
      const groups = testers?.googleGroups ?? []
      if (!groups.includes(testersGroup)) {
        await call(fetchImpl, 'Ajout du groupe des testeurs', `${editUrl}/testers/${track}`, { method: 'PUT', token, body: { ...testers, googleGroups: [...groups, testersGroup] } })
        testersAdded = true
        log(`Groupe ${testersGroup} ajouté aux testeurs de la piste ${track}.`)
      }
    }

    let notSentForReview = false
    try {
      await call(fetchImpl, 'Validation de l’edit', `${editUrl}:commit`, { method: 'POST', token })
    } catch (err) {
      if (!(err instanceof PlayApiError && /changesNotSentForReview/.test(err.apiMessage))) throw err
      notSentForReview = true
      await call(fetchImpl, 'Validation de l’edit (sans examen)', `${editUrl}:commit?changesNotSentForReview=true`, { method: 'POST', token })
    }
    return { outcome: 'published', versionCode, track, status, language, notSentForReview, ...(track === 'alpha' ? { reusedBundle, testersAdded } : {}) }
  } catch (err) {
    await abandon()
    throw err
  }
}
