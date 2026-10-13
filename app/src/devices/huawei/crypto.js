/**
 * Primitives cryptographiques du pilote Huawei (chantier D3, étape c), sur Web Crypto
 * (disponible dans la WebView Android en contexte sécurisé et dans Node pour les tests).
 * Tout est en Uint8Array ; aucune clé ne quitte le téléphone.
 */

import { x25519, ed25519 } from '@noble/curves/ed25519.js'

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

/**
 * Courbes Curve25519 pour le « New Auth Protocol » HiChain 3 (protocoles/huawei.md §6.8).
 * Sur @noble/curves (MIT, audité) plutôt que Web Crypto : le SPEKE multiplie un scalaire par un
 * point de base DÉRIVÉ du mot de passe, or `crypto.subtle` ne sait faire X25519 que sur la base
 * standard. @noble/curves marche aussi à l'identique quelle que soit la version de la WebView.
 * Tout reste en Uint8Array de 32 octets ; aucune clé ne quitte le téléphone.
 */

/** Point de base standard de X25519 (u = 9, RFC 7748). */
export const x25519Base = () => Uint8Array.from(x25519.GuBytes)

/**
 * Multiplication scalaire X25519 (RFC 7748) : `scalar` × point `u` (coordonnée de Montgomery).
 * Le scalaire est bridé (« clamp ») par la bibliothèque comme l'exige X25519. Sert à la fois à
 * l'ECDH standard (`u` = base ou clé publique du pair) et au SPEKE (`u` = base dérivée du PIN).
 */
export function x25519ScalarMult(scalar, u) {
  return x25519.scalarMult(u8(scalar), u8(u))
}

/** Secret partagé ECDH X25519 = scalaire privé × clé publique du pair (32 octets). */
export function x25519SharedSecret(privateKey, peerPublicKey) {
  return x25519.getSharedSecret(u8(privateKey), u8(peerPublicKey))
}

/** Paire de clés X25519 éphémère : { privateKey, publicKey } (32 octets chacune). */
export function generateX25519KeyPair() {
  const { secretKey, publicKey } = x25519.keygen()
  return { privateKey: Uint8Array.from(secretKey), publicKey: Uint8Array.from(publicKey) }
}

/** Clé publique Ed25519 à partir de la clé secrète de 32 octets (RFC 8032). */
export function ed25519PublicKey(secretKey) {
  return ed25519.getPublicKey(u8(secretKey))
}

/** Signature Ed25519 (64 octets) du message par la clé secrète de 32 octets. */
export function ed25519Sign(message, secretKey) {
  return ed25519.sign(u8(message), u8(secretKey))
}

/** Vérifie une signature Ed25519. Renvoie false (ne jette jamais) sur entrée invalide. */
export function ed25519Verify(signature, message, publicKey) {
  try {
    return ed25519.verify(u8(signature), u8(message), u8(publicKey))
  } catch {
    return false
  }
}

/** Paire de clés Ed25519 : { secretKey, publicKey } (32 octets chacune). */
export function generateEd25519KeyPair() {
  const { secretKey, publicKey } = ed25519.keygen()
  return { secretKey: Uint8Array.from(secretKey), publicKey: Uint8Array.from(publicKey) }
}
