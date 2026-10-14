/**
 * Synchronisation des mesures de la montre Huawei connectée en direct (chantier D3, étape d) :
 * relit la montre depuis la dernière synchro réussie (30 jours la première fois, 6 h de recouvrement),
 * écrit les entrées dans IndexedDB (sans doublon), remplace les totaux du jour, et garde l'état de la
 * dernière synchro par montre (localStorage).
 * Protocole : src/devices/huawei/sync.js.
 */
import { deleteEntry, listEntries, upsertEntries } from '../storage/localHealthStorage'
import { countEntryKinds, readWatchData, stalledServices, syncWindow, totalsEntries, WATCH_SOURCE, watchEntries } from '../devices/huawei/sync'

const KEY = 'healthtrack_watch_sync'
/**
 * Version de l'état. Avant la v2, une synchro qui n'avait rien lu avançait quand même la date de
 * reprise (fenêtre vide ensuite, journal v124) : un état plus ancien est ignoré → première synchro.
 */
export const SYNC_STATE_VERSION = 2

function readAll(storage) {
  try {
    const v = JSON.parse(storage?.getItem(KEY) || 'null')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

/** État de la dernière synchro d'une montre : { v, until, at, inserted, minutes, nights, workouts, kinds } ou null. */
export const getWatchSyncState = (watchKey, storage = globalThis.localStorage) => readAll(storage)[watchKey] || null

/** Date de reprise : seulement si l'état est de la version courante (sinon : première synchro). */
const resumeFrom = (state) => (state?.v === SYNC_STATE_VERSION ? state.until : null)

function setState(watchKey, state, storage) {
  try {
    storage?.setItem(KEY, JSON.stringify({ ...readAll(storage), [watchKey]: state }))
  } catch {
    /* stockage plein : la synchro suivante relira un peu plus */
  }
}

const plural = (n, one, many) => `${n.toLocaleString('fr-FR')} ${n > 1 ? many : one}`

/** Nombre de nuits distinctes (date de fin de chaque période, ou de chaque nuit détaillée). */
const countNights = (sleep, nights = []) =>
  new Set([...sleep.map((p) => p.start + p.minutes * 60_000), ...nights.map((n) => n.end)].map((end) => new Date(end - 12 * 3600_000).toDateString())).size

/**
 * Une nuit détaillée remplace ce que la montre avait déjà écrit pour cette nuit (périodes simples
 * léger / profond d'une synchro faite pendant la nuit, ou nuit détaillée partielle).
 */
export async function clearWatchNights(nights, { list = listEntries, remove = deleteEntry } = {}) {
  let removed = 0
  for (const n of nights) {
    const old = await list({ type: 'sleep', source: WATCH_SOURCE, since: new Date(n.start).toISOString(), until: new Date(n.end - 1).toISOString(), limit: 1000 })
    for (const e of old) {
      await remove(e.id)
      removed++
    }
  }
  return removed
}

/** Le total du jour de la montre change à chaque synchro : l'ancien est retiré avant d'écrire le nouveau. */
export async function clearWatchDayTotals(entries, { list = listEntries, remove = deleteEntry } = {}) {
  let removed = 0
  for (const e of entries) {
    const old = await list({ type: e.type, source: WATCH_SOURCE, since: e.at, until: e.at, limit: 10 })
    for (const o of old.filter((x) => x.at === e.at && x.payload?.period === 'day')) {
      await remove(o.id)
      removed++
    }
  }
  return removed
}

/**
 * Rend la fonction `sync(session, { log, caps })` attendue par pairing.connectAndAuthenticate.
 */
export function createWatchSync({
  watchKey,
  watchName,
  write = upsertEntries,
  clear = clearWatchNights,
  clearTotals = clearWatchDayTotals,
  storage = globalThis.localStorage,
  now = () => Date.now(),
} = {}) {
  return async (session, { log = () => {}, caps = null } = {}) => {
    const t = now()
    const prev = getWatchSyncState(watchKey, storage)
    const lastUntil = resumeFrom(prev)
    const { since, until } = syncWindow(lastUntil, t)
    log(`lecture du ${new Date(since).toISOString().slice(0, 16)} au ${new Date(until).toISOString().slice(0, 16)} (UTC)${lastUntil ? '' : ' — première synchro'}`)
    const data = await readWatchData(session, { since, until, now: t, log, caps })
    const sourceName = watchName || 'Montre Huawei'
    const totals = totalsEntries(data.totals, t, { sourceName })
    const entries = [...watchEntries(data, { until, sourceName }), ...totals]
    const nightsToWrite = (data.nights || []).filter((n) => n.end <= until)
    if (nightsToWrite.length) await clear(nightsToWrite)
    if (totals.length) {
      try {
        await clearTotals(totals)
      } catch (e) {
        log(`ancien total du jour non retiré : ${e?.message || e}`, 'warn')
      }
    }
    const result = entries.length ? await write(entries) : { inserted: 0 }
    const inserted = result?.inserted ?? 0
    const nights = countNights(data.sleep, data.nights)
    const workouts = (data.workouts || []).length
    const kinds = countEntryKinds(entries)
    log(`à écrire : ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ') || 'rien'} → ${inserted} nouvelle${inserted > 1 ? 's' : ''}`)
    // La reprise n'avance que si la montre a rendu quelque chose : sinon la prochaine relit la même période
    const gotData = data.minutes.length > 0 || data.sleep.length > 0 || workouts > 0 || (data.nights || []).length > 0
    const resume = gotData ? until : lastUntil
    setState(watchKey, { v: SYNC_STATE_VERSION, until: resume, at: new Date(t).toISOString(), inserted, minutes: data.minutes.length, nights, workouts, kinds }, storage)
    if (inserted > 0 && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('health-entries-updated'))
    const parts = [plural(data.minutes.length, 'minute', 'minutes')]
    if (nights) parts.push(plural(nights, 'nuit', 'nuits'))
    if (workouts) parts.push(plural(workouts, 'séance', 'séances'))
    if (data.totals?.steps) parts.push(`${plural(data.totals.steps, 'pas', 'pas')} aujourd'hui`)
    // Où la montre a calé (I69) : dit à l'écran, détaillé dans le journal (`services`, `hints`)
    const stalled = stalledServices(data.services).map((r) => r.label)
    return {
      label: `${parts.join(', ')} → ${plural(inserted, 'mesure', 'mesures')}${stalled.length ? ` · sans réponse : ${stalled.join(', ')}` : ''}`,
      stalled,
      services: data.services || [],
      hints: data.hints || [],
      inserted,
      minutes: data.minutes.length,
      nights,
      detailedNights: (data.nights || []).length,
      workouts,
      kinds,
      capabilities: data.capabilities,
      totals: data.totals,
      since: new Date(since).toISOString(),
      until: new Date(until).toISOString(),
      firstSync: !lastUntil,
    }
  }
}
