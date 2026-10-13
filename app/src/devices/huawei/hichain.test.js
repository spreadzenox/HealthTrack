import { describe, it, expect } from 'vitest'
import { groupId, newAuthId, securityNegotiationTlvs, parseSecurityNegotiation, parseHichainReply, inspectHichainReply, hichainTlvs, parseDigestSecrets, digestSecretFor, createCipher, pinBaseKey } from './hichain'
import { sha256, utf8, hexOf, randomBytes } from './crypto'
import { toHex } from './protocol'

describe('HiChain — messages et calculs (§6)', () => {
  it('groupId = SHA-256 de « health_group_name|com.huawei.health », hexadécimal majuscule', async () => {
    const g = await groupId()
    expect(g).toMatch(/^[0-9A-F]{64}$/)
    expect(g).toBe(hexOf(await sha256(utf8('health_group_name|com.huawei.health')), true))
  })

  it('identifiant du téléphone : 32 caractères hexadécimaux majuscules', () => {
    expect(newAuthId(() => new Uint8Array(16).fill(0xab))).toBe('AB'.repeat(16))
  })

  it('négociation : étiquettes dans l’ordre, mode 4 avec modèle, 0x0D si GCM', () => {
    const t = securityNegotiationTlvs({ deviceSupportType: 1, encryptMethod: 1, authId: 'A'.repeat(32) })
    expect(t.map((x) => x.tag)).toEqual([1, 2, 5, 3, 4, 0x0d])
    expect(t[0].value).toEqual([2])
    const t4 = securityNegotiationTlvs({ deviceSupportType: 4, encryptMethod: 0, authId: 'A'.repeat(32), model: 'SM-A566B' })
    expect(t4.map((x) => x.tag)).toEqual([1, 2, 5, 3, 4, 6, 7])
    expect(t4[0].value).toEqual([4])
  })

  it('réponse de négociation → HiChain / HiChain Lite', () => {
    expect(parseSecurityNegotiation([{ tag: 1, value: [1] }]).scheme).toBe('hichain')
    expect(parseSecurityNegotiation([{ tag: 1, value: [4] }, { tag: 2, value: [1] }]).scheme).toBe('hichain') // 1 xor 4 = 5, et 5 xor 1 = 4 (HiChain 3)
    expect(parseSecurityNegotiation([{ tag: 2, value: [2] }]).scheme).toBe('hichain_lite')
    expect(parseSecurityNegotiation([{ tag: 0x7f, value: [0, 1, 0x86, 0xa1] }]).scheme).toBe('unknown')
  })

  it('message 1/0x28 : JSON, opération, identifiant de requête sur 8 octets gros-boutistes', () => {
    const t = hichainTlvs({ a: 1 }, 2, 0x0102030405)
    expect(t[1].value).toEqual([2])
    expect(toHex(t[2].value)).toBe('00 00 00 01 02 03 04 05')
    expect(new TextDecoder().decode(Uint8Array.from(t[0].value))).toBe('{"a":1}')
  })

  it('réponse de la montre : JSON, message final, erreur', () => {
    const json = (o) => [{ tag: 1, value: utf8(JSON.stringify(o)) }, { tag: 4, value: Uint8Array.of(0) }]
    expect(parseHichainReply(json({ message: 0x8001, payload: { isoSalt: 'AA' } })).payload.isoSalt).toBe('AA')
    expect(parseHichainReply([{ tag: 1, value: utf8('fin') }, { tag: 4, value: Uint8Array.of(1) }]).final).toBe(true)
    expect(() => parseHichainReply(json({ payload: { errorCode: 12 } }))).toThrow(/erreur 12/)
  })

  describe('inspectHichainReply — analyse sûre d’une réponse 0x28 (§6.2)', () => {
    const jsonReply = (o) => [{ tag: 1, value: utf8(JSON.stringify(o)) }, { tag: 4, value: Uint8Array.of(0) }]

    it('réponse ISO normale : classe json_ok, message, noms des champs mais jamais les valeurs', () => {
      const i = inspectHichainReply(jsonReply({ message: 0x8001, payload: { isoSalt: 'DEADBEEF', peerAuthId: 'CAFE', token: 'F00D' } }))
      expect(i.classification).toBe('json_ok')
      expect(i.messageHex).toBe('0x8001')
      expect(i.payloadKeys).toEqual(['isoSalt', 'peerAuthId', 'token'])
      // structure seulement : aucune valeur sensible ne doit fuir
      const dump = JSON.stringify(i)
      expect(dump).not.toContain('DEADBEEF')
      expect(dump).not.toContain('CAFE')
      expect(dump).not.toContain('F00D')
    })

    it('étiquette 1 présente mais pas du JSON → json_unparsable, avec sa taille et ses premiers octets (cas GT 6 Pro)', () => {
      const blob = new Array(835).fill(0xff)
      const i = inspectHichainReply([{ tag: 1, value: blob }, { tag: 4, value: [0] }])
      expect(i.classification).toBe('json_unparsable')
      expect(i.jsonLength).toBe(835)
      expect(i.isJson).toBe(false)
      expect(i.head).toMatch(/^ff ff/)
      expect(() => parseHichainReply([{ tag: 1, value: blob }, { tag: 4, value: [0] }])).toThrow(/illisible.*835 octets/)
    })

    it('sans étiquette 1 → no_payload ; avec un code de résultat d’erreur → result_error ; message final → final', () => {
      const noPayload = inspectHichainReply([{ tag: 4, value: [0] }])
      expect(noPayload.classification).toBe('no_payload')
      expect(() => parseHichainReply([{ tag: 4, value: [0] }])).toThrow(/sans charge utile/)

      const err = inspectHichainReply([{ tag: 0x7f, value: [0, 1, 0x86, 0xa2] }])
      expect(err.classification).toBe('result_error')
      expect(err.resultCode).toBe(100002)
      expect(() => parseHichainReply([{ tag: 0x7f, value: [0, 1, 0x86, 0xa2] }])).toThrow(/erreur \(code 100002\)/)

      expect(inspectHichainReply([{ tag: 1, value: utf8('fin') }, { tag: 4, value: [1] }]).classification).toBe('final')
      expect(inspectHichainReply([]).classification).toBe('empty')
    })

    it('réponse « New Auth Protocol » (préfixe binaire + JSON intégré) → structure nomme et dimensionne les champs, jamais les valeurs (§6.8)', () => {
      // GT 6 Pro : étiquette 1 non directement JSON, mais un JSON SPEKE noyé après un préfixe binaire.
      // Tailles réalistes : challenge 16, salt 16, epk 32 octets + une signature Ed25519 de 64 octets.
      const payload = {
        challenge: hexOf(randomBytes(16)),
        salt: hexOf(randomBytes(16)),
        epk: hexOf(randomBytes(32)),
        signature: hexOf(randomBytes(64)),
        version: '2.0.16',
      }
      const bytes = [0x01, 0x00, 0x00, 0x03, 0x35, ...utf8(JSON.stringify({ message: 32769, payload }))]
      const i = inspectHichainReply([{ tag: 1, value: bytes }, { tag: 4, value: [0] }])
      expect(i.classification).toBe('json_unparsable')
      expect(i.structure.embeddedJson.payloadKeys).toEqual(['challenge', 'epk', 'salt', 'signature', 'version'])
      expect(i.structure.embeddedJson.keys).toEqual(['message', 'payload'])
      expect(i.structure.embeddedJson.message).toBe('0x8001')
      expect(i.structure.embeddedJson.offset).toBe(5)
      // Tailles en octets pour un hexadécimal, en caractères pour une autre chaîne — jamais la valeur.
      expect(i.structure.embeddedJson.payloadFields).toEqual([
        { key: 'challenge', bytes: 16 },
        { key: 'epk', bytes: 32 },
        { key: 'salt', bytes: 16 },
        { key: 'signature', bytes: 64 },
        { key: 'version', chars: 6 },
      ])
      // aucune valeur de champ ne doit fuir dans l'analyse (hex, ni la chaîne « version »)
      const dump = JSON.stringify(i)
      for (const v of Object.values(payload)) expect(dump).not.toContain(v)
      // parseHichainReply surface les champs repérés ET leur taille dans son message d'erreur
      expect(() => parseHichainReply([{ tag: 1, value: bytes }, { tag: 4, value: [0] }])).toThrow(
        /champs repérés : challenge \(16 o\), epk \(32 o\), salt \(16 o\), signature \(64 o\), version \(6 car\.\)/,
      )
    })

    it('charge utile portée par une autre étiquette que la 1 → no_payload avec structure sondée', () => {
      const payload = { challenge: 'AA', epk: 'BB' }
      const inner = Array.from(utf8(JSON.stringify({ message: 32769, payload })))
      const i = inspectHichainReply([{ tag: 2, value: inner }, { tag: 4, value: [0] }])
      expect(i.classification).toBe('no_payload')
      expect(i.structure.embeddedJson.payloadKeys).toEqual(['challenge', 'epk'])
      expect(JSON.stringify(i)).not.toContain('AA')
    })

    it('errorCode JSON ≠ 0 → json_error, et parseHichainReply lève « erreur N » avec l’analyse attachée', () => {
      const i = inspectHichainReply(jsonReply({ message: 0x8001, payload: { errorCode: 2001 } }))
      expect(i.classification).toBe('json_error')
      expect(i.errorCode).toBe(2001)
      try {
        parseHichainReply(jsonReply({ payload: { errorCode: 2001 } }))
        throw new Error('aurait dû lever')
      } catch (e) {
        expect(e.inspection.classification).toBe('json_error')
        expect(e.code).toBe('watch_error')
      }
    })
  })

  it('constantes du PIN : lues dans le format de huawei-lpv2 ou collées, choisies selon la version', () => {
    const fake = (n) => Array.from({ length: 16 }, (_, i) => ((i * 7 + n) & 0xff).toString(16).padStart(2, '0').toUpperCase()).join(' ')
    const file = `NETWORK_BYTEORDER = "big"\n\nDIGEST_SECRETS = {\n    AuthVersion.V1: "${fake(1)}",\n    AuthVersion.V2: "${fake(2)}",\n    AuthVersion.V3: "${fake(3)}",\n}\n`
    const s = parseDigestSecrets(file)
    expect(s.v2).toBe(fake(2).replace(/ /g, '').toLowerCase())
    expect(parseDigestSecrets(`v1: ${fake(1)}\nv2 ${fake(2)}\nv3=${fake(3)}`)).toEqual(s)
    expect(parseDigestSecrets('v1: 00 11')).toBeNull()
    expect(hexOf(digestSecretFor(4, s))).toBe(s.v1)
    expect(hexOf(digestSecretFor(2, s))).toBe(s.v2)
    expect(hexOf(digestSecretFor(5, s))).toBe(s.v3)
    expect(() => digestSecretFor(1, null)).toThrow(/importez/)
  })

  it('clé de base de la liaison = SHA-256 du PIN écrit en hexadécimal majuscule', async () => {
    expect(hexOf(await pinBaseKey(utf8('12')))).toBe(hexOf(await sha256(utf8('3132'))))
  })

  it('chiffrement des trames : compteur gros-boutiste à partir de 1, aller-retour GCM et CBC', async () => {
    const key = randomBytes(32)
    for (const gcm of [true, false]) {
      const c = createCipher({ key, gcm, rand: (n) => new Uint8Array(n) })
      const sealed = await c.seal(1, 8, [{ tag: 1, value: [42] }])
      expect(sealed.map((t) => t.tag)).toEqual([0x7c, 0x7d, 0x7e])
      expect(toHex(sealed[1].value)).toBe('00 '.repeat(15) + '01')
      const second = await c.seal(1, 8, [])
      expect(second[1].value[15]).toBe(2)
      const back = await c.open(1, 8, sealed)
      expect(Array.from(back[0].value)).toEqual([42])
    }
    const wrap = createCipher({ key, gcm: true, counter: 0xffffffff, rand: (n) => new Uint8Array(n) })
    expect((await wrap.seal(1, 8, []))[1].value.slice(12)).toEqual([0, 0, 0, 1])
  })
})
