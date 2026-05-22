import { describe, it, expect } from 'vitest'
import { buildMockWithingsMeasuresBody } from './withingsMockMeasures'
import { withingsGroupToEntries } from '../connectors/WithingsConnector'

describe('withingsMockMeasures fixture', () => {
  it('contains advanced Body Scan biomarkers', () => {
    const grp = buildMockWithingsMeasuresBody().measuregrps[0]
    const comp = withingsGroupToEntries(grp).find((e) => e.type === 'body_composition')
    expect(comp?.payload).toMatchObject({
      vascularAgeYears: 38,
      pwvMps: 6.5,
      muscleMassKg: 35.8,
      visceralFatIndex: 42,
      extracellularWaterKg: 15.2,
    })
  })
})
