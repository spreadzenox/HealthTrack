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
import { AUTO_LATE_SCREEN_MIN } from './behaviorTags'
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
  return { sleep: usual('sleepMinutes'), steps: usual('steps'), meals, list }
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

/**
 * REFONTE-6c-4 (SPEC comprendre § 6.5 : « Barres des 14 nuits ») : une valeur par jour sous la ligne d'en-tête, de la
 * plus ancienne à la plus récente, sur les mêmes jours que familyPeriods (sommeil et pas : les 14 jours passés ;
 * repas : 13 jours passés et aujourd'hui). `usual` est la médiane déjà écrite dans l'en-tête (null pour les repas).
 * Une famille n'a de barres que si elle a sa ligne d'en-tête. Un jour sans mesure vaut null.
 * @returns {{ sleep?: Bars, activity?: Bars, nutrition?: Bars }}  Bars = { days: { dateKey, value }[], usual }
 */
export function familyBars(days, now = new Date()) {
  const { sleep, steps, meals, list } = usualValues(days, now)
  const DAY = 86_400_000
  const n = DEVIATION_WINDOW_DAYS
  const byKey = new Map(list.map((d) => [d.dateKey, d.summary]))
  const series = (field, lastOffset) => Array.from({ length: n }, (_, i) => {
    const dateKey = localDateKey(new Date(now.getTime() - (n - 1 - i + lastOffset) * DAY).toISOString())
    const v = byKey.get(dateKey)?.[field]
    return { dateKey, value: isNum(v) ? v : null }
  })
  const out = {}
  if (sleep != null) {
    const sleepDays = series('sleepMinutes', 1)
    out.sleep = { days: sleepDays, usual: sleep, evenings: eveningSplit(sleepDays, byKey) }
  }
  if (steps != null) out.activity = { days: series('steps', 1), usual: steps }
  if (meals > 0) out.nutrition = { days: series('meals', 0), usual: null }
  return out
}

/** REFONTE-6c-5 : nuits mesurées qu'il faut de chaque côté pour écrire les deux moyennes (comme le bilan, SPEC § 7). */
export const EVENING_SPLIT_MIN = 3

/**
 * REFONTE-6c-5 (SPEC comprendre § 6.5 : point ambre sur les soirs d'écran, puis « deux moyennes se tracent ») : marque
 * chaque nuit dont la soirée a eu de l'écran tard (`late`, absent quand l'écran n'est pas connu) et compare la moyenne
 * des nuits qui suivent ces soirs à celle des autres nuits. « Écran tard » est la mesure qui existe déjà dans l'app
 * (au moins AUTO_LATE_SCREEN_MIN minutes entre 22 h et 4 h, rangées au jour du réveil comme la nuit), plutôt que les
 * « 2 h d'écran » de la maquette : un même objet, une seule mesure, et c'est ce que la piste « pas d'écran après 22 h »
 * fera changer. Les nuits estimées par le téléphone ne comptent pas dans les moyennes : elles sont déduites de l'écran
 * lui-même (lien circulaire, règle 5). Une description sur 14 nuits, jamais une preuve.
 */
function eveningSplit(sleepDays, byKey) {
  const late = []
  const other = []
  for (const d of sleepDays) {
    const s = byKey.get(d.dateKey)
    const mins = s?.lateScreenMinutes
    if (!isNum(mins)) continue
    d.late = mins >= AUTO_LATE_SCREEN_MIN
    if (d.value == null || !(d.value > 0) || s.sleepEstimated) continue
    ;(d.late ? late : other).push(d.value)
  }
  if (late.length < EVENING_SPLIT_MIN || other.length < EVENING_SPLIT_MIN) return null
  const mean = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length)
  const l = mean(late)
  const o = mean(other)
  return { late: l, other: o, lateCount: late.length, otherCount: other.length, diff: l - o }
}

/**
 * REFONTE-6c-5 : les mots sous les barres du sommeil. « pas d'écart » sous 1 min ; signe typographique « − ».
 * @returns {{ late: string, other: string, diff: string, note: string } | null}
 */
export function eveningsText(evenings) {
  if (!evenings) return null
  const { late, other, lateCount, otherCount, diff } = evenings
  const d = Math.round(diff)
  return {
    late: `Soirs avec écran après 22 h : ${formatDuration(late)}`,
    other: `Autres soirs : ${formatDuration(other)}`,
    diff: d === 0 ? 'pas d’écart' : `${d < 0 ? '−' : '+'}${formatDuration(Math.abs(d))}`,
    note: `Observé sur ${lateCount + otherCount} nuits : un lien, pas une preuve.`,
  }
}
