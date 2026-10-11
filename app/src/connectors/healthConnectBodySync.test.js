import { describe, it, expect } from 'vitest'
import { healthConnectBodySamplesToEntries } from './healthConnectBodySync'

describe('healthConnectBodySamplesToEntries', () => {
  it('maps weight samples to weight entries', () => {
    const entries = healthConnectBodySamplesToEntries(
      [{ startDate: '2026-05-20T08:00:00Z', value: 73.2, sourceName: 'Withings' }],
      'weight',
    )
    expect(entries).toHaveLength(1)
    expect(entries[0].type).toBe('weight')
    expect(entries[0].source).toBe('health_connect')
    expect(entries[0].payload.valueKg).toBe(73.2)
  })

  it('maps height in centimeters', () => {
    const entries = healthConnectBodySamplesToEntries(
      [{ startDate: '2026-05-01T08:00:00Z', value: 178 }],
      'height',
    )
    expect(entries[0].type).toBe('height')
    expect(entries[0].payload.valueCm).toBe(178)
  })

  it('maps body fat to body_composition', () => {
    const entries = healthConnectBodySamplesToEntries(
      [{ startDate: '2026-05-20T08:00:00Z', value: 18.5 }],
      'bodyFat',
    )
    expect(entries[0].type).toBe('body_composition')
    expect(entries[0].payload.fatRatioPct).toBe(18.5)
  })
})
