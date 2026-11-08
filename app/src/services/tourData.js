/**
 * Données fictives de la visite guidée (ACC-8) : synthétiques, construites en mémoire (jamais écrites dans la base),
 * et limitées aux mesures que la personne reçoit vraiment (ACC-5) : sans VFC chez elle, pas de VFC dans l'exemple.
 */
import { generateDemoEntries } from '../../scripts/visual/demoData.mjs'
import { measuresOf } from '../devices/deviceCapabilities'
import { listEntries } from '../storage/localHealthStorage'

const DAY_MS = 86_400_000

/** Mesures (ids de deviceCapabilities.MEASURES) reçues ces 30 derniers jours, lues dans la vraie base. */
export async function receivedMeasures({ now = new Date(), list = listEntries } = {}) {
  const since = new Date(now.getTime() - 30 * DAY_MS).toISOString()
  const entries = await list({ since, limit: 100000 })
  return new Set(entries.flatMap(measuresOf))
}

// Notes digestives ajoutées pour le jour 28 : surtout calmes, des jours de gêne et de douleur (cycle fixe, sans hasard)
const GUT_LEVELS = ['calm', 'calm', 'discomfort', 'calm', 'pain', 'calm']
const DEVICE_SOURCES = new Set(['health_connect', 'huawei_watch', 'withings'])
const dayKey = (iso) => new Date(iso).toDateString()

/**
 * @param {{ days: number, now?: Date, received?: Set<string>, face?: boolean, weather?: boolean, screen?: boolean, huawei?: boolean }} p
 * @returns {Array<object>} entrées fictives (sans id ; exampleMode leur en donne un)
 */
export function buildTourEntries({ days, now = new Date(), received = new Set(), face = false, weather = false, screen = false, huawei = false }) {
  // Ce qui tomberait plus tard aujourd'hui (note de 21 h 30, repas du soir) est ramené à tout à l'heure : l'écran
  // d'aujourd'hui montre déjà sa note et ses repas
  const soon = new Date(now.getTime() - 10 * 60_000).toISOString()
  const all = generateDemoEntries({ days, now }).map((e) => (Date.parse(e.at) > now.getTime() ? { ...e, at: soon } : e))
  // La démo laisse aujourd'hui vide (journée en cours) : la visite y recopie la note, les repas et la digestion d'hier
  const yesterday = new Date(now.getTime() - DAY_MS).toDateString()
  for (const e of all.filter((x) => ['wellbeing', 'food', 'gut'].includes(x.type) && dayKey(x.at) === yesterday)) {
    const t = Date.parse(e.at) + DAY_MS
    const copy = { ...e, at: t > now.getTime() ? soon : new Date(t).toISOString() }
    // Une journée d'exemple plutôt bonne (la note fictive d'aujourd'hui ne descend pas sous 4)
    if (e.type === 'wellbeing') copy.payload = { ...e.payload, score: Math.max(4, e.payload?.score ?? 4) }
    all.push(copy)
  }
  const kept = all
    .filter((e) => {
      if (e.type === 'face_burst') return face
      if (e.source === 'open_meteo') return weather
      if (e.source === 'phone') return screen
      const ms = measuresOf(e)
      // Appareils : seulement ce que la personne reçoit (sans source, rien ; sans VFC, pas de VFC)
      if (DEVICE_SOURCES.has(e.source)) return received.size > 0 && (ms.length === 0 || received.has(ms[0]))
      return ms.length === 0 || received.has(ms[0])
    })
    // La montre Huawei de la démo devient « Health Connect » chez qui n'en a pas
    .map((e) => (e.source === 'huawei_watch' && !huawei ? { ...e, source: 'health_connect' } : e))
  // Digestion (jour 28) : une note par jour, pour que ses analyses s'ouvrent comme chez quelqu'un qui note
  if (days >= 28) {
    const noted = new Set(kept.filter((e) => e.type === 'gut').map((e) => dayKey(e.at)))
    for (let i = days; i >= 1; i--) {
      const d = new Date(now.getTime() - i * DAY_MS)
      d.setHours(20, 30, 0, 0)
      if (noted.has(d.toDateString())) continue
      kept.push({ type: 'gut', source: 'app_gut', at: d.toISOString(), payload: { level: GUT_LEVELS[(i * 7) % GUT_LEVELS.length] } })
    }
  }
  return kept
}
