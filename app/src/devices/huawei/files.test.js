import { describe, it, expect } from 'vitest'
import { decodeTlvs } from './protocol'
import { openFileTlvs, parsePush, parseSleepSequence, parseStressFile, parseSummary, SLEEP_FIELD } from './files'
import { field, rawField, sleepSequenceFile, stressFile } from './testing/sampleFiles'
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

  it('nuit complète (§10.3) : FC mini / maxi, réveils, respiration, SpO₂, mesures brutes à part', () => {
    const file = sleepSequenceFile([
      {
        startSec: T,
        endSec: T + 8 * 3600,
        fields: [
          field(SLEEP_FIELD.VALID, 1), field(SLEEP_FIELD.BED, T), field(SLEEP_FIELD.SCORE, 77),
          field(SLEEP_FIELD.MIN_HR, 47), field(SLEEP_FIELD.MAX_HR, 88), field(SLEEP_FIELD.WAKEUPS, 2),
          field(SLEEP_FIELD.RESP_AVG, 14.25), field(SLEEP_FIELD.RESP_MIN, 11), field(SLEEP_FIELD.RESP_MAX, 19),
          field(SLEEP_FIELD.SPO2_AVG, 95), field(SLEEP_FIELD.SPO2_MIN, 89), field(SLEEP_FIELD.SPO2_MAX, 99),
          field(SLEEP_FIELD.LATENCY, 12), field(SLEEP_FIELD.HRV_BASE_MAX, 52.5),
          rawField(SLEEP_FIELD.EFFICIENCY, 6, [0xbf, 0x80, 0, 0]), // absente
        ],
        stages: [[200, 1], [100, 3]],
      },
    ])
    const [night] = parseSleepSequence(file)
    expect(night).toMatchObject({ score: 77, minHr: 47, maxHr: 88, wakeups: 2, respAvg: 14.3, respMin: 11, respMax: 19, spo2Avg: 95, spo2Min: 89, spo2Max: 99 })
    expect(night.extras).toEqual({ latency: 12, hrvBaselineMax: 52.5 })
    expect(night.nap).toBeUndefined()
  })

  it('réel sur 4 octets, valeurs hors bornes ignorées', () => {
    const f32 = (x) => {
      const v = new DataView(new ArrayBuffer(4))
      v.setFloat32(0, x)
      return Array.from(new Uint8Array(v.buffer))
    }
    const file = sleepSequenceFile([
      { startSec: T, endSec: T + 3600, fields: [rawField(SLEEP_FIELD.RESP_AVG, 6, f32(15.5)), field(SLEEP_FIELD.SPO2_AVG, 140), field(SLEEP_FIELD.MIN_HR, 3)], stages: [[60, 1]] },
    ])
    const [night] = parseSleepSequence(file)
    expect(night.respAvg).toBe(15.5)
    expect(night.spo2Avg).toBeUndefined()
    expect(night.minHr).toBeUndefined()
  })

  it('« données valides » = −1 (sieste ou nuit invalide) : phases gardées, aucune mesure du résumé', () => {
    const file = sleepSequenceFile([
      { startSec: T, endSec: T + 3600, fields: [field(SLEEP_FIELD.VALID, -1), field(SLEEP_FIELD.BED, T - 600), field(SLEEP_FIELD.SCORE, 60), field(SLEEP_FIELD.HRV, 40)], stages: [[25, 5]] },
    ])
    const [nap] = parseSleepSequence(file)
    expect(nap).toEqual({ start: T * 1000, end: (T + 25 * 60) * 1000, nap: true, stages: [{ start: T * 1000, minutes: 25, stage: 'asleep' }] })
  })

  it('capacité 199 absente : départ à l’endormissement même si la nuit est valide', () => {
    const file = sleepSequenceFile([
      { startSec: T, endSec: T + 3600, fields: [field(SLEEP_FIELD.VALID, 1), field(SLEEP_FIELD.BED, T), field(SLEEP_FIELD.FALL_ASLEEP, T + 1200)], stages: [[30, 1]] },
    ])
    expect(parseSleepSequence(file)[0].start).toBe(T * 1000)
    expect(parseSleepSequence(file, { bedTime: false })[0].start).toBe((T + 1200) * 1000)
  })

  it('bloc de durée abîmée (pas une minute entière, ou plus de 24 h) : ignoré sans décaler la suite', () => {
    const file = sleepSequenceFile([
      { startSec: T, endSec: T + 3600, fields: [], stages: [[10, 1], [0, 3, 95], [0, 3, 1441 * 60], [20, 3]] },
    ])
    expect(parseSleepSequence(file)[0].stages).toEqual([
      { start: T * 1000, minutes: 10, stage: 'light' },
      { start: (T + 600) * 1000, minutes: 20, stage: 'deep' },
    ])
  })

  it('résumé d’un autre type que 2 : phases lues, résumé ignoré', () => {
    const file = sleepSequenceFile([{ startSec: T, endSec: T + 3600, fields: [field(SLEEP_FIELD.SCORE, 80)], stages: [[30, 1]] }])
    file[32 + 9] = 3 // type de résumé du premier enregistrement
    const [night] = parseSleepSequence(file)
    expect(night.score).toBeUndefined()
    expect(night.stages).toHaveLength(1)
  })
})

describe('montre Huawei : fichier de stress rrisqi_data.bin (M4, §7.6)', () => {
  it('version 3 : deux enregistrements → score et niveau de la montre', () => {
    const file = stressFile([
      { startSec: T, endSec: T + 300, score: 27, level: 1 },
      { startSec: T + 3600, endSec: T + 3900, score: 64, level: 3 },
    ])
    expect(file.length).toBe(48 + 2 * 66)
    expect(parseStressFile(file)).toEqual([
      { start: T * 1000, end: (T + 300) * 1000, score: 27, level: 1 },
      { start: (T + 3600) * 1000, end: (T + 3900) * 1000, score: 64, level: 3 },
    ])
  })

  it('autre version ignorée, score hors 1–99 ou dates incohérentes écartés, niveau inconnu omis', () => {
    expect(parseStressFile(stressFile([{ startSec: T, endSec: T + 60, score: 40, level: 2 }], { version: 2 }))).toEqual([])
    const file = stressFile([
      { startSec: T, endSec: T + 60, score: 0 },
      { startSec: T, endSec: T + 60, score: 100 },
      { startSec: T, endSec: T - 60, score: 50 },
      { startSec: T, endSec: T + 60, score: 50, level: 9 },
    ])
    expect(parseStressFile(file)).toEqual([{ start: T * 1000, end: (T + 60) * 1000, score: 50 }])
    expect(parseStressFile(new Uint8Array(10))).toEqual([])
    // enregistrement tronqué en fin de fichier : ignoré
    expect(parseStressFile(file.slice(0, 48 + 66 + 20))).toEqual([])
  })
})
