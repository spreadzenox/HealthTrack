/**
 * Livraison continue vers le test fermé (alpha) — retours du propriétaire du 04/11 vers 19:45.
 *
 * Chaque version de main qui change l'app part sur l'alpha en plus du test interne, sans plafond par jour, quand :
 * - « Tests », « Test — émulateur Samsung Galaxy A56 » (dont le job Android 9) et « Play — AAB » ont réussi sur ce
 *   commit (déclenchement push) ; un workflow encore en cours → on attend son propre déclenchement ;
 * - son versionCode dépasse celui de l'alpha (jamais de retour en arrière) ;
 * - des fichiers de l'app ont changé depuis la version de l'alpha (journal, relais, scripts et tests ne comptent pas).
 * La production n'est jamais touchée (publish.mjs n'accepte que internal et alpha).
 */

export const REQUIRED_WORKFLOWS = ['Tests', 'Test — émulateur Samsung Galaxy A56', 'Play — AAB']
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
 * Renvoie { send, wait?, reason }.
 */
export function decideAlpha({ runs, candidateVersionCode, alphaVersionCode, internalVersionCode, changedFiles, enabled = true }) {
  if (!enabled) return { send: false, reason: 'livraison continue coupée (ALPHA_AUTO=false)' }
  for (const name of REQUIRED_WORKFLOWS) {
    const mine = runs.filter((r) => r.name === name && r.event === 'push')
    if (!mine.length) {
      return name === 'Play — AAB'
        ? { send: false, reason: 'aucun AAB pour ce commit (seul le journal a changé)' }
        : { send: false, wait: true, reason: `« ${name} » n’a pas encore démarré` }
    }
    if (mine.some((r) => r.status !== 'completed')) return { send: false, wait: true, reason: `« ${name} » est encore en cours` }
    if (!mine.some((r) => r.conclusion === 'success')) {
      return { send: false, reason: `« ${name} » n’a pas réussi (${mine.map((r) => r.conclusion).join(', ')})` }
    }
  }
  const candidate = Number(candidateVersionCode)
  if (internalVersionCode !== undefined && (internalVersionCode == null || candidate > Number(internalVersionCode))) {
    return { send: false, reason: `${candidate} n’est pas en test interne (envoi refusé ou en attente ; test interne : ${internalVersionCode ?? 'vide'})` }
  }
  if (alphaVersionCode != null && candidate <= Number(alphaVersionCode)) {
    return { send: false, reason: `l’alpha a déjà ${alphaVersionCode} (≥ ${candidate})` }
  }
  if (changedFiles) {
    const app = changedFiles.filter(affectsApp)
    if (!app.length) return { send: false, reason: `rien ne change dans l’app depuis ${alphaVersionCode}` }
    return { send: true, reason: `${app.length} fichier(s) de l’app modifié(s) depuis ${alphaVersionCode}` }
  }
  return { send: true, reason: 'version de l’alpha introuvable dans l’historique : envoi' }
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
