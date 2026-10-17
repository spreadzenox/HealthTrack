/**
 * Fuseau horaire du téléphone, noté une fois par jour (et à chaque changement) dans une entrée légère
 * `context` : `{ date, tz, tzOffset }`. Un changement de fuseau d'un jour à l'autre fait le tag « Voyage »
 * (behaviorTags.js) sans rien demander. C'est une entrée comme les autres : elle part dans l'export JSON,
 * revient à l'import et se lit dans les Analyses (rien ne quitte l'appareil).
 */
import { upsertEntries } from '../storage/localHealthStorage'

const SOURCE = 'app_context'

function pad(n) {
  return String(n).padStart(2, '0')
}

function currentZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
}

/**
 * Entrée du jour, datée de midi heure locale : la même journée dans le même fuseau donne la même clé
 * (source, at, type), donc jamais de doublon.
 * @returns {{ type: 'context', source: string, at: string, payload: { date: string, tz: string, tzOffset: number } } | null}
 */
export function timezoneContextEntry(now = new Date(), tz = currentZone()) {
  if (!tz) return null
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const noon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  return { type: 'context', source: SOURCE, at: noon.toISOString(), payload: { date, tz, tzOffset: -now.getTimezoneOffset() } }
}

let lastRecorded = null

/**
 * Note le fuseau du jour (à l'ouverture et au retour dans l'app) ; une seule écriture par jour et par fuseau.
 * @returns {Promise<boolean>} true si une entrée a été écrite
 */
export async function recordTimezoneContext(now = new Date(), tz = currentZone()) {
  const entry = timezoneContextEntry(now, tz)
  if (!entry) return false
  const key = `${entry.payload.date}|${entry.payload.tz}`
  if (key === lastRecorded) return false
  try {
    const { inserted } = await upsertEntries([entry])
    lastRecorded = key
    return inserted > 0
  } catch {
    return false
  }
}
