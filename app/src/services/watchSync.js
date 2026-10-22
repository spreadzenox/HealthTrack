/**
 * Synchronisation des mesures de la montre Huawei connectée en direct (chantier D3, étape d) :
 * relit la montre depuis la dernière synchro réussie (30 jours la première fois, 6 h de recouvrement),
 * écrit les entrées dans IndexedDB (sans doublon), remplace les totaux du jour, et garde l'état de la
 * dernière synchro par montre (localStorage).
 * Protocole : src/devices/huawei/sync.js.
 */
import { deleteEntry, listEntries, upsertEntries } from '../storage/localHealthStorage'
import { countEntryKinds, describeServices, readWatchData, stalledServices, stepsCheck, syncWindow, totalsEntries, WATCH_SOURCE, watchEntries } from '../devices/huawei/sync'
import { dataFromCapture } from '../devices/huawei/capture'

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

/** État de la dernière synchro d'une montre : { v, until, at, inserted, minutes, nights, workouts, kinds, sleepFileUntil?, dictUntil? } ou null. */
export const getWatchSyncState = (watchKey, storage = globalThis.localStorage) => readAll(storage)[watchKey] || null

/**
 * Rattrapage du sommeil détaillé (M1) : tant qu'il n'a jamais été lu (avant la v201, la question sur le
 * service 0x2C le faisait sauter), on le demande sur 60 jours ; ensuite, depuis la dernière lecture.
 */
export const SLEEP_CATCHUP_DAYS = 60
const DAY_MS = 24 * 3600_000

/** Début de la lecture du sommeil détaillé (ms). */
export function sleepFileSince(state, since, until) {
  if (state?.sleepFileUntil) return Math.min(since, state.sleepFileUntil) - DAY_MS
  return Math.min(since - DAY_MS, until - SLEEP_CATCHUP_DAYS * DAY_MS)
}

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
    const sleepSince = sleepFileSince(prev, since, until)
    const data = await readWatchData(session, { since, until, now: t, log, caps, sleepSince, dictionarySince: prev?.dictUntil || {} })
    return writeWatchData(data, { t, since, until, lastUntil, watchKey, watchName, write, clear, clearTotals, storage, log })
  }
}

/**
 * Écrit ce que la montre a rendu (synchro en direct ou capture du client Java) et met à jour l'état de reprise.
 * `withTotals: false` : totaux du jour ignorés (capture plus ancienne que la dernière synchro).
 */
async function writeWatchData(data, { t, since, until, lastUntil, watchKey, watchName, write, clear, clearTotals, storage, log, withTotals = true, keepAt = null }) {
  const sourceName = watchName || 'Montre Huawei'
  const totals = withTotals ? totalsEntries(data.totals, t, { sourceName }) : []
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
  const steps = stepsCheck(data, t)
  if (withTotals && steps.total !== null) {
    log(`pas du jour : total de la montre ${steps.total}, minutes lues depuis minuit ${steps.minuteSteps}`, steps.consistent ? 'info' : 'warn')
  }
  log(`à écrire : ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ') || 'rien'} → ${inserted} nouvelle${inserted > 1 ? 's' : ''}`)
  // La reprise n'avance que si la montre a rendu quelque chose : sinon la prochaine relit la même période
  const gotData = data.minutes.length > 0 || data.sleep.length > 0 || workouts > 0 || (data.nights || []).length > 0
  const resume = gotData ? Math.max(until, lastUntil || 0) : lastUntil
  const at = keepAt && Date.parse(keepAt) > t ? keepAt : new Date(t).toISOString()
  // Sommeil détaillé lu (même vide) : la prochaine synchro ne relit que depuis là ; sinon, on garde l'ancienne date
  const sleepRead = (data.services || []).find((r) => r.id === 'sleepFile')
  const prevSleep = getWatchSyncState(watchKey, storage)?.sleepFileUntil
  const sleepFileUntil = sleepRead && ['ok', 'empty'].includes(sleepRead.outcome) ? Math.max(until, prevSleep || 0) : prevSleep
  // Dictionnaire (P2P) : par classe, le dernier instant lu ; la prochaine synchro repart juste après (§10.10)
  const dictUntil = { ...(getWatchSyncState(watchKey, storage)?.dictUntil || {}) }
  for (const [cls, ms] of Object.entries(data.dictionary || {})) dictUntil[cls] = Math.max(ms, dictUntil[cls] || 0)
  setState(watchKey, { v: SYNC_STATE_VERSION, until: resume, at, inserted, minutes: data.minutes.length, nights, workouts, kinds, ...(sleepFileUntil ? { sleepFileUntil } : {}), ...(Object.keys(dictUntil).length ? { dictUntil } : {}) }, storage)
  if (inserted > 0 && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('health-entries-updated'))
  const parts = [plural(data.minutes.length, 'minute', 'minutes')]
  if (nights) parts.push(plural(nights, 'nuit', 'nuits'))
  if (workouts) parts.push(plural(workouts, 'séance', 'séances'))
  if (data.totals?.steps) parts.push(`${plural(data.totals.steps, 'pas', 'pas')} aujourd'hui`)
  if (data.hrvDay?.length) parts.push(plural(data.hrvDay.length, 'VFC de journée', 'VFC de journée'))
  // Où la montre a calé (I69) : dit à l'écran, détaillé dans le journal (`services`, `hints`)
  const stalled = stalledServices(data.services).map((r) => r.label)
  // « nouvelles » : les mesures relues (6 h de recouvrement) déjà enregistrées ne sont pas recomptées
  const fresh = inserted ? plural(inserted, 'nouvelle mesure', 'nouvelles mesures') : 'déjà à jour'
  return {
    label: `${parts.join(', ')} → ${fresh}${stalled.length ? ` · sans réponse : ${stalled.join(', ')}` : ''}`,
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
    steps,
    since: new Date(since).toISOString(),
    until: new Date(until).toISOString(),
    firstSync: !lastUntil,
  }
}

/**
 * Importe une capture du client Java « synchro seule » (app tuée, §9.1 d) : décodée par les analyseurs de la
 * synchro en direct, écrite sans doublon. Une capture plus ancienne que la dernière synchro ne fait jamais
 * reculer la reprise ni remplacer un total du jour plus récent. Lève si la capture est illisible.
 */
export async function importWatchCapture(capture, {
  watchKey,
  watchName,
  write = upsertEntries,
  clear = clearWatchNights,
  clearTotals = clearWatchDayTotals,
  storage = globalThis.localStorage,
  log = () => {},
} = {}) {
  const data = dataFromCapture(capture)
  const prev = getWatchSyncState(watchKey, storage)
  const lastUntil = resumeFrom(prev)
  const newer = !(Date.parse(prev?.at || '') >= capture.at)
  log(`capture en arrière-plan du ${new Date(capture.at).toISOString().slice(0, 16)} (UTC) : ${describeServices(data.services, { all: true })}`)
  const report = await writeWatchData(data, {
    t: capture.at,
    since: capture.since,
    until: capture.until,
    lastUntil,
    watchKey,
    watchName,
    write,
    clear,
    clearTotals,
    storage,
    log,
    withTotals: newer,
    keepAt: prev?.at || null,
  })
  return { ...report, battery: data.battery, background: true }
}
