import { listEntries } from '../storage/localHealthStorage'
import { goalsOf } from '../settings/onboarding'
import { CYCLE_TYPE, MAX_CYCLE_DAY, cycleByDay, cycleVisible, hasCycleData, periodEntryOn } from './cycle'

/** Jours de cycle relus : le jour du cycle compte depuis les dernières règles (60 jours au plus) + 14 jours de journal. */
const CYCLE_READ_DAYS = MAX_CYCLE_DAY + 16

/** Cycle jour par jour (CYCLE-1b) (Journal, détail du jour de Tendances), ou null tant que « Mon cycle » n'est pas coché et sans donnée de cycle. */
export async function readCycle() {
  const since = new Date()
  since.setDate(since.getDate() - CYCLE_READ_DAYS)
  const list = await listEntries({ type: CYCLE_TYPE, since: since.toISOString(), limit: 5000 })
  if (!cycleVisible(goalsOf(), hasCycleData(list))) return null
  return (dateKeys) => {
    const byDay = cycleByDay(list, dateKeys)
    // CYCLE-2b : l'entrée « règles » du jour, pour « … » (corriger le flux, supprimer)
    for (const [key, info] of byDay) {
      if (info.period) byDay.set(key, { ...info, entry: periodEntryOn(list, key) })
    }
    return byDay
  }
}

