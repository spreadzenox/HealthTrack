/**
 * Fausse montre Huawei HiChain pour les tests : joue le côté montre de journal/protocoles/huawei.md
 * §4–6 (paramètres du lien, état, négociation, PIN, liaison, authentification, trames chiffrées).
 * Les constantes du PIN sont des valeurs de test aléatoires, pas celles de Huawei.
 */
import { crc16, createReassembler, decodeTlvs, encodeFrames, encodeTlvs } from '../protocol'
import { aesCbcEncrypt, aesGcmDecrypt, aesGcmEncrypt, bytesEqual, bytesOfHex, concatBytes, hexOf, hmacSha256, randomBytes, utf8 } from '../crypto'
import { createCipher, digestSecretFor, frameKey, phoneToken, pinBaseKeyVariants, psk, returnCodeMac, sessionKey, WATCH_TOKEN_ORDERS } from '../hichain'

export const TEST_SECRETS = { v1: hexOf(randomBytes(16)), v2: hexOf(randomBytes(16)), v3: hexOf(randomBytes(16)) }

const up = (b) => hexOf(b, true)

/** Trame non découpée dont le corps n'est pas en TLV (bloc de fichier en clair). */
function rawFrame(serviceId, commandId, body) {
  const len = body.length + 3
  const head = [0x5a, len >> 8, len & 0xff, 0x00, serviceId, commandId, ...body]
  const crc = crc16(head)
  return Uint8Array.from([...head, crc >> 8, crc & 0xff])
}

export function createFakeWatch({
  authVersion = 2,
  encryptMethod = 1,
  deviceSupportType = 1,
  secrets = TEST_SECRETS,
  pin = utf8('123456'),
  battery = 87,
  negotiation = [{ tag: 1, value: [1] }],
  silentOn = null,
  garbleHichain = null, // { size } : 1re réponse 0x28 = étiquette 1 illisible (simule la GT 6 Pro, log 13/10)
  newAuthHichain = null, // true/{ prefix } : 1re réponse 0x28 au format « New Auth Protocol » HiChain 3 (§6.8) :
  // préfixe binaire + JSON intégré (challenge/salt/epk) → ni l'ISO ni le parseur direct ne savent la lire
  trailingNul = 0, // octets NUL ajoutés après chaque JSON 0x28 (GT 6 Pro, journal 13/10 17:03 : 804 car. + 1, §6.9)
  pinBaseVariant = 'sha256-hex-majuscule', // clé de base de la liaison calculée par la montre (§6.10)
  tokenOrder = 'reference', // ordre de concaténation du jeton de la montre (WATCH_TOKEN_ORDERS, §6.10)
  minuteBlocks = [],
  sleepBlocks = [],
  totals = null,
  unsupported = [], // services absents (« 0x17 », etc.) annoncés par 1/0x02
  expand = null, // octets des capacités étendues (1/0x37) ; null = commande absente
  workouts = [], // [{ number, body }] : body = corps TLV de la réponse 0x17/0x08
  files = {}, // nom → octets (0x2C)
  maxBlock = 64,
  pushSize = 40,
  filePlain = false,
  silentAssociation = false, // n'accepte aucun message de fin d'association (§6.12) : tout reste sans réponse
  askPhoneInfo = null, // [étiquettes] : après l'authentification, la montre demande les infos du téléphone (1/0x10)
} = {}) {
  const r = createReassembler()
  const tokens = new Map() // authId (texte) → clé longue durée
  const state = { op: null, sk: null, k: null, ids: null, cipher: null, associated: false, phoneInfo: null, agreements: null }
  const seen = []
  let push
  let close

  const reply = (serviceId, commandId, tlvs) => {
    for (const f of encodeFrames(serviceId, commandId, tlvs, 244)) setTimeout(() => push?.(f), 0)
  }
  const replyJson = (json, final = false) =>
    reply(1, 0x28, [{ tag: 1, value: [...utf8(final ? 'done' : JSON.stringify(json)), ...new Array(trailingNul).fill(0)] }, { tag: 4, value: [final ? 1 : 0] }])
  const pinBase = async () => (await pinBaseKeyVariants(pin)).find((v) => v.name === pinBaseVariant).key
  const watchToken = (k, ids) => hmacSha256(k, concatBytes(...WATCH_TOKEN_ORDERS[tokenOrder](ids)))

  async function hichain(m) {
    if (garbleHichain && !state.garbled) {
      // Réponse 0x28 avec une étiquette 1 qui n'est pas du JSON (octets 0xFF) et type 0 : reproduit
      // « Réponse HiChain illisible » vu sur la vraie GT 6 Pro (trame reçue de 835 octets).
      state.garbled = true
      return reply(1, 0x28, [{ tag: 1, value: new Array(garbleHichain.size || 64).fill(0xff) }, { tag: 4, value: [0] }])
    }
    if (newAuthHichain && !state.newAuthed) {
      // Réponse « New Auth Protocol » (HiChain 3, §6.8) : préfixe binaire (en-tête propre à la montre)
      // suivi d'un JSON intégré portant les champs SPEKE. Les valeurs sont factices.
      state.newAuthed = true
      const prefix = newAuthHichain.prefix || [0x01, 0x00, 0x00, 0x03, 0x35]
      const payload = { challenge: up(randomBytes(16)), salt: up(randomBytes(16)), epk: up(randomBytes(32)) }
      const body = Array.from(utf8(JSON.stringify({ message: 32769, payload })))
      return reply(1, 0x28, [{ tag: 1, value: [...prefix, ...body] }, { tag: 4, value: [0] }])
    }
    const json = JSON.parse(new TextDecoder().decode(m.tlvs.find((t) => t.tag === 1).value))
    const p = json.payload
    const code = json.message & 0x0f
    if (code === 1) {
      const op = p.operationCode
      const authId = new TextDecoder().decode(bytesOfHex(p.peerAuthId))
      const base = op === 1 ? await pinBase() : tokens.get(authId)
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
      if (askPhoneInfo) {
        const c = state.cipher
        setTimeout(async () => reply(1, 0x10, await c.seal(1, 0x10, askPhoneInfo.map((tag) => ({ tag })))), 0)
      }
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
    if (m.serviceId === 1 && m.commandId === 2) {
      const ids = tlvs.find((t) => t.tag === 1).value
      return sealed([{ tag: 2, value: Array.from(ids, (id) => (unsupported.includes(id) ? 0 : 1)) }])
    }
    if (m.serviceId === 1 && m.commandId === 3) {
      const body = decodeTlvs(tlvs.find((t) => t.tag === 0x81).value)
      const out = []
      for (const t of body) {
        if (t.tag === 2) out.push({ tag: 2, value: t.value })
        if (t.tag === 3) {
          const service = out[out.length - 1].value[0]
          const yes = (c) => !unsupported.includes(service) && !(service === 1 && c === 0x37 && !expand)
          out.push({ tag: 4, value: Array.from(t.value, (c) => (yes(c) ? 1 : 0)) })
        }
      }
      return sealed([{ tag: 0x81, value: encodeTlvs(out) }])
    }
    // Fin d'association (§6.12) : 1/0x3E sans réponse ; les autres accusés « succès »
    const ok = [0x7f, [0, 1, 0x86, 0xa0]]
    if (m.serviceId === 1 && m.commandId === 0x10) {
      state.phoneInfo = tlvs.map((t) => t.tag)
      return
    }
    if (m.serviceId === 1 && m.commandId === 0x3e) {
      state.associated = new TextDecoder().decode(Uint8Array.from(tlvs.find((t) => t.tag === 2)?.value || []))
      return
    }
    const assoc = { 1: [0x04, 0x07, 0x30, 0x32, 0x35, 0x3d], 7: [0x02, 0x0e, 0x17, 0x24], 0x1a: [0x05], 0x0c: [0x01] }
    if (assoc[m.serviceId]?.includes(m.commandId)) {
      if (silentAssociation) return
      if (m.serviceId === 1 && m.commandId === 0x30) state.agreements = decodeTlvs(tlvs.find((t) => t.tag === 0x81).value).length
      return sealed([{ tag: ok[0], value: ok[1] }])
    }
    if (m.serviceId === 1 && m.commandId === 0x31) return sealed([{ tag: 2, value: [0x06] }])
    if (m.serviceId === 1 && m.commandId === 0x37 && expand) return sealed([{ tag: 1, value: expand }])
    if (m.serviceId === 0x17 && m.commandId === 7) {
      const items = workouts.map((w) => ({ tag: 0x85, value: encodeTlvs([{ tag: 6, value: [w.number >> 8, w.number & 0xff] }, { tag: 7, value: [0, 1] }]) }))
      return sealed([{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: [0, workouts.length] }, ...items]) }])
    }
    if (m.serviceId === 0x17 && m.commandId === 8) {
      const v = decodeTlvs(tlvs.find((t) => t.tag === 0x81).value).find((t) => t.tag === 2).value
      const w = workouts.find((x) => x.number === v[0] * 256 + v[1])
      return w ? sealed(w.body) : sealed([{ tag: 0x7f, value: [0, 1, 0x86, 0xa1] }])
    }
    if (m.serviceId === 0x2c) return fileService(m.commandId, tlvs, sealed)
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

  const opened = new Map() // identifiant → octets
  async function fileService(cmd, tlvs, sealed) {
    const get = (tag) => tlvs.find((t) => t.tag === tag)?.value
    const u = (b) => Array.from(b || []).reduce((v, x) => v * 256 + x, 0)
    if (cmd === 1) {
      const name = new TextDecoder().decode(get(1))
      const data = files[name]
      const id = opened.size + 1
      if (data) opened.set(id, data)
      const size = data ? data.length : 0
      return sealed([{ tag: 3, value: [id] }, { tag: 4, value: [size >>> 24, (size >> 16) & 0xff, (size >> 8) & 0xff, size & 0xff] }])
    }
    if (cmd === 3) return sealed([{ tag: 1, value: get(1) }, { tag: 2, value: [5] }, { tag: 3, value: [0, pushSize] }, { tag: 4, value: [0, 0, 0, maxBlock] }, { tag: 5, value: [filePlain ? 1 : 0] }])
    if (cmd === 4) {
      const id = get(1)[0]
      const offset = u(get(2))
      const size = u(get(3))
      const data = opened.get(id)
      for (let at = offset; at < offset + size; at += pushSize) {
        const chunk = Array.from(data.slice(at, Math.min(at + pushSize, offset + size)))
        const raw = [id, at >>> 24, (at >> 16) & 0xff, (at >> 8) & 0xff, at & 0xff, 0, ...chunk]
        // bloc brut, chiffré dans l'enveloppe habituelle (7C 01 01 …) sauf « sans chiffrement »
        if (filePlain) {
          const frame = rawFrame(0x2c, 5, raw)
          setTimeout(() => push?.(frame), 0)
        } else reply(0x2c, 5, await state.cipher.sealBytes(0x2c, 5, Uint8Array.from(raw)))
      }
      return
    }
    if (cmd === 6) {
      opened.delete(get(1)?.[0])
      return
    }
  }

  let queue = Promise.resolve()
  return {
    seen,
    tokens,
    state,
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
