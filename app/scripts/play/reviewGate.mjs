/**
 * Envois examinés par Google, espacés (CD-ALPHA-5, run « idées » du 05/11 20:35, I222).
 *
 * D'après l'aide de la Play Console, le délai d'examen court depuis le dernier changement envoyé pour l'app : une
 * version sur l'alpha, la fiche du Store ou les abonnements (le test interne excepté). Un envoi pendant l'examen peut
 * renvoyer l'app en fin de file. Les trois workflows qui envoient ces changements (« Play — Alpha », « Play — fiche du
 * Store », « Play — abonnements ») attendent donc `minHours` (24 par défaut) après le dernier d'entre eux ; un envoi
 * reporté part au passage quotidien du workflow (07:xx UTC) dès que le délai est écoulé.
 *
 * Chaque envoi remplace la version de la piste : la validation de l'edit annule l'examen en cours puis envoie la
 * nouvelle version (`changesInReviewBehavior=CANCEL_IN_REVIEW_AND_SUBMIT`, explicite dans publish.mjs depuis le 10/11).
 *
 * Gel (`review-freeze.json`, champ `until`) : rien ne part avant cette date, par exemple pendant l'examen de la
 * demande d'accès à la production (P30). La routine le règle par une PR ; il ne touche pas l'app.
 */

export const DEFAULT_MIN_HOURS = 24

/** Workflows dont l'envoi est examiné, avec le nom exact de l'étape qui envoie (sa réussite = un envoi). */
export const REVIEWED_WORKFLOWS = {
  listing: {
    file: 'play-listing.yml',
    step: 'Envoyer la fiche (Google Play)',
    label: 'la fiche du Store',
    content: [/^app\/store\/(?!data-safety\/)/, /^app\/scripts\/play\/listing(-cli)?\.mjs$/],
  },
  subscriptions: {
    file: 'play-subscriptions.yml',
    step: 'Créer et activer les abonnements (Google Play)',
    label: 'les abonnements',
    content: [/^app\/scripts\/play\/subscriptions(-cli)?\.mjs$/, /^app\/src\/config\/premiumBenefits\.js$/],
  },
}

const time = (iso) => (iso == null ? NaN : Date.parse(iso))
const stepOf = (run, step) => (run.steps ?? []).find((s) => s.name === step)

/**
 * `runs` : exécutions terminées d'un workflow ({ head_sha, updated_at, steps: [{ name, conclusion, completed_at }] }).
 * Renvoie le dernier envoi réussi { at (ISO), sha } (étape d'envoi réussie), null si aucun.
 */
export function lastSent(runs, step) {
  let best = null
  for (const run of runs) {
    const s = stepOf(run, step)
    if (s?.conclusion !== 'success') continue
    const at = s.completed_at ?? run.updated_at
    if (Number.isFinite(time(at)) && (best == null || time(at) > time(best.at))) best = { at, sha: run.head_sha ?? null }
  }
  return best
}

/**
 * Y a-t-il quelque chose à envoyer ? `files` : fichiers modifiés depuis le commit du dernier envoi (null si inconnu :
 * on envoie). Un changement du seul workflow, ou rien de neuf au passage quotidien, n'envoie rien : la fiche est
 * renvoyée en entier à chaque passage, et chaque envoi relance l'examen.
 */
export function hasNewContent(kind, files) {
  if (files == null) return true
  const { content } = REVIEWED_WORKFLOWS[kind]
  return files.some((f) => content.some((re) => re.test(f)))
}

/**
 * `sends` : derniers envois examinés [{ what, at }] (at ISO ou null). `freezeUntil` : gel (ISO ou null).
 * Renvoie { send: true } ou { send: false, frozen?, spaced?, nextAt, reason }.
 */
export function decideReviewed({ sends = [], now = Date.now(), minHours = DEFAULT_MIN_HOURS, freezeUntil = null }) {
  const frozen = time(freezeUntil)
  if (Number.isFinite(frozen) && now < frozen) {
    const nextAt = new Date(frozen).toISOString()
    return { send: false, frozen: true, nextAt, reason: `envois gelés jusqu’au ${nextAt.slice(0, 16).replace('T', ' ')} UTC (review-freeze.json)` }
  }
  const gapMs = Number(minHours) * 3600e3
  const last = sends.filter((s) => Number.isFinite(time(s.at))).sort((a, b) => time(b.at) - time(a.at))[0]
  if (!(gapMs > 0) || !last || now - time(last.at) >= gapMs) return { send: true }
  const ago = Math.max(0, Math.round((now - time(last.at)) / 3600e3))
  const nextAt = new Date(time(last.at) + gapMs).toISOString()
  return {
    send: false,
    spaced: true,
    nextAt,
    reason: `${last.what} : envoi d’il y a ${ago} h ; un changement examiné par Google toutes les ${minHours} h au plus, pour le laisser finir son examen (prochain envoi possible après ${nextAt.slice(0, 16).replace('T', ' ')} UTC)`,
  }
}
