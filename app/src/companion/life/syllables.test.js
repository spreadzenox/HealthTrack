import { describe, it, expect } from 'vitest'
import { hopsFor, syllableCount } from './syllables'

describe('syllabes du nom', () => {
  it('cas simples', () => {
    expect(syllableCount('Pilou')).toBe(2)
    expect(syllableCount('Lune')).toBe(1)
    expect(syllableCount('Noisette')).toBe(2)
    expect(syllableCount('Bob')).toBe(1)
    expect(syllableCount('Câlinou')).toBe(3)
    expect(syllableCount('Zoé')).toBe(2)
  })

  it('jamais d’erreur, au moins un saut, deux au-delà de 3 syllabes', () => {
    expect(hopsFor('')).toBe(1)
    expect(hopsFor('42')).toBe(1)
    expect(hopsFor('🙂')).toBe(1)
    expect(hopsFor('Pilou')).toBe(2)
    expect(hopsFor('Anastasia')).toBe(2)
  })
})
