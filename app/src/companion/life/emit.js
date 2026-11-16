/**
 * Ce que le lot VIE dit au reste du compagnon (scène, Pilou en 3D, bulles), par le bus du contrat
 * (app/src/companion/CONTRAT.md § 4) : repas noté, bien-être noté, habitude, digestion, annulation, méditation.
 * L'émission suit toujours l'enregistrement de la saisie ; jamais le contenu d'un repas ni une valeur de santé au-delà
 * du contrat.
 */
import { bus, EVENTS } from '../bus'
import { mealSlotOf } from '../../services/dayChecklist'
import { scoreToChoice } from '../../services/mood/wellbeingScale'

const SLOT = { morning: 'breakfast', noon: 'lunch', evening: 'dinner' }
/** Durée de la méditation de Pilou (SPEC journée § 6). */
export const MEDITATION_MS = 4400

/**
 * @param {object|null} entry la saisie qui vient d'arriver (null pour une annulation)
 * @param {{ undone?: { kind: string, id: string }, mealsToday?: number, target?: object }} [ctx]
 * @returns {string[]} les événements émis (pour les tests)
 */
export function emitEntry(entry, { undone, mealsToday = 0, target = bus } = {}) {
  const sent = []
  const send = (type, payload) => {
    target.emit(type, payload)
    sent.push(type)
  }
  if (!entry && undone) send(EVENTS.ENTRY_UNDONE, undone)
  if (!entry) return sent
  if (entry.type === 'food') send(EVENTS.MEAL_LOGGED, { slot: SLOT[mealSlotOf(entry.at)], count: mealsToday, total: 3 })
  if (entry.type === 'wellbeing') {
    const level = scoreToChoice(entry.payload?.score)
    send(EVENTS.WELLBEING_NOTED, { level, difficult: level <= 2, source: 'note' })
  }
  if (entry.type === 'gut') send(EVENTS.GUT_NOTED, {})
  if (entry.type === 'habit') {
    const habitId = entry.payload?.habit
    const yes = !!entry.payload?.done
    send(EVENTS.HABIT_NOTED, { habitId, answer: yes ? 'yes' : 'no' })
    if (yes && (habitId === 'meditation' || habitId === 'reading')) {
      send(EVENTS.ACTIVITY_START, { kind: habitId })
      setTimeout(() => target.emit(EVENTS.ACTIVITY_END, { kind: habitId }), MEDITATION_MS)
    }
  }
  return sent
}

/** « Plus rien à faire » (SPEC journée § 8). */
export const emitDayDone = (target = bus) => target.emit(EVENTS.DAY_DONE, {})
