import { describe, it, expect } from 'vitest'
import { personaEntries, keepForEquipment } from './personaData.mjs'
import { generateDemoEntries } from '../visual/demoData.mjs'

const now = new Date('2026-11-08T15:00:00')
const demo = generateDemoEntries({ now })
const types = (list) => new Set(list.map((e) => e.type))

describe('personaEntries', () => {
  it('jour 14 : rien de plus ancien que 14 jours, rien dans le futur', () => {
    const list = personaEntries(demo, { day: 14, equipment: 'full', now })
    const from = new Date('2026-10-26T00:00:00')
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((e) => new Date(e.at) >= from && new Date(e.at) <= now)).toBe(true)
  })

  it('jour 1 : aucune saisie dans l\'app, mais l\'historique de la montre (30 jours)', () => {
    const list = personaEntries(demo, { day: 1, equipment: 'watch', now })
    expect([...types(list)].some((t) => ['food', 'gut', 'wellbeing', 'face_burst', 'stool'].includes(t))).toBe(false)
    expect(types(list).has('sleep')).toBe(true)
    expect(list.some((e) => new Date(e.at) < new Date('2026-10-20'))).toBe(true)
  })

  it('téléphone seul : pas et calories seulement côté import', () => {
    const list = personaEntries(demo, { day: 14, equipment: 'phone', now })
    expect(types(list).has('sleep')).toBe(false)
    expect(types(list).has('heart_rate')).toBe(false)
    expect(types(list).has('steps')).toBe(true)
    expect(types(list).has('food')).toBe(true)
  })

  it('montre sans VFC : ni VFC, ni montre Huawei, ni poids', () => {
    const list = personaEntries(demo, { day: 45, equipment: 'watch', now })
    expect(list.some((e) => e.payload?.subtype === 'heartRateVariability')).toBe(false)
    expect(list.some((e) => e.source === 'huawei_watch')).toBe(false)
    expect(types(list).has('weight')).toBe(false)
    expect(types(list).has('sleep')).toBe(true)
  })

  it('refuse un matériel inconnu', () => {
    expect(() => keepForEquipment({ type: 'sleep' }, 'tablette')).toThrow(/inconnu/)
  })
})
