/** Journal › Tendances : lecture des mesures du visualiseur (résumés du jour). */
import { buildDailyJournal } from './dailyJournal'
import { listEntries } from '../storage/localHealthStorage'

const DAY_MS = 86_400_000

/** Les 31 derniers jours des mesures du visualiseur (une nuit de plus pour celle qui finit le premier jour). */
export async function readMeasureDays(now = new Date(), list = listEntries) {
  const since = new Date(now.getTime() - 31 * DAY_MS).toISOString()
  const sleepSince = new Date(now.getTime() - 32 * DAY_MS).toISOString()
  const lists = await Promise.all([
    list({ type: 'sleep', since: sleepSince, limit: Infinity }),
    list({ type: 'steps', since, limit: Infinity }),
    list({ type: 'heart_rate', subtypes: ['restingHeartRate', 'heartRateVariability'], since, limit: Infinity }),
    list({ type: 'phone_usage', since, limit: Infinity }),
    // Pesées (POLISH-SIM-47) : à la main ou balance ; la composition porte aussi le poids
    list({ type: 'weight', since, limit: Infinity }),
    list({ type: 'body_composition', since, limit: Infinity }),
  ])
  return buildDailyJournal(lists.flat())
}
