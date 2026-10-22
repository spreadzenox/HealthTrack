import { describe, it, expect, vi } from 'vitest'
import { decodeTlvs, encodeTlvs } from './protocol'
import {
  ackFor,
  classSince,
  createP2P,
  createSequence,
  decodeP2P,
  dictionaryMessage,
  dictionaryRequest,
  DICT_CLASS,
  DICT_FIELD,
  encodeP2P,
  hrvDayValues,
  minimalBytes,
  P2P,
  PACKAGE,
  parseDictionaryPage,
  readReal,
  SEQ_MODULO,
} from './p2p'
import { dictionaryPage, real4, real8 } from './testing/sampleDictionary'

const u = (b) => Array.from(b).reduce((v, x) => v * 256 + x, 0)
const txt = (b) => new TextDecoder().decode(b)
const get = (tlvs, tag) => tlvs.find((t) => t.tag === tag)?.value

describe('séquence P2P', () => {
  it('le premier message porte 2, puis +1', () => {
    const next = createSequence()
    expect([next(), next(), next()]).toEqual([2, 3, 4])
  })
  it('boucle à 32 766 (valeurs 0 … 32 765)', () => {
    const next = createSequence(SEQ_MODULO - 2)
    expect([next(), next(), next()]).toEqual([32765, 0, 1])
  })
})

describe('enveloppe P2P', () => {
  it('encode puis décode une demande de données', () => {
    const tlvs = dictionaryMessage(2, DICT_CLASS.HRV, 0, 1_700_000_000_000)
    const msg = decodeP2P(decodeTlvs(encodeTlvs(tlvs)))
    expect(msg).toMatchObject({ cmd: P2P.DATA, seq: 2, src: PACKAGE.DICTIONARY, dst: PACKAGE.FILESYNC })
    expect(txt(get(tlvs.map((t) => ({ ...t, value: Uint8Array.from(t.value) })), 5))).toBe('UniteDeviceManagement')
    expect(txt(Uint8Array.from(get(tlvs, 6)))).toBe('SystemApp')
  })
  it('la classe est sur le minimum d’octets', () => {
    expect(minimalBytes(500044)).toEqual([0x07, 0xa1, 0x4c])
    expect(minimalBytes(400012)).toEqual([0x06, 0x1a, 0x8c])
    expect(minimalBytes(0)).toEqual([0])
  })
  it('demande : 0x01 puis opération, classe, début et maintenant sur 8 octets, 0x0D', () => {
    const p = dictionaryRequest(500044, 5000, 1_700_000_000_000)
    expect(p[0]).toBe(1)
    const t = decodeTlvs(p.slice(1))
    expect(t.map((x) => x.tag)).toEqual([1, 2, 5, 6, 0x0d])
    expect(u(get(t, 5))).toBe(5000)
    expect(get(t, 5)).toHaveLength(8)
    expect(u(get(t, 6))).toBe(1_700_000_000_000)
  })
  it('accusé : même numéro, paquets inversés, sans empreinte, code 0xCF sur 4 octets', () => {
    const ack = ackFor({ seq: 77, src: PACKAGE.FILESYNC, dst: PACKAGE.DICTIONARY })
    const msg = decodeP2P(decodeTlvs(encodeTlvs(ack)))
    expect(msg).toMatchObject({ cmd: P2P.REPLY, seq: 77, src: PACKAGE.DICTIONARY, dst: PACKAGE.FILESYNC, code: 0xcf })
    expect(get(ack, 8)).toEqual([0, 0, 0, 0xcf])
    expect(ack.some((t) => t.tag === 5 || t.tag === 6)).toBe(false)
  })
})

describe('page du dictionnaire', () => {
  it('réels de 8 et 4 octets ; longueur 6 ignorée et comptée', () => {
    expect(readReal(real8(42.5))).toBe(42.5)
    expect(readReal(real4(36.25))).toBe(36.25)
    expect(readReal([1, 2, 3, 4, 5, 6])).toBeNull()
    const page = parseDictionaryPage(
      dictionaryPage(DICT_CLASS.HRV, [
        { start: 1000, end: 2000, values: [[DICT_FIELD.HRV, real8(41)]] },
        { start: 3000, modified: 9000, values: [[DICT_FIELD.HRV, real4(55)]] },
        { start: 10_000, values: [[DICT_FIELD.HRV, [1, 2, 3, 4, 5, 6]]] },
      ]),
    )
    expect(page.cls).toBe(500044)
    expect(page.records.map((r) => r.values[DICT_FIELD.HRV])).toEqual([41, 55, undefined])
    expect(page.ignored).toBe(1)
    expect(page.maxTime).toBe(10_000) // le début à défaut de fin / modification
  })
  it('page vide : aucun enregistrement', () => {
    expect(parseDictionaryPage(dictionaryPage(DICT_CLASS.HRV, null)).records).toEqual([])
  })
  it('page sans classe : erreur', () => {
    expect(() => parseDictionaryPage([1, ...encodeTlvs([{ tag: 1, value: [1] }])])).toThrow(/classe/)
  })
  it('VFC : bornes 0–200 ms, arrondie', () => {
    const recs = [
      { start: 1, values: { [DICT_FIELD.HRV]: 41.6 } },
      { start: 2, values: { [DICT_FIELD.HRV]: 250 } },
      { start: 3, values: { [DICT_FIELD.HRV]: 0 } },
      { start: 4, values: {} },
    ]
    expect(hrvDayValues(recs)).toEqual([{ start: 1, value: 42 }])
  })
  it('reprise : 0 la première fois, sinon + 1 s', () => {
    expect(classSince(undefined)).toBe(0)
    expect(classSince(5000)).toBe(6000)
  })
})

/** Fausse session : la « montre » répond par `onSend(msg, reply)` ; `reply(fields)` pousse un message P2P. */
function fakeSession(onSend) {
  let handler = null
  const sent = []
  const session = {
    sent,
    listen: (s, c, h) => {
      handler = h
      return () => (handler = null)
    },
    send: vi.fn(async (s, c, tlvs) => {
      const msg = decodeP2P(decodeTlvs(encodeTlvs(tlvs)))
      sent.push(msg)
      const reply = (fields) => setTimeout(() => handler?.({ serviceId: 0x34, commandId: 1, tlvs: decodeTlvs(encodeTlvs(encodeP2P(fields))) }), 0)
      onSend(msg, reply)
    }),
    get listening() {
      return Boolean(handler)
    },
  }
  return session
}

const pageMessage = (seq, payload) => ({ cmd: P2P.DATA, seq, src: PACKAGE.FILESYNC, dst: PACKAGE.DICTIONARY, payload })

describe('aiguilleur P2P', () => {
  it('ping 0xCA : disponible ; la réponse est rattachée par numéro', async () => {
    const s = fakeSession((msg, reply) => {
      if (msg.cmd === P2P.PING) {
        reply({ cmd: P2P.REPLY, seq: 999, src: PACKAGE.FILESYNC, dst: PACKAGE.HEALTH, code: [0xcc] }) // autre numéro : ignoré
        reply({ cmd: P2P.REPLY, seq: msg.seq, src: PACKAGE.FILESYNC, dst: PACKAGE.HEALTH, code: [0xca] })
      }
    })
    const p2p = createP2P(s)
    expect(await p2p.ping()).toBe(0xca)
    expect(s.sent[0]).toMatchObject({ cmd: P2P.PING, seq: 2, src: PACKAGE.HEALTH, dst: PACKAGE.FILESYNC })
    p2p.close()
    expect(s.listening).toBe(false)
  })

  it('ping sans réponse : null', async () => {
    const p2p = createP2P(fakeSession(() => {}), { timeout: 20 })
    expect(await p2p.ping()).toBeNull()
  })

  it('accusé de la montre ignoré, page acquittée avec SON numéro, 2 pages puis page vide', async () => {
    const pages = [
      [{ start: 1000, end: 61_000, values: [[DICT_FIELD.HRV, real8(40)]] }],
      [{ start: 70_000, end: 130_000, values: [[DICT_FIELD.HRV, real8(250)]] }], // hors bornes, mais compte pour la reprise
      null,
    ]
    let watchSeq = 500
    const s = fakeSession((msg, reply) => {
      if (msg.cmd !== P2P.DATA) return
      reply({ cmd: P2P.REPLY, seq: msg.seq, src: PACKAGE.FILESYNC, dst: PACKAGE.DICTIONARY, code: [0xcf] })
      reply(pageMessage(++watchSeq, dictionaryPage(DICT_CLASS.HRV, pages.shift())))
    })
    const p2p = createP2P(s, { now: () => 1_700_000_000_000 })
    const r = await p2p.readClass(DICT_CLASS.HRV, { since: 0 })
    expect(r).toMatchObject({ outcome: 'ok', pages: 3, maxTime: 130_000 })
    expect(r.records).toHaveLength(2)
    const requests = s.sent.filter((m) => m.cmd === P2P.DATA)
    const starts = requests.map((m) => u(get(decodeTlvs(m.payload.slice(1)), 5)))
    expect(starts).toEqual([0, 62_000, 131_000])
    const acks = s.sent.filter((m) => m.cmd === P2P.REPLY)
    expect(acks.map((a) => a.seq)).toEqual([501, 502, 503])
    expect(acks[0]).toMatchObject({ src: PACKAGE.DICTIONARY, dst: PACKAGE.FILESYNC, code: 0xcf })
    expect(hrvDayValues(r.records)).toEqual([{ start: 1000, value: 40 }])
  })

  it('première page sans réponse : erreur « Pas de réponse » (délai)', async () => {
    const p2p = createP2P(fakeSession(() => {}), { timeout: 20 })
    await expect(p2p.readClass(DICT_CLASS.HRV)).rejects.toThrow(/^Pas de réponse/)
  })

  it('page suivante sans réponse : ce qui est lu est gardé', async () => {
    let n = 0
    const s = fakeSession((msg, reply) => {
      if (msg.cmd === P2P.DATA && n++ === 0) reply(pageMessage(1, dictionaryPage(DICT_CLASS.HRV, [{ start: 1000, end: 2000, values: [[DICT_FIELD.HRV, real8(30)]] }])))
    })
    const r = await createP2P(s, { timeout: 20 }).readClass(DICT_CLASS.HRV)
    expect(r).toMatchObject({ outcome: 'ok', stopped: 'timeout', maxTime: 2000 })
    expect(r.records).toHaveLength(1)
  })

  it('garde-fou : 50 pages au plus', async () => {
    let t = 0
    const s = fakeSession((msg, reply) => {
      if (msg.cmd !== P2P.DATA) return
      t += 60_000
      reply(pageMessage(1, dictionaryPage(DICT_CLASS.HRV, [{ start: t, end: t + 1000, values: [[DICT_FIELD.HRV, real8(30)]] }])))
    })
    const r = await createP2P(s).readClass(DICT_CLASS.HRV, { maxPages: 50 })
    expect(r).toMatchObject({ pages: 50, stopped: 'pages' })
    expect(s.sent.filter((m) => m.cmd === P2P.DATA)).toHaveLength(50)
  })

  it('reprise qui n’avance pas : arrêt', async () => {
    const s = fakeSession((msg, reply) => {
      if (msg.cmd === P2P.DATA) reply(pageMessage(1, dictionaryPage(DICT_CLASS.HRV, [{ start: 1000, end: 2000, values: [] }])))
    })
    const r = await createP2P(s).readClass(DICT_CLASS.HRV, { since: 5000 })
    expect(r).toMatchObject({ stopped: 'stuck', pages: 1 })
  })

  it('message spontané de la montre (ping) acquitté', async () => {
    let push
    const s = fakeSession((msg, reply) => (push = reply))
    createP2P(s)
    await s.send(0x34, 1, encodeP2P({ cmd: P2P.REPLY, seq: 1, src: 'x', dst: 'y' })) // pour récupérer `reply`
    push({ cmd: P2P.PING, seq: 9, src: PACKAGE.FILESYNC, dst: PACKAGE.HEALTH })
    await new Promise((r) => setTimeout(r, 5))
    expect(s.sent.at(-1)).toMatchObject({ cmd: P2P.REPLY, seq: 9, src: PACKAGE.HEALTH, dst: PACKAGE.FILESYNC, code: 0xcf })
  })
})
