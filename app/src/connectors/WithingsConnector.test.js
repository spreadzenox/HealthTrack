import { describe, it, expect } from 'vitest'
import { WithingsConnector, withingsGroupToEntries } from './WithingsConnector'
import { WITHINGS_MEASURE_TYPES } from './withingsMeasureTypes'

describe('withingsGroupToEntries', () => {
  it('creates weight and body_composition entries from a measure group', () => {
    const grp = {
      grpid: 1,
      date: 1710000000,
      deviceid: 'abc',
      measures: [
        { type: WITHINGS_MEASURE_TYPES.WEIGHT, value: 75000, unit: -3 },
        { type: WITHINGS_MEASURE_TYPES.FAT_RATIO, value: 185, unit: -1 },
        { type: WITHINGS_MEASURE_TYPES.MUSCLE_MASS, value: 35000, unit: -3 },
      ],
    }
    const entries = withingsGroupToEntries(grp)
    expect(entries.some((e) => e.type === 'weight' && e.payload.valueKg === 75)).toBe(true)
    expect(entries.some((e) => e.type === 'body_composition')).toBe(true)
    const comp = entries.find((e) => e.type === 'body_composition')
    expect(comp.payload.fatRatioPct).toBe(18.5)
    expect(comp.payload.muscleMassKg).toBe(35)
    expect(comp.source).toBe('withings')
  })

  it('creates height entry in cm', () => {
    const grp = {
      date: 1710000000,
      measures: [{ type: WITHINGS_MEASURE_TYPES.HEIGHT, value: 175, unit: -2 }],
    }
    const entries = withingsGroupToEntries(grp)
    expect(entries[0].type).toBe('height')
    expect(entries[0].payload.valueCm).toBe(175)
  })
})

describe('WithingsConnector', () => {
  it('has correct id and data types', () => {
    const c = new WithingsConnector()
    expect(c.id).toBe('withings')
    expect(c.dataTypes).toContain('weight')
    expect(c.dataTypes).toContain('body_composition')
  })
})
