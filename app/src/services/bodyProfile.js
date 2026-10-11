/**
 * Profil corporel (poids, taille, sexe, âge) pour les repères nutritionnels.
 * Priorité : profil saisi dans l'app > Withings > valeur par défaut (signalée dans `origins`).
 */

import { listEntries } from '../storage/localHealthStorage'
import { getWithingsUserProfile } from '../settings/withingsSettings'
import { getBodySettings, ageFromBirthYear } from '../settings/bodySettings'

export const DEFAULT_WEIGHT_KG = 70
export const DEFAULT_HEIGHT_CM = 170

function latest(entries, type, valueKey) {
  return entries
    .filter((e) => e.type === type && e.payload?.[valueKey] > 0)
    .sort((a, b) => (b.at < a.at ? -1 : 1))[0]
}

function originOf(entry) {
  return entry.source === 'withings' ? 'withings' : 'manual'
}

/**
 * @param {Array<{ type: string, source?: string, at: string, payload?: object }>} [entries]
 * @returns {Promise<{ weightKg: number, heightCm: number, sex?: 'M'|'F', age?: number, source: string,
 *   origins: { weight: string, height: string, sex: string, age: string }, weightAt?: string, heightAt?: string }>}
 */
export async function getBodyProfile(entries) {
  const data = entries ?? await listEntries({ limit: 5000 })
  const manual = getBodySettings()
  const withingsUser = getWithingsUserProfile() || {}

  const weightEntry = latest(data, 'weight', 'valueKg')
  const heightEntry = manual.heightCm ? null : latest(data, 'height', 'valueCm')
  const manualAge = ageFromBirthYear(manual.birthYear)

  const origins = {
    weight: weightEntry ? originOf(weightEntry) : 'default',
    height: manual.heightCm ? 'manual' : heightEntry ? originOf(heightEntry) : 'default',
    sex: manual.sex ? 'manual' : withingsUser.sex ? 'withings' : 'default',
    age: manualAge ? 'manual' : withingsUser.age ? 'withings' : 'default',
  }
  const source = origins.weight === 'withings' && origins.height === 'withings'
    ? 'withings'
    : origins.weight === 'default' && origins.height === 'default'
      ? 'default'
      : 'mixed'

  return {
    weightKg: weightEntry?.payload?.valueKg ?? DEFAULT_WEIGHT_KG,
    heightCm: manual.heightCm ?? heightEntry?.payload?.valueCm ?? DEFAULT_HEIGHT_CM,
    sex: manual.sex ?? withingsUser.sex,
    age: manualAge ?? withingsUser.age,
    source,
    origins,
    weightAt: weightEntry?.at,
    heightAt: heightEntry?.at,
  }
}

/**
 * Latest Withings body composition snapshot (for display).
 */
export function getLatestBodyComposition(entries) {
  const comp = (entries || [])
    .filter((e) => e.type === 'body_composition' && e.source === 'withings')
    .sort((a, b) => (b.at < a.at ? -1 : 1))[0]
  return comp?.payload ?? null
}

export function computeBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}
