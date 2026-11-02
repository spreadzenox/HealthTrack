/**
 * Décodeur CBOR (RFC 8949) volontairement réduit, pour lire les attestations et assertions App Attest d'Apple
 * (I6-RELAIS-5). Écrit pour le relais, sans dépendance.
 *
 * Accepte : entiers positifs et négatifs (jusqu'à 2^53 - 1), chaînes d'octets, textes UTF-8, tableaux, tables
 * (rendues en `Map`, clés entières ou textes, sans doublon), false / true / null.
 * Refuse (CborError) : longueurs indéfinies, étiquettes (tags), flottants et autres valeurs simples, texte UTF-8
 * invalide, données tronquées, octets en trop, imbrication ou nombre d'éléments au-delà des bornes.
 */

export class CborError extends Error {
  constructor(reason) {
    super(`CBOR illisible : ${reason}`)
    this.name = 'CborError'
    this.reason = reason
  }
}

const DEFAULT_LIMITS = { maxDepth: 16, maxItems: 4096, maxBytes: 64 * 1024 }
const utf8 = new TextDecoder('utf-8', { fatal: true })

/**
 * Décode une valeur CBOR qui commence à `offset` et rend aussi l'indice juste après elle (utile pour `authData`, où
 * la clé COSE est suivie d'autres octets).
 * @param {Uint8Array} bytes
 * @param {number} [offset]
 * @param {{ maxDepth?: number, maxItems?: number, maxBytes?: number }} [limits]
 * @returns {{ value: unknown, end: number }}
 */
export function decodeCborPrefix(bytes, offset = 0, limits = {}) {
  if (!(bytes instanceof Uint8Array)) throw new CborError('pas des octets')
  const lim = { ...DEFAULT_LIMITS, ...limits }
  if (bytes.length - offset > lim.maxBytes) throw new CborError('trop long')
  const state = { bytes, pos: offset, items: 0, lim }
  const value = readItem(state, 0)
  return { value, end: state.pos }
}

/**
 * Décode un objet CBOR complet : tout octet après la valeur est une erreur.
 * @param {Uint8Array} bytes
 * @param {{ maxDepth?: number, maxItems?: number, maxBytes?: number }} [limits]
 */
export function decodeCbor(bytes, limits = {}) {
  const { value, end } = decodeCborPrefix(bytes, 0, limits)
  if (end !== bytes.length) throw new CborError('octets en trop')
  return value
}

function need(state, n) {
  if (state.pos + n > state.bytes.length) throw new CborError('tronqué')
}

function readArgument(state, info) {
  if (info < 24) return info
  const size = { 24: 1, 25: 2, 26: 4, 27: 8 }[info]
  if (!size) throw new CborError(info === 31 ? 'longueur indéfinie' : 'argument réservé')
  need(state, size)
  let n = 0
  for (let i = 0; i < size; i++) n = n * 256 + state.bytes[state.pos + i]
  state.pos += size
  if (!Number.isSafeInteger(n)) throw new CborError('entier trop grand')
  return n
}

function readItem(state, depth) {
  if (depth > state.lim.maxDepth) throw new CborError('imbrication trop profonde')
  if (++state.items > state.lim.maxItems) throw new CborError('trop d’éléments')
  need(state, 1)
  const head = state.bytes[state.pos++]
  const major = head >> 5
  const info = head & 0x1f
  switch (major) {
    case 0:
      return readArgument(state, info)
    case 1:
      return -1 - readArgument(state, info)
    case 2: {
      const len = readArgument(state, info)
      need(state, len)
      const out = Buffer.from(state.bytes.subarray(state.pos, state.pos + len))
      state.pos += len
      return out
    }
    case 3: {
      const len = readArgument(state, info)
      need(state, len)
      let text
      try {
        text = utf8.decode(state.bytes.subarray(state.pos, state.pos + len))
      } catch {
        throw new CborError('texte UTF-8 invalide')
      }
      state.pos += len
      return text
    }
    case 4: {
      const len = readArgument(state, info)
      if (len > state.lim.maxItems) throw new CborError('trop d’éléments')
      const out = []
      for (let i = 0; i < len; i++) out.push(readItem(state, depth + 1))
      return out
    }
    case 5: {
      const len = readArgument(state, info)
      if (len > state.lim.maxItems) throw new CborError('trop d’éléments')
      const out = new Map()
      for (let i = 0; i < len; i++) {
        const key = readItem(state, depth + 1)
        if (typeof key !== 'number' && typeof key !== 'string') throw new CborError('clé de table inattendue')
        if (out.has(key)) throw new CborError('clé en double')
        out.set(key, readItem(state, depth + 1))
      }
      return out
    }
    case 6:
      throw new CborError('étiquette non prise en charge')
    default:
      if (info === 20) return false
      if (info === 21) return true
      if (info === 22) return null
      throw new CborError('valeur simple ou flottant non pris en charge')
  }
}
