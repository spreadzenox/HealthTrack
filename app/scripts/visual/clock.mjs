/**
 * Horloge des captures (VISUAL-NOW) : `--now` fige l'heure de départ du navigateur, `--usage-days` donne à l'îlot de
 * Pilou un décompte de jours d'usage déjà gardé. Sans eux, l'Accueil de démo dépend de l'heure du run (la nuit, image
 * de nuit) et la croissance n'arrive que 4 s après la première ouverture, après la capture.
 */

/** Décalage (ms) du fuseau `tz` à l'instant `ms` : heure murale moins UTC. */
function tzOffsetMs(ms, tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(ms)).map((p) => [p.type, p.value]),
  )
  const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  return wall - Math.floor(ms / 1000) * 1000
}

/**
 * `--now` : « HH:MM » (ce jour-là dans le fuseau des captures) ou une date ISO complète.
 * @returns {Date}
 */
export function parseNow(text, { tz = 'Europe/Paris', ref = new Date() } = {}) {
  const s = String(text)
  const hm = s.match(/^(\d{1,2}):(\d{2})$/)
  if (hm) {
    const h = Number(hm[1])
    const mi = Number(hm[2])
    if (h > 23 || mi > 59) throw new Error(`--now invalide : « ${s} »`)
    const local = new Date(ref.getTime() + tzOffsetMs(ref.getTime(), tz))
    const wall = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), h, mi)
    let ms = wall - tzOffsetMs(wall, tz)
    ms = wall - tzOffsetMs(ms, tz) // second passage : bon côté d'un changement d'heure
    return new Date(ms)
  }
  const ms = /^\d{4}-\d{2}-\d{2}T/.test(s) ? Date.parse(s) : NaN
  if (!Number.isFinite(ms)) throw new Error(`--now attendu sous la forme HH:MM ou date ISO, reçu « ${s} »`)
  return new Date(ms)
}

/** `--usage-days=N` : entrée localStorage du décompte gardé par l'îlot (jour vide : recompté ensuite, jamais en baisse). */
export function usageDaysStorage(text) {
  const n = Number(text)
  if (!Number.isInteger(n) || n < 0) throw new Error(`--usage-days attendu entier ≥ 0, reçu « ${text} »`)
  return { key: 'halcya.world.usageDays', value: JSON.stringify({ day: '', days: n }) }
}
