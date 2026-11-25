/**
 * Checklist de « Ma journée » (refonte « Compagnon », étape 3, brief § 4 et specs/journee.SPEC.md § 1) : ce qui se
 * note à la main aujourd'hui, et ce qui l'est déjà. Fonction pure : les entrées du jour, l'heure, et l'objectif
 * digestion (sans lui, le ventre n'est jamais demandé). Étape 4 : une ligne par habitude suivie, oui ou non.
 */
import { localDateKey } from './analysisEngine'
import { GUT_TYPE, GUT_EVENING_FROM_HOUR, GUT_LEVELS, gutEveningCheck, isGutDayNote } from './today'
import { habitAnswers } from './habits'

/**
 * Les trois cercles de la ligne Repas ; un repas remplit celui de son heure, ou celui qu'on a touché pour le noter
 * (`payload.slot`, POLISH-SIM-122). `mid` : heure proposée pour un créneau déjà passé.
 */
export const MEAL_SLOTS = [
  { id: 'morning', label: 'Matin', before: 11, mid: [8, 0], phrase: 'Repas du matin' },
  { id: 'noon', label: 'Midi', before: 16, mid: [12, 30], phrase: 'Repas de midi' },
  { id: 'evening', label: 'Soir', before: 24, mid: [19, 30], phrase: 'Repas du soir' },
]

export function mealSlotOf(iso) {
  const h = new Date(iso).getHours()
  return MEAL_SLOTS.find((s) => h < s.before).id
}

const slotById = (id) => MEAL_SLOTS.find((s) => s.id === id) ?? null

/** Créneau d'un repas : le cercle touché pour le noter s'il est connu, sinon son heure. */
export function mealSlotOfEntry(entry) {
  const touched = slotById(entry?.payload?.slot)
  return touched ? touched.id : mealSlotOf(entry.at)
}

/**
 * POLISH-SIM-122 : heure proposée pour un repas noté depuis un cercle déjà passé (Matin touché à 15 h → 08:00),
 * null si le créneau est l'actuel ou à venir (un repas n'est jamais dans le futur : il garde l'heure du geste).
 */
export function pastSlotAt(slotId, now = new Date()) {
  const slot = slotById(slotId)
  if (!slot) return null
  const current = MEAL_SLOTS.findIndex((s) => s.id === mealSlotOf(now.toISOString()))
  if (MEAL_SLOTS.indexOf(slot) >= current) return null
  const d = new Date(now)
  d.setHours(slot.mid[0], slot.mid[1], 0, 0)
  return d.toISOString()
}

/**
 * Simulation du 24/11 (« Ventre et données » J45, trois essais dans le champ date) : heure d'un repas d'hier, au milieu
 * du créneau (« Hier midi » → hier 12:30), au format d'un champ `datetime-local`.
 */
export function yesterdaySlotInput(slotId, now = new Date()) {
  const slot = slotById(slotId)
  if (!slot) return null
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  d.setHours(slot.mid[0], slot.mid[1], 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Heure proposée pour un repas noté depuis un cercle : le milieu d'un créneau passé, sinon maintenant. */
export function slotMealAt(slotId, now = new Date()) {
  return pastSlotAt(slotId, now) ?? now.toISOString()
}

/** « Repas de midi », pour dire où un repas est rangé ; null pour un créneau inconnu. */
export const mealSlotPhrase = (slotId) => slotById(slotId)?.phrase ?? null

/**
 * @param {object[]} entries  entrées récentes (toutes dates)
 * @param {{ now?: Date, askGut?: boolean, habits?: { id: string, label: string }[] }} [opts]
 * @returns {{ tasks: object[], remaining: number, allDone: boolean, noted: { kind: string, entry: object }[] }}
 */
export function dayChecklist(entries, { now = new Date(), askGut = false, habits = [] } = {}) {
  const today = localDateKey(now.toISOString())
  const ofToday = (entries || []).filter((e) => e?.at && localDateKey(e.at) === today)
  const meals = ofToday.filter((e) => e.type === 'food').sort((a, b) => (a.at < b.at ? -1 : 1))
  const slots = MEAL_SLOTS.map((s) => ({
    id: s.id,
    label: s.label,
    filled: meals.some((m) => mealSlotOfEntry(m) === s.id),
  }))
  const count = slots.filter((s) => s.filled).length
  const wellbeing = ofToday.filter((e) => e.type === 'wellbeing').sort((a, b) => (a.at < b.at ? 1 : -1))[0] ?? null

  const tasks = [
    { id: 'meals', done: count === slots.length, slots, count },
    { id: 'wellbeing', done: Boolean(wellbeing), entry: wellbeing },
  ]
  // POLISH-SIM-123 : une note digestive d'un moment (« Gêne » à 08:35) n'est pas le bilan du soir, mais elle se voit :
  // dans « Déjà noté », et sous la ligne du soir, qui reste à faire.
  const gutMoments = ofToday
    .filter((e) => e.type === GUT_TYPE && !isGutDayNote(e) && GUT_LEVELS.some((l) => l.id === e.payload?.level))
    .sort((a, b) => (a.at < b.at ? -1 : 1))
  let gut = null
  if (askGut) {
    gut = gutEveningCheck(ofToday.filter((e) => e.type === GUT_TYPE), now).done
    tasks.push({
      id: 'gut',
      done: Boolean(gut),
      entry: gut,
      available: now.getHours() >= GUT_EVENING_FROM_HOUR,
      moment: gutMoments[gutMoments.length - 1] ?? null,
    })
  }

  // Habitudes : « non » est une réponse comme « oui », la ligne est faite dans les deux cas (brief § 5)
  const answers = habitAnswers(ofToday, today)
  const habitTasks = habits.map((habit) => {
    const entry = answers.get(habit.id) ?? null
    return { id: `habit:${habit.id}`, habit, done: Boolean(entry), entry }
  })
  tasks.splice(2, 0, ...habitTasks)

  const noted = [
    ...meals.map((entry) => ({ kind: 'meal', entry })),
    ...(wellbeing ? [{ kind: 'wellbeing', entry: wellbeing }] : []),
    ...gutMoments.map((entry) => ({ kind: 'gutMoment', entry })),
    ...(gut ? [{ kind: 'gut', entry: gut }] : []),
  ].sort((a, b) => (a.entry.at < b.entry.at ? -1 : 1))
  // Une habitude n'a pas d'heure (rangée à midi) : après les saisies horodatées, dans l'ordre de la liste
  noted.push(...habitTasks.filter((t) => t.entry).map((t) => ({ kind: 'habit', entry: t.entry, habit: t.habit })))
  const remaining = tasks.filter((t) => !t.done).length
  return { tasks, remaining, allDone: remaining === 0, noted }
}
