/**
 * Captures du client Java « synchro seule » (chantier D3 d quater ③ d, journal/protocoles/huawei.md §9.1) :
 * app tuée, le Java relit la montre et garde ses réponses **brutes** (TLV déchiffrés, WatchReader.java) ;
 * à l'ouverture, le JS les décode ici avec les analyseurs de la synchro en direct (sync.js), pour qu'il n'y
 * ait qu'une seule implémentation du décodage santé. Même forme de résultat que readWatchData.
 */
import { bytesOfHex } from './crypto'
import { decodeTlvs } from './protocol'
import { parseSleepSequence, parseStressFile } from './files'
import { hrvDayValues, parseDictionaryPage, skinTempValues } from './p2p'
import { FIT, FITNESS, parseMinuteBlock, parseSleepBlock, parseTotals, SYNC_READS, syncHints } from './sync'

export const CAPTURE_VERSION = 1
const DAY = 24 * 3600_000
const OUTCOMES = ['ok', 'empty', 'timeout', 'refused', 'error']

const isMs = (v) => Number.isFinite(v) && v > 0
const isHex = (h) => typeof h === 'string' && /^([0-9a-f]{2})*$/i.test(h)

/** Capture lisible (format v1, dates cohérentes, réponses en hexadécimal) ? */
export function isValidCapture(c) {
  return (
    !!c &&
    c.v === CAPTURE_VERSION &&
    isMs(c.since) &&
    isMs(c.until) &&
    c.since < c.until &&
    isMs(c.at) &&
    Array.isArray(c.replies) &&
    c.replies.every((r) => Number.isInteger(r?.s) && Number.isInteger(r?.c) && Number.isInteger(r?.i) && typeof r.hex === 'string' && /^([0-9a-f]{2})*$/i.test(r.hex)) &&
    (c.reads == null || Array.isArray(c.reads)) &&
    (c.files == null || (Array.isArray(c.files) && c.files.every((f) => typeof f?.id === 'string' && isMs(f.since) && isHex(f.hex)))) &&
    (c.dict == null || (Array.isArray(c.dict) && c.dict.every((d) => typeof d?.id === 'string' && Number.isInteger(d.cls) && Array.isArray(d.pages) && d.pages.every(isHex))))
  )
}

/** Fichiers 0x2C de la capture (M6) : sommeil détaillé et stress, décodés comme dans readWatchData. */
const FILE_READS = {
  sleepFile: (bytes, f, c) => parseSleepSequence(bytes, { bedTime: c.bedTime !== false }).filter((n) => n.end > f.since && n.end <= c.until),
  stress: (bytes, f, c) => parseStressFile(bytes).filter((r) => r.start >= f.since && r.start < c.until),
}

/** Classes du dictionnaire P2P de la capture (M6b) : VFC de journée et température, mêmes bornes que readWatchData. */
const DICT_READS = { hrvDay: hrvDayValues, skinTemp: skinTempValues }

/**
 * Capture → { minutes, sleep, totals, workouts, nights, stress, hrvDay, skinTemp, dictionary, services, hints, capabilities, battery } comme readWatchData.
 * Une réponse illisible est comptée perdue (`failed`), jamais bloquante. Lève si la capture n'est pas lisible.
 */
export function dataFromCapture(capture) {
  if (!isValidCapture(capture)) throw new Error('Capture de la montre illisible')
  const { since, until } = capture
  const reads = new Map((capture.reads || []).map((r) => [r.id, r]))
  const decoded = { sleep: [], minutes: [], totals: null }
  const lost = { sleep: 0, minutes: 0, totals: 0 }
  const kinds = { [FIT.SLEEP_DATA]: ['sleep', parseSleepBlock], [FIT.MINUTE_DATA]: ['minutes', parseMinuteBlock] }
  for (const r of capture.replies) {
    if (r.s !== FITNESS) continue
    try {
      const tlvs = decodeTlvs(bytesOfHex(r.hex))
      if (r.c === FIT.TOTALS) decoded.totals = parseTotals(tlvs)
      else if (kinds[r.c]) decoded[kinds[r.c][0]].push(...kinds[r.c][1](tlvs))
    } catch {
      const id = r.c === FIT.TOTALS ? 'totals' : kinds[r.c]?.[0]
      if (id) lost[id]++
    }
  }
  const fromFiles = { sleepFile: [], stress: [] }
  const lostFiles = { sleepFile: 0, stress: 0 }
  for (const f of capture.files || []) {
    if (!FILE_READS[f.id]) continue
    try {
      fromFiles[f.id].push(...FILE_READS[f.id](bytesOfHex(f.hex), f, capture))
    } catch {
      lostFiles[f.id]++
    }
  }
  const fromDict = { hrvDay: [], skinTemp: [] }
  const lostDict = { hrvDay: 0, skinTemp: 0 }
  const dictionary = {}
  for (const d of capture.dict || []) {
    if (!DICT_READS[d.id]) continue
    for (const hex of d.pages) {
      try {
        const page = parseDictionaryPage(bytesOfHex(hex))
        if (page.cls !== d.cls) continue
        fromDict[d.id].push(...DICT_READS[d.id](page.records))
        if (page.maxTime) dictionary[d.cls] = Math.max(page.maxTime, dictionary[d.cls] || 0)
      } catch {
        lostDict[d.id]++
      }
    }
  }
  const sleep = decoded.sleep.filter((p) => p.start >= since - DAY && p.start < until)
  const minutes = decoded.minutes.filter((m) => m.t >= since && m.t < until)
  const services = ['sleep', 'minutes', 'totals'].map((id) => {
    const native = reads.get(id) || {}
    const items = id === 'totals' ? (decoded.totals ? [decoded.totals] : []) : decoded[id]
    let outcome = OUTCOMES.includes(native.outcome) ? native.outcome : items.length ? 'ok' : 'empty'
    if (id === 'totals' && decoded.totals) outcome = decoded.totals.steps || decoded.totals.kcal || decoded.totals.distanceM ? 'ok' : 'empty'
    else if (items.length) outcome = 'ok'
    else if (outcome === 'ok' && lost[id]) outcome = 'error'
    const failed = (Number.isInteger(native.failed) ? native.failed : 0) + lost[id]
    return {
      ...SYNC_READS.find((s) => s.id === id),
      outcome,
      count: outcome === 'empty' ? 0 : items.length,
      ...(Number.isInteger(native.units) && id !== 'totals' ? { units: native.units } : {}),
      ...(failed ? { failed } : {}),
    }
  })
  // fichiers lus seulement si le Java les a demandés (sa lecture est consignée) : sinon, rien à dire
  for (const id of Object.keys(FILE_READS)) {
    const native = reads.get(id)
    if (!native) continue
    const items = fromFiles[id]
    let outcome = OUTCOMES.includes(native.outcome) ? native.outcome : 'error'
    if (items.length) outcome = 'ok'
    else if (outcome === 'ok') outcome = lostFiles[id] ? 'error' : 'empty'
    services.push({ ...SYNC_READS.find((s) => s.id === id), outcome, count: items.length, ...(lostFiles[id] ? { failed: lostFiles[id] } : {}) })
  }
  for (const id of Object.keys(DICT_READS)) {
    const native = reads.get(id)
    if (!native) continue
    const items = fromDict[id]
    let outcome = OUTCOMES.includes(native.outcome) || native.outcome === 'unsupported' ? native.outcome : 'error'
    if (items.length) outcome = 'ok'
    else if (outcome === 'ok') outcome = lostDict[id] ? 'error' : 'empty'
    services.push({ ...SYNC_READS.find((s) => s.id === id), outcome, count: items.length, ...(Number.isInteger(native.units) ? { units: native.units } : {}), ...(lostDict[id] ? { failed: lostDict[id] } : {}) })
  }
  const totals = decoded.totals
  const withFiles = services.some((r) => r.id === 'sleepFile' || r.id === 'stress')
  return {
    minutes,
    sleep,
    totals,
    workouts: [],
    nights: fromFiles.sleepFile,
    stress: fromFiles.stress,
    hrvDay: fromDict.hrvDay,
    skinTemp: fromDict.skinTemp,
    dictionary,
    services,
    hints: syncHints(services, { totals }),
    capabilities: `synchro en arrière-plan (sommeil, minutes, totaux${withFiles ? ', fichiers' : ''}${services.some((r) => DICT_READS[r.id]) ? ', dictionnaire' : ''})`,
    battery: Number.isInteger(capture.battery) && capture.battery >= 0 ? capture.battery : null,
  }
}
