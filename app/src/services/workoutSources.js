/**
 * Une seule source par séance de sport. La montre Huawei et Health Connect (Samsung Health, Garmin, Health Sync…)
 * peuvent décrire la même course : la compter deux fois double ses calories dans les analyses (« Calories brûlées
 * (activité) ») et le nombre de séances, comme les pas du 27/10 et les nuits (POL-PLAY-59). Le choix se fait à la
 * lecture : aucune entrée n'est effacée (historique et export intacts).
 *
 * Deux séances de sources différentes sont la même si elles se chevauchent sur au moins la moitié de la plus courte.
 * On garde la source qui a la fréquence cardiaque, puis la montre Huawei, puis la plus longue. Une source = `source`
 * + app d'origine dans Health Connect (`sourceName`) ; une même source n'est jamais dédoublonnée ici.
 */
const WATCH_SOURCE = 'huawei_watch'
const MIN_OVERLAP_SHARE = 0.5

const sourceKey = (e) => `${e.source || ''}|${e.payload?.sourceName || ''}`

/** Début et fin d'une séance en ms, ou null sans durée connue. */
function interval(e) {
  if (e?.type !== 'activity') return null
  const start = Date.parse(e.at)
  if (!Number.isFinite(start)) return null
  const p = e.payload || {}
  let end = p.endDate ? Date.parse(p.endDate) : NaN
  if (!Number.isFinite(end) && typeof p.durationSeconds === 'number') end = start + p.durationSeconds * 1000
  return Number.isFinite(end) && end > start ? { start, end } : null
}

const rank = (s) => [s.e.payload?.avgHeartRate ? 1 : 0, s.e.source === WATCH_SOURCE ? 1 : 0, s.end - s.start]

function better(a, b) {
  const ra = rank(a)
  const rb = rank(b)
  for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] > rb[i]
  return sourceKey(a.e) < sourceKey(b.e)
}

/**
 * @param {object[]} entries  entrées de tout type
 * @returns {object[]} les mêmes entrées, sans les doublons d'une séance vue par une autre source
 */
export function oneSourcePerWorkout(entries) {
  const list = entries || []
  const sessions = []
  for (const e of list) {
    const iv = interval(e)
    if (iv) sessions.push({ e, ...iv })
  }
  if (sessions.length < 2) return list
  sessions.sort((a, b) => a.start - b.start)

  const dropped = new Set()
  for (let i = 0; i < sessions.length; i++) {
    const a = sessions[i]
    for (let j = i + 1; j < sessions.length && sessions[j].start < a.end; j++) {
      const b = sessions[j]
      if (sourceKey(a.e) === sourceKey(b.e) || dropped.has(a.e) || dropped.has(b.e)) continue
      const overlap = Math.min(a.end, b.end) - b.start
      if (overlap < MIN_OVERLAP_SHARE * Math.min(a.end - a.start, b.end - b.start)) continue
      dropped.add(better(a, b) ? b.e : a.e)
    }
  }
  return dropped.size ? list.filter((e) => !dropped.has(e)) : list
}
