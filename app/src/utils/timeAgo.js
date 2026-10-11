/** « il y a 3 h », « hier », « il y a 4 jours » (dates de dernière mesure). */
export function formatAgo(iso, now = new Date()) {
  const min = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000))
  if (min < 60) return 'il y a moins d’une heure'
  const h = Math.round(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'hier' : `il y a ${d} jours`
}
