/**
 * Vecteurs communs JS ↔ Java (chantier D3 d quater ③) : le client Java « synchro seule »
 * (android/app/src/main/java/com/healthtrack/app/huawei/) doit produire exactement les mêmes trames,
 * corps chiffrés et messages d'authentification que le pilote JS, qui a fait ses preuves sur la vraie
 * GT 6 Pro. Ce test calcule les vecteurs avec le code JS et vérifie que le fichier lu par les tests
 * Java (src/test/resources/huawei/link-vectors.json) est à jour.
 * Après un changement voulu du protocole : `UPDATE_VECTORS=1 npx vitest run src/devices/huawei/javaVectors.test.js`.
 */
import { describe, it, expect, vi } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createReassembler, encodeFrames, encodeTlvs, parseLinkParams } from './protocol'
import { createSession } from './session'
import { createFakeWatch } from './testing/fakeWatch'
import { CMD, OP_AUTH, createCipher, frameKey, hichainTlvs, parseHichainReply, psk, returnCodeMac, runHichain, securityNegotiationTlvs, watchToken } from './hichain'
import { bytesOfHex, hexOf, utf8 } from './crypto'

const FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../../../android/app/src/test/resources/huawei/link-vectors.json')

const hex = (b) => hexOf(b)
const seq = (start, n) => Uint8Array.from({ length: n }, (_, i) => (start + i * 7) & 0xff)
/** Aléa scripté : rend les tableaux prévus dans l'ordre (le test Java rejoue la même liste). */
const scripted = (list) => {
  const queue = list.map((h) => bytesOfHex(h))
  return (n) => {
    const next = queue.shift()
    if (!next || next.length !== n) throw new Error(`aléa scripté : ${n} octets demandés`)
    return next
  }
}
const tlvsJson = (tlvs) => tlvs.map((t) => ({ tag: t.tag, hex: hex(Uint8Array.from(t.value || [])) }))

function frameVectors() {
  const cases = [
    { service: 1, command: 1, tlvs: [{ tag: 1 }, { tag: 2 }, { tag: 3 }, { tag: 4 }], max: 244 },
    { service: 7, command: 0x0b, tlvs: [{ tag: 1, value: [0, 3] }, { tag: 0x81, value: Array.from(seq(1, 200)) }], max: 64 },
    { service: 0x2c, command: 5, tlvs: [{ tag: 2, value: Array.from(seq(9, 130)) }], max: 244 },
  ]
  return cases.map((c) => ({ ...c, tlvs: tlvsJson(c.tlvs), frames: encodeFrames(c.service, c.command, c.tlvs, c.max).map(hex) }))
}

function reassemblyVector() {
  const frames = encodeFrames(7, 0x0b, [{ tag: 0x81, value: Array.from(seq(3, 150)) }], 48)
  const stream = Uint8Array.from(frames.flatMap((f) => Array.from(f)))
  // morceaux de 17 octets, avec 2 octets parasites avant le début
  const chunks = [[0x00, 0x13]]
  for (let i = 0; i < stream.length; i += 17) chunks.push(Array.from(stream.slice(i, i + 17)))
  const r = createReassembler()
  const messages = chunks.flatMap((c) => r.push(c))
  return {
    chunks: chunks.map((c) => hex(Uint8Array.from(c))),
    messages: messages.map((m) => ({ service: m.serviceId, command: m.commandId, raw: hex(m.raw) })),
  }
}

async function cipherVectors() {
  const key = seq(0x40, 32)
  const plain = Uint8Array.from(encodeTlvs([{ tag: 1, value: [0x55] }, { tag: 2, value: Array.from(seq(5, 40)) }]))
  const out = []
  for (const [gcm, randomIv, counter] of [
    [false, false, 0],
    [true, false, 0xffffffff],
    [true, true, 0],
  ]) {
    const random = [hex(randomIv ? seq(0x90, 16) : seq(0x90, 12)), hex(randomIv ? seq(0xa0, 16) : seq(0xa0, 12))]
    const c = createCipher({ key, gcm, randomIv, counter, rand: scripted(random) })
    const sealed = [await c.sealBytes(1, 8, plain), await c.sealBytes(1, 8, plain)]
    out.push({ gcm, randomIv, counter, key: hex(key), random, plain: hex(plain), sealed: sealed.map(tlvsJson) })
  }
  return out
}

async function authVector() {
  const authToken = seq(0x11, 32)
  const authId = '0123456789ABCDEF0123456789ABCDEF'
  const random = [hex(seq(0x21, 16)), hex(seq(0x31, 32)), hex(seq(0x51, 12))]
  const [randSelf, seed] = random.slice(0, 2).map(bytesOfHex)
  const randPeer = seq(0x61, 16)
  const idPeer = utf8('WATCH-PEER-ID-0042')
  const k = await psk(authToken, seed)
  const ids = { randSelf, randPeer, idSelf: utf8(authId), idPeer }
  const startReply = { payload: { isoSalt: hexOf(randPeer, true), peerAuthId: hexOf(idPeer, true), peerUserType: 0, token: hexOf(await watchToken(k, ids), true) }, message: 0x8011 }
  const tokenReply = { payload: { returnCodeMac: hexOf(await returnCodeMac(k), true) }, message: 0x8012 }
  // la GT 6 Pro termine son JSON par un octet NUL (§6.9) : le Java doit l'ignorer comme le JS
  const replyTlvs = (json) => [{ tag: 1, value: [...utf8(JSON.stringify(json)), 0] }]
  const replies = [replyTlvs(startReply), replyTlvs(tokenReply), [{ tag: 1, value: Array.from(utf8('ok')) }, { tag: 4, value: [1] }]]
  const sent = []
  let i = 0
  const result = await runHichain({
    operation: OP_AUTH,
    baseKey: authToken,
    authId,
    requestId: 1700000000123,
    rand: scripted(random),
    exchange: async (json, op) => {
      sent.push(JSON.stringify(json))
      expect(op).toBe(OP_AUTH)
      return parseHichainReply(replies[i++].map((t) => ({ tag: t.tag, value: Uint8Array.from(t.value) })))
    },
  })
  return {
    authToken: hex(authToken),
    authId,
    requestId: 1700000000123,
    random,
    replies: replies.map(tlvsJson),
    sent,
    firstRequestTlvs: tlvsJson(hichainTlvs(JSON.parse(sent[0]), OP_AUTH, 1700000000123)),
    frameKey: hex(await frameKey(result.sessionKey, result)),
  }
}

/**
 * Reconnexion complète à une fausse GT 6 Pro (HiChain 3 : type 4, GCM, IV aléatoire, JSON + NUL) telle que
 * pairing.js la joue : paramètres du lien, état, négociation, authentification, puis batterie chiffrée.
 * Trames enregistrées dans l'ordre ; l'aléa de la montre est rendu déterministe le temps de l'échange.
 */
async function handshakeVector() {
  const authToken = seq(0x13, 32)
  const authId = 'FEDCBA9876543210FEDCBA9876543210'
  const requestId = 1760000000001
  const random = [hex(seq(0x23, 16)), hex(seq(0x33, 32)), hex(seq(0x53, 12)), hex(seq(0x73, 16))]
  let state = 0x2545f491
  const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((arr) => {
    for (let i = 0; i < arr.length; i++) {
      state ^= state << 13
      state ^= state >>> 17
      state ^= state << 5
      arr[i] = state & 0xff
    }
    return arr
  })
  try {
    const watch = createFakeWatch({ deviceSupportType: 4, encryptMethod: 1, authVersion: 1, trailingNul: 1, battery: 64 })
    watch.tokens.set(authId, authToken)
    const steps = []
    const transport = {
      open: (onData, onClose) =>
        watch.transport.open((bytes) => {
          steps.push({ dir: 'in', hex: hex(bytes) })
          onData(bytes)
        }, onClose),
      send: (bytes) => {
        steps.push({ dir: 'out', hex: hex(bytes) })
        return watch.transport.send(bytes)
      },
      close: () => watch.transport.close(),
    }
    const rand = scripted(random)
    const session = createSession(transport, { timeoutMs: 2000 })
    await session.open()
    const lp = parseLinkParams((await session.request(1, 1, [{ tag: 1 }, { tag: 2 }, { tag: 3 }, { tag: 4 }], { plain: true })).tlvs)
    if (lp.maxFrameSize) session.setMaxFrameSize(lp.maxFrameSize)
    await session.request(1, CMD.DEVICE_STATUS, [{ tag: 1 }], { plain: true })
    await session.request(1, CMD.SECURITY_NEGOTIATION, securityNegotiationTlvs({ ...lp, authId }), { plain: true })
    const exchange = async (json, op) => parseHichainReply((await session.request(1, CMD.HICHAIN, hichainTlvs(json, op, requestId), { plain: true })).tlvs)
    const auth = await runHichain({ operation: OP_AUTH, baseKey: authToken, authId, requestId, exchange, rand })
    session.setCipher(createCipher({ key: await frameKey(auth.sessionKey, auth), gcm: true, randomIv: true, rand }))
    const battery = await session.request(1, 8, [{ tag: 1 }])
    await session.close()
    return { authToken: hex(authToken), authId, requestId, random, battery: battery.tlvs.find((t) => t.tag === 1).value[0], steps }
  } finally {
    spy.mockRestore()
  }
}

describe('vecteurs communs du client Java « synchro seule »', () => {
  it('le fichier lu par les tests Java correspond au pilote JS', async () => {
    const vectors = {
      about: 'Généré par src/devices/huawei/javaVectors.test.js — ne pas modifier à la main.',
      frames: frameVectors(),
      reassembly: reassemblyVector(),
      cipher: await cipherVectors(),
      auth: await authVector(),
      handshake: await handshakeVector(),
    }
    const text = `${JSON.stringify(vectors, null, 2)}\n`
    if (process.env.UPDATE_VECTORS) writeFileSync(FILE, text)
    expect(readFileSync(FILE, 'utf8')).toBe(text)
  })
})
