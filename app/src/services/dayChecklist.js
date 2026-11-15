/**
 * Checklist de « Ma journée » (refonte « Compagnon », étape 3, brief § 4 et specs/journee.SPEC.md § 1) : ce qui se
 * note à la main aujourd'hui, et ce qui l'est déjà. Fonction pure : les entrées du jour, l'heure, et l'objectif
 * digestion (sans lui, le ventre n'est jamais demandé). Les habitudes s'y ajoutent à l'étape 4.
 */
import { localDateKey } from './analysisEngine'
import { GUT_TYPE, GUT_EVENING_FROM_HOUR, gutEveningCheck } from './today'

/** Les trois cercles de la ligne Repas ; un repas remplit celui de son heure. */
export const MEAL_SLOTS = [
  { id: 'morning', label: 'Matin', before: 11 },
  { id: 'noon', label: 'Midi', before: 16 },
  { id: 'evening', label: 'Soir', before: 24 },
]

export function mealSlotOf(iso) {
  const h = new Date(iso).getHours()
  return MEAL_SLOTS.find((s) => h < s.before).id
}

/**
 * @param {object[]} entries  entrées récentes (toutes dates)
 * @param {{ now?: Date, askGut?: boolean }} [opts]
 * @returns {{ tasks: object[], remaining: number, allDone: boolean, noted: { kind: string, entry: object }[] }}
 */
export function dayChecklist(entries, { now = new Date(), askGut = false } = {}) {
  const today = localDateKey(now.toISOString())
  const ofToday = (entries || []).filter((e) => e?.at && localDateKey(e.at) === today)
  const meals = ofToday.filter((e) => e.type === 'food').sort((a, b) => (a.at < b.at ? -1 : 1))
  const slots = MEAL_SLOTS.map((s) => ({
    id: s.id,
    label: s.label,
    filled: meals.some((m) => mealSlotOf(m.at) === s.id),
  }))
  const count = slots.filter((s) => s.filled).length
  const wellbeing = ofToday.filter((e) => e.type === 'wellbeing').sort((a, b) => (a.at < b.at ? 1 : -1))[0] ?? null

  const tasks = [
    { id: 'meals', done: count === slots.length, slots, count },
    { id: 'wellbeing', done: Boolean(wellbeing), entry: wellbeing },
  ]
  let gut = null
  if (askGut) {
    gut = gutEveningCheck(ofToday.filter((e) => e.type === GUT_TYPE), now).done
    tasks.push({ id: 'gut', done: Boolean(gut), entry: gut, available: now.getHours() >= GUT_EVENING_FROM_HOUR })
  }

  const noted = [
    ...meals.map((entry) => ({ kind: 'meal', entry })),
    ...(wellbeing ? [{ kind: 'wellbeing', entry: wellbeing }] : []),
    ...(gut ? [{ kind: 'gut', entry: gut }] : []),
  ].sort((a, b) => (a.entry.at < b.entry.at ? -1 : 1))
  const remaining = tasks.filter((t) => !t.done).length
  return { tasks, remaining, allDone: remaining === 0, noted }
}
