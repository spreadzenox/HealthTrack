import { describe, it, expect } from 'vitest'
import { decodeTlvs } from './protocol'
import { openFileTlvs, parsePush, parseSleepSequence, parseSummary, SLEEP_FIELD } from './files'
import { field, sleepSequenceFile } from './testing/sampleFiles'
import { encodeTlvs } from './protocol'

const T = 1760306400 // 12/10/2026 22:00 UTC

describe('montre Huawei : fichiers détaillés (§7.6)', () => {
  it('ouverture du fichier de sommeil : nom, type, période, dictionnaire', () => {
    const tlvs = openFileTlvs({ name: 'sequence_data', type: 0x16, startMs: T * 1000, endMs: (T + 60) * 1000, dictionary: 700013 })
    expect(tlvs.map((t) => t.tag)).toEqual([1, 2, 5, 6, 0x0c])
    expect(new TextDecoder().decode(Uint8Array.from(tlvs[0].value))).toBe('sequence_data')
    expect(tlvs[4].value).toEqual([0x00, 0x0a, 0xae, 0x6d])
  })

  it('bloc poussé brut : identifiant, position gros-boutiste, octet inconnu, données', () => {
    expect(parsePush(Uint8Array.from([3, 0, 0, 1, 0, 9, 0xaa, 0xbb]))).toEqual({ fileId: 3, offset: 256, data: Uint8Array.from([0xaa, 0xbb]) })
    expect(parsePush(Uint8Array.from([3, 0]))).toBeNull()
  })

  it('résumé : champs entiers et réels, à toute profondeur', () => {
    const bytes = encodeTlvs([{ tag: 0x81, value: encodeTlvs([field(SLEEP_FIELD.SCORE, 82), field(SLEEP_FIELD.HRV, 41.5)]) }])
    const m = parseSummary(Uint8Array.from(bytes))
    expect(m.get(SLEEP_FIELD.SCORE)).toBe(82)
    expect(m.get(SLEEP_FIELD.HRV)).toBe(41.5)
    expect(decodeTlvs(bytes)[0].tag).toBe(0x81)
  })

  it('nuit détaillée : phases enchaînées depuis le coucher, score, VFC, FC moyenne', () => {
    const file = sleepSequenceFile([
      {
        startSec: T,
        endSec: T + 8 * 3600,
        fields: [field(SLEEP_FIELD.BED, T + 30), field(SLEEP_FIELD.VALID, 1), field(SLEEP_FIELD.FALL_ASLEEP, T + 900), field(SLEEP_FIELD.SCORE, 82), field(SLEEP_FIELD.HRV, 41.5), field(SLEEP_FIELD.AVG_HR, 54)],
        stages: [[15, 4], [120, 1], [60, 3], [45, 2], [0, 1], [10, 9]],
      },
    ])
    const [night] = parseSleepSequence(file)
    expect(night.stages).toEqual([
      { start: T * 1000, minutes: 15, stage: 'awake' },
      { start: (T + 15 * 60) * 1000, minutes: 120, stage: 'light' },
      { start: (T + 135 * 60) * 1000, minutes: 60, stage: 'deep' },
      { start: (T + 195 * 60) * 1000, minutes: 45, stage: 'rem' },
    ])
    // la phase inconnue (code 9) est sautée mais le temps avance
    expect(night).toMatchObject({ start: T * 1000, end: (T + 250 * 60) * 1000, score: 82, hrvMs: 41.5, avgHr: 54 })
  })

  it('sans « données valides » : départ à l’endormissement ; valeurs aberrantes ignorées ; fichier tronqué toléré', () => {
    const file = sleepSequenceFile([
      { startSec: T, endSec: T + 3600, fields: [field(SLEEP_FIELD.BED, T), field(SLEEP_FIELD.FALL_ASLEEP, T + 600), field(SLEEP_FIELD.HRV, 900)], stages: [[30, 1]] },
      { startSec: T + 86400, endSec: T + 90000, fields: [], stages: [[20, 5]] },
    ])
    const nights = parseSleepSequence(file)
    expect(nights[0]).toEqual({ start: (T + 600) * 1000, end: (T + 2400) * 1000, stages: [{ start: (T + 600) * 1000, minutes: 30, stage: 'light' }] })
    expect(nights[1].stages[0]).toEqual({ start: (T + 86400) * 1000, minutes: 20, stage: 'asleep' })
    expect(parseSleepSequence(file.slice(0, file.length - 4))).toHaveLength(1)
    expect(parseSleepSequence(new Uint8Array(10))).toEqual([])
  })
})
