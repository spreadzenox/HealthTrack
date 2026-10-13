import { describe, it, expect } from 'vitest'
import {
  hmacSha256, hkdfSha256, sha256, aesGcmEncrypt, aesGcmDecrypt, aesCbcEncrypt, aesCbcDecrypt,
  pbkdf2Sha256, hexOf, bytesOfHex, concatBytes, utf8, bytesEqual,
  x25519ScalarMult, x25519Base, generateX25519KeyPair, x25519SharedSecret,
  ed25519Sign, ed25519Verify, ed25519PublicKey, generateEd25519KeyPair,
} from './crypto'

// Vecteurs publiés (RFC 4231, RFC 5869, NIST GCM test case 4 tronqué, RFC 7914 §11 pour PBKDF2-SHA256).
describe('crypto Huawei — vecteurs de référence', () => {
  it('SHA-256 « abc »', async () => {
    expect(hexOf(await sha256(utf8('abc')))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('HMAC-SHA256 (RFC 4231, cas 2)', async () => {
    expect(hexOf(await hmacSha256(utf8('Jefe'), utf8('what do ya want for nothing?')))).toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843')
  })

  it('HKDF-SHA256 (RFC 5869, cas 1)', async () => {
    const okm = await hkdfSha256(bytesOfHex('0b'.repeat(22)), bytesOfHex('000102030405060708090a0b0c'), bytesOfHex('f0f1f2f3f4f5f6f7f8f9'), 42)
    expect(hexOf(okm)).toBe('3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865')
  })

  it('PBKDF2-SHA256 (RFC 7914 §11, 1 itération)', async () => {
    const dk = await pbkdf2Sha256(utf8('passwd'), utf8('salt'), 1, 64)
    expect(hexOf(dk).slice(0, 32)).toBe('55ac046e56e3089fec1691c22544b605')
  })

  it('AES-128-GCM (NIST, cas 4) : chiffrement, AAD, étiquette, refus si altéré', async () => {
    const key = bytesOfHex('feffe9928665731c6d6a8f9467308308')
    const iv = bytesOfHex('cafebabefacedbaddecaf888')
    const plain = bytesOfHex('d9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b39')
    const aad = bytesOfHex('feedfacedeadbeeffeedfacedeadbeefabaddad2')
    const sealed = await aesGcmEncrypt(key, iv, plain, aad)
    expect(hexOf(sealed.slice(-16))).toBe('5bc94fbc3221a5db94fae95ae7121a47')
    expect(hexOf(sealed.slice(0, 8))).toBe('42831ec2217774244b'.slice(0, 16))
    expect(hexOf(await aesGcmDecrypt(key, iv, sealed, aad))).toBe(hexOf(plain))
    sealed[0] ^= 1
    await expect(aesGcmDecrypt(key, iv, sealed, aad)).rejects.toThrow(/refusé/)
  })

  it('AES-128-CBC + PKCS#7 : aller-retour, bourrage d’un bloc complet', async () => {
    const key = bytesOfHex('2b7e151628aed2a6abf7158809cf4f3c')
    const iv = bytesOfHex('000102030405060708090a0b0c0d0e0f')
    const plain = bytesOfHex('6bc1bee22e409f96e93d7e117393172a')
    const c = await aesCbcEncrypt(key, iv, plain)
    expect(hexOf(c.slice(0, 16))).toBe('7649abac8119b246cee98e9b12e9197d') // NIST SP 800-38A F.2.1
    expect(c.length).toBe(32)
    expect(hexOf(await aesCbcDecrypt(key, iv, c))).toBe(hexOf(plain))
  })

  it('outils : concat, hex, égalité', () => {
    expect(hexOf(concatBytes([1], new Uint8Array([2, 3])), true)).toBe('010203')
    expect(() => bytesOfHex('0g')).toThrow()
    expect(bytesEqual([1, 2], [1, 2])).toBe(true)
    expect(bytesEqual([1, 2], [1, 3])).toBe(false)
  })
})

// Primitives « New Auth Protocol » HiChain 3 (protocoles/huawei.md §6.8) : X25519 et Ed25519.
// Nécessaires au SPEKE, qui multiplie un scalaire par un point de base DÉRIVÉ (pas la base standard) :
// Web Crypto ne sait faire X25519 que sur la base standard, d'où une implémentation à multiplication libre.
describe('crypto Huawei — X25519 (RFC 7748)', () => {
  it('multiplication scalaire sur un point quelconque (RFC 7748 §5.2, cas 1 et 2)', () => {
    expect(hexOf(x25519ScalarMult(
      bytesOfHex('a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4'),
      bytesOfHex('e6db6867583030db3594c1a424b15f7c726624ec26b3353b10a903a6d0ab1c4c'),
    ))).toBe('c3da55379de9c6908e94ea4df28d084f32eccf03491c71f754b4075577a28552')
    expect(hexOf(x25519ScalarMult(
      bytesOfHex('4b66e9d4d1b4673c5ad22691957d6af5c11b6421e0ea01d42ca4169e7918ba0d'),
      bytesOfHex('e5210f12786811d3f4b7959d0538ae2c31dbe7106fc03c3efc4cd549c715a493'),
    ))).toBe('95cbde9476e8907d7aade45cb4b873f88b595a68799fa152e6f8f7647aac7957')
  })

  it('point de base standard = 9 ; clé publique = scalaire × base', () => {
    expect(hexOf(x25519Base())).toBe('0900000000000000000000000000000000000000000000000000000000000000')
    const priv = bytesOfHex('77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a')
    // Clé publique d'Alice (RFC 7748 §6.1)
    const expected = '8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a'
    expect(hexOf(x25519ScalarMult(priv, x25519Base()))).toBe(expected)
    const { privateKey, publicKey } = { privateKey: priv, publicKey: x25519ScalarMult(priv, x25519Base()) }
    expect(hexOf(publicKey)).toBe(expected)
    expect(privateKey.length).toBe(32)
  })

  it('ECDH : les deux côtés calculent le même secret (RFC 7748 §6.1)', () => {
    const a = bytesOfHex('77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a')
    const b = bytesOfHex('5dab087e624a8a4b79e17f8b83800ee66f3bb1292618b6fd1c2f8b27ff88e0eb')
    const aPub = x25519ScalarMult(a, x25519Base())
    const bPub = x25519ScalarMult(b, x25519Base())
    const shared = '4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742'
    expect(hexOf(x25519SharedSecret(a, bPub))).toBe(shared)
    expect(hexOf(x25519SharedSecret(b, aPub))).toBe(shared)
  })

  it('generateX25519KeyPair : clés de 32 octets, publique cohérente, ECDH symétrique', () => {
    const alice = generateX25519KeyPair()
    const bob = generateX25519KeyPair()
    expect(alice.privateKey.length).toBe(32)
    expect(alice.publicKey.length).toBe(32)
    expect(hexOf(alice.publicKey)).toBe(hexOf(x25519ScalarMult(alice.privateKey, x25519Base())))
    expect(hexOf(x25519SharedSecret(alice.privateKey, bob.publicKey)))
      .toBe(hexOf(x25519SharedSecret(bob.privateKey, alice.publicKey)))
  })
})

describe('crypto Huawei — Ed25519 (RFC 8032)', () => {
  it('clé publique et signature déterministes (RFC 8032 §7.1, cas 2)', () => {
    const sk = bytesOfHex('4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb')
    const msg = bytesOfHex('72')
    const expPub = '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c'
    const expSig = '92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00'
    expect(hexOf(ed25519PublicKey(sk))).toBe(expPub)
    expect(hexOf(ed25519Sign(msg, sk))).toBe(expSig)
    expect(ed25519Verify(bytesOfHex(expSig), msg, bytesOfHex(expPub))).toBe(true)
  })

  it('vérification : rejette message ou signature altérés, ne jette jamais', () => {
    const { secretKey, publicKey } = generateEd25519KeyPair()
    const msg = utf8('bonjour la montre')
    const sig = ed25519Sign(msg, secretKey)
    expect(ed25519Verify(sig, msg, publicKey)).toBe(true)
    expect(ed25519Verify(sig, utf8('bonjour la montr3'), publicKey)).toBe(false)
    const tampered = Uint8Array.from(sig)
    tampered[0] ^= 1
    expect(ed25519Verify(tampered, msg, publicKey)).toBe(false)
    // Entrée manifestement invalide : renvoie false plutôt que de jeter.
    expect(ed25519Verify(new Uint8Array(10), msg, publicKey)).toBe(false)
  })

  it('generateEd25519KeyPair : clés de 32 octets, publique cohérente', () => {
    const { secretKey, publicKey } = generateEd25519KeyPair()
    expect(secretKey.length).toBe(32)
    expect(publicKey.length).toBe(32)
    expect(hexOf(ed25519PublicKey(secretKey))).toBe(hexOf(publicKey))
  })
})
