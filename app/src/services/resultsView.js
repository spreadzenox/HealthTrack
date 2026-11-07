/**
 * Ce qu'Analyses montre d'un résultat (ORG-4 et ORG-6, revue design du 07/11), d'après le contrat de la méthode
 * (services/analysisResults.js, forme stable). Fonction pure, sans React.
 * - Avant les résultats : un seul compte à rebours (la prochaine étape seulement, leçon 15).
 * - « Pistes à tester » : 2 ou 3 liens nets sur ce qu'on peut changer (un par facteur, l'horizon où il est le plus net).
 * - « Ce qui pèse » : par horizon prêt (Court / Moyen / Long terme), les facteurs qu'on peut changer, en points sur 5
 *   pour une variation habituelle, avec leur fourchette ; « net » plein, sinon hachuré. Seulement si la méthode prévoit
 *   mieux que « demain = aujourd'hui » hors échantillon (`beatsPersistence`).
 * - « À regarder, pas à changer » : corps et contexte (non actionnables).
 */
const MAX_PISTES = 3
const MAX_PER_HORIZON = 5

/** Couleur du thème d'un facteur ou d'un résultat (DESIGN.md, leçon 12). */
export const THEME_TONE = { wellbeing: 'mint', digestion: 'peach', nutrition: 'peach', activity: 'lilac', sleep: 'night', body: 'rose', context: 'stone' }

/**
 * @param {object | null} outcome  OutcomeResult du contrat
 * @returns {{ state: 'loading'|'locked'|'results', daysLeft?: number|null, progress?: { have, need },
 *   symptomsLeft?: number, pistes?: object[], weigh?: object[] | null, nextLock?: object | null, lookOnly?: object[] }}
 */
export function resultsView(outcome) {
  if (!outcome) return { state: 'loading' }
  const horizons = Object.values(outcome.horizons || {})
  const short = outcome.horizons?.short
  if (outcome.status === 'locked') {
    const symptomsLeft = outcome.symptomDaysNeeded != null
      ? Math.max(0, outcome.symptomDaysNeeded - (outcome.symptomDays ?? 0))
      : 0
    return {
      state: 'locked',
      daysLeft: outcome.daysToFirst,
      progress: short ? { have: Math.min(short.daysHave, short.daysNeeded), need: short.daysNeeded } : null,
      symptomsLeft,
    }
  }
  const ready = horizons.filter((h) => h.status === 'ready')
  const all = ready.flatMap((h) => h.factors.map((f) => ({ ...f, horizonLabel: h.label })))
  const best = new Map()
  for (const f of all.filter((x) => x.actionable && x.net)) {
    const cur = best.get(f.key)
    if (!cur || Math.abs(f.effect) > Math.abs(cur.effect)) best.set(f.key, f)
  }
  const pistes = [...best.values()].sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect)).slice(0, MAX_PISTES)
  const weigh = outcome.beatsPersistence === true
    ? ready.map((h) => ({
      id: h.id, label: h.label, window: h.window,
      factors: h.factors.filter((f) => f.actionable).slice(0, MAX_PER_HORIZON),
    })).filter((h) => h.factors.length)
    : null
  const lookBest = new Map()
  for (const f of all.filter((x) => !x.actionable)) {
    const cur = lookBest.get(f.key)
    if (!cur || Math.abs(f.effect) > Math.abs(cur.effect)) lookBest.set(f.key, f)
  }
  const lookOnly = outcome.beatsPersistence === true
    ? [...lookBest.values()].sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect)).slice(0, MAX_PER_HORIZON)
    : []
  const locked = horizons.find((h) => h.status === 'locked')
  const nextLock = locked ? { label: locked.label, daysLeft: Math.max(0, locked.daysNeeded - locked.daysHave) } : null
  return { state: 'results', pistes, weigh, nextLock, lookOnly }
}

/** Titres courts des pistes, pour l'Accueil et Agir (résumé mémorisé, pistesSummary.js). */
export function pistesTitles(results) {
  const titles = (id) => resultsView(results?.outcomes?.[id]).pistes?.map((f) => f.label) ?? []
  return { gut: titles('digestion').map((l) => `${l} → digestion`), levers: titles('wellbeing') }
}
