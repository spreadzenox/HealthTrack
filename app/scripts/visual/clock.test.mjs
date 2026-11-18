import { describe, it, expect } from 'vitest'
import { parseNow, usageDaysStorage } from './clock.mjs'
import { USAGE_DAYS_KEY } from '../../src/companion/world/context.js'

describe('parseNow (--now des captures)', () => {
  const ref = new Date('2026-11-18T07:30:00Z') // 08:30 à Paris

  it('une heure seule : ce jour-là, à cette heure, dans le fuseau des captures', () => {
    expect(parseNow('14:00', { tz: 'Europe/Paris', ref }).toISOString()).toBe('2026-11-18T13:00:00.000Z')
    expect(parseNow('9:05', { tz: 'America/New_York', ref }).toISOString()).toBe('2026-11-18T14:05:00.000Z')
  })

  it('le jour est celui du fuseau, pas celui de la machine', () => {
    // 07:30 UTC : à Honolulu (UTC-10), il est 21:30 le 17.
    expect(parseNow('12:00', { tz: 'Pacific/Honolulu', ref }).toISOString()).toBe('2026-11-17T22:00:00.000Z')
  })

  it('heure d’été prise en compte', () => {
    const summer = new Date('2026-07-01T10:00:00Z')
    expect(parseNow('14:00', { tz: 'Europe/Paris', ref: summer }).toISOString()).toBe('2026-07-01T12:00:00.000Z')
  })

  it('une date ISO complète est prise telle quelle', () => {
    expect(parseNow('2026-11-18T14:00:00+01:00').toISOString()).toBe('2026-11-18T13:00:00.000Z')
  })

  it('refuse une valeur illisible', () => {
    expect(() => parseNow('midi')).toThrow(/--now/)
    expect(() => parseNow('25:00')).toThrow(/--now/)
  })
})

describe('usageDaysStorage (--usage-days)', () => {
  it('donne la clé et la valeur gardées par l’îlot', () => {
    expect(usageDaysStorage('1').key).toBe(USAGE_DAYS_KEY)
    expect(usageDaysStorage('76')).toEqual({ key: 'halcya.world.usageDays', value: JSON.stringify({ day: '', days: 76 }) })
  })

  it('refuse un nombre négatif ou illisible', () => {
    expect(() => usageDaysStorage('-1')).toThrow(/--usage-days/)
    expect(() => usageDaysStorage('beaucoup')).toThrow(/--usage-days/)
  })
})
