import { describe, it, expect } from 'vitest'
import { THEME_TONES, measureTheme, measureTone } from './themes'

describe('une couleur par thème (AUJ-8, leçon 12)', () => {
  it('associe chaque thème du propriétaire à son pastel', () => {
    expect(THEME_TONES).toEqual({
      wellbeing: 'mint', digestion: 'peach', activity: 'lilac', sleep: 'night', body: 'rose', context: 'stone',
    })
  })

  it('range chaque mesure dans son thème', () => {
    expect(measureTone('sleepMinutes')).toBe('night')
    expect(measureTone('hrv')).toBe('rose')
    expect(measureTone('restingHr')).toBe('rose')
    expect(measureTone('watchStress')).toBe('rose')
    expect(measureTone('steps')).toBe('lilac')
    expect(measureTone('screenMinutes')).toBe('stone')
    expect(measureTone('weather')).toBe('stone')
    expect(measureTone('gut')).toBe('peach')
    expect(measureTone('wellbeing')).toBe('mint')
  })

  it('une mesure inconnue reste neutre', () => {
    expect(measureTheme('inconnue')).toBe('context')
  })
})
