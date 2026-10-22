/**
 * Pages synthétiques de la synchro « dictionnaire » (service P2P 0x34, journal/protocoles/huawei.md §10.4),
 * construites par nous pour les tests : aucune trame réelle.
 */
import { encodeTlvs } from '../protocol'
import { minimalBytes } from '../p2p'

const fixed = (n, size) => Array.from({ length: size }, (_, i) => Math.floor(n / 2 ** (8 * (size - 1 - i))) & 0xff)

export const real8 = (x) => {
  const v = new DataView(new ArrayBuffer(8))
  v.setFloat64(0, x)
  return Array.from(new Uint8Array(v.buffer))
}
export const real4 = (x) => {
  const v = new DataView(new ArrayBuffer(4))
  v.setFloat32(0, x)
  return Array.from(new Uint8Array(v.buffer))
}

/**
 * Charge utile d'une page : `records` = [{ start, end?, modified?, values: [[champ, octets]] }],
 * ou null pour une page sans conteneur 0x83 (classe terminée).
 */
export function dictionaryPage(cls, records) {
  const tlvs = [
    { tag: 1, value: [1] },
    { tag: 2, value: minimalBytes(cls) },
  ]
  if (records) {
    const items = records.map((r) => ({
      tag: 0x84,
      value: encodeTlvs([
        { tag: 5, value: fixed(r.start, 8) },
        ...(r.end != null ? [{ tag: 6, value: fixed(r.end, 8) }] : []),
        ...(r.modified != null ? [{ tag: 0x0c, value: fixed(r.modified, 8) }] : []),
        { tag: 0x87, value: encodeTlvs(r.values.map(([field, bytes]) => ({ tag: 0x88, value: encodeTlvs([{ tag: 9, value: minimalBytes(field) }, { tag: 0x0a, value: bytes }]) }))) },
      ]),
    }))
    tlvs.push({ tag: 0x83, value: encodeTlvs(items) })
  }
  return [1, ...encodeTlvs(tlvs)]
}
