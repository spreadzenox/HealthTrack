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
 * @param {Array<{ at: string, payload?: { score?: number } }>} entries
 * @param {number} [maxDays=14]
 * @returns {Array<{ dateKey: string, average: number, count: number }>} ascending by date
 */
export function seriesByDay(entries, maxDays = 14) {
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
  const keys = [...byDay.keys()].sort()
  const sliced = keys.length > maxDays ? keys.slice(-maxDays) : keys
  return sliced.map((dateKey) => {
    const { sum, count } = byDay.get(dateKey)
    return { dateKey, average: sum / count, count }
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
