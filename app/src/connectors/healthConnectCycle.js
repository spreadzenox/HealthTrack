/**
 * Règles lues dans Health Connect (CYCLE-3a) : conversion des enregistrements en entrées `cycle` de l'app.
 *
 * Le plugin Health Connect de l'app ne connaît aucun type de cycle : un petit pont natif à nous, `HealthCycle`,
 * lit `MenstruationPeriodRecord` et `MenstruationFlowRecord`. Contrat du pont :
 * - `checkPermission()` → `{ granted: boolean }` (autorisation `android.permission.health.READ_MENSTRUATION`) ;
 * - `requestPermission()` → `{ granted: boolean }` ;
 * - `read({ startDate, endDate })` (ISO) → `{ periods: [{ startTime, endTime, sourceName? }],
 *   flows: [{ time, flow, sourceName? }] }`, `flow` étant la constante de Health Connect (0 inconnu, 1 léger,
 *   2 moyen, 3 abondant).
 * Sans pont (web, iPhone, variante play tant que le type n'est pas déclaré dans la Play Console) rien n'est lu.
 * Les données restent sur le téléphone.
 */
import { periodEntry } from '../services/cycle'
import { localDateKey } from '../services/analysisEngine'

export const HC_CYCLE_SOURCE = 'health_connect'

const HC_FLOWS = { 0: 'unknown', 1: 'light', 2: 'medium', 3: 'heavy' }
/** Au-delà, la période est une erreur de l'app qui l'a écrite (ou une période jamais fermée) : on ne l'importe pas. */
const MAX_PERIOD_DAYS = 15

const time = (iso) => {
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : null
}

const nextDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)

/**
 * @param {{ periods?: Array<{ startTime: string, endTime: string, sourceName?: string }>,
 *   flows?: Array<{ time: string, flow: number, sourceName?: string }> }|null} raw
 * @returns {Array<object>} une entrée « jour de règles » par jour local, triées par date, prêtes pour `upsertEntries`
 */
export function cycleEntriesFromHealthConnect(raw) {
  const byDay = new Map() // dateKey → { flow, flowAt, sourceName }
  const day = (key) => {
    if (!byDay.has(key)) byDay.set(key, { flow: 'unknown', flowAt: -Infinity, sourceName: undefined })
    return byDay.get(key)
  }

  for (const p of raw?.periods || []) {
    const start = time(p?.startTime)
    const end = time(p?.endTime)
    if (start == null || end == null || end < start) continue
    // Une fin à minuit pile appartient au jour d'avant
    const lastKey = localDateKey(new Date(Math.max(start, end - 1)).toISOString())
    const keys = []
    for (let d = new Date(start); keys.length <= MAX_PERIOD_DAYS; d = nextDay(d)) {
      const key = localDateKey(d.toISOString())
      keys.push(key)
      if (key >= lastKey) break
    }
    if (keys.length > MAX_PERIOD_DAYS) continue
    for (const key of keys) {
      const info = day(key)
      info.sourceName = info.sourceName || p.sourceName
    }
  }

  for (const f of raw?.flows || []) {
    const at = time(f?.time)
    if (at == null) continue
    const info = day(localDateKey(new Date(at).toISOString()))
    info.sourceName = info.sourceName || f.sourceName
    const flow = HC_FLOWS[f.flow] || 'unknown'
    if (flow !== 'unknown' && at >= info.flowAt) {
      info.flow = flow
      info.flowAt = at
    }
  }

  return [...byDay.keys()].sort().map((key) => {
    const { flow, sourceName } = byDay.get(key)
    const entry = periodEntry(key, flow, HC_CYCLE_SOURCE)
    return { ...entry, payload: { ...entry.payload, connector: 'health_connect', ...(sourceName ? { sourceName } : {}) } }
  })
}

/**
 * Lit les règles par le pont natif, si l'autorisation est déjà donnée (cette fonction ne demande rien).
 * @returns {Promise<Array<object>|null>} les entrées, ou null si rien ne peut être lu (pas de pont, pas d'autorisation)
 */
export async function readCycleEntries(bridge, { startDate, endDate }) {
  if (typeof bridge?.checkPermission !== 'function' || typeof bridge?.read !== 'function') return null
  const { granted } = (await bridge.checkPermission()) || {}
  if (!granted) return null
  return cycleEntriesFromHealthConnect(await bridge.read({ startDate, endDate }))
}
