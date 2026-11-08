/**
 * Données fictives de la visite guidée (ACC-8) : synthétiques, construites en mémoire (jamais écrites dans la base),
 * et limitées aux mesures que la personne reçoit vraiment (ACC-5) : sans VFC chez elle, pas de VFC dans l'exemple.
 */
import { generateDemoEntries } from '../../scripts/visual/demoData.mjs'
import { measuresOf } from '../devices/deviceCapabilities'
import { listEntries } from '../storage/localHealthStorage'

const DAY_MS = 86_400_000
const GUT_LEVELS = ['calm', 'calm', 'calm', 'discomfort', 'discomfort', 'pain']

/** Mesures (ids de deviceCapabilities.MEASURES) reçues ces 30 derniers jours, lues dans la vraie base. */
export async function receivedMeasures({ now = new Date(), list = listEntries } = {}) {
  const since = new Date(now.getTime() - 30 * DAY_MS).toISOString()
  const entries = await list({ since, limit: 100000 })
  return new Set(entries.flatMap(measuresOf))
}

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * @param {{ days: number, now?: Date, received?: Set<string>, face?: boolean }} p
 * @returns {Array<object>} entrées fictives (sans id ; exampleMode leur en donne un)
 */
export function buildTourEntries({ days, now = new Date(), received = new Set(), face = false }) {
  const all = generateDemoEntries({ days, now })
  const kept = all.filter((e) => {
    if (e.type === 'face_burst') return face
    const ms = measuresOf(e)
    return ms.length === 0 || received.has(ms[0])
  })
  // Digestion (jour 28) : une note par jour, pour que ses analyses s'ouvrent comme chez quelqu'un qui note
  if (days >= 28) {
    const r = rng(7001)
    const noted = new Set(kept.filter((e) => e.type === 'gut').map((e) => e.at.slice(0, 10)))
    for (let i = days; i >= 1; i--) {
      const d = new Date(now.getTime() - i * DAY_MS)
      d.setHours(20, 30, 0, 0)
      if (noted.has(d.toISOString().slice(0, 10))) continue
      kept.push({ type: 'gut', source: 'app_gut', at: d.toISOString(), payload: { level: GUT_LEVELS[Math.floor(r() * GUT_LEVELS.length)] } })
    }
  }
  return kept
}
