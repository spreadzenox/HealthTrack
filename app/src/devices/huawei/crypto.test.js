import { describe, it, expect } from 'vitest'
import { hmacSha256, hkdfSha256, sha256, aesGcmEncrypt, aesGcmDecrypt, aesCbcEncrypt, aesCbcDecrypt, pbkdf2Sha256, hexOf, bytesOfHex, concatBytes, utf8, bytesEqual } from './crypto'

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
