/**
 * Habitudes (refonte « Compagnon », étape 4 ; brief § 3.3) : ce que la personne fait déjà et note par oui ou non,
 * chaque jour. Proposées : méditation, étirements, relaxation, lecture ; plus une habitude libre (un nom).
 *
 * Stockage : des entrées ordinaires de la table `health_entries` (aucune migration de schéma, comme le cycle), donc
 * comprises telles quelles par l'export et l'import JSON et par les anciennes versions de l'app :
 * `{ type: 'habit', source: 'app_habit', payload: { habit, label, done } }`, une par habitude et par jour.
 * « Non » est une vraie réponse, gardée comme « Oui ». La liste des habitudes suivies est un réglage
 * (settings/habits.js). Tout reste sur le téléphone. Une habitude est une entrée des analyses (variable X), jamais
 * une entrée de l'estimateur du bien-être (règle 5), et aucune n'est « bonne » ou « mauvaise » par principe (règle 6).
 */
import { localDateKey } from './analysisEngine'

export const HABIT_TYPE = 'habit'
export const HABIT_SOURCE = 'app_habit'

// Ajouts en fin de liste seulement : la minute de saisie dépend de la place (habitEntry)
export const SUGGESTED_HABITS = [
  { id: 'meditation', label: 'Méditation' },
  { id: 'stretching', label: 'Étirements' },
  { id: 'relaxation', label: 'Relaxation' },
  { id: 'reading', label: 'Lecture' },
]

export const CUSTOM_PREFIX = 'custom:'
export const MAX_HABIT_LABEL = 40

/** Habitude libre : son nom, et un identifiant tiré du nom (renommer, c'est suivre une autre habitude). */
export function customHabit(name) {
  const label = String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_HABIT_LABEL).trim()
  const slug = label.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug ? { id: `${CUSTOM_PREFIX}${slug}`, label } : null
}

/** Minute propre à chaque habitude : le dédoublonnage (source, date, type) de l'import garde chacune. */
function minuteOf(id) {
  const i = SUGGESTED_HABITS.findIndex((h) => h.id === id)
  if (i >= 0) return i + 1
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 40
  return 15 + h
}

/** Entrée « habitude du jour `dateKey` » (AAAA-MM-JJ, heure locale) prête pour `createEntry`. */
export function habitEntry(habit, dateKey, done) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return {
    type: HABIT_TYPE,
    source: HABIT_SOURCE,
    at: new Date(y, m - 1, d, 12, minuteOf(habit.id)).toISOString(),
    payload: { habit: habit.id, label: habit.label, done: Boolean(done) },
  }
}

/** Réponse du jour par habitude : `Map(id → entrée)` ; si deux réponses existent, la dernière saisie gagne. */
export function habitAnswers(entries, dateKey) {
  const out = new Map()
  for (const e of entries || []) {
    if (e?.type !== HABIT_TYPE || !e.at || !e.payload?.habit || localDateKey(e.at) !== dateKey) continue
    const prev = out.get(e.payload.habit)
    if (!prev || (e.created_at || '') >= (prev.created_at || '')) out.set(e.payload.habit, e)
  }
  return out
}
