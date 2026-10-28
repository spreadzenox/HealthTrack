/**
 * Résumé des pistes pour la carte lilas de l'Accueil (POL-PLAY-21). L'analyse complète est lourde (Web Worker,
 * toutes les entrées) et dépasserait le budget de lectures de l'Accueil : l'onglet Analyses mémorise ici, à chaque
 * calcul, ce qu'il montre (titres seulement), et l'Accueil le relit sans rien recalculer. Un résumé d'un jour ou
 * deux reste juste à l'échelle de pistes qui demandent des semaines de données.
 */
export const PISTES_SUMMARY_KEY = 'healthtrack_pistes_summary'

/** Titre d'une piste repas → ventre, comme dans Analyses (« Oignon → ventre »). */
const gutTitle = (link) => `${link.label} → ventre`

/**
 * Ce que montre Analyses, réduit aux titres : pistes repas → ventre (si l'analyse du ventre en a) puis pistes à
 * tester du bien-être. `null` tant que l'analyse n'a pas assez de jours (la carte garde son compte à rebours).
 */
export function summarizePistes(analysis) {
  if (!analysis) return null
  const gut = analysis.gut?.status === 'links' ? analysis.gut.links.map(gutTitle) : []
  const ready = analysis.correlations?.status === 'ok'
  const levers = ready ? (analysis.correlations.levers ?? []).map((l) => l.title ?? l.action).filter(Boolean) : []
  if (!ready && !gut.length) return null
  return { gut, levers }
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

/** `{ gut: string[], levers: string[], at }` ou `null`. */
export function readPistesSummary() {
  try {
    const s = JSON.parse(localStorage.getItem(PISTES_SUMMARY_KEY) || 'null')
    if (!s || !Array.isArray(s.gut) || !Array.isArray(s.levers)) return null
    return s
  } catch {
    return null
  }
}
