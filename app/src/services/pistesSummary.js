/**
 * Résumé des pistes pour la carte lilas de l'Accueil (POL-PLAY-21). L'analyse complète est lourde (Web Worker,
 * toutes les entrées) et dépasserait le budget de lectures de l'Accueil : l'onglet Analyses mémorise ici, à chaque
 * calcul, ce qu'il montre (titres seulement), et l'Accueil le relit sans rien recalculer. Un résumé d'un jour ou
 * deux reste juste à l'échelle de pistes qui demandent des semaines de données.
 */
import { getHiddenLinks, gutLinkKey } from '../settings/hiddenLinks'

export const PISTES_SUMMARY_KEY = 'healthtrack_pistes_summary'

/** Titre d'une piste repas → ventre, comme dans Analyses (« Oignon → ventre »). */
const gutTitle = (link) => `${link.label} → digestion`

/**
 * Ce que montre Analyses, réduit aux titres : pistes repas → ventre (si l'analyse du ventre en a) puis pistes à
 * tester du bien-être, sans celles que la personne a masquées (I86). `null` tant que l'analyse n'a pas assez de jours (la carte garde son compte à rebours).
 */
export function summarizePistes(analysis, hidden = getHiddenLinks()) {
  if (!analysis) return null
  const gut = analysis.gut?.status === 'links' ? analysis.gut.links.filter((l) => !hidden.includes(gutLinkKey(l))).map(gutTitle) : []
  const ready = analysis.correlations?.status === 'ok'
  const shown = ready
    ? (analysis.correlations.levers ?? []).filter((l) => !hidden.includes(l.variable) && (l.title ?? l.action))
    : []
  if (!ready && !gut.length) return null
  // `leverVars` (TESTEUR-1d-3) : la variable de chaque piste, alignée sur `levers`, pour la relier aux mesures du jour
  return { gut, levers: shown.map((l) => l.title ?? l.action), leverVars: shown.map((l) => l.variable ?? null) }
}

/** Variable d'une piste → mesure de « Ce qui change aujourd'hui » (dayDeviations). VFC et FC au repos n'en sont pas. */
const LEVER_TO_DAY_MEASURE = { sleepMinutes: 'sleep', steps: 'steps', screen_minutes: 'screen' }

/**
 * TESTEUR-1d-3 : la piste la plus solide (ordre d'Analyses) qui touche une mesure du jour sortie de vos habitudes.
 * `{ title, today }` (« plus de pas ») ou `null` ; un ancien résumé sans `leverVars` ne cite rien.
 */
export function pisteTouchingToday(summary, dayItems) {
  if (!summary || !Array.isArray(summary.leverVars) || !dayItems?.length) return null
  for (let i = 0; i < summary.levers.length; i++) {
    const item = dayItems.find((d) => d.key === LEVER_TO_DAY_MEASURE[summary.leverVars[i]])
    if (item) return { title: summary.levers[i], today: item.text.charAt(0).toLowerCase() + item.text.slice(1) }
  }
  return null
}

export function rememberPistesSummary(analysis, now = new Date()) {
  try {
    const summary = summarizePistes(analysis)
    if (summary) localStorage.setItem(PISTES_SUMMARY_KEY, JSON.stringify({ ...summary, at: now.toISOString() }))
    else localStorage.removeItem(PISTES_SUMMARY_KEY)
  } catch {
    /* localStorage indisponible : l'Accueil garde son texte générique */
  }
}

/** `{ gut: string[], levers: string[], leverVars?: (string|null)[], at }` ou `null`. */
export function readPistesSummary() {
  try {
    const s = JSON.parse(localStorage.getItem(PISTES_SUMMARY_KEY) || 'null')
    if (!s || !Array.isArray(s.gut) || !Array.isArray(s.levers)) return null
    return s
  } catch {
    return null
  }
}
