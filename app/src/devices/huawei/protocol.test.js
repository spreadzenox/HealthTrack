import { describe, it, expect } from 'vitest'
import {
  crc16,
  encodeVarInt,
  decodeVarInt,
  encodeTlvs,
  decodeTlvs,
  encodeFrame,
  decodeFrame,
  createReassembler,
  linkParamsRequest,
  parseLinkParams,
  resultCode,
  toHex,
  authModeLabel,
} from './protocol'

const hex = (s) => Uint8Array.from(s.trim().split(/\s+/).map((b) => parseInt(b, 16)))

describe('protocole Huawei — briques', () => {
  it('CRC-16 XMODEM (valeur de contrôle standard « 123456789 » = 0x31C3)', () => {
    expect(crc16(new TextEncoder().encode('123456789'))).toBe(0x31c3)
  })

  it('entiers variables : 7 bits par octet, poids forts d’abord', () => {
    const cases = [
      [0, '00'],
      [1, '01'],
      [127, '7f'],
      [128, '81 00'],
      [8193, 'c0 01'],
      [16383, 'ff 7f'],
      [16384, '81 80 00'],
    ]
    for (const [n, bytes] of cases) {
      expect(toHex(encodeVarInt(n))).toBe(bytes)
      expect(decodeVarInt(hex(bytes))).toEqual({ value: n, size: hex(bytes).length })
    }
    expect(() => decodeVarInt(hex('81'))).toThrow()
  })

  it('TLV : aller-retour, étiquettes vides comprises', () => {
    const bytes = encodeTlvs([{ tag: 1, value: [0x61, 0x62, 0x63] }, { tag: 2 }])
    expect(toHex(bytes)).toBe('01 03 61 62 63 02 00')
    const back = decodeTlvs(bytes)
    expect(back.map((t) => [t.tag, toHex(t.value)])).toEqual([
      [1, '61 62 63'],
      [2, ''],
    ])
    expect(() => decodeTlvs(hex('01 05 61'))).toThrow(/tronqué/)
  })
})

describe('protocole Huawei — trames', () => {
  // Trame de référence publiée avec huawei-lpv2 (MIT) : service 1, commande 2, TLV 3 = « abc ».
  const SAMPLE = '5a 00 08 00 01 02 03 03 61 62 63 e1 d3'

  it('encode la trame de référence', () => {
    expect(toHex(encodeFrame(1, 2, [{ tag: 3, value: [0x61, 0x62, 0x63] }]))).toBe(SAMPLE)
  })

  it('décode la trame de référence et refuse les trames abîmées', () => {
    const { slice, body } = decodeFrame(hex(SAMPLE))
    expect(slice).toBe(0)
    expect(toHex(body)).toBe('01 02 03 03 61 62 63')
    expect(() => decodeFrame(hex('5a 00 08 00 01 02 03 03 61 62 63 e1 d4'))).toThrow(/CRC/)
    expect(() => decodeFrame(hex('5b 00 08 00 01 02 03 03 61 62 63 e1 d3'))).toThrow(/0x5A/)
    expect(() => decodeFrame(hex('5a 00 09 00 01 02 03 03 61 62 63 e1 d3'))).toThrow(/Longueur/)
  })

  it('demande des paramètres du lien = service 1, commande 1, étiquettes 1 à 4 vides', () => {
    const frame = linkParamsRequest()
    expect(toHex(frame.slice(0, 14))).toBe('5a 00 0b 00 01 01 01 00 02 00 03 00 04 00')
    expect(frame).toHaveLength(16)
    const { body } = decodeFrame(frame)
    expect(toHex(body)).toBe('01 01 01 00 02 00 03 00 04 00')
  })

  it('rassemble une trame arrivée en plusieurs notifications', () => {
    const r = createReassembler()
    const frame = hex(SAMPLE)
    expect(r.push(frame.slice(0, 5))).toEqual([])
    const msgs = r.push(frame.slice(5))
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toMatchObject({ serviceId: 1, commandId: 2 })
    expect(toHex(msgs[0].tlvs[0].value)).toBe('61 62 63')
  })

  it('rassemble un message découpé en tranches (1 = début, 2 = milieu, 3 = fin)', () => {
    const payload = [1, 2, ...encodeTlvs([{ tag: 3, value: [0x61, 0x62, 0x63, 0x64, 0x65, 0x66] }])]
    const parts = [payload.slice(0, 3), payload.slice(3, 6), payload.slice(6)]
    const sliceFrame = (flag, index, part) => {
      const len = part.length + 2
      const head = [0x5a, len >> 8, len & 0xff, flag, index, ...part]
      const c = crc16(head)
      return Uint8Array.from([...head, c >> 8, c & 0xff])
    }
    const r = createReassembler()
    expect(r.push(sliceFrame(1, 0, parts[0]))).toEqual([])
    expect(r.push(sliceFrame(2, 1, parts[1]))).toEqual([])
    const msgs = r.push(sliceFrame(3, 2, parts[2]))
    expect(msgs).toHaveLength(1)
    expect(toHex(msgs[0].tlvs[0].value)).toBe('61 62 63 64 65 66')
  })

  it('ignore les octets parasites avant l’en-tête', () => {
    const r = createReassembler()
    expect(r.push([0x00, 0x11, ...hex(SAMPLE)])).toHaveLength(1)
  })
})

describe('protocole Huawei — paramètres du lien', () => {
  it('lit version, tailles, intervalle, version d’authentification et garde les étiquettes inconnues', () => {
    const nonce = Array.from({ length: 16 }, (_, i) => i)
    const tlvs = decodeTlvs(
      encodeTlvs([
        { tag: 1, value: [2] },
        { tag: 2, value: [0x02, 0x00] },
        { tag: 3, value: [0x01, 0xf4] },
        { tag: 4, value: [0x00, 0x1e] },
        { tag: 5, value: [0x00, 0x03, ...nonce] },
        { tag: 7, value: [0x02] },
        { tag: 0x0c, value: [0x01] },
        { tag: 0x0e, value: [0xaa] },
      ]),
    )
    expect(parseLinkParams(tlvs)).toEqual({
      protocolVersion: 2,
      maxFrameSize: 512,
      maxLinkSize: 500,
      connectionIntervalMs: 30,
      authVersion: 3,
      serverNonceLength: 16,
      deviceSupportType: 2,
      authMode: 'hichain_lite',
      authAlgo: null,
      bondState: null,
      encryptMethod: 1,
      result: null,
      otherTags: [{ tag: 14, hex: 'aa' }],
    })
  })

  it('mode d’authentification : classique sans étiquette 7, HiChain pour 1 / 3, inconnu sinon', () => {
    const lp = (extra) => parseLinkParams(decodeTlvs(encodeTlvs([{ tag: 1, value: [2] }, ...extra])))
    expect(lp([]).authMode).toBe('legacy')
    expect(authModeLabel(lp([]))).toMatch(/classique/)
    expect(lp([{ tag: 7, value: [1] }]).authMode).toBe('hichain')
    expect(lp([{ tag: 7, value: [3] }]).authMode).toBe('hichain')
    expect(lp([{ tag: 7, value: [4] }]).authMode).toBe('hichain3')
    expect(lp([{ tag: 7, value: [9] }]).authMode).toBe('unknown')
    expect(authModeLabel(lp([{ tag: 7, value: [9] }]))).toBe('mode inconnu (9)')
  })

  it('code de résultat (étiquette 0x7F, 4 octets)', () => {
    expect(resultCode(decodeTlvs(encodeTlvs([{ tag: 0x7f, value: [0x00, 0x01, 0x86, 0xa9] }])))).toBe(100009)
    expect(resultCode([])).toBeNull()
  })
})
