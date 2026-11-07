/**
 * Livraison continue vers le test fermé (alpha) — retours du propriétaire du 04/11 vers 19:45.
 *
 * Chaque version de main qui change l'app part sur l'alpha en plus du test interne, sans plafond par jour, quand :
 * - « Tests », « Test — émulateur Samsung Galaxy A56 » (dont le job Android 9) et « Play — AAB » ont réussi sur ce
 *   commit (déclenchement push) ; un workflow encore en cours → on attend son propre déclenchement ;
 * - son versionCode dépasse celui de l'alpha (jamais de retour en arrière) ;
 * - des fichiers de l'app ont changé depuis la version de l'alpha (journal, relais, scripts et tests ne comptent pas).
 * La production n'est jamais touchée (publish.mjs n'accepte que internal et alpha).
 *
 * Commit de journal seul (pas d'AAB) juste après une version de l'app : sur main, il annule l'émulateur de celle-ci
 * (concurrency), qui ne serait alors jamais envoyée (100787, 05/11). Il hérite donc de la version du test interne si
 * rien de l'app n'a changé entre elle et lui : ses « Tests » et son émulateur portent sur le même code d'app.
 *
 * Un envoi par jour à heure fixe (CD-ALPHA-6, décision du propriétaire du 07/11 vers 17:30) : chaque soir à 23:45
 * (heure de Paris), le workflow envoie la plus récente version de main dont « Build & Release » a réussi (et les
 * autres workflows exigés), si elle a changé depuis le dernier envoi (`decideNightly`). Plus d'envoi à chaque merge
 * ni d'espacement de 24 h : le rythme quotidien en tient lieu (`NIGHTLY_MIN_HOURS` = 0) ; le gel s'applique toujours.
 *
 * Historique — envois espacés (CD-ALPHA-2, 05/11, remplacé par CD-ALPHA-6) : chaque envoi relance l'examen de Google (quelques heures à 2 jours) ; à un
 * envoi par heure, l'alpha restait « En cours d'examen » et les testeurs ne pouvaient pas être invités. Une nouvelle
 * version ne part que `minHours` (24 par défaut, ALPHA_MIN_HOURS) après celle de l'alpha ; la date de celle-ci est
 * celle de son commit sur main (l'envoi suit d'une heure environ). Depuis CD-ALPHA-5, les derniers envois de la fiche
 * et des abonnements comptent aussi (`otherSends`), et le gel de review-freeze.json s'applique (reviewGate.mjs).
 */

import { decideReviewed, DEFAULT_MIN_HOURS } from './reviewGate.mjs'

export { DEFAULT_MIN_HOURS }

export const REQUIRED_WORKFLOWS = ['Tests', 'Test — émulateur Samsung Galaxy A56', 'Play — AAB', 'Build & Release']
/** Envoi quotidien : pas d'écart minimal entre deux envois (CD-ALPHA-6). */
export const NIGHTLY_MIN_HOURS = 0
export const VERSION_OFFSET = 100000

/** Le fichier change-t-il l'app installée ? */
export function affectsApp(path) {
  if (path === '.github/workflows/play-bundle.yml') return true
  if (!path.startsWith('app/')) return false
  if (/^app\/(scripts|e2e|\.visual|tests?)\//.test(path)) return false
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(path) || /\/__tests__\//.test(path)) return false
  if (/^app\/[^/]+\.md$/.test(path)) return false
  return true
}

/** versionCode play → nombre de commits de main (versionName), null si hors plage. */
export function commitCountOf(versionCode) {
  const n = Number(versionCode) - VERSION_OFFSET
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * `runs` : exécutions GitHub Actions du commit ({ name, event, status, conclusion }).
 * `alphaVersionCode` / `internalVersionCode` : plus grand versionCode de l'alpha / du test interne (null si vide ;
 * le candidat doit avoir été envoyé en test interne). `changedFiles` : fichiers modifiés depuis
 * la version de l'alpha (null si ce commit est introuvable : on envoie).
 * `inherited` : { versionCode, filesSince } de la version du test interne, avec les fichiers modifiés entre son
 * commit et celui-ci (null si inconnue).
 * `alphaSentAt` : date (ISO) de la version de l'alpha, `now` : maintenant (ms), `minHours` : écart minimal.
 * `otherSends` : autres envois examinés [{ what, at }] (fiche, abonnements), `freezeUntil` : gel (ISO ou null).
 * Renvoie { send, wait?, spaced?, nextAt?, reason, versionCode? } (versionCode : la version à placer sur l'alpha).
 */
export function decideAlpha({ runs, candidateVersionCode, alphaVersionCode, internalVersionCode, changedFiles, inherited = null, enabled = true, alphaSentAt = null, now = Date.now(), minHours = DEFAULT_MIN_HOURS, otherSends = [], freezeUntil = null }) {
  if (!enabled) return { send: false, reason: 'livraison continue coupée (ALPHA_AUTO=false)' }
  const hasAab = runs.some((r) => r.name === 'Play — AAB' && r.event === 'push')
  const inherit = !hasAab && inherited?.versionCode != null && Array.isArray(inherited.filesSince) && !inherited.filesSince.some(affectsApp)
  if (!hasAab && !inherit) return { send: false, reason: 'aucun AAB pour ce commit (seul le journal a changé)' }
  for (const name of REQUIRED_WORKFLOWS) {
    if (inherit && name === 'Play — AAB') continue
    const mine = runs.filter((r) => r.name === name && r.event === 'push')
    if (!mine.length) return { send: false, wait: true, reason: `« ${name} » n’a pas encore démarré` }
    if (mine.some((r) => r.status !== 'completed')) return { send: false, wait: true, reason: `« ${name} » est encore en cours` }
    if (!mine.some((r) => r.conclusion === 'success')) {
      return { send: false, reason: `« ${name} » n’a pas réussi (${mine.map((r) => r.conclusion).join(', ')})` }
    }
  }
  const candidate = Number(inherit ? inherited.versionCode : candidateVersionCode)
  const from = inherit ? ` (version du test interne, reprise par ce commit de journal)` : ''
  if (internalVersionCode !== undefined && (internalVersionCode == null || candidate > Number(internalVersionCode))) {
    return { send: false, reason: `${candidate} n’est pas en test interne (envoi refusé ou en attente ; test interne : ${internalVersionCode ?? 'vide'})` }
  }
  if (alphaVersionCode != null && candidate <= Number(alphaVersionCode)) {
    return { send: false, upToDate: true, reason: `l’alpha a déjà ${alphaVersionCode} (≥ ${candidate})` }
  }
  let why = `version de l’alpha introuvable dans l’historique : envoi${from}`
  if (changedFiles) {
    const app = changedFiles.filter(affectsApp)
    if (!app.length) return { send: false, upToDate: true, reason: `rien ne change dans l’app depuis ${alphaVersionCode}` }
    why = `${app.length} fichier(s) de l’app modifié(s) depuis ${alphaVersionCode}${from}`
  }
  const sends = [{ what: `${alphaVersionCode} sur l’alpha`, at: alphaSentAt }, ...otherSends]
  const gate = decideReviewed({ sends, now, minHours, freezeUntil })
  if (!gate.send) return gate
  if (changedFiles) return { send: true, versionCode: candidate, reason: why }
  return { send: true, versionCode: candidate, reason: `version de l’alpha introuvable dans l’historique : envoi${from}` }
}

/**
 * Envoi du soir (CD-ALPHA-6). `candidates` : commits de main dont « Build & Release » a réussi, du plus récent au plus
 * ancien, chacun avec les entrées de `decideAlpha` et son `sha`. On envoie le premier prêt ; un commit pas prêt
 * (workflow en cours ou en échec, pas d'AAB) cède la place au précédent ; un commit déjà sur l'alpha ou sans
 * changement de l'app arrête la recherche (les plus anciens le sont aussi), comme le gel ou l'interrupteur.
 * Renvoie la décision de `decideAlpha` avec { sha, skipped: [{ sha, reason }] }.
 */
export function decideNightly(candidates) {
  const skipped = []
  for (const { sha, ...input } of candidates) {
    const d = decideAlpha(input)
    if (d.send || d.upToDate || d.frozen || input.enabled === false) return { ...d, sha, skipped }
    skipped.push({ sha, reason: d.reason })
  }
  const why = skipped.length ? ` (${skipped.map((s) => `${String(s.sha).slice(0, 7)} : ${s.reason}`).join(' ; ')})` : ''
  return { send: false, reason: `aucune version de main prête pour l’alpha${why}`, skipped }
}

/**
 * Commit de main dont `git rev-list --count` vaut `n` (l'historique ancien a des merges : la position dans
 * --first-parent ne suffit pas). `chain` : commits --first-parent du plus ancien au plus récent (comptes croissants),
 * `countOf(sha)` : nombre de commits. Recherche dichotomique ; null si aucun commit n'a ce compte.
 */
export function findCommitByCount(chain, countOf, n) {
  let lo = 0
  let hi = chain.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const c = countOf(chain[mid])
    if (c === n) return chain[mid]
    if (c < n) lo = mid + 1
    else hi = mid - 1
  }
  return null
}
