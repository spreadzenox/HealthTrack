/**
 * Fichiers d'exemple construits par nous d'après journal/protocoles/huawei.md §7.6 (pas des
 * fichiers de montre réels) : sommeil détaillé « sequence_data », dictionnaire 700013.
 */
import { encodeTlvs } from '../protocol'

export const be = (n, size) => Array.from({ length: size }, (_, i) => Math.floor(n / 2 ** (8 * (size - 1 - i))) & 0xff)
const le = (n, size) => be(n, size).reverse()
const f64 = (x) => {
  const v = new DataView(new ArrayBuffer(8))
  v.setFloat64(0, x)
  return Array.from(new Uint8Array(v.buffer))
}

/** Champ du résumé : entier sur 4 octets (type 4) ou réel double (type 6). */
export const field = (id, value, type = Number.isInteger(value) ? 4 : 6) =>
  ({ tag: 0x82, value: encodeTlvs([{ tag: 3, value: be(id, 4) }, { tag: 4, value: [type] }, { tag: 5, value: type === 6 ? f64(value) : be(value, 4) }]) })

/** Champ du résumé aux octets donnés tels quels (ex. `BF 80 00 00`, valeur absente). */
export const rawField = (id, type, bytes) =>
  ({ tag: 0x82, value: encodeTlvs([{ tag: 3, value: be(id, 4) }, { tag: 4, value: [type] }, { tag: 5, value: bytes }]) })

/**
 * @param nights [{ startSec, endSec, fields: [field…], stages: [[minutes, code] ou [minutes, code, secondes]…] }]
 */
export function sleepSequenceFile(nights) {
  const records = nights.flatMap((n) => {
    const summary = encodeTlvs([{ tag: 0x81, value: encodeTlvs(n.fields || []) }])
    const detail = (n.stages || []).flatMap(([minutes, code, seconds = minutes * 60]) => [...le(seconds, 4), code, 0, 0, 0])
    return [...be(n.startSec, 4), ...be(n.endSec, 4), 1, 2, ...be(summary.length, 2), ...be(detail.length, 4), ...new Array(16).fill(0), ...summary, ...detail]
  })
  return Uint8Array.from([...be(records.length, 4), ...be(700013, 4), ...be(0x16, 2), ...be(1, 2), ...new Array(20).fill(0), ...records])
}
