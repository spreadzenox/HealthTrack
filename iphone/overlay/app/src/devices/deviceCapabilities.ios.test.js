import { describe, it, expect } from 'vitest'
import { measuresOf, measureStatuses } from './deviceCapabilities'

// Version iOS (HealthTrack-iOS) : la VFC de l'app Santé (SDNN) est rangée à part de la RMSSD d'Android
// (`heartRateVariabilitySdnn`, correctif 08). L'accueil d'Android (ACC-5, v917) dit ce que vos appareils envoient :
// avec une Apple Watch, la VFC doit y être « reçue », jamais « pas mesurée » (correctif 53).
const sdnn = { type: 'heart_rate', at: '2026-11-07T06:00:00Z', payload: { subtype: 'heartRateVariabilitySdnn', value: 48 } }

describe('ce que vos appareils envoient, avec la VFC de l’app Santé (SDNN)', () => {
  it('une entrée SDNN apporte la VFC', () => {
    expect(measuresOf(sdnn)).toEqual(['hrv'])
  })

  it('Apple Watch : VFC reçue, absente de « pas mesuré »', () => {
    const { groups, notMeasured } = measureStatuses({ entries: [sdnn] })
    const hrv = groups.flatMap((g) => g.items).find((m) => m.id === 'hrv')
    expect(hrv).toMatchObject({ status: 'received' })
    expect(notMeasured).not.toContain(hrv.label)
  })
})
