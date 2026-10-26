/**
 * Pistes repas → ventre à l'écran (jalon 5) : réunit les deux moteurs déjà calibrés — notes horodatées par fenêtre
 * (`gutWindows`, 0–4 h, 4–24 h, 24–48 h) et bilans du soir jour par jour (`gutDays`, le jour même ou la veille) — en
 * une liste « un aliment = une piste », la plus nette d'abord. Rien n'est recalculé ici : seules les pistes que les
 * moteurs gardent (BH + porte TTS) sont montrées ; tout le reste est « pas de lien net » ou « trop tôt pour dire ».
 *
 * I171 (a) : pour une piste par fenêtre, part des notes « avec l'aliment » prises dans les 2 h après un repas qui en
 * contenait. Une personne qui surveille un aliment de près le note plus souvent juste après : l'attente joue aussi.
 */
import { localDateKey } from './analysisEngine'
import { analyzeGutDays, GUT_DAY_WINDOWS } from './gutDays'
import { analyzeGutWindows, FODMAP_FACTOR, GUT_WINDOWS, TTS_MIN_KEPT_DAYS, TTS_SHIFT_DAYS, mealFactors } from './gutWindows'
import { GUT_TYPE, isGutDayNote } from './today'
import { shortFoodName } from '../utils/format'

/** Jours de notes du ventre avant de pouvoir garder une piste (porte TTS : r jours retirés à chaque bout + 10). */
export const GUT_LINKS_MIN_DAYS = 2 * TTS_SHIFT_DAYS + TTS_MIN_KEPT_DAYS
/** I171 (a) : une note est « juste après » le repas si elle tombe dans les 2 h qui suivent. */
export const NEAR_MEAL_H = 2

const H = 3_600_000

const WHEN = {
  ...Object.fromEntries(GUT_WINDOWS.map((w) => [w.id, { kind: 'window', label: `${w.label} après`, order: 0 }])),
  ...Object.fromEntries(GUT_DAY_WINDOWS.map((w) => [w.id, { kind: 'day', label: w.label, order: 1 }])),
}

export function gutFactorLabel(factor) {
  if (factor === FODMAP_FACTOR) return 'Repas riches en FODMAP'
  const name = shortFoodName(factor) || factor
  return name.charAt(0).toLocaleUpperCase('fr-FR') + name.slice(1)
}

const joinOr = (names) => (names.length < 2 ? names[0] : `${names.slice(0, -1).join(', ')} ou ${names[names.length - 1]}`)

/** Part des notes exposées prises dans les 2 h après un repas contenant l'aliment (null : pas de note exposée). */
function nearMealShare(notes, meals, factor, w) {
  const own = meals.filter((m) => m.factors.includes(factor)).map((m) => m.t)
  let exposed = 0
  let near = 0
  for (const t of notes) {
    if (!own.some((m) => t - m >= w.fromH * H && t - m < w.toH * H)) continue
    exposed += 1
    if (own.some((m) => t - m >= 0 && t - m < NEAR_MEAL_H * H)) near += 1
  }
  return exposed ? near / exposed : null
}

/**
 * @param {object[]} entries
 * @returns {{ status: 'no_notes'|'too_early'|'none'|'links', noteDays: number, minDays: number, tested: number,
 *   links: { factor: string, label: string, when: string, kind: 'window'|'day', whenLabel: string,
 *     exposed: { n: number, symptoms: number }, unexposed: { n: number, symptoms: number },
 *     rr: number, q: number, nearMeal: number|null, sameNight: boolean, also: string[], together: string[] }[] }}
 */
export function summarizeGutLinks(entries) {
  const list = entries || []
  const gutNotes = list.filter((e) => e?.type === GUT_TYPE && e.at && !Number.isNaN(Date.parse(e.at)))
  const noteDays = new Set(gutNotes.map((e) => localDateKey(e.at))).size
  const base = { noteDays, minDays: GUT_LINKS_MIN_DAYS, tested: 0, links: [] }
  if (noteDays === 0) return { ...base, status: 'no_notes' }

  const byWindow = analyzeGutWindows(list)
  const byDay = analyzeGutDays(list)
  const tested = byWindow.tested + byDay.tested
  const found = [
    ...byWindow.results.map((r) => ({ ...r, n: r.exposed.notes, m: r.unexposed.notes })),
    ...byDay.results.map((r) => ({ ...r, n: r.exposed.days, m: r.unexposed.days })),
  ].filter((r) => r.status === 'link')

  // Un aliment = une piste : la fenêtre la plus nette, les autres rappelées en une ligne.
  const best = new Map()
  for (const r of [...found].sort((a, b) => a.q - b.q || WHEN[a.window].order - WHEN[b.window].order)) {
    if (best.has(r.factor)) best.get(r.factor).also.push(WHEN[r.window].label)
    else best.set(r.factor, { ...r, also: [] })
  }

  const timedNotes = gutNotes.filter((e) => !isGutDayNote(e)).map((e) => Date.parse(e.at))
  const meals = list
    .filter((e) => e?.type === 'food' && e.at && !Number.isNaN(Date.parse(e.at)))
    .map((e) => ({ t: Date.parse(e.at), factors: mealFactors(e) }))

  const links = [...best.values()].map((r) => {
    const w = GUT_WINDOWS.find((win) => win.id === r.window)
    return {
      factor: r.factor,
      label: gutFactorLabel(r.factor),
      when: r.window,
      kind: WHEN[r.window].kind,
      whenLabel: WHEN[r.window].label,
      exposed: { n: r.n, symptoms: r.exposed.symptoms },
      unexposed: { n: r.m, symptoms: r.unexposed.symptoms },
      rr: r.rr,
      q: r.q,
      nearMeal: w ? nearMealShare(timedNotes, meals, r.factor, w) : null,
      also: r.also,
      // I134 : les pistes « jour » sont comparées à nuit comparable quand vos nuits sont connues.
      sameNight: WHEN[r.window].kind === 'day' && byDay.adjustedFor.includes('sleep'),
    }
  })

  // Aliments toujours mangés ensemble : mêmes comptes, même délai. Les données ne peuvent pas les départager, on
  // le dit en une seule piste plutôt que trois cartes identiques.
  const groups = new Map()
  for (const l of links) {
    const key = [l.when, l.exposed.n, l.exposed.symptoms, l.unexposed.n, l.unexposed.symptoms, l.q].join('|')
    if (groups.has(key)) groups.get(key).push(l)
    else groups.set(key, [l])
  }
  const merged = [...groups.values()].map((g) => (g.length === 1 ? { ...g[0], together: [] } : {
    ...g[0],
    label: joinOr(g.map((l, i) => (i === 0 ? l.label : l.label.charAt(0).toLocaleLowerCase('fr-FR') + l.label.slice(1)))),
    together: g.map((l) => l.factor),
  }))

  let status = 'none'
  if (merged.length) status = 'links'
  else if (tested === 0 || noteDays < GUT_LINKS_MIN_DAYS) status = 'too_early'
  return { ...base, tested, links: merged, status }
}
