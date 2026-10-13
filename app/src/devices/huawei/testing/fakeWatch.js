/**
 * Fausse montre Huawei HiChain pour les tests : joue le côté montre de journal/protocoles/huawei.md
 * §4–6 (paramètres du lien, état, négociation, PIN, liaison, authentification, trames chiffrées).
 * Les constantes du PIN sont des valeurs de test aléatoires, pas celles de Huawei.
 */
import { createReassembler, decodeTlvs, encodeFrames } from '../protocol'
import { aesCbcEncrypt, aesGcmDecrypt, aesGcmEncrypt, bytesEqual, bytesOfHex, hexOf, randomBytes, utf8 } from '../crypto'
import { createCipher, digestSecretFor, frameKey, phoneToken, pinBaseKey, psk, returnCodeMac, sessionKey, watchToken } from '../hichain'

export const TEST_SECRETS = { v1: hexOf(randomBytes(16)), v2: hexOf(randomBytes(16)), v3: hexOf(randomBytes(16)) }

const up = (b) => hexOf(b, true)

export function createFakeWatch({
  authVersion = 2,
  encryptMethod = 1,
  deviceSupportType = 1,
  secrets = TEST_SECRETS,
  pin = utf8('123456'),
  battery = 87,
  negotiation = [{ tag: 1, value: [1] }],
  silentOn = null,
  minuteBlocks = [],
  sleepBlocks = [],
  totals = null,
} = {}) {
  const r = createReassembler()
  const tokens = new Map() // authId (texte) → clé longue durée
  const state = { op: null, sk: null, k: null, ids: null, cipher: null }
  const seen = []
  let push
  let close

  const reply = (serviceId, commandId, tlvs) => {
    for (const f of encodeFrames(serviceId, commandId, tlvs, 244)) setTimeout(() => push?.(f), 0)
  }
  const replyJson = (json, final = false) => reply(1, 0x28, [{ tag: 1, value: Array.from(utf8(final ? 'done' : JSON.stringify(json))) }, { tag: 4, value: [final ? 1 : 0] }])

  async function hichain(m) {
    const json = JSON.parse(new TextDecoder().decode(m.tlvs.find((t) => t.tag === 1).value))
    const p = json.payload
    const code = json.message & 0x0f
    if (code === 1) {
      const op = p.operationCode
      const authId = new TextDecoder().decode(bytesOfHex(p.peerAuthId))
      const base = op === 1 ? await pinBaseKey(pin) : tokens.get(authId)
      if (!base) return replyJson({ payload: { errorCode: 2001 } })
      const randSelf = bytesOfHex(p.isoSalt)
      const randPeer = randomBytes(16)
      state.ids = { randSelf, randPeer, idSelf: bytesOfHex(p.peerAuthId), idPeer: utf8('FAKE-WATCH-UDID') }
      state.k = await psk(base, bytesOfHex(p.seed))
      state.op = op
      state.authId = authId
      return replyJson({ message: 0x8000 | json.message, payload: { isoSalt: up(randPeer), peerAuthId: up(state.ids.idPeer), peerUserType: 1, token: up(await watchToken(state.k, state.ids)) } })
    }
    if (code === 2) {
      if (!bytesEqual(bytesOfHex(p.token), await phoneToken(state.k, state.ids))) return replyJson({ payload: { errorCode: 2002 } })
      state.sk = await sessionKey(state.k, state.ids)
      return replyJson({ message: 0x8000 | json.message, payload: { returnCodeMac: up(await returnCodeMac(state.k)) } })
    }
    if (json.message === 0x0003) {
      const challenge = await aesGcmDecrypt(state.sk, bytesOfHex(p.nonce), bytesOfHex(p.encData), utf8('hichain_iso_exchange'))
      const token = randomBytes(32)
      tokens.set(state.authId, token)
      const nonce = randomBytes(12)
      return replyJson({ message: 0x8003, payload: { nonce: up(nonce), encAuthToken: up(await aesGcmEncrypt(state.sk, nonce, token, challenge)) } })
    }
    // confirmation
    const result = await aesGcmDecrypt(state.sk, bytesOfHex(p.nonce), bytesOfHex(p.encResult), utf8('hichain_iso_result'))
    if (!bytesEqual(result, new Uint8Array(4))) return replyJson({ payload: { errorCode: 2004 } })
    if (state.op === 2) {
      const key = await frameKey(state.sk, state.ids)
      state.cipher = createCipher({ key, gcm: encryptMethod === 1 || deviceSupportType === 4, randomIv: deviceSupportType === 4 })
    }
    return replyJson(null, true)
  }

  async function handle(m) {
    seen.push(`${m.serviceId}/${m.commandId}${m.tlvs.some((t) => t.tag === 0x7c) ? '*' : ''}`)
    if (silentOn === m.commandId) return
    let tlvs = m.tlvs
    if (tlvs.some((t) => t.tag === 0x7c)) tlvs = await state.cipher.open(m.serviceId, m.commandId, tlvs)
    if (m.serviceId === 1 && m.commandId === 1) {
      return reply(1, 1, [
        { tag: 1, value: [2] },
        { tag: 2, value: [0, 244] },
        { tag: 5, value: [0, authVersion, ...randomBytes(16)] },
        { tag: 7, value: [deviceSupportType] },
        { tag: 0x0c, value: [encryptMethod] },
      ])
    }
    if (m.serviceId === 1 && m.commandId === 0x16) return reply(1, 0x16, [{ tag: 1, value: [1] }])
    if (m.serviceId === 1 && m.commandId === 0x33) return reply(1, 0x33, negotiation)
    if (m.serviceId === 1 && m.commandId === 0x2c) {
      const key = digestSecretFor(authVersion, secrets)
      const iv = randomBytes(encryptMethod === 1 ? 12 : 16)
      const sealed = encryptMethod === 1 ? await aesGcmEncrypt(key, iv, pin) : await aesCbcEncrypt(key, iv, pin)
      return reply(1, 0x2c, [{ tag: 1, value: Array.from(sealed) }, { tag: 2, value: Array.from(iv) }])
    }
    if (m.serviceId === 1 && m.commandId === 0x28) return hichain({ ...m, tlvs })
    if (m.serviceId === 1 && m.commandId === 8) return reply(1, 8, await state.cipher.seal(1, 8, [{ tag: 1, value: [battery] }]))
    // Données santé (§7), toujours chiffrées : blocs fournis tels quels (corps TLV d'une réponse)
    const sealed = async (tlv) => reply(m.serviceId, m.commandId, await state.cipher.seal(m.serviceId, m.commandId, tlv))
    if (m.serviceId === 1 && m.commandId === 5) return sealed([{ tag: 1, value: tlvs.find((t) => t.tag === 1)?.value || [] }])
    if (m.serviceId === 7) {
      const index = () => {
        const inner = decodeTlvs(tlvs.find((t) => t.tag === 0x81).value)
        const v = inner.find((t) => t.tag === 2).value
        return v[0] * 256 + v[1]
      }
      if (m.commandId === 0x0a || m.commandId === 0x0c) {
        const n = (m.commandId === 0x0a ? minuteBlocks : sleepBlocks).length
        return sealed([{ tag: 0x81, value: [2, 2, n >> 8, n & 0xff] }])
      }
      if (m.commandId === 0x0b) return sealed(minuteBlocks[index()])
      if (m.commandId === 0x0d) return sealed(sleepBlocks[index()])
      if (m.commandId === 0x03 && totals) return sealed(totals)
    }
  }

  let queue = Promise.resolve()
  return {
    seen,
    tokens,
    /** La montre « oublie » ses clés (réinitialisation, ou liaison par une autre app). */
    reset: () => tokens.clear(),
    transport: {
      label: 'faux transport',
      async open(onData, onClose) {
        push = onData
        close = onClose
      },
      async send(bytes) {
        for (const m of r.push(bytes)) queue = queue.then(() => handle(m))
      },
      async close() {
        push = null
      },
    },
    cut: () => close?.(),
  }
}
