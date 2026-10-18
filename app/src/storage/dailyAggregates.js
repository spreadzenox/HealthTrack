/**
 * Agrégats journaliers des séries denses (perf D2) : pas et calories horaires, tranches de FC et de SpO₂.
 *
 * Les analyses (Web Worker) relisaient à chaque calcul les N dernières entrées brutes de ces séries ; les
 * tranches de la montre (≈ 16 pas et calories par jour, 144 FC et SpO₂) évinçaient alors tout ce qui avait
 * plus de quelques semaines (2 000 pas ≈ 4 mois, 500 calories ≈ 1 mois, 3 000 FC ≈ 3 semaines).
 * Ici, un enregistrement par série et par jour (UTC, préfixe de `at`) garde des sommes **par heure** : tout
 * l'historique tient en ≈ 1 enregistrement par jour et par série, et l'heure suffit au moteur pour ne
 * compter que ce qui précède la note du jour (D5 : une heure terminée après la note est écartée en entier).
 *
 * Tenue à jour : chaque écriture marque « à refaire » les jours touchés (dans la même transaction) ; la
 * lecture refait ces jours seuls depuis les entrées brutes. Sans état (nouvelle base, v5, import qui
 * remplace tout) ou après un changement de format (`AGG_VERSION`), tout est reconstruit à la lecture.
 */

export const AGG_STORE = 'daily_aggregates'
export const AGG_VERSION = 1
const STATE_KEY = '__state'
const HOUR = 3600_000

/** Séries agrégées : `mean` = moyenne pondérée (FC, SpO₂), sinon somme (pas, calories). */
export const DENSE_SERIES = [
  { key: 'steps', type: 'steps' },
  { key: 'calories', type: 'calories' },
  { key: 'heart_rate:heartRate', type: 'heart_rate', subtype: 'heartRate', mean: true },
  { key: 'heart_rate:oxygenSaturation', type: 'heart_rate', subtype: 'oxygenSaturation', mean: true },
]
const BY_KEY = new Map(DENSE_SERIES.map((s) => [s.key, s]))

/** Série agrégée d'une entrée, ou null. */
export function seriesOf(e) {
  if (!e) return null
  if (e.type === 'steps' || e.type === 'calories') return BY_KEY.get(e.type)
  if (e.type === 'heart_rate') return BY_KEY.get(`heart_rate:${e.payload?.subtype}`) ?? null
  return null
}

const dayOf = (at) => (typeof at === 'string' ? at.slice(0, 10) : null)
const aggKey = (seriesKey, day) => `${seriesKey}|${day}`

/** Bornes de lecture des entrées brutes d'une série (index [type, at] ou [type, sous-type, at]). */
export function rawRange(series, from, to) {
  return series.subtype
    ? { index: 'type_subtype_at', lower: [series.type, series.subtype, from], upper: [series.type, series.subtype, to] }
    : { index: 'type_at', lower: [series.type, from], upper: [series.type, to] }
}

function valueOf(series, e) {
  const p = e.payload || {}
  const v = series.subtype === 'oxygenSaturation' ? p.value ?? p.bpm : series.mean ? p.bpm ?? p.value : p.value
  return typeof v === 'number' && v > 0 ? v : null
}

// Même fin que le moteur d'analyse (endDate, sinon début + durée, sinon début)
function endMs(e) {
  const end = Date.parse(e.payload?.endDate ?? '')
  if (Number.isFinite(end)) return end
  const start = Date.parse(e.at)
  const d = e.payload?.durationSeconds
  return typeof d === 'number' && d > 0 ? start + d * 1000 : start
}

/**
 * Enregistrement d'un jour d'une série à partir de ses entrées brutes.
 * `hours` : [début de l'heure (ms), somme, nombre, premier début (ms), dernière fin (ms)] ;
 * `totals` (pas, calories) : les totaux « du jour » (`period: 'day'`), gardés tels quels.
 */
export function buildRecord(series, day, entries) {
  const hours = new Map()
  const totals = []
  for (const e of entries) {
    const v = valueOf(series, e)
    const start = Date.parse(e.at)
    if (v == null || !Number.isFinite(start)) continue
    if (!series.mean && e.payload?.period === 'day') {
      totals.push({ at: e.at, value: v, ...(e.payload.endDate ? { endDate: e.payload.endDate } : {}) })
      continue
    }
    const h = Math.floor(start / HOUR) * HOUR
    const b = hours.get(h)
    if (!b) hours.set(h, [h, v, 1, start, endMs(e)])
    else {
      b[1] += v
      b[2] += 1
      b[3] = Math.min(b[3], start)
      b[4] = Math.max(b[4], endMs(e))
    }
  }
  totals.sort((a, b) => (a.at < b.at ? -1 : 1))
  return { key: aggKey(series.key, day), series: series.key, day, hours: [...hours.values()].sort((a, b) => a[0] - b[0]), totals }
}

/**
 * Entrées équivalentes pour le moteur d'analyse : une par heure (au premier début, fin = dernière fin),
 * plus les totaux du jour. FC et SpO₂ : moyenne de l'heure avec son poids (`weight` = nombre d'entrées).
 */
export function recordEntries(record) {
  const series = BY_KEY.get(record.series)
  if (!series || record.dirty) return []
  const out = []
  for (const [, sum, n, first, last] of record.hours || []) {
    const payload = series.mean
      ? { subtype: series.subtype, bpm: sum / n, value: sum / n, weight: n }
      : { value: sum }
    payload.endDate = new Date(last).toISOString()
    out.push({ type: series.type, source: 'aggregate', at: new Date(first).toISOString(), payload })
  }
  for (const t of record.totals || []) {
    out.push({ type: series.type, source: 'aggregate', at: t.at, payload: { value: t.value, period: 'day', ...(t.endDate ? { endDate: t.endDate } : {}) } })
  }
  return out
}

/** Dans une transaction d'écriture : marque à refaire les jours des séries denses touchés par ces entrées. */
export function markDirty(aggStore, entries) {
  const keys = new Set()
  for (const e of entries) {
    const series = seriesOf(e)
    const day = dayOf(e?.at)
    if (series && day) keys.add(aggKey(series.key, day))
  }
  for (const key of keys) {
    const [series, day] = key.split('|')
    aggStore.put({ key, series, day, dirty: true })
  }
  return keys.size
}

const request = (req) =>
  new Promise((resolve, reject) => {
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
  })

const nextDay = (day) => new Date(Date.parse(`${day}T00:00:00Z`) + 86400_000).toISOString().slice(0, 10)

/**
 * Remet à jour les agrégats (jours marqués, ou tout si l'état manque) en une transaction d'écriture sur
 * les deux magasins : une écriture concurrente attend la fin, rien n'est perdu.
 */
function refresh(db, entriesStore) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([entriesStore, AGG_STORE], 'readwrite')
    const raw = tx.objectStore(entriesStore)
    const agg = tx.objectStore(AGG_STORE)
    const put = (series, day, rows) => agg.put(buildRecord(series, day, rows))
    agg.get(STATE_KEY).onsuccess = (ev) => {
      const state = ev.target.result
      if (state?.v !== AGG_VERSION) {
        // Reconstruction complète : une lecture par série, regroupée par jour
        agg.clear()
        for (const series of DENSE_SERIES) {
          const { index, lower, upper } = rawRange(series, '', '￿')
          raw.index(index).getAll(IDBKeyRange.bound(lower, upper)).onsuccess = (e) => {
            const byDay = new Map()
            for (const row of e.target.result || []) {
              const day = dayOf(row.at)
              if (!day) continue
              if (!byDay.has(day)) byDay.set(day, [])
              byDay.get(day).push(row)
            }
            for (const [day, rows] of byDay) put(series, day, rows)
          }
        }
        agg.put({ key: STATE_KEY, v: AGG_VERSION })
        return
      }
      agg.getAll().onsuccess = (e) => {
        for (const rec of e.target.result || []) {
          if (!rec.dirty) continue
          const series = BY_KEY.get(rec.series)
          if (!series) {
            agg.delete(rec.key)
            continue
          }
          const { index, lower, upper } = rawRange(series, rec.day, nextDay(rec.day))
          // Borne haute exclue : le jour suivant n'en fait pas partie
          raw.index(index).getAll(IDBKeyRange.bound(lower, upper, false, true)).onsuccess = (r) => {
            const rows = r.target.result || []
            if (rows.length) put(series, rec.day, rows)
            else agg.delete(rec.key)
          }
        }
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

/**
 * Entrées des séries denses pour les analyses, depuis les agrégats (remis à jour au besoin).
 * @returns {Promise<Array<{ type: string, source: string, at: string, payload: object }>>}
 */
export async function readAggregatedEntries(db, entriesStore) {
  const read = () => request(db.transaction(AGG_STORE, 'readonly').objectStore(AGG_STORE).getAll())
  let records = await read()
  const fresh = records.some((r) => r.key === STATE_KEY && r.v === AGG_VERSION) && !records.some((r) => r.dirty)
  if (!fresh) {
    await refresh(db, entriesStore)
    records = await read()
  }
  return records.filter((r) => r.key !== STATE_KEY).flatMap(recordEntries)
}
