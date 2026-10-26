/**
 * Rapport pour le médecin (jalon 7, I175 étape 1) : modèle pur, sans PDF ni React ni stockage.
 *
 * Entrées du journal → un objet qui décrit les deux pages du rapport (page 1 « En bref », page 2 « Détail ») ; le
 * rendu PDF (étape 2, `renderPdf.js`) ne fait que le dessiner. Tout reste sur le téléphone : rien n'est envoyé.
 *
 * Choix de contenu (IDEES.md I175) :
 * - un jour du ventre prend la note la plus forte du jour (douleur > gêne > calme), bilans du soir et notes au fil
 *   de l'eau confondus ; un jour sans note n'est ni calme ni gêné : il est « non noté » ;
 * - les pistes viennent telles quelles de `summarizeGutLinks` (toutes les vérifications passées), toujours « à
 *   confirmer », avec le nombre de comparaisons faites : l'analyse porte sur tout le journal, pas seulement la
 *   période, et on le dit ;
 * - le bien-être estimé par le visage est une donnée sensible et une estimation : absent sauf `includeWellbeing` ;
 * - aucune norme : on décrit, on ne juge pas (pas de « bon » ou « mauvais » sommeil).
 */
import { APP_NAME } from '../../config/brand'
import { localDateKey } from '../analysisEngine'
import { FODMAP_CHALLENGE_TYPE, challengeStatus, findFood, findGroup, verdictSentence } from '../fodmapChallenge'
import { gutFactorLabel, summarizeGutLinks } from '../gutLinks'
import { FODMAP_FACTOR, mealFactors } from '../gutWindows'
import { faceMoodDays } from '../mood/faceMoodDays'
import { nightlySleep } from '../radar'
import { computeSleepRegularity } from '../sleepRegularity'
import { GUT_LEVELS, GUT_TYPE, SOURCE_LABELS, entrySourceLabel } from '../today'

export const REPORT_PERIODS = [2, 4, 12]
export const REPORT_DEFAULT_WEEKS = 4
export const REPORT_TOP_FOODS = 8
export const REPORT_DISCLAIMER = 'Estimations et liens repérés dans un journal personnel, pas un diagnostic.'

const RANK = { calm: 0, discomfort: 1, pain: 2 }
const REGULARITY = { regular: 'régulier', fairly: 'assez régulier', variable: 'variable' }
const HAND = 'Saisi à la main'

const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d + n, 12).toISOString())
}
const validAt = (e) => e?.at && !Number.isNaN(Date.parse(e.at))

/** Nom du fichier : `Halcya-rapport-AAAA-MM-JJ.pdf`. */
export function reportFileName(now = new Date()) {
  return `${APP_NAME}-rapport-${localDateKey(now.toISOString())}.pdf`
}

/** Source lisible pour le rapport : saisie à la main, montre, Health Connect (avec l'app d'origine)… */
function reportSource(e) {
  if (e.type === 'face_burst') return 'Caméra du téléphone (estimation)'
  if (String(e.source || '').startsWith('app_')) return HAND
  if (e.source === 'huawei_watch') return SOURCE_LABELS.huawei_watch
  return entrySourceLabel(e)
}

function levelCounts(days) {
  const counts = { calm: 0, discomfort: 0, pain: 0 }
  for (const d of days) if (d.level) counts[d.level] += 1
  return counts
}

/**
 * @param {object[]} entries  tout le journal (le rapport choisit lui-même la période)
 * @param {{ now?: Date, weeks?: number, includeWellbeing?: boolean, appVersion?: string|null }} [opts]
 */
export function buildReport(entries, { now = new Date(), weeks = REPORT_DEFAULT_WEEKS, includeWellbeing = false, appVersion = null } = {}) {
  const list = (entries || []).filter(validAt)
  const nWeeks = REPORT_PERIODS.includes(weeks) ? weeks : REPORT_DEFAULT_WEEKS
  const to = localDateKey(now.toISOString())
  const from = addDays(to, -(nWeeks * 7 - 1))
  const inPeriod = (e) => {
    const k = localDateKey(e.at)
    return k >= from && k <= to
  }
  const period = list.filter(inPeriod)

  // Ventre : la note la plus forte de chaque jour.
  const gutByDay = new Map()
  for (const e of period) {
    if (e.type !== GUT_TYPE || !(e.payload?.level in RANK)) continue
    const k = localDateKey(e.at)
    const prev = gutByDay.get(k)
    if (!prev || RANK[e.payload.level] > RANK[prev]) gutByDay.set(k, e.payload.level)
  }

  // Repas : aliments par jour et jours riches en FODMAP.
  const foodDays = new Map()
  const fodmapDays = new Set()
  for (const e of period) {
    if (e.type !== 'food') continue
    const k = localDateKey(e.at)
    for (const f of mealFactors(e)) {
      if (f === FODMAP_FACTOR) {
        fodmapDays.add(k)
        continue
      }
      if (!foodDays.has(f)) foodDays.set(f, new Set())
      foodDays.get(f).add(k)
    }
  }

  const calendar = []
  for (let k = from; k <= to; k = addDays(k, 1)) {
    calendar.push({ date: k, level: gutByDay.get(k) ?? null, fodmap: fodmapDays.has(k) })
  }

  const counts = levelCounts(calendar)
  const notedDays = calendar.filter((d) => d.level).length
  const shares = Object.fromEntries(GUT_LEVELS.map((l) => [l.id, notedDays ? counts[l.id] / notedDays : 0]))

  const weekly = Array.from({ length: nWeeks }, (_, i) => {
    const days = calendar.slice(i * 7, i * 7 + 7)
    const c = levelCounts(days)
    return { from: days[0].date, to: days[days.length - 1].date, notedDays: days.filter((d) => d.level).length, ...c }
  })

  // Réintroduction : tous les tests faits (pas seulement ceux de la période), du plus ancien au plus récent.
  const gutAll = list.filter((e) => e.type === GUT_TYPE)
  const challenges = list
    .filter((e) => e.type === FODMAP_CHALLENGE_TYPE && e.payload?.group && !e.payload.abandonedAt)
    .sort((a, b) => (a.payload.startedAt < b.payload.startedAt ? -1 : 1))
    .map((e) => {
      const s = challengeStatus(e.payload, gutAll, now)
      return {
        group: findGroup(e.payload.group)?.label ?? e.payload.group,
        food: findFood(e.payload.group, e.payload.food)?.label ?? e.payload.food,
        startedAt: e.payload.startedAt,
        state: s.verdict ? 'done' : 'ongoing',
        verdict: s.verdict?.tag ?? null,
        sentence: s.verdict ? verdictSentence(e.payload, s.verdict) : null,
      }
    })

  // Pistes : sur tout le journal (une période courte ne suffit jamais), on le dit dans le rapport.
  const g = summarizeGutLinks(list)
  const links = {
    status: g.status,
    noteDays: g.noteDays,
    minDays: g.minDays,
    comparisons: g.tested,
    items: g.links.map((l) => ({
      label: l.label,
      when: l.whenLabel,
      strength: 'à confirmer',
      exposed: l.exposed,
      unexposed: l.unexposed,
    })),
  }

  // Sommeil mesuré (pas l'estimation du téléphone) : durée moyenne des nuits de la période, régularité sur 14 jours.
  const nights = [...nightlySleep(period)].filter(([k]) => k >= from && k <= to).map(([, m]) => m)
  const regularity = computeSleepRegularity(list, now)
  const sleep = nights.length ? {
    nights: nights.length,
    meanMinutes: Math.round(nights.reduce((a, b) => a + b, 0) / nights.length),
    regularity: regularity?.status === 'ok' ? REGULARITY[regularity.level] ?? null : null,
  } : null

  const topFoods = [...foodDays]
    .map(([f, days]) => ({ label: gutFactorLabel(f), days: days.size }))
    .sort((a, b) => b.days - a.days || a.label.localeCompare(b.label, 'fr'))
    .slice(0, REPORT_TOP_FOODS)

  let wellbeing = null
  const sourceTypes = new Set([GUT_TYPE, 'food', 'sleep', FODMAP_CHALLENGE_TYPE])
  if (includeWellbeing) {
    const est = faceMoodDays(period).filter((d) => d.date >= from && d.date <= to)
    wellbeing = est.length ? {
      days: est.length,
      mean: Math.round((est.reduce((a, d) => a + d.note, 0) / est.length) * 10) / 10,
      scale: 5,
      note: 'Estimation à partir du visage, pas un diagnostic.',
    } : null
    if (est.length) sourceTypes.add('face_burst')
  }

  const sources = [...new Set(period.filter((e) => sourceTypes.has(e.type)).map(reportSource))]
    .sort((a, b) => (a === HAND ? -1 : b === HAND ? 1 : a.localeCompare(b, 'fr')))

  return {
    title: 'Rapport pour mon médecin',
    app: APP_NAME,
    appVersion,
    generatedAt: now.toISOString(),
    period: { from, to, weeks: nWeeks, days: calendar.length },
    disclaimer: REPORT_DISCLAIMER,
    gut: { notedDays, ...counts, shares },
    weekly,
    challenges,
    links,
    sleep,
    calendar,
    topFoods,
    wellbeing,
    sources,
  }
}
