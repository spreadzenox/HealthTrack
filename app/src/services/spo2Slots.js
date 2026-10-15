/**
 * I82 (perf D2) — SpO₂ de la montre en tranches de 10 min. Jusqu'à la v138, la synchro de la montre Huawei
 * rangeait une entrée SpO₂ par minute : des dizaines de milliers de lignes `heart_rate` relues par l'Accueil et
 * les Analyses. La synchro rend maintenant une entrée par tranche (moyenne, min, max, nombre de minutes) ; ce
 * module regroupe de la même façon les minutes déjà en base (au premier lancement, puis après un import).
 */
import { HR_SLOT, spo2SlotEntry, WATCH_SOURCE } from '../devices/huawei/sync'
import { rewriteSourceEntries } from '../storage/localHealthStorage'

const DONE_KEY = 'healthtrack_spo2_slots_v1'

/** Ancienne entrée SpO₂ « minute » : sans `samples` (les tranches en ont toujours). */
const isMinuteSpo2 = (e) => e.type === 'heart_rate' && e.payload?.subtype === 'oxygenSaturation' && e.payload.samples == null

/** Plan de réécriture (pur) : les minutes à retirer et une entrée par tranche de 10 min. */
export function planSpo2Compaction(entries) {
  const groups = new Map()
  for (const e of entries) {
    if (!isMinuteSpo2(e)) continue
    const t = Date.parse(e.at)
    const v = e.payload.value ?? e.payload.bpm
    if (!Number.isFinite(t)) continue
    const s = Math.floor(t / HR_SLOT) * HR_SLOT
    const g = groups.get(s) || { ids: [], values: [], base: { connector: WATCH_SOURCE, ...(e.payload.sourceName ? { sourceName: e.payload.sourceName } : {}) } }
    g.ids.push(e.id)
    if (typeof v === 'number' && v > 0) g.values.push(v)
    groups.set(s, g)
  }
  const remove = []
  const add = []
  for (const [s, g] of groups) {
    remove.push(...g.ids)
    if (g.values.length) add.push(spo2SlotEntry(s, g.values, g.base))
  }
  return { remove, add }
}

/** Regroupe les SpO₂ minute de la montre déjà en base. Rend { removed, added }. */
export function compactWatchSpo2() {
  return rewriteSourceEntries(WATCH_SOURCE, planSpo2Compaction)
}

let running = null

/** Une seule fois par téléphone (drapeau local) ; `force` après un import (ancien fichier). */
export function compactWatchSpo2Once({ storage = globalThis.localStorage, force = false } = {}) {
  if (running) return running
  try {
    if (!force && storage?.getItem(DONE_KEY)) return Promise.resolve(null)
  } catch {
    /* stockage indisponible : on tente quand même, l'opération est idempotente */
  }
  running = Promise.resolve()
    .then(compactWatchSpo2)
    .then((r) => {
      try {
        storage?.setItem(DONE_KEY, new Date().toISOString())
      } catch {
        /* ignoré */
      }
      return r
    })
    .catch(() => null)
    .finally(() => {
      running = null
    })
  return running
}
