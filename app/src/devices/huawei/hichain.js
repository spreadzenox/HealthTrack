/**
 * Authentification HiChain des montres Huawei GT 3 → GT 7 (chantier D3, étape c), écrite à partir de
 * journal/protocoles/huawei.md §6 (aucun code Gadgetbridge). Fonctions pures : messages, calculs,
 * chiffrement des trames. Le déroulé avec la montre est dans pairing.js.
 */
import {
  aesCbcDecrypt,
  aesCbcEncrypt,
  aesGcmDecrypt,
  aesGcmEncrypt,
  bytesEqual,
  bytesOfHex,
  concatBytes,
  hexOf,
  hkdfSha256,
  hmacSha256,
  randomBytes,
  sha256,
  utf8,
} from './crypto'
import { decodeTlvs, encodeTlvs, resultCode, TAG_RESULT } from './protocol'

export const CMD = { DEVICE_STATUS: 0x16, SECURITY_NEGOTIATION: 0x33, PIN_CODE: 0x2c, HICHAIN: 0x28 }
export const OP_BIND = 1
export const OP_AUTH = 2

/** Messages de chaque opération (§6.2) : début, jeton, échange (liaison seulement), confirmation. */
export const MESSAGES = {
  [OP_BIND]: { start: 0x0001, token: 0x0002, exchange: 0x0003, confirm: 0x0004 },
  [OP_AUTH]: { start: 0x0011, token: 0x0012, confirm: 0x0013 },
}

const GROUP_NAME = 'health_group_name'
const APP_ID = 'com.huawei.health'
const VERSION = { minVersion: '1.0.0', currentVersion: '2.0.16' }
const HICHAIN_TYPE = 100000

const upperHex = (bytes) => hexOf(bytes, true)

/** Identifiant du groupe pair à pair : SHA-256 de « nom|app » en hexadécimal majuscule (§6.2). */
export async function groupId() {
  return upperHex(await sha256(utf8(`${GROUP_NAME}|${APP_ID}`)))
}

/** Identifiant du téléphone pour une montre : 32 caractères hexadécimaux majuscules, tiré une fois (§6.4). */
export const newAuthId = (rand = randomBytes) => upperHex(rand(16))

/** Mode demandé à la négociation d'après le type de prise en charge (§6.1). */
export const negotiationMode = (deviceSupportType) => (deviceSupportType === 4 ? 4 : 2)

export function securityNegotiationTlvs({ deviceSupportType, encryptMethod, authId, model = 'Android' }) {
  const mode = negotiationMode(deviceSupportType)
  const tlvs = [
    { tag: 1, value: [mode] },
    { tag: 2, value: [1] },
    { tag: 5, value: Array.from(utf8(authId)) },
    { tag: 3, value: [1] },
    { tag: 4, value: [0] },
  ]
  if (mode === 4) tlvs.push({ tag: 6 }, { tag: 7, value: Array.from(utf8(model)) })
  if (encryptMethod === 1) tlvs.push({ tag: 0x0d, value: [1] })
  return tlvs
}

const uint = (bytes) => Array.from(bytes || []).reduce((n, b) => n * 256 + b, 0)

/** Réponse 1/0x33 → { authType, scheme: 'hichain' | 'hichain_lite' | 'unknown', error } */
export function parseSecurityNegotiation(tlvs) {
  const get = (tag) => tlvs.find((t) => t.tag === tag)?.value
  const first = get(1)?.length ? uint(get(1)) : null
  let authType = first === 1 ? HICHAIN_TYPE : null
  if (get(2)?.length) authType = uint(get(2)) ^ (first === 4 ? 4 : 0)
  const error = get(TAG_RESULT) ? resultCode(tlvs) : null
  if (error !== null && error !== HICHAIN_TYPE) authType = error
  let scheme = 'unknown'
  if (authType === HICHAIN_TYPE || (authType ^ 1) === 4 || (authType ^ 2) === 4) scheme = 'hichain'
  else if (authType === 1 || authType === 2) scheme = 'hichain_lite'
  return { authType, scheme }
}

/** Constante du PIN selon la version d'authentification (§6.3) : v1 pour 1 et 4, v2 pour 2, v3 pour 3 et plus. */
export function digestSecretFor(authVersion, secrets) {
  const v = authVersion === 1 || authVersion === 4 ? 'v1' : authVersion === 2 ? 'v2' : 'v3'
  const hex = secrets?.[v]
  if (!hex) throw new Error(`Constante ${v} absente : importez les paramètres Huawei`)
  return bytesOfHex(hex)
}

/** Réponse 1/0x2C → octets du PIN (§6.3). */
export async function decryptPin(tlvs, { authVersion, encryptMethod, secrets }) {
  const get = (tag) => tlvs.find((t) => t.tag === tag)?.value
  const sealed = get(1)
  const iv = get(2)
  if (!sealed?.length || !iv?.length) throw new Error(`La montre n'a pas donné de PIN (code ${resultCode(tlvs) ?? '?'})`)
  const key = digestSecretFor(authVersion, secrets)
  return encryptMethod === 1 ? aesGcmDecrypt(key, iv, sealed) : aesCbcDecrypt(key, iv, sealed)
}

/** Clé de base : liaison = SHA-256 du PIN en hexadécimal majuscule ; authentification = clé longue durée. */
export const pinBaseKey = (pinBytes) => sha256(utf8(upperHex(pinBytes)))

export const psk = (baseKey, seed) => hmacSha256(baseKey, seed)
export const watchToken = (k, { randSelf, randPeer, idSelf, idPeer }) => hmacSha256(k, concatBytes(randPeer, randSelf, idSelf, idPeer))
export const phoneToken = (k, { randSelf, randPeer, idSelf, idPeer }) => hmacSha256(k, concatBytes(randSelf, randPeer, idPeer, idSelf))
export const returnCodeMac = (k) => hmacSha256(k, new Uint8Array(4))
export const sessionKey = (k, { randSelf, randPeer }) => hkdfSha256(k, concatBytes(randSelf, randPeer), utf8('hichain_iso_session_key'), 32)
export const frameKey = (sk, { randSelf, randPeer }) => hkdfSha256(sk, concatBytes(randSelf, randPeer), utf8('hichain_return_key'), 32)

/** Message 1/0x28 du téléphone : JSON (étiquette 1), opération (2), identifiant de requête (3). */
export function hichainTlvs(json, operation, requestId) {
  const id = []
  let n = BigInt(requestId)
  for (let i = 0; i < 8; i++) {
    id.unshift(Number(n & 0xffn))
    n >>= 8n
  }
  return [
    { tag: 1, value: Array.from(utf8(JSON.stringify(json))) },
    { tag: 2, value: [operation] },
    { tag: 3, value: id },
  ]
}

/** Réponse 1/0x28 de la montre → { final, payload, message } ; lève une erreur si `errorCode` ≠ 0. */
export function parseHichainReply(tlvs) {
  const get = (tag) => tlvs.find((t) => t.tag === tag)?.value
  const type = get(4)?.length ? uint(get(4)) : 0
  const text = get(1) ? new TextDecoder().decode(get(1)) : ''
  if (type !== 0) return { final: true, payload: null, message: null, text }
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Réponse HiChain illisible (code ${resultCode(tlvs) ?? '?'})`)
  }
  const payload = json?.payload && typeof json.payload === 'object' ? json.payload : json
  const err = Number(payload?.errorCode ?? json?.errorCode ?? 0)
  if (err) {
    const e = new Error(`La montre a refusé l'étape HiChain (erreur ${err})`)
    e.code = 'watch_error'
    throw e
  }
  return { final: false, payload, message: json?.message ?? null }
}

const hexField = (payload, field, length) => {
  const v = payload?.[field]
  if (typeof v !== 'string') throw new Error(`Champ « ${field} » absent de la réponse de la montre`)
  const bytes = bytesOfHex(v)
  if (length && bytes.length !== length) throw new Error(`Champ « ${field} » : ${bytes.length} octets au lieu de ${length}`)
  return bytes
}

/**
 * Une opération HiChain (liaison ou authentification) côté téléphone. `exchange(json, op)` envoie
 * un message 1/0x28 et rend la réponse décodée (parseHichainReply).
 * @returns {{ authToken?: Uint8Array, sessionKey: Uint8Array, randSelf: Uint8Array, randPeer: Uint8Array }}
 */
export async function runHichain({ operation, baseKey, authId, requestId, exchange, rand = randomBytes }) {
  const codes = MESSAGES[operation]
  const bind = operation === OP_BIND
  const gid = await groupId()
  const idSelf = utf8(authId)
  const envelope = (message, payload, extra = {}) => ({
    authForm: 0,
    groupAndModuleVersion: '2.0.1',
    message,
    payload: { ...payload, version: VERSION },
    ...extra,
    ...(bind
      ? {
          requestId: String(requestId),
          groupId: gid,
          groupName: GROUP_NAME,
          groupOp: 2,
          groupType: 256,
          peerDeviceId: authId,
          connDeviceId: authId,
          appId: APP_ID,
          ownerName: '',
        }
      : {}),
  })
  const authOnly = bind ? {} : { isDeviceLevel: false }

  // 1. Début : aléas, graine
  const randSelf = rand(16)
  const seed = rand(32)
  const start = await exchange(
    envelope(
      codes.start,
      {
        isoSalt: upperHex(randSelf),
        peerAuthId: upperHex(idSelf),
        operationCode: operation,
        seed: upperHex(seed),
        peerUserType: 0,
        ...(bind ? {} : { pkgName: 'com.huawei.devicegroupmanage', serviceType: gid, keyLength: 32 }),
      },
      authOnly,
    ),
    operation,
  )
  if (start.final) throw new Error("La montre a clos l'échange HiChain dès le début")
  const randPeer = hexField(start.payload, 'isoSalt', 16)
  const idPeer = hexField(start.payload, 'peerAuthId')
  const ids = { randSelf, randPeer, idSelf, idPeer }
  const k = await psk(baseKey, seed)
  if (!bytesEqual(await watchToken(k, ids), hexField(start.payload, 'token', 32))) {
    const e = new Error(bind ? 'PIN refusé par la montre (jeton différent)' : 'Clé refusée par la montre (jeton différent)')
    e.code = 'token_mismatch'
    throw e
  }

  // 2. Jeton du téléphone
  const tokenReply = await exchange(envelope(codes.token, { peerAuthId: upperHex(idSelf), token: upperHex(await phoneToken(k, ids)) }, authOnly), operation)
  if (tokenReply.final || !bytesEqual(await returnCodeMac(k), hexField(tokenReply.payload, 'returnCodeMac', 32))) {
    throw new Error('Code de retour de la montre invalide')
  }
  const sk = await sessionKey(k, ids)

  // 3. Liaison : la montre remet la clé longue durée
  let authToken
  if (bind) {
    const challenge = rand(16)
    const nonce = rand(12)
    const encData = await aesGcmEncrypt(sk, nonce, challenge, utf8('hichain_iso_exchange'))
    const ex = await exchange(envelope(codes.exchange, { nonce: upperHex(nonce), encData: upperHex(encData) }), operation)
    if (ex.final) throw new Error("La montre n'a pas remis de clé")
    authToken = await aesGcmDecrypt(sk, hexField(ex.payload, 'nonce', 12), hexField(ex.payload, 'encAuthToken', 48), challenge)
  }

  // 4. Confirmation
  const nonce = rand(12)
  const encResult = await aesGcmEncrypt(sk, nonce, new Uint8Array(4), utf8('hichain_iso_result'))
  await exchange(envelope(codes.confirm, { nonce: upperHex(nonce), encResult: upperHex(encResult), operationCode: operation }), operation)
  return { authToken, sessionKey: sk, randSelf, randPeer }
}

/**
 * Chiffrement des trames après l'authentification (§6.5). `gcm` : méthode 1 ou type 4 ;
 * `randomIv` : type 4 (IV entièrement aléatoire) ; sinon 12 aléatoires + compteur gros-boutiste.
 */
export function createCipher({ key, gcm, randomIv = false, counter = 0, rand = randomBytes }) {
  let n = counter
  const nextIv = () => {
    if (randomIv) return rand(16)
    n = n >= 0xffffffff ? 1 : n + 1
    return concatBytes(rand(12), [n >>> 24, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff])
  }
  return {
    async seal(serviceId, commandId, tlvs) {
      const iv = nextIv()
      const plain = Uint8Array.from(encodeTlvs(tlvs))
      const cipher = gcm ? await aesGcmEncrypt(key, iv, plain) : await aesCbcEncrypt(key, iv, plain)
      return [
        { tag: 0x7c, value: [1] },
        { tag: 0x7d, value: Array.from(iv) },
        { tag: 0x7e, value: Array.from(cipher) },
      ]
    },
    async open(serviceId, commandId, tlvs) {
      const iv = tlvs.find((t) => t.tag === 0x7d)?.value
      const data = tlvs.find((t) => t.tag === 0x7e)?.value
      if (!iv || !data) throw new Error('Trame chiffrée incomplète')
      return decodeTlvs(gcm ? await aesGcmDecrypt(key, iv, data) : await aesCbcDecrypt(key, iv, data))
    },
  }
}

/**
 * Constantes « digest secret » v1–v3 lues dans le fichier `huawei/protocol.py` de huawei-lpv2 (MIT)
 * ou dans un texte collé (« v1: 00 11 … » ou le bloc DIGEST_SECRETS tel quel). Jamais dans le dépôt.
 * @returns {{ v1: string, v2: string, v3: string }|null}
 */
export function parseDigestSecrets(text) {
  const s = String(text || '')
  const out = {}
  const re = /(?:V|v)([123])\b[^0-9a-fA-F]{0,8}["']?((?:[0-9a-fA-F]{2}[\s:]?){16})/g
  let m
  while ((m = re.exec(s))) {
    const hex = m[2].replace(/[^0-9a-f]/gi, '').toLowerCase()
    if (hex.length === 32 && !out[`v${m[1]}`]) out[`v${m[1]}`] = hex
  }
  return out.v1 && out.v2 && out.v3 ? out : null
}
