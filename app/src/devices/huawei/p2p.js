/**
 * Service « P2P » des montres Huawei (0x34/0x01) et synchro « dictionnaire » : la voie par laquelle la
 * GT 6 Pro rend la VFC de journée (classe 500044) et la température de la peau (400012). Réimplémenté
 * d'après journal/protocoles/huawei.md §10.4 et §10.10 (aucun code Gadgetbridge, AGPL).
 *
 * Une enveloppe P2P = des TLV : 1 commande (1 ping, 2 données, 3 accusé), 2 numéro de séquence,
 * 3 / 4 paquets source / destination, 5 / 6 empreintes (données seulement), 7 charge utile, 8 code.
 * On n'utilise pas `session.request` : il prendrait l'accusé de la montre pour la réponse. Un
 * aiguilleur branché par `session.listen` rattache la réponse au ping par son numéro, les pages de
 * données par leur classe, et acquitte tout message spontané de la montre.
 */
import { decodeTlvs, encodeTlvs, tryDecodeTlvs } from './protocol'

export const P2P_SERVICE = 0x34
export const P2P_COMMAND = 0x01
export const P2P = { PING: 1, DATA: 2, REPLY: 3 }
/** 0xCA : service disponible (réponse au ping) ; 0xCF : accusé « reçu ». */
export const P2P_CODE = { AVAILABLE: 0xca, RECEIVED: 0xcf }
export const PACKAGE = { HEALTH: 'com.huawei.health', FILESYNC: 'hw.watch.health.filesync', DICTIONARY: 'hw.unitedevice.datadictionarysync' }
/** Empreintes publiques des demandes de dictionnaire (aucun secret). */
export const FINGERPRINT = { SOURCE: 'UniteDeviceManagement', DESTINATION: 'SystemApp' }
/** Le numéro de séquence boucle sur 0 … 32 765. */
export const SEQ_MODULO = 32766

/** Classes du dictionnaire lues par HealthTrack, et le champ de la valeur utile. */
export const DICT_CLASS = { HRV: 500044, SKIN_TEMP: 400012 }
export const DICT_FIELD = { HRV: 500044831, SKIN_TEMP: 400012430 }

/** Délai d'une page (la montre ne dit rien d'une classe qu'elle ignore) et garde-fou de pages par classe. */
export const PAGE_TIMEOUT_MS = 10_000
/** Le ping répond tout de suite quand le service existe : une montre sans P2P ne coûte que 5 s. */
export const PING_TIMEOUT_MS = 5000
export const MAX_PAGES = 50
/** Une page reprend 1 s après le dernier enregistrement de la précédente. */
export const NEXT_PAGE_GAP_MS = 1000

const utf8 = (s) => Array.from(new TextEncoder().encode(s))
const text = (b) => (b ? new TextDecoder().decode(b) : null)
const uint = (bytes) => Array.from(bytes || []).reduce((v, b) => v * 256 + b, 0)
const fixed = (n, size) => Array.from({ length: size }, (_, i) => Math.floor(n / 2 ** (8 * (size - 1 - i))) & 0xff)
/** Entier gros-boutiste sur le minimum d'octets (500044 → 07 A1 4C). */
export function minimalBytes(n) {
  const out = []
  let v = n
  do {
    out.unshift(v & 0xff)
    v = Math.floor(v / 256)
  } while (v > 0)
  return out
}

/** Compteur unique de la connexion : incrémenté avant chaque envoi, le premier message porte donc 2. */
export function createSequence(start = 1) {
  let n = start
  return () => (n = (n + 1) % SEQ_MODULO)
}

/** Enveloppe → TLV de la commande 0x34/0x01. `code` : octets (4 du téléphone vers la montre). */
export function encodeP2P({ cmd, seq, src, dst, srcFingerprint, dstFingerprint, payload, code }) {
  const tlvs = [
    { tag: 1, value: [cmd] },
    { tag: 2, value: fixed(seq, 2) },
    { tag: 3, value: utf8(src) },
    { tag: 4, value: utf8(dst) },
  ]
  if (srcFingerprint != null) tlvs.push({ tag: 5, value: utf8(srcFingerprint) })
  if (dstFingerprint != null) tlvs.push({ tag: 6, value: utf8(dstFingerprint) })
  if (payload?.length) tlvs.push({ tag: 7, value: Array.from(payload) })
  if (code != null) tlvs.push({ tag: 8, value: code })
  return tlvs
}

/** TLV reçus → { cmd, seq, src, dst, payload, code } (code : entier, quelle que soit sa longueur). */
export function decodeP2P(tlvs) {
  const get = (tag) => tlvs.find((t) => t.tag === tag)?.value
  const code = get(8)
  return { cmd: get(1)?.[0] ?? null, seq: uint(get(2)), src: text(get(3)), dst: text(get(4)), payload: get(7) || null, code: code?.length ? uint(code) : null }
}

/** Accusé « reçu » d'un message de la montre : même numéro, paquets inversés, sans empreinte. */
export const ackFor = (msg) => encodeP2P({ cmd: P2P.REPLY, seq: msg.seq, src: msg.dst, dst: msg.src, code: fixed(P2P_CODE.RECEIVED, 4) })

/** Ping d'ouverture : la montre répond 0xCA si la synchro dictionnaire est disponible. */
export const pingP2P = (seq) => encodeP2P({ cmd: P2P.PING, seq, src: PACKAGE.HEALTH, dst: PACKAGE.FILESYNC })

/** Charge utile d'une demande de dictionnaire : 0x01 (contenu TLV) puis opération, classe, début, maintenant. */
export function dictionaryRequest(cls, startMs, nowMs) {
  return [
    0x01,
    ...encodeTlvs([
      { tag: 1, value: [0x01] },
      { tag: 2, value: minimalBytes(cls) },
      { tag: 5, value: fixed(Math.max(0, Math.floor(startMs)), 8) },
      { tag: 6, value: fixed(Math.floor(nowMs), 8) },
      { tag: 0x0d, value: [0x01] },
    ]),
  ]
}

export const dictionaryMessage = (seq, cls, startMs, nowMs) =>
  encodeP2P({
    cmd: P2P.DATA,
    seq,
    src: PACKAGE.DICTIONARY,
    dst: PACKAGE.FILESYNC,
    srcFingerprint: FINGERPRINT.SOURCE,
    dstFingerprint: FINGERPRINT.DESTINATION,
    payload: dictionaryRequest(cls, startMs, nowMs),
  })

/** Valeur numérique : réel double (8 octets) ou simple (4 octets), gros-boutiste ; autre longueur → null. */
export function readReal(bytes) {
  const b = Uint8Array.from(bytes || [])
  const view = new DataView(b.buffer)
  if (b.length === 8) return view.getFloat64(0)
  if (b.length === 4) return view.getFloat32(0)
  return null
}

/**
 * Charge utile d'une page de la montre → { cls, records: [{ start, end, modified, values: { champ: nombre } }],
 * maxTime, ignored }. `maxTime` : le plus grand max(fin, modification) de la page (le début à défaut), sur tous
 * les enregistrements, même ceux que nos bornes écarteront ensuite. `ignored` : valeurs de longueur inconnue.
 * Lève si la page n'a pas de classe.
 */
export function parseDictionaryPage(payload) {
  const bytes = Uint8Array.from(payload || [])
  if (bytes[0] !== 0x01) throw new Error('page de dictionnaire sans contenu TLV')
  const body = decodeTlvs(bytes.subarray(1))
  const get = (tlvs, tag) => tlvs.find((t) => t.tag === tag)?.value
  const cls = get(body, 2)
  if (!cls?.length) throw new Error('page de dictionnaire sans classe')
  const op = get(body, 1)?.[0] ?? null
  const records = []
  let maxTime = null
  let ignored = 0
  const container = get(body, 0x83)
  for (const item of container ? tryDecodeTlvs(container).filter((t) => t.tag === 0x84) : []) {
    const r = tryDecodeTlvs(item.value)
    const start = uint(get(r, 5))
    const end = get(r, 6) ? uint(get(r, 6)) : null
    const modified = get(r, 0x0c) ? uint(get(r, 0x0c)) : null
    const values = {}
    const fields = get(r, 0x87)
    for (const v of fields ? tryDecodeTlvs(fields).filter((t) => t.tag === 0x88) : []) {
      const f = tryDecodeTlvs(v.value)
      const field = uint(get(f, 9))
      const raw = get(f, 0x0a)
      if (!raw) continue // valeur texte (étiquette 0x0B) : pas utilisée
      const n = readReal(raw)
      if (n == null || !Number.isFinite(n)) ignored++
      else values[field] = n
    }
    const t = Math.max(end ?? 0, modified ?? 0) || start
    if (t) maxTime = Math.max(maxTime ?? 0, t)
    records.push({ start, end, modified, values })
  }
  return { op, cls: uint(cls), records, maxTime, ignored }
}

/**
 * Aiguilleur P2P sur une session authentifiée. `close()` le débranche.
 * @returns {{ ping(): Promise<number|null>, readClass(cls, opts): Promise<object>, close(): void }}
 */
export function createP2P(session, { log = () => {}, timeout = PAGE_TIMEOUT_MS, now = () => Date.now() } = {}) {
  const next = createSequence()
  const pings = new Map() // numéro → resolve(code)
  let current = null // { cls, resolve, reject } : une seule page en vol

  const send = (tlvs) => session.send(P2P_SERVICE, P2P_COMMAND, tlvs)
  const unlisten = session.listen(P2P_SERVICE, P2P_COMMAND, async (m) => {
    const msg = decodeP2P(m.tlvs || [])
    if (msg.cmd === P2P.REPLY) {
      const resolve = pings.get(msg.seq)
      if (resolve) {
        pings.delete(msg.seq)
        resolve(msg.code)
      }
      return // accusé d'une de nos demandes, ou numéro inconnu : rien à faire
    }
    if (msg.cmd !== P2P.PING && msg.cmd !== P2P.DATA) return
    // tout message de la montre est acquitté d'abord, avant d'être lu
    try {
      await send(ackFor(msg))
    } catch (e) {
      log(`P2P : accusé non envoyé (${e?.message || e})`, 'warn')
    }
    if (msg.cmd !== P2P.DATA || msg.src !== PACKAGE.FILESYNC || !msg.payload) return
    let page
    try {
      page = parseDictionaryPage(msg.payload)
    } catch (e) {
      if (current) current.reject(new Error(`page illisible : ${e?.message || e}`))
      return
    }
    if (current && page.cls === current.cls) current.resolve(page)
    else log(`P2P : page de la classe ${page.cls} non demandée, ignorée`)
  })

  const wait = (label, register, ms = timeout) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Pas de réponse de la montre (P2P ${label}) en ${Math.round(ms / 1000)} s`)), ms)
      register(
        (v) => {
          clearTimeout(timer)
          resolve(v)
        },
        (e) => {
          clearTimeout(timer)
          reject(e)
        },
      )
    })

  async function requestPage(cls, start) {
    const seq = next()
    const page = wait(`classe ${cls}`, (resolve, reject) => (current = { cls, resolve, reject }))
    try {
      await send(dictionaryMessage(seq, cls, start, now()))
      return await page
    } finally {
      current = null
    }
  }

  return {
    /** Code de la réponse au ping (0xCA = disponible), null si la montre ne répond pas. */
    async ping() {
      const seq = next()
      const answer = wait('ping', (resolve) => pings.set(seq, resolve), Math.min(timeout, PING_TIMEOUT_MS))
      await send(pingP2P(seq))
      try {
        return await answer
      } catch {
        pings.delete(seq)
        return null
      }
    },
    /**
     * Toutes les pages d'une classe depuis `since` (ms ; 0 = tout l'historique de la montre).
     * @returns {Promise<{ records: object[], pages: number, maxTime: number|null, ignored: number, outcome: string, stopped?: string }>}
     */
    async readClass(cls, { since = 0, maxPages = MAX_PAGES } = {}) {
      const records = []
      let maxTime = null
      let ignored = 0
      let start = since
      for (let pages = 0; pages < maxPages; pages++) {
        let page
        try {
          page = await requestPage(cls, start)
        } catch (e) {
          // ce qui est déjà lu est gardé ; la reprise repartira de la dernière page reçue
          if (!records.length && !pages) throw e
          log(`P2P classe ${cls} : page ${pages + 1} perdue (${e?.message || e})`, 'warn')
          return { records, pages, maxTime, ignored, outcome: 'ok', stopped: 'timeout' }
        }
        ignored += page.ignored
        if (!page.records.length) return { records, pages: pages + 1, maxTime, ignored, outcome: records.length ? 'ok' : 'empty' }
        records.push(...page.records)
        maxTime = Math.max(maxTime ?? 0, page.maxTime ?? 0) || maxTime
        const following = (page.maxTime ?? 0) + NEXT_PAGE_GAP_MS
        if (!(following > start)) {
          log(`P2P classe ${cls} : la reprise n'avance plus, arrêt`, 'warn')
          return { records, pages: pages + 1, maxTime, ignored, outcome: 'ok', stopped: 'stuck' }
        }
        start = following
      }
      log(`P2P classe ${cls} : ${maxPages} pages lues, la suite à la prochaine synchro`)
      return { records, pages: maxPages, maxTime, ignored, outcome: records.length ? 'ok' : 'empty', stopped: 'pages' }
    },
    close: () => unlisten(),
  }
}

/** Début de la lecture d'une classe d'après l'état de synchro : 1 s après la dernière lue, 0 la première fois. */
export const classSince = (until) => (until ? until + NEXT_PAGE_GAP_MS : 0)

/** VFC de journée gardée : RMSSD entre 0 et 200 ms, arrondie à l'entier. */
export const HRV_DAY_RANGE = [0, 200]

/** Enregistrements de la classe 500044 → [{ start, value }] (valeurs hors bornes écartées). */
export function hrvDayValues(records) {
  const [min, max] = HRV_DAY_RANGE
  const out = []
  for (const r of records) {
    const v = r.values?.[DICT_FIELD.HRV]
    if (typeof v !== 'number' || !(v > min) || v > max || !r.start) continue
    out.push({ start: r.start, value: Math.round(v) })
  }
  return out
}

/** Température de la peau gardée (poignet, °C) : 20 à 42 °C, arrondie au centième (§10.10). */
export const SKIN_TEMP_RANGE = [20, 42]

/** Enregistrements de la classe 400012 → [{ start, value }] en °C (valeurs hors bornes écartées). */
export function skinTempValues(records) {
  const [min, max] = SKIN_TEMP_RANGE
  const out = []
  for (const r of records) {
    const v = r.values?.[DICT_FIELD.SKIN_TEMP]
    if (typeof v !== 'number' || !(v >= min) || v > max || !r.start) continue
    out.push({ start: r.start, value: Math.round(v * 100) / 100 })
  }
  return out
}
