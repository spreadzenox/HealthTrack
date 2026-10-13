/**
 * Primitives cryptographiques du pilote Huawei (chantier D3, étape c), sur Web Crypto
 * (disponible dans la WebView Android en contexte sécurisé et dans Node pour les tests).
 * Tout est en Uint8Array ; aucune clé ne quitte le téléphone.
 */

const subtle = () => {
  const s = globalThis.crypto?.subtle
  if (!s) throw new Error('Web Crypto indisponible')
  return s
}

const u8 = (v) => (v instanceof Uint8Array ? v : Uint8Array.from(v || []))

export function concatBytes(...parts) {
  const arrays = parts.map(u8)
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0))
  let i = 0
  for (const a of arrays) {
    out.set(a, i)
    i += a.length
  }
  return out
}

export const utf8 = (s) => new TextEncoder().encode(String(s))

/** Octets → hexadécimal compact (minuscules par défaut). */
export const hexOf = (bytes, upper = false) => {
  const s = Array.from(u8(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
  return upper ? s.toUpperCase() : s
}

/** Hexadécimal (espaces tolérés) → octets. */
export function bytesOfHex(hex) {
  const clean = String(hex || '').replace(/\s+/g, '')
  if (clean.length % 2 || /[^0-9a-f]/i.test(clean)) throw new Error('Hexadécimal invalide')
  return Uint8Array.from(clean.match(/../g) || [], (b) => parseInt(b, 16))
}

export function randomBytes(n) {
  return globalThis.crypto.getRandomValues(new Uint8Array(n))
}

export function bytesEqual(a, b) {
  const x = u8(a)
  const y = u8(b)
  if (x.length !== y.length) return false
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

export async function sha256(data) {
  return new Uint8Array(await subtle().digest('SHA-256', u8(data)))
}

export async function hmacSha256(key, data) {
  const k = await subtle().importKey('raw', u8(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await subtle().sign('HMAC', k, u8(data)))
}

/** HKDF-SHA256 (RFC 5869). */
export async function hkdfSha256(ikm, salt, info, length) {
  const k = await subtle().importKey('raw', u8(ikm), 'HKDF', false, ['deriveBits'])
  const bits = await subtle().deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: u8(salt), info: u8(info) }, k, length * 8)
  return new Uint8Array(bits)
}

export async function pbkdf2Sha256(password, salt, iterations, length) {
  const k = await subtle().importKey('raw', u8(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: u8(salt), iterations }, k, length * 8)
  return new Uint8Array(bits)
}

const aesKey = (key, name, usage) => subtle().importKey('raw', u8(key), { name }, false, [usage])

/** AES-GCM, étiquette d'authentification de 16 octets collée à la fin du texte chiffré. */
export async function aesGcmEncrypt(key, iv, plain, aad) {
  const params = { name: 'AES-GCM', iv: u8(iv), tagLength: 128, ...(aad ? { additionalData: u8(aad) } : {}) }
  return new Uint8Array(await subtle().encrypt(params, await aesKey(key, 'AES-GCM', 'encrypt'), u8(plain)))
}

export async function aesGcmDecrypt(key, iv, sealed, aad) {
  const params = { name: 'AES-GCM', iv: u8(iv), tagLength: 128, ...(aad ? { additionalData: u8(aad) } : {}) }
  try {
    return new Uint8Array(await subtle().decrypt(params, await aesKey(key, 'AES-GCM', 'decrypt'), u8(sealed)))
  } catch {
    throw new Error('Déchiffrement AES-GCM refusé (clé ou données invalides)')
  }
}

/** AES-CBC avec bourrage PKCS#7 (celui de Web Crypto). */
export async function aesCbcEncrypt(key, iv, plain) {
  return new Uint8Array(await subtle().encrypt({ name: 'AES-CBC', iv: u8(iv) }, await aesKey(key, 'AES-CBC', 'encrypt'), u8(plain)))
}

export async function aesCbcDecrypt(key, iv, cipher) {
  try {
    return new Uint8Array(await subtle().decrypt({ name: 'AES-CBC', iv: u8(iv) }, await aesKey(key, 'AES-CBC', 'decrypt'), u8(cipher)))
  } catch {
    throw new Error('Déchiffrement AES-CBC refusé (clé ou données invalides)')
  }
}
