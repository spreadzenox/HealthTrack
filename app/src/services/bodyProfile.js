/**
 * Profil corporel (poids, taille, sexe, âge) pour les repères nutritionnels.
 * Priorité : profil saisi dans l'app > Withings > valeur par défaut (signalée dans `origins`).
 */

import { listEntries } from '../storage/localHealthStorage'
import { getWithingsUserProfile } from '../settings/withingsSettings'
import { getBodySettings, ageFromBirthYear } from '../settings/bodySettings'
import { buildDailyJournal } from './dailyJournal'
import { activityFromSteps, DEFAULT_ACTIVITY } from './nutrientReferenceIntakes'

export const DEFAULT_WEIGHT_KG = 70
export const DEFAULT_HEIGHT_CM = 170

export const STEPS_WINDOW_DAYS = 14
const MIN_STEPS_DAYS = 7

function latest(entries, type, valueKey) {
  return entries
    .filter((e) => e.type === type && e.payload?.[valueKey] > 0)
    .sort((a, b) => (b.at < a.at ? -1 : 1))[0]
}

function originOf(entry) {
  return entry.source === 'withings' ? 'withings' : 'manual'
}

/**
 * Pas quotidiens moyens des 14 jours précédant aujourd'hui (la journée en cours est incomplète).
 * Un jour sans pas (montre non portée) est ignoré.
 */
function recentMeanSteps(entries, now) {
  const end = new Date(now)
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setDate(start.getDate() - STEPS_WINDOW_DAYS)
  const steps = entries.filter((e) => {
    if (e.type !== 'steps') return false
    const t = new Date(e.at).getTime()
    return t >= start.getTime() && t < end.getTime()
  })
  const totals = buildDailyJournal(steps)
    .map((d) => d.summary.steps)
    .filter((v) => typeof v === 'number' && v > 0)
  if (totals.length < MIN_STEPS_DAYS) return { meanSteps: undefined, stepsDays: totals.length }
  return { meanSteps: Math.round(totals.reduce((a, b) => a + b, 0) / totals.length), stepsDays: totals.length }
}

/**
 * @param {Array<{ type: string, source?: string, at: string, payload?: object }>} [entries]
 * @param {Date} [now]
 * @returns {Promise<{ weightKg: number, heightCm: number, sex?: 'M'|'F', age?: number, source: string,
 *   activity: string, meanSteps?: number, stepsDays: number,
 *   origins: { weight: string, height: string, sex: string, age: string, activity: string }, weightAt?: string, heightAt?: string }>}
 */
export async function getBodyProfile(entries, now = new Date()) {
  const data = entries ?? await listEntries({ limit: 5000 })
  const manual = getBodySettings()
  const withingsUser = getWithingsUserProfile() || {}

  const weightEntry = latest(data, 'weight', 'valueKg')
  const heightEntry = manual.heightCm ? null : latest(data, 'height', 'valueCm')
  const manualAge = ageFromBirthYear(manual.birthYear)
  const { meanSteps, stepsDays } = recentMeanSteps(data, now)
  const stepsActivity = activityFromSteps(meanSteps)

  const origins = {
    weight: weightEntry ? originOf(weightEntry) : 'default',
    height: manual.heightCm ? 'manual' : heightEntry ? originOf(heightEntry) : 'default',
    sex: manual.sex ? 'manual' : withingsUser.sex ? 'withings' : 'default',
    age: manualAge ? 'manual' : withingsUser.age ? 'withings' : 'default',
    activity: manual.activity ? 'manual' : stepsActivity ? 'steps' : 'default',
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
    activity: manual.activity ?? stepsActivity ?? DEFAULT_ACTIVITY,
    meanSteps,
    stepsDays,
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
