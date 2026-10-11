/**
 * Body profile (weight, height) from Withings entries or manual fallback.
 */

import { listEntries } from '../storage/localHealthStorage'
import { getWithingsUserProfile } from '../settings/withingsSettings'
import { BODY_MEASUREMENT_SOURCES } from '../constants/bodyMeasurementSources'

const DEFAULT_WEIGHT_KG = 70
const DEFAULT_HEIGHT_CM = 170

/**
 * @param {Array<{ type: string, source?: string, at: string, payload?: object }>} [entries]
 * @returns {Promise<{ weightKg: number, heightCm: number, sex?: 'M'|'F', age?: number, source: string }>}
 */
export async function getBodyProfile(entries) {
  const data = entries ?? await listEntries({ limit: 5000 })
  const bodyEntries = data.filter((e) => BODY_MEASUREMENT_SOURCES.includes(e.source))

  const weightEntry = bodyEntries
    .filter((e) => e.type === 'weight' && e.payload?.valueKg > 0)
    .sort((a, b) => (b.at < a.at ? -1 : 1))[0]

  const heightEntry = bodyEntries
    .filter((e) => e.type === 'height' && e.payload?.valueCm > 0)
    .sort((a, b) => (b.at < a.at ? -1 : 1))[0]

  const weightKg = weightEntry?.payload?.valueKg ?? DEFAULT_WEIGHT_KG
  const heightCm = heightEntry?.payload?.valueCm ?? DEFAULT_HEIGHT_CM

  const withingsUser = getWithingsUserProfile() || {}
  const measureSource = weightEntry?.source || heightEntry?.source
  const source = weightEntry && heightEntry
    ? measureSource || 'health_connect'
    : weightEntry || heightEntry
      ? `${measureSource || 'health_connect'}_partial`
      : 'default'

  return {
    weightKg,
    heightCm,
    sex: withingsUser.sex,
    age: withingsUser.age,
    source,
    weightAt: weightEntry?.at,
    heightAt: heightEntry?.at,
  }
}

/**
 * Latest Withings body composition snapshot (for display).
 */
export function getLatestBodyComposition(entries) {
  const comp = (entries || [])
    .filter((e) => e.type === 'body_composition' && BODY_MEASUREMENT_SOURCES.includes(e.source))
    .sort((a, b) => (b.at < a.at ? -1 : 1))[0]
  return comp?.payload ?? null
}

export function computeBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}
