import { describe, it, expect, vi } from 'vitest'

// Version iOS (HealthTrack-iOS), correctif 57 : la VFC de l'app Santé (SDNN) a sa propre norme ; elle est lue avec
// les autres mesures comparées, jamais mêlée à la VFC RMSSD d'Android
const lists = vi.hoisted(() => ({ calls: [] }))
vi.mock('../storage/localHealthStorage', async (orig) => ({
  ...(await orig()),
  listEntries: vi.fn(async (q) => { lists.calls.push(q); return [] }),
}))

import { measureNorms, readDeviationEntries } from './dayDeviations'

const NOW = new Date('2026-11-09T10:00:00')
const day = (n, summary) => ({ dateKey: `2026-11-${String(n).padStart(2, '0')}`, summary })

describe('Normes : VFC en SDNN (iPhone)', () => {
  it('SDNN et RMSSD ont chacune leur habitude', () => {
    const days = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => day(n, { hrvSdnn: 50, hrv: 30 }))
    days.push(day(9, { hrvSdnn: 62 }))
    const { norms } = measureNorms(days, NOW)
    expect(norms.hrvSdnn).toMatchObject({ usual: 'd’habitude 50 ms', value: '62 ms', direction: 'up', text: 'Variabilité cardiaque plus haute' })
    expect(norms.hrv).toBeUndefined() // pas de RMSSD aujourd'hui : rien à comparer, et jamais la SDNN à sa place
  })

  it('les mesures de SDNN sont lues pour les normes', async () => {
    lists.calls.length = 0
    await readDeviationEntries(NOW)
    const heart = lists.calls.find((q) => q.type === 'heart_rate')
    expect(heart.subtypes).toEqual(expect.arrayContaining(['heartRateVariability', 'heartRateVariabilitySdnn']))
  })
})
