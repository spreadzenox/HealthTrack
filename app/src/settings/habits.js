/**
 * Les habitudes que la personne suit (refonte « Compagnon », étape 4) : réglage local, joint à l'export JSON.
 * Les quatre proposées et une habitude libre au plus (brief § 3.3). Retirer une habitude n'efface aucune réponse.
 */
import { SUGGESTED_HABITS, CUSTOM_PREFIX, customHabit } from '../services/habits'

export const HABITS_KEY = 'healthtrack_habits'

/** Liste propre : les proposées dans leur ordre (libellé de l'app), puis la première habitude libre lisible. */
export function sanitizeHabits(raw) {
  if (!Array.isArray(raw)) return []
  const ids = raw.filter((h) => h && typeof h === 'object').map((h) => h.id)
  const out = SUGGESTED_HABITS.filter((h) => ids.includes(h.id)).map((h) => ({ ...h }))
  for (const h of raw) {
    if (!h || typeof h.id !== 'string' || !h.id.startsWith(CUSTOM_PREFIX)) continue
    const custom = customHabit(h.label)
    if (!custom) continue
    out.push(custom)
    break
  }
  return out
}

/** @returns {{ id: string, label: string }[]} */
export function getHabits() {
  try {
    const raw = localStorage.getItem(HABITS_KEY)
    if (raw) return sanitizeHabits(JSON.parse(raw))
  } catch { /* ignore */ }
  return []
}

export function setHabits(habits) {
  const clean = sanitizeHabits(habits)
  try {
    if (clean.length === 0) localStorage.removeItem(HABITS_KEY)
    else localStorage.setItem(HABITS_KEY, JSON.stringify(clean))
  } catch { /* stockage indisponible : rien de gardé */ }
  return clean
}
