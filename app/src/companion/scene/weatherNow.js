/**
 * La météo « maintenant » pour l'île (SPEC île § 6), tirée de ce que Halcya garde déjà (réglage météo, journée en
 * cours) : aucun appel réseau ici. La journée n'a que des valeurs quotidiennes ; on en tire une estimation de l'heure
 * (température entre le minimum vers 6 h et le maximum vers 15 h, pluie répartie sur la journée). Sans météo
 * activée ou sans données du jour : `null` (l'île garde son ciel).
 */
export function weatherNow(settings, date = new Date()) {
  // la lecture « maintenant » (bloc `current`, lot MONDE) quand elle a moins de 3 h
  const cur = settings?.enabled ? settings.current : null
  if (cur && cur.at && date - new Date(cur.at) < 3 * 3600 * 1000 && date >= new Date(cur.at) - 60000) {
    return { tempC: cur.tempC ?? null, precipMmH: cur.precipMmH ?? 0, windKmH: cur.windKmH ?? null, code: cur.code ?? null }
  }
  const today = settings?.enabled ? settings.today : null
  if (!today) return null
  const { tempMinC, tempMaxC, precipMm } = today
  if (tempMinC == null && tempMaxC == null && precipMm == null) return null
  const h = date.getHours() + date.getMinutes() / 60
  let tempC = null
  if (tempMinC != null && tempMaxC != null) {
    // creux à 6 h, pic à 15 h (demi-cosinus), redescente jusqu'au lendemain
    const u = h >= 6 && h <= 15 ? (h - 6) / 9 : h > 15 ? 1 - (h - 15) / 15 : 1 - (h + 9) / 15
    tempC = tempMinC + (tempMaxC - tempMinC) * (0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u))))
  } else tempC = tempMaxC ?? tempMinC
  return {
    tempC: tempC == null ? null : Math.round(tempC),
    precipMmH: precipMm == null ? 0 : Math.round((precipMm / 24) * 100) / 100,
    windKmH: null,
    code: null,
  }
}
