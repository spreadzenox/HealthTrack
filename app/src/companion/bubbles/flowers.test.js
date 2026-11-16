import { describe, it, expect } from 'vitest'
import { islandFlowers, flowersForBus, DAY_SLOTS, MEADOW_MAX } from './flowers'
import { habitEntry } from '../../services/habits'

const NOW = new Date(2026, 10, 16, 20)
const at = (day, h, m = 0) => new Date(2026, 10, day, h, m).toISOString()

describe('fleurs de l’îlot', () => {
  it('une fleur par geste du jour, à la couleur de son thème, « non » compris', () => {
    const r = islandFlowers([
      { id: 1, type: 'food', at: at(16, 8) },
      { id: 2, type: 'wellbeing', at: at(16, 9) },
      habitEntry({ id: 'reading', label: 'Lecture' }, '2026-11-16', false),
      { id: 3, type: 'steps', at: at(16, 10) },
    ], NOW)
    expect(r.today.map((f) => f.tone)).toEqual(['peach', 'mint', 'honey'])
    expect(r.today[0]).toMatchObject({ angle: DAY_SLOTS[0].angle })
  })

  it('jamais derrière Pilou : places du jour devant, à moins de 100° de l’avant', () => {
    for (const s of DAY_SLOTS) expect(Math.abs(s.angle)).toBeLessThan(100)
  })

  it('la prairie garde les 7 derniers jours, 44 fleurs au plus, et ne fane jamais dans la semaine', () => {
    const entries = []
    for (let d = 1; d <= 15; d++) for (let h = 7; h < 15; h++) entries.push({ id: `${d}-${h}`, type: 'food', at: at(d, h) })
    const r = islandFlowers(entries, NOW)
    expect(r.meadow.length).toBe(MEADOW_MAX)
    expect(r.meadow.every((f) => f.day >= '2026-11-09')).toBe(true)
    expect(r.meadow.every((f) => f.r >= 1 && f.r <= 1.13)).toBe(true)
  })
})

describe('fleurs pour le bus', () => {
  it('format du contrat, prairie plus petite', () => {
    const r = islandFlowers([{ id: 1, type: 'food', at: at(16, 8) }, { id: 2, type: 'wellbeing', at: at(15, 8) }], NOW)
    expect(flowersForBus(r)).toEqual([
      { id: '2', theme: 'menthe', angleDeg: expect.any(Number), radius: expect.any(Number), scale: 0.58 },
      { id: '1', theme: 'peche', angleDeg: -74, radius: 0.95, scale: 1 },
    ])
  })
})
