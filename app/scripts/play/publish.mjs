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
/**
 * Brouillons gardés sur la piste quand une version normale y est placée : ceux de la déclaration P28 (AAB play avec
 * l'interrupteur faceUnlockPlay, jamais déployé, journal/PLAY-CONFORMITE.md §1 bis). Les autres brouillons sont
 * remplacés, comme avant.
 */
export const KEPT_DRAFT_PREFIX = 'p28-'

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
  return err instanceof PlayApiError && (err.status === 401 || err.status === 403) && !isMissingDeclaration(err)
}

/** 403 « You must let us know whether your app uses any Foreground Service permissions » (27/10) : une déclaration
 * de la Play Console manque ; ce n'est pas un problème d'accès, l'envoi doit échouer franchement. */
export function isMissingDeclaration(err) {
  return err instanceof PlayApiError && /must let us know/i.test(err.apiMessage ?? err.message)
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
 *
 * `draft: true` (déclaration P28) : la version est créée en brouillon, jamais déployée, sous `releaseName`, et les
 * versions déjà sur la piste (hors brouillons) y restent telles quelles. Sans `draft`, un brouillon P28 déjà sur la
 * piste est gardé à côté de la nouvelle version ; si Play refuse l'ensemble, la version passe seule (`draftDropped`).
 *
 * Lecture au déverrouillage allumée en test interne (P28, 27/10) : `privateTrack: true` refuse d'envoyer si le groupe
 * des testeurs du test fermé est aussi testeur de la piste (le test interne doit rester au seul propriétaire) et
 * renvoie les groupes lus (`internalGroups`, null si Play ne les donne pas) ; `noReuse: true` refuse de placer sur
 * l'alpha un versionCode déjà envoyé en test interne (cet AAB-là a l'interrupteur allumé).
 *
 * `mapping` (facultatif, octets de mapping.txt de R8) : envoyé comme fichier de désobscurcissement de la version dans
 * le même edit, pour des traces de plantage lisibles dans la Play Console ; un refus ne bloque pas la version
 * (`mapping: 'failed'`, `mappingError`).
 */
export async function publishBundle({ packageName, aab, mapping, versionCode, track = 'internal', notes, token, draft = false, releaseName = String(versionCode), testersGroup = ALPHA_TESTERS_GROUP, privateTrack = false, noReuse = false, fetchImpl = fetch, sleep, log = () => {} }) {
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
    let mappingResult = {}
    try {
      const bundle = await call(fetchImpl, 'Import de l’AAB', `${UPLOAD_API}/${packageName}/edits/${edit.id}/bundles?uploadType=media`, {
        method: 'POST',
        token,
        body: aab,
        contentType: 'application/octet-stream',
      })
      log(`AAB importé : versionCode ${bundle?.versionCode}, sha256 ${bundle?.sha256 ?? '?'}`)
      if (mapping) {
        try {
          await call(fetchImpl, 'Fichier de correspondance R8', `${UPLOAD_API}/${packageName}/edits/${edit.id}/apks/${versionCode}/deobfuscationFiles/proguard?uploadType=media`, {
            method: 'POST',
            token,
            body: mapping,
            contentType: 'application/octet-stream',
          })
          mappingResult = { mapping: 'uploaded' }
          log('Fichier de correspondance R8 envoyé.')
        } catch (err) {
          mappingResult = { mapping: 'failed', mappingError: err.message }
          log(`Fichier de correspondance R8 refusé : ${err.message}`)
        }
      }
    } catch (err) {
      if (err instanceof PlayApiError && /version code .*already been used|already been used/i.test(err.apiMessage)) {
        if (track === 'internal') {
          await abandon()
          return { outcome: 'already-uploaded', versionCode, track }
        }
        if (noReuse) {
          throw new Error(`versionCode ${versionCode} déjà envoyé en test interne avec la lecture au déverrouillage : il ne doit pas aller sur la piste ${track}. Relancez sur un commit de main qui ne touche que journal/ (son numéro n'a jamais été envoyé).`)
        }
        reusedBundle = true
        log(`versionCode ${versionCode} déjà envoyé : la même version est placée sur la piste ${track}.`)
      } else {
        throw err
      }
    }

    let internalGroups
    if (privateTrack && track === 'internal') {
      internalGroups = null
      try {
        internalGroups = (await call(fetchImpl, 'Lecture des testeurs internes', `${editUrl}/testers/${track}`, { token }))?.googleGroups ?? []
      } catch (err) {
        if (!(err instanceof PlayApiError) || isAccessDenied(err)) throw err
        log(`Testeurs internes illisibles (${err.message}) : envoi poursuivi.`)
      }
      if (internalGroups?.includes(testersGroup)) {
        throw new Error(`Le groupe ${testersGroup} est testeur du test interne : la version avec la lecture au déverrouillage n'y est pas envoyée (le test interne doit rester au seul propriétaire).`)
      }
    }

    let existing = []
    try {
      existing = (await call(fetchImpl, `Lecture de la piste ${track}`, `${editUrl}/tracks/${track}`, { token }))?.releases ?? []
    } catch (err) {
      if (!(err instanceof PlayApiError && err.status === 404)) throw err
    }
    const kept = draft
      ? existing.filter((r) => r.status !== 'draft')
      : existing.filter((r) => r.status === 'draft' && String(r.name ?? '').startsWith(KEPT_DRAFT_PREFIX) && !r.versionCodes?.includes(String(versionCode)))
    const ours = (status) => ({
      name: releaseName,
      versionCodes: [String(versionCode)],
      status,
      ...(notes ? { releaseNotes: [{ language, text: notes }] } : {}),
    })
    const put = (step, releases) => call(fetchImpl, step, `${editUrl}/tracks/${track}`, { method: 'PUT', token, body: { track, releases } })

    let status = draft ? 'draft' : 'completed'
    let draftDropped = false
    if (draft) {
      await put(`Piste ${track} (brouillon)`, [...kept, ours(status)])
      log(`Version ${releaseName} créée en brouillon sur la piste ${track} (jamais déployée) ; ${kept.length} version(s) déjà sur la piste gardée(s).`)
    } else {
      try {
        await put(`Piste ${track}`, [ours(status), ...kept])
      } catch (err) {
        if (!(err instanceof PlayApiError)) throw err
        if (kept.length && err.status === 400 && !/draft app/i.test(err.apiMessage)) {
          draftDropped = true
          log(`Play refuse de garder le brouillon ${kept.map((r) => r.name).join(', ')} (${err.apiMessage}) : version placée seule.`)
          await put(`Piste ${track}`, [ours(status)])
        } else if (/draft/i.test(err.apiMessage)) {
          status = 'draft'
          log('Play n’accepte que des versions brouillon pour l’instant : version créée en brouillon.')
          await put(`Piste ${track} (brouillon)`, [ours(status)])
        } else {
          throw err
        }
      }
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
    return {
      outcome: 'published',
      versionCode,
      track,
      status,
      language,
      notSentForReview,
      ...mappingResult,
      ...(track === 'alpha' ? { reusedBundle, testersAdded } : {}),
      ...(!draft && kept.length ? { keptDrafts: kept.map((r) => r.name), draftDropped } : {}),
      ...(internalGroups !== undefined ? { internalGroups } : {}),
    }
  } catch (err) {
    await abandon()
    throw err
  }
}
