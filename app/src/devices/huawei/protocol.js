/**
 * Protocole des montres et bracelets Huawei / Honor (« Link Protocol v2 »), réimplémenté d'après la
 * spécification écrite dans journal/protocoles/huawei.md (aucun code Gadgetbridge, AGPL).
 *
 * Trame : 0x5A | longueur (2 octets, gros-boutiste) = 1 + charge utile | drapeau de tranche | charge
 * utile | CRC-16/XMODEM des octets précédents (2 octets). Charge utile = service, commande, TLV…
 * TLV : étiquette (1 octet) | longueur en entier variable (7 bits par octet, poids forts d'abord,
 * bit 0x80 = « octet suivant ») | valeur.
 */

export const HUAWEI_SERVICE = '0000fe86-0000-1000-8000-00805f9b34fb'
export const HUAWEI_WRITE = '0000fe01-0000-1000-8000-00805f9b34fb'
export const HUAWEI_NOTIFY = '0000fe02-0000-1000-8000-00805f9b34fb'

const MAGIC = 0x5a

/** Étiquette commune « résultat » (code d'erreur sur 4 octets) et code de succès. */
export const TAG_RESULT = 0x7f
export const RESULT_SUCCESS = 100000

/** CRC-16 polynôme 0x1021, valeur initiale 0, sans réflexion (variante « XMODEM »). */
export function crc16(bytes) {
  let crc = 0
  for (const b of bytes) {
    crc ^= b << 8
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc
}

export function encodeVarInt(value) {
  if (!Number.isInteger(value) || value < 0) throw new Error('Entier variable négatif ou non entier')
  const out = [value & 0x7f]
  let v = Math.floor(value / 128)
  while (v > 0) {
    out.unshift((v & 0x7f) | 0x80)
    v = Math.floor(v / 128)
  }
  return out
}

/** @returns {{ value: number, size: number }} */
export function decodeVarInt(bytes, offset = 0) {
  let value = 0
  for (let i = offset; i < bytes.length && i - offset < 5; i++) {
    value = value * 128 + (bytes[i] & 0x7f)
    if (!(bytes[i] & 0x80)) return { value, size: i - offset + 1 }
  }
  throw new Error('Entier variable tronqué')
}

/** @param {Array<{ tag: number, value?: number[]|Uint8Array }>} tlvs */
export function encodeTlvs(tlvs) {
  const out = []
  for (const { tag, value = [] } of tlvs) out.push(tag, ...encodeVarInt(value.length), ...value)
  return out
}

/** @returns {Array<{ tag: number, value: Uint8Array }>} */
export function decodeTlvs(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes)
  const out = []
  let i = 0
  while (i < data.length) {
    const tag = data[i]
    const { value: len, size } = decodeVarInt(data, i + 1)
    const start = i + 1 + size
    if (start + len > data.length) throw new Error(`TLV ${tag} tronqué`)
    out.push({ tag, value: data.slice(start, start + len) })
    i = start + len
  }
  return out
}

/** Trame complète (non découpée) pour un service / une commande. */
export function encodeFrame(serviceId, commandId, tlvs = []) {
  const payload = [serviceId, commandId, ...encodeTlvs(tlvs)]
  if (payload.length + 1 > 0xffff) throw new Error('Charge utile trop longue')
  const len = payload.length + 1
  const head = [MAGIC, len >> 8, len & 0xff, 0x00, ...payload]
  const crc = crc16(head)
  return Uint8Array.from([...head, crc >> 8, crc & 0xff])
}

/**
 * Lit une trame reçue. Drapeau de tranche 0 = trame entière ; 1, 2, 3 = première, milieu, dernière
 * tranche d'un message découpé (un octet d'index suit alors le drapeau).
 * @returns {{ slice: number, sliceIndex: number|null, body: Uint8Array }}
 */
export function decodeFrame(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes)
  if (data.length < 6) throw new Error('Trame trop courte')
  if (data[0] !== MAGIC) throw new Error('Trame sans en-tête 0x5A')
  const len = (data[1] << 8) | data[2]
  if (data.length !== len + 5) throw new Error(`Longueur annoncée ${len}, reçue ${data.length - 5}`)
  const expected = (data[data.length - 2] << 8) | data[data.length - 1]
  if (crc16(data.subarray(0, data.length - 2)) !== expected) throw new Error('Somme de contrôle (CRC) invalide')
  const slice = data[3]
  const sliced = slice !== 0
  return { slice, sliceIndex: sliced ? data[4] : null, body: data.slice(sliced ? 5 : 4, data.length - 2) }
}

/**
 * Rassemble les notifications BLE (une trame peut arriver en plusieurs morceaux, et un message en
 * plusieurs tranches). `push(bytes)` renvoie les messages complets : { serviceId, commandId, tlvs }.
 */
export function createReassembler() {
  let buffer = []
  let slices = []
  return {
    push(chunk) {
      buffer.push(...chunk)
      const messages = []
      for (;;) {
        const start = buffer.indexOf(MAGIC)
        if (start < 0) {
          buffer = []
          break
        }
        if (start > 0) buffer = buffer.slice(start)
        if (buffer.length < 3) break
        const total = ((buffer[1] << 8) | buffer[2]) + 5
        if (buffer.length < total) break
        const frame = buffer.slice(0, total)
        buffer = buffer.slice(total)
        const { slice, body } = decodeFrame(frame)
        let payload = null
        if (slice === 0) payload = body
        else if (slice === 1) slices = [...body]
        else {
          slices.push(...body)
          if (slice === 3) {
            payload = Uint8Array.from(slices)
            slices = []
          }
        }
        if (payload && payload.length >= 2) {
          messages.push({ serviceId: payload[0], commandId: payload[1], tlvs: decodeTlvs(payload.slice(2)) })
        }
      }
      return messages
    },
  }
}

export const toHex = (bytes) => Array.from(bytes || [], (b) => b.toString(16).padStart(2, '0')).join(' ')

const uint = (bytes) => Array.from(bytes || []).reduce((n, b) => n * 256 + b, 0)

/** Code de résultat d'une réponse (étiquette 0x7F), ou null s'il n'y en a pas. */
export function resultCode(tlvs) {
  const r = tlvs.find((t) => t.tag === TAG_RESULT)
  return r ? uint(r.value) : null
}

/** Service 1 (configuration de l'appareil), commande 1 : paramètres du lien. */
export const DEVICE_CONFIG = 1
export const LINK_PARAMS = 1

/** Première trame envoyée : demande des paramètres du lien (étiquettes 1 à 4 vides). */
export function linkParamsRequest() {
  return encodeFrame(DEVICE_CONFIG, LINK_PARAMS, [{ tag: 1 }, { tag: 2 }, { tag: 3 }, { tag: 4 }])
}

/** Mode d'authentification annoncé (étiquette 7 « type de prise en charge »), voir journal/protocoles/huawei.md §4. */
export const AUTH_MODES = {
  0: { id: 'legacy', label: 'authentification classique (défi HMAC)' },
  1: { id: 'hichain', label: 'HiChain' },
  2: { id: 'hichain_lite', label: 'HiChain Lite' },
  3: { id: 'hichain', label: 'HiChain' },
  4: { id: 'hichain3', label: 'HiChain 3 (chiffrement GCM)' },
}

/**
 * Réponse aux paramètres du lien. Étiquettes : 1 version du protocole, 2 taille max de tranche,
 * 3 taille max du lien, 4 intervalle de connexion, 5 = 2 octets de version d'authentification
 * + 16 octets d'aléa de la montre, 7 type de prise en charge (→ mode d'authentification),
 * 8 algorithme de dérivation, 9 état de liaison, 0x0C méthode de chiffrement (1 = GCM).
 * Les étiquettes inconnues sont gardées brutes pour le diagnostic.
 */
export function parseLinkParams(tlvs) {
  const get = (tag) => tlvs.find((t) => t.tag === tag)?.value
  const num = (tag) => (get(tag) && get(tag).length ? uint(get(tag)) : null)
  const nonceTlv = get(5)
  const known = new Set([1, 2, 3, 4, 5, 7, 8, 9, 0x0c, TAG_RESULT])
  const deviceSupportType = num(7)
  return {
    protocolVersion: num(1),
    maxFrameSize: num(2),
    maxLinkSize: num(3),
    connectionIntervalMs: num(4),
    authVersion: nonceTlv && nonceTlv.length >= 2 ? uint(nonceTlv.slice(0, 2)) : null,
    serverNonceLength: nonceTlv ? Math.max(0, nonceTlv.length - 2) : 0,
    deviceSupportType,
    authMode: deviceSupportType === null ? AUTH_MODES[0].id : AUTH_MODES[deviceSupportType]?.id || 'unknown',
    authAlgo: num(8),
    bondState: num(9),
    encryptMethod: num(0x0c),
    result: resultCode(tlvs),
    otherTags: tlvs.filter((t) => !known.has(t.tag)).map((t) => ({ tag: t.tag, hex: toHex(t.value) })),
  }
}

/** Libellé du mode d'authentification pour l'écran. */
export function authModeLabel(lp) {
  if (!lp) return null
  if (lp.deviceSupportType === null) return AUTH_MODES[0].label
  return AUTH_MODES[lp.deviceSupportType]?.label || `mode inconnu (${lp.deviceSupportType})`
}
