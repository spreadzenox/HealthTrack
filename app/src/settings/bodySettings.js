/**
 * Profil saisi dans l'app (sexe, année de naissance, taille, niveau d'activité) — stocké localement.
 * Le poids n'est pas ici : une pesée saisie à la main est une entrée `weight` (source `app_weight`).
 */

const KEY = 'healthtrack_body_profile'

const MIN_HEIGHT_CM = 100
const MAX_HEIGHT_CM = 250
const ACTIVITY_IDS = ['sedentary', 'moderate', 'active', 'very_active']

function toInt(value) {
  if (value === '' || value == null) return undefined
  const n = Math.round(Number(value))
  return Number.isFinite(n) ? n : undefined
}

/**
 * Garde uniquement les champs connus et valides (formulaire, localStorage ou fichier de sauvegarde).
 * @returns {{ sex?: 'M'|'F', birthYear?: number, heightCm?: number, activity?: string }}
 */
export function sanitizeBodySettings(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object') return out
  if (raw.sex === 'M' || raw.sex === 'F') out.sex = raw.sex
  const year = toInt(raw.birthYear)
  const thisYear = new Date().getFullYear()
  if (year && year >= thisYear - 110 && year <= thisYear - 15) out.birthYear = year
  const height = toInt(raw.heightCm)
  if (height && height >= MIN_HEIGHT_CM && height <= MAX_HEIGHT_CM) out.heightCm = height
  if (ACTIVITY_IDS.includes(raw.activity)) out.activity = raw.activity
  return out
}

/**
 * @returns {{ sex?: 'M'|'F', birthYear?: number, heightCm?: number, activity?: string }}
 */
export function getBodySettings() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return sanitizeBodySettings(JSON.parse(raw))
  } catch { /* ignore */ }
  return {}
}

/**
 * Remplace le profil saisi (les champs vides ou invalides sont retirés).
 * @param {{ sex?: string, birthYear?: number|string, heightCm?: number|string, activity?: string }} profile
 */
export function setBodySettings(profile) {
  const clean = sanitizeBodySettings(profile)
  if (Object.keys(clean).length === 0) localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, JSON.stringify(clean))
}

export function ageFromBirthYear(birthYear, now = new Date()) {
  if (!birthYear) return undefined
  return now.getFullYear() - birthYear
}
