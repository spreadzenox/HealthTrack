/**
 * Une seule source par nuit (POL-PLAY-59). La montre Huawei et Health Connect (Samsung Health, Health Sync,
 * Sleep as Android…) peuvent décrire la même nuit : additionner leurs phases compterait 7 h comme 14 h, comme les
 * pas du 27/10. Le choix se fait à la lecture : aucune entrée n'est effacée (historique et export intacts).
 *
 * Par nuit (jour local du réveil), on garde la source qui a des phases (léger, profond, paradoxal), puis celle qui
 * a la plus longue durée endormie ; à égalité, la montre Huawei. Une source = `source` + app d'origine dans Health
 * Connect (`sourceName`) : deux apps qui écrivent dans Health Connect sont deux sources.
 */
import { localDateKey } from './wellbeingSeries'

const STAGES = new Set(['light', 'deep', 'rem'])
const NOT_ASLEEP = new Set(['awake', 'inBed', 'outOfBed'])
const WATCH_SOURCE = 'huawei_watch'

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

/** Jour du réveil : une nuit commencée le 7 à 23 h compte pour le 8. */
export function sleepNightKey(e) {
  const p = e.payload || {}
  if (p.endDate) return localDateKey(p.endDate)
  if (isNum(p.durationMinutes)) return localDateKey(new Date(new Date(e.at).getTime() + p.durationMinutes * 60000).toISOString())
  return localDateKey(e.at)
}

const sourceKey = (e) => `${e.source || ''}|${e.payload?.sourceName || ''}`

/**
 * @param {object[]} entries  entrées de tout type
 * @returns {object[]} les mêmes entrées, sans le sommeil (hors siestes) des sources écartées pour chaque nuit
 */
export function oneSleepSourcePerNight(entries) {
  const list = entries || []
  const nights = new Map() // nuit → source → { staged, asleep, watch }
  for (const e of list) {
    if (e?.type !== 'sleep' || !e.at || e.payload?.nap) continue
    const night = sleepNightKey(e)
    if (!nights.has(night)) nights.set(night, new Map())
    const bySource = nights.get(night)
    const k = sourceKey(e)
    if (!bySource.has(k)) bySource.set(k, { staged: false, asleep: 0, watch: e.source === WATCH_SOURCE })
    const s = bySource.get(k)
    const p = e.payload || {}
    if (STAGES.has(p.sleepState)) s.staged = true
    if (isNum(p.durationMinutes) && p.durationMinutes > 0 && !NOT_ASLEEP.has(p.sleepState)) s.asleep += p.durationMinutes
  }
  const chosen = new Map()
  for (const [night, bySource] of nights) {
    if (bySource.size < 2) continue
    const best = [...bySource].sort(([ka, a], [kb, b]) =>
      (b.staged - a.staged) || (b.asleep - a.asleep) || (b.watch - a.watch) || (ka < kb ? -1 : ka > kb ? 1 : 0))[0][0]
    chosen.set(night, best)
  }
  if (!chosen.size) return list
  return list.filter((e) => {
    if (e?.type !== 'sleep' || !e.at || e.payload?.nap) return true
    const best = chosen.get(sleepNightKey(e))
    return !best || best === sourceKey(e)
  })
}
