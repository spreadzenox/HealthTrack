/**
 * Ce qui va avec un objectif, rangé par famille (refonte « Compagnon », étape 6b ; brief § 4, SPEC comprendre § 6.3).
 * Fonction pure sur le contrat de la méthode (services/analysisResults.js) : aucune statistique nouvelle, seulement un
 * regroupement des liens nets déjà calculés, sur les délais prêts.
 * - Trois familles toujours montrées : Sommeil (avec « Écran tard le soir », comme la SPEC § 6.5), Alimentation,
 *   Activité. Habitudes et Écrans (temps d'écran, réseaux sociaux) ne s'ajoutent qu'avec un lien net, pour qu'aucun
 *   lien net ne soit caché. Le corps et la météo restent dans « À regarder, pas à changer ».
 * - Niveau d'une famille : son lien net le plus fort, en points sur 5 pour une variation habituelle. Les deux seuils
 *   sont des repères d'affichage, pas des tests.
 * - Sans lien net, la famille le dit ; sans facteur comparé (trop peu de données), aussi.
 */
export const MEDIUM_FROM = 0.25
export const STRONG_FROM = 0.5

export const LEVEL_WORDS = { 3: 'Lien fort', 2: 'Lien moyen', 1: 'Lien faible' }
const NONE_WORD = 'Pas de lien net pour l’instant'
const NODATA_WORD = 'Pas assez de données'

export const FAMILIES = [
  { id: 'sleep', label: 'Sommeil', tone: 'night', always: true },
  { id: 'nutrition', label: 'Alimentation', tone: 'peach', always: true },
  { id: 'activity', label: 'Activité', tone: 'lilac', always: true },
  { id: 'habit', label: 'Habitudes', tone: 'honey', always: false },
  { id: 'screen', label: 'Écrans', tone: 'stone', always: false },
]

/** Famille d'un facteur du contrat, ou null (corps, météo : rien à y changer). */
export function familyOf(factor) {
  if (!factor?.actionable) return null
  if (factor.theme === 'sleep' || factor.key === 'screen_late_minutes') return 'sleep'
  if (factor.theme === 'nutrition' || factor.theme === 'activity' || factor.theme === 'habit') return factor.theme
  if (factor.theme === 'context') return 'screen'
  return null
}

const levelOf = (effect) => (Math.abs(effect) >= STRONG_FROM ? 3 : Math.abs(effect) >= MEDIUM_FROM ? 2 : 1)

/**
 * @param {object | null} outcome  OutcomeResult du contrat
 * @returns {{ id: string, label: string, tone: string, state: 'net'|'none'|'nodata', level: 0|1|2|3, word: string, lead: string|null }[]}
 */
export function influenceFamilies(outcome) {
  if (!outcome || outcome.status === 'locked') return []
  const factors = Object.values(outcome.horizons || {}).filter((h) => h.status === 'ready').flatMap((h) => h.factors || [])
  const rows = FAMILIES.map((fam) => {
    const mine = factors.filter((f) => familyOf(f) === fam.id)
    const best = mine.filter((f) => f.net && !f.outOfScale).sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))[0]
    const base = { id: fam.id, label: fam.label, tone: fam.tone }
    if (best) return { ...base, state: 'net', level: levelOf(best.effect), word: LEVEL_WORDS[levelOf(best.effect)], lead: best.label, strength: Math.abs(best.effect), always: fam.always }
    return { ...base, state: mine.length ? 'none' : 'nodata', level: 0, word: mine.length ? NONE_WORD : NODATA_WORD, lead: null, strength: 0, always: fam.always }
  }).filter((r) => r.always || r.state === 'net')
  // Tri stable : la famille au lien le plus fort d'abord ; sans lien net, l'ordre de FAMILIES
  return rows.sort((a, b) => b.strength - a.strength).map(({ strength, always, ...r }) => r) // eslint-disable-line no-unused-vars
}

/**
 * REFONTE-6c : le détail d'une famille (brief § 4 : « puis le détail d'une famille et la piste à tester »).
 * Ses facteurs, délai prêt par délai prêt, et ses liens nets (un par facteur, au délai où il est le plus fort).
 * `bars` suit la règle de « Ce qui va avec » : les barres ne se montrent que si la méthode prévoit mieux que
 * « demain comme aujourd'hui ». Null pour une famille inconnue, avant les résultats ou sans facteur comparé.
 * @returns {{ id, label, tone, bars: boolean, count: number, horizons: { id, label, window, factors: object[] }[], pistes: object[] } | null}
 */
export function familyDetail(outcome, familyId) {
  const fam = FAMILIES.find((x) => x.id === familyId)
  if (!fam || !outcome || outcome.status === 'locked') return null
  const horizons = Object.values(outcome.horizons || {})
    .filter((h) => h.status === 'ready')
    .map((h) => ({ id: h.id, label: h.label, window: h.window, factors: (h.factors || []).filter((f) => familyOf(f) === familyId) }))
    .filter((h) => h.factors.length)
  if (!horizons.length) return null
  const best = new Map()
  for (const h of horizons) {
    for (const f of h.factors.filter((x) => x.net && !x.outOfScale)) {
      const cur = best.get(f.key)
      if (!cur || Math.abs(f.effect) > Math.abs(cur.effect)) best.set(f.key, { ...f, horizonLabel: h.label })
    }
  }
  const pistes = [...best.values()].sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
  const count = new Set(horizons.flatMap((h) => h.factors.map((f) => f.key))).size
  return { id: fam.id, label: fam.label, tone: fam.tone, bars: outcome.beatsPersistence === true, count, horizons, pistes }
}
