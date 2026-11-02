import { describe, it, expect } from 'vitest'
import { localeDate } from './locale.js'
import { dayHeading } from '../services/dailyJournal.js'
import { describeCredits } from '../services/aiRelay.js'

describe('localeDate (« 1er » du mois en français)', () => {
  it('écrit « 1er novembre » et laisse les autres jours inchangés', () => {
    expect(localeDate(new Date(2026, 10, 1), { day: 'numeric', month: 'long' })).toBe('1er novembre')
    expect(localeDate(new Date(2026, 10, 11), { day: 'numeric', month: 'long' })).toBe('11 novembre')
    expect(localeDate(new Date(2026, 10, 21), { day: 'numeric', month: 'long' })).toBe('21 novembre')
  })

  it('marche avec le jour de la semaine et l’année', () => {
    expect(localeDate(new Date(2026, 10, 1), { weekday: 'long', day: 'numeric', month: 'long' })).toBe('dimanche 1er novembre')
    expect(localeDate(new Date(2026, 11, 1), { day: 'numeric', month: 'short', year: 'numeric' })).toBe('1er déc. 2026')
  })

  it('ne touche pas une date sans jour', () => {
    expect(localeDate(new Date(2026, 10, 1), { month: 'long', year: 'numeric' })).toBe('novembre 2026')
  })

  it('en-tête « Hier » du Journal et des repas : « 1er novembre »', () => {
    expect(dayHeading('2026-11-01', new Date(2026, 10, 2, 9))).toEqual({ title: 'Hier', date: '1er novembre' })
  })

  it('renouvellement des crédits le 1er', () => {
    const resetAt = new Date(2026, 11, 1).toISOString()
    expect(describeCredits({ remaining: 3, plan: 'free', resetAt })).toMatch(/renouvellement le 1er décembre$/)
  })
})
