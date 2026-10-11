/**
 * Aggregate wellbeing entries (0–5) for local charts.
 * Uses the device local timezone for "day" and "hour".
 */

/**
 * @param {string} iso
 * @returns {string} YYYY-MM-DD in local calendar
 */
export function localDateKey(iso) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * @param {string} iso
 * @returns {number} hour 0–23 local
 */
export function localHour(iso) {
  return new Date(iso).getHours()
}

/**
 * Moyenne de bien-être pour chacun des `days` derniers jours du calendrier (aujourd'hui inclus).
 * Un jour sans note a `average: null` : le graphique place chaque note à sa vraie date, sans
 * rapprocher deux notes séparées par une interruption de saisie.
 * @param {Array<{ at: string, payload?: { score?: number } }>} entries
 * @param {number} [days=14]
 * @param {Date} [now=new Date()]
 * @returns {Array<{ dateKey: string, offset: number, average: number|null, count: number }>}
 *   du plus ancien (offset 0) à aujourd'hui (offset days-1)
 */
export function seriesByCalendarDay(entries, days = 14, now = new Date()) {
  const byDay = new Map()
  for (const e of entries) {
    const score = e.payload?.score
    if (typeof score !== 'number' || score < 0 || score > 5) continue
    const key = localDateKey(e.at)
    const cur = byDay.get(key) || { sum: 0, count: 0 }
    cur.sum += score
    cur.count += 1
    byDay.set(key, cur)
  }
  return Array.from({ length: days }, (_, offset) => {
    // new Date(y, m, d - k) reste juste aux changements d'heure (pas d'arithmétique en ms)
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - offset), 12)
    const dateKey = localDateKey(day.toISOString())
    const agg = byDay.get(dateKey)
    return { dateKey, offset, average: agg ? agg.sum / agg.count : null, count: agg ? agg.count : 0 }
  })
}

/**
 * @param {Array<{ at: string, payload?: { score?: number } }>} entries
 * @param {Date} [now=new Date()]
 * @returns {Array<{ hour: number, average: number, count: number }>} hours 0–23 present today only
 */
export function seriesByHourToday(entries, now = new Date()) {
  const todayKey = localDateKey(now.toISOString())
  const byHour = new Map()
  for (const e of entries) {
    if (localDateKey(e.at) !== todayKey) continue
    const score = e.payload?.score
    if (typeof score !== 'number' || score < 0 || score > 5) continue
    const h = localHour(e.at)
    const cur = byHour.get(h) || { sum: 0, count: 0 }
    cur.sum += score
    cur.count += 1
    byHour.set(h, cur)
  }
  const hours = [...byHour.keys()].sort((a, b) => a - b)
  return hours.map((hour) => {
    const { sum, count } = byHour.get(hour)
    return { hour, average: sum / count, count }
  })
}
