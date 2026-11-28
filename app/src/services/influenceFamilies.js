/**
 * Ce qui va avec un objectif, rangé par famille (refonte « Compagnon », étape 6b ; brief § 4, SPEC comprendre § 6.3).
 * Fonction pure sur le contrat de la méthode (services/analysisResults.js) : aucune statistique nouvelle, seulement un
 * regroupement des liens nets déjà calculés, sur les délais prêts.
 * - Trois familles toujours montrées : Sommeil (avec « Écran tard le soir », comme la SPEC § 6.5), Alimentation,
 *   Activité. Habitudes et Écrans (temps d'écran, réseaux sociaux) ne s'ajoutent qu'avec un lien net, pour qu'aucun
 *   lien net ne soit caché. Le corps et la météo restent dans « À regarder, pas à changer ».
 * - Niveau d'une famille : son lien net le plus fort, en points sur 5 pour une variation habituelle. Les deux seuils
 *   sont des repères d'affichage, pas des tests.
 * - Sans lien net, la famille le dit avec les mots de la légende des barres hachurées (« pas assez net », POLISH-SIM-104) ;
 *   sans facteur comparé (trop peu de données), aussi.
 */
import { FODMAP_GROUPS } from './fodmapChallenge'
import { localDateKey } from './analysisEngine'
import { DEVIATION_MIN_PAST_DAYS, DEVIATION_WINDOW_DAYS } from './dayDeviations'
import { formatDuration } from '../utils/format'
import { appLocale } from '../i18n/locale.js'

export const MEDIUM_FROM = 0.25
export const STRONG_FROM = 0.5

export const LEVEL_WORDS = { 3: 'Lien fort', 2: 'Lien moyen', 1: 'Lien faible' }
const NONE_WORD = 'Pas assez net pour l’instant'
const NODATA_WORD = 'Pas assez de données'

/**
 * POLISH-SIM-170 (« Stressé et pressé », J45 : « Pas assez de données. OK, mais je fais quoi ? ») : une famille toujours
 * montrée qui n'a aucun facteur comparé dit ce qui manque et mène où le donner. « Un jour sur deux » :
 * FACTOR_MIN_COVERAGE de services/analysisResults.js.
 */
export const NODATA_ACTIONS = {
  sleep: { text: 'Il faut vos nuits au moins un jour sur deux.', to: '/connectors' },
  nutrition: { text: 'Notez vos repas au moins un jour sur deux.', to: '/food' },
  activity: { text: 'Il faut vos pas au moins un jour sur deux.', to: '/connectors' },
}

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
 * @returns {{ id: string, label: string, tone: string, state: 'net'|'none'|'nodata', level: 0|1|2|3, word: string, lead: string|null, action: { text: string, to: string }|null }[]}
 */
export function influenceFamilies(outcome) {
  if (!outcome || outcome.status === 'locked') return []
  const factors = Object.values(outcome.horizons || {}).filter((h) => h.status === 'ready').flatMap((h) => h.factors || [])
  const rows = FAMILIES.map((fam) => {
    const mine = factors.filter((f) => familyOf(f) === fam.id)
    const best = mine.filter((f) => f.net && !f.outOfScale).sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))[0]
    const base = { id: fam.id, label: fam.label, tone: fam.tone }
    if (best) return { ...base, state: 'net', level: levelOf(best.effect), word: LEVEL_WORDS[levelOf(best.effect)], lead: best.label, action: null, strength: Math.abs(best.effect), always: fam.always }
    const action = mine.length ? null : (NODATA_ACTIONS[fam.id] ?? null)
    return { ...base, state: mine.length ? 'none' : 'nodata', level: 0, word: mine.length ? NONE_WORD : NODATA_WORD, lead: null, action, strength: 0, always: fam.always }
  }).filter((r) => r.always || r.state === 'net')
  // Tri stable : la famille au lien le plus fort d'abord ; sans lien net, l'ordre de FAMILIES
  return rows.sort((a, b) => b.strength - a.strength).map(({ strength, always, ...r }) => r) // eslint-disable-line no-unused-vars
}

/**
 * REFONTE-6c : le détail d'une famille (brief § 4 : « puis le détail d'une famille et la piste à tester »).
 * Ses facteurs, délai prêt par délai prêt, et ses liens nets (un par facteur, au délai où il est le plus fort).
 * `bars` suit la règle de « Ce qui va avec » : les barres ne se montrent que si la méthode prévoit mieux que
 * « demain comme aujourd'hui ». Null pour une famille inconnue, avant les résultats ou sans facteur comparé.
 * @returns {{ id, label, tone, bars: boolean, count: number, names: string[], horizons: { id, label, window, factors: object[] }[], pistes: object[], fodmapNotCompared: { id, label, hint }[] } | null}
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
  // POLISH-SIM-160 : les facteurs comparés par leur nom, une fois chacun, dans l'ordre où ils apparaissent
  const names = [...new Map(horizons.flatMap((h) => h.factors.map((f) => [f.key, f.label]))).values()]
  // POLISH-FODMAP-ABSENT (« Ventre et données », 27/11 : « fructanes et mannitol absents, pourquoi ? ») : un groupe
  // FODMAP sans repas au-dessus de son repère ne varie pas, la méthode ne peut pas le comparer (fitOne) ; le dire.
  const keys = new Set(horizons.flatMap((h) => h.factors.map((f) => f.key)))
  const fodmapNotCompared = fam.id === 'nutrition'
    ? FODMAP_GROUPS.filter((g) => !keys.has(`fodmap_${g.id}`)).map(({ id, label, hint }) => ({ id, label, hint }))
    : []
  return { id: fam.id, label: fam.label, tone: fam.tone, bars: outcome.beatsPersistence === true, count: names.length, names, horizons, pistes, fodmapNotCompared }
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const median = (values) => {
  const s = [...values].sort((a, b) => a - b)
  const n = s.length
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}

/**
 * REFONTE-6b-2 (SPEC comprendre § 6.3 : « Sommeil · 7 h 05 par nuit », « Alimentation · 19 repas », « Activité ·
 * 8 400 pas par jour ») : ce que la personne fait d'habitude dans chaque famille, à côté de la force du lien.
 * Sommeil et pas : la médiane des 14 jours passés, dès 7 jours de mesure, comme « d'habitude » sur l'Accueil
 * (services/dayDeviations.js), pour que les deux écrans disent le même chiffre ; aujourd'hui n'est pas compté (pas
 * encore fini). Repas : le nombre noté sur les 14 derniers jours, aujourd'hui compris. Une description, jamais une
 * norme (règle 6) : aucun repère, aucune couleur.
 * @param {{ dateKey: string, summary: object }[] | null} days  sortie de buildDailyJournal
 * @returns {{ sleep?: string, activity?: string, nutrition?: string }}
 */
// Les valeurs brutes communes à familyUsuals et familyPeriods
function usualValues(days, now) {
  const DAY = 86_400_000
  const today = localDateKey(now.toISOString())
  const from = localDateKey(new Date(now.getTime() - DEVIATION_WINDOW_DAYS * DAY).toISOString())
  const mealsFrom = localDateKey(new Date(now.getTime() - (DEVIATION_WINDOW_DAYS - 1) * DAY).toISOString())
  const list = Array.isArray(days) ? days.filter((d) => d?.dateKey) : []
  const past = list.filter((d) => d.dateKey >= from && d.dateKey < today)
  const usual = (field) => {
    const values = past.map((d) => d.summary?.[field]).filter(isNum)
    const m = values.length >= DEVIATION_MIN_PAST_DAYS ? median(values) : null
    return m != null && m > 0 ? m : null
  }
  const meals = list
    .filter((d) => d.dateKey >= mealsFrom && d.dateKey <= today)
    .reduce((n, d) => n + (isNum(d.summary?.meals) ? d.summary.meals : 0), 0)
  return { sleep: usual('sleepMinutes'), steps: usual('steps'), meals }
}

const stepsText = (steps) => `${Math.round(steps).toLocaleString(appLocale())} pas par jour`

export function familyUsuals(days, now = new Date()) {
  const { sleep, steps, meals } = usualValues(days, now)
  const out = {}
  if (sleep != null) out.sleep = `${formatDuration(sleep)} par nuit`
  if (steps != null) out.activity = stepsText(steps)
  if (meals > 0) out.nutrition = `${meals} repas en ${DEVIATION_WINDOW_DAYS} jours`
  return out
}

/**
 * REFONTE-6c-3 (SPEC comprendre § 6.5 : « Vos 14 dernières nuits · en moyenne 7 h 05 ») : la ligne sous le titre du
 * détail d'une famille. Les mêmes chiffres que familyUsuals ; « d'habitude » plutôt que « en moyenne », puisque c'est
 * la médiane, comme sur l'Accueil. Rien sans mesure.
 * @returns {{ sleep?: string, activity?: string, nutrition?: string }}
 */
export function familyPeriods(days, now = new Date()) {
  const { sleep, steps, meals } = usualValues(days, now)
  const n = DEVIATION_WINDOW_DAYS
  const out = {}
  if (sleep != null) out.sleep = `Vos ${n} dernières nuits · d’habitude ${formatDuration(sleep)}`
  if (steps != null) out.activity = `Vos ${n} derniers jours · d’habitude ${stepsText(steps)}`
  if (meals > 0) out.nutrition = `Vos ${n} derniers jours · ${meals} repas noté${meals > 1 ? 's' : ''}`
  return out
}
