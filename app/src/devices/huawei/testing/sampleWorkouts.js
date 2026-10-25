/** Trames de séances synthétiques (0x17, §7.5 bis) : aucune donnée réelle, valeurs inventées pour les tests. */
import { encodeTlvs } from '../protocol'

export const be = (n, size) => Array.from({ length: size }, (_, i) => Math.floor(n / 2 ** (8 * (size - 1 - i))) & 0xff)

/** Bloc 0x17/0x0A synthétique : points [FC, vitesse en dm/s] avec un champ de 2 octets en plus (bit 7, calories) pour vérifier le saut. */
export const samplesBlock = (number, block, startSec, stepSec, points, { mask = 0b10000011, size = 5 } = {}) => [
  {
    tag: 0x81,
    value: encodeTlvs([
      { tag: 2, value: be(number, 2) },
      { tag: 3, value: be(block, 2) },
      { tag: 4, value: [...be(number, 2), ...be(block, 2), ...be(startSec, 4), stepSec, ...be(points.length, 2), size, ...be(mask, 2)] },
      { tag: 5, value: points.flatMap(([hr, speed]) => [hr, ...be(speed, 2), 0, 9].slice(0, size)) },
    ]),
  },
]

/** Bloc 0x17/0x0C synthétique : [km, unité, secondes, correction?]. */
export const paceBlock = (number, block, rows) => [
  { tag: 0x81, value: encodeTlvs([{ tag: 2, value: be(number, 2) }, { tag: 8, value: be(block, 2) }, ...rows.map(([km, unit, sec, corr]) => ({ tag: 0x83, value: encodeTlvs([{ tag: 4, value: be(km, 2) }, { tag: 5, value: [unit] }, { tag: 6, value: be(sec, 4) }, ...(corr ? [{ tag: 9, value: be(corr, 2) }] : [])]) }))]) },
]

/** Réponse 0x17/0x08 synthétique : course de 30 min (310 kcal, 5,2 km, 4 800 pas, FC 96–171). */
export const runTotals = (number, startSec) => [
  { tag: 0x81, value: encodeTlvs([{ tag: 2, value: be(number, 2) }, { tag: 4, value: be(startSec, 4) }, { tag: 5, value: be(startSec + 1800, 4) }, { tag: 6, value: be(310, 4) }, { tag: 7, value: be(5200, 4) }, { tag: 8, value: be(4800, 4) }, { tag: 0x0c, value: [96, 171] }, { tag: 0x12, value: be(1750, 4) }, { tag: 0x14, value: [1] }]) },
]
