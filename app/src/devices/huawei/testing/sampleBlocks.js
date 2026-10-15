/**
 * Réponses d'exemple des lectures santé (7/0x0B minutes, 7/0x0D sommeil, 7/0x03 totaux), partagées par les
 * vecteurs Java (javaVectors.test.js) et les tests de l'import des captures (capture.test.js).
 */
import { encodeTlvs } from '../protocol'

export const be = (n, size) => Array.from({ length: size }, (_, i) => Math.floor(n / 2 ** (8 * (size - 1 - i))) & 0xff)

/** Bloc 7/0x0B : début (s) et minutes [{ offset, bytes }]. */
export const minuteBlock = (index, startSec, minutes) => [
  {
    tag: 0x81,
    value: encodeTlvs([
      { tag: 2, value: be(index, 2) },
      { tag: 3, value: be(startSec, 4) },
      ...minutes.map((m) => ({ tag: 0x84, value: encodeTlvs([{ tag: 5, value: [m.offset & 0xff] }, { tag: 6, value: m.bytes }]) })),
    ]),
  },
]
/** Octets d'une minute : pas, kcal, FC (masque 0x43). */
export const minute = (steps, kcal, hr) => [0x43, ...be(steps, 2), ...be(kcal, 2), hr]
/** Bloc 7/0x0D : périodes [{ type, startSec, minutes }]. */
export const sleepBlock = (periods) => [
  { tag: 0x81, value: encodeTlvs(periods.map((p) => ({ tag: 0x83, value: encodeTlvs([{ tag: 4, value: [p.type] }, { tag: 5, value: [...be(p.startSec, 4), ...be(p.minutes, 2)] }]) }))) },
]

/** Période lue par le client Java dans les vecteurs, et heure de la capture. */
export const READ_WINDOW = { since: Date.UTC(2026, 9, 14, 0), until: Date.UTC(2026, 9, 15, 6), at: Date.UTC(2026, 9, 15, 6, 20) }

/** Données de la fausse montre (options de createFakeWatch) : une nuit, 2 blocs de minutes, totaux du jour. */
export function readWatchOptions() {
  const start = READ_WINDOW.since / 1000 + 20 * 3600
  return {
    sleepBlocks: [sleepBlock([{ type: 6, startSec: start + 2 * 3600, minutes: 150 }, { type: 7, startSec: start + 2 * 3600 + 9000, minutes: 60 }])],
    minuteBlocks: [
      minuteBlock(0, start, [{ offset: 0, bytes: minute(120, 6, 88) }, { offset: 1, bytes: minute(95, 5, 91) }, { offset: 2, bytes: [0x40, 0xff] }]),
      minuteBlock(1, start + 3600, [{ offset: 0, bytes: minute(40, 2, 70) }]),
    ],
    totals: [{ tag: 0x81, value: encodeTlvs([{ tag: 0x83, value: encodeTlvs([{ tag: 5, value: be(5400, 4) }, { tag: 6, value: be(210, 2) }, { tag: 7, value: be(3900, 4) }]) }]) }],
  }
}
