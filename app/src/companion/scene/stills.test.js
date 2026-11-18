import { describe, expect, it } from 'vitest'
import { STILL_SEASONS, STILL_STAGES, stillKey, stillName, stillStage } from './stills.js'

describe('images fixes de la scène (palier bas)', () => {
  it('étape de croissance : la plus grande atteinte', () => {
    expect(stillStage(null)).toBe(0)
    expect(stillStage(Number.NaN)).toBe(0)
    expect(stillStage(29)).toBe(0)
    expect(stillStage(30)).toBe(30)
    expect(stillStage(45)).toBe(30)
    expect(stillStage(89)).toBe(30)
    expect(stillStage(400)).toBe(90)
  })

  it('une image par étape et par saison, la nuit à part', () => {
    expect(stillKey({ days: 50, season: 'hiver' })).toBe('j30-hiver')
    expect(stillKey({ days: 3, season: 'automne' })).toBe('j0-automne')
    expect(stillKey({ days: 120, season: 'inconnue' })).toBe('j90-printemps-ete')
    expect(stillKey({ days: 120, season: 'hiver', night: true })).toBe('nuit')
  })

  it('les 13 images existent dans le dépôt', async () => {
    const files = import.meta.glob('./stills/*.webp')
    const names = Object.keys(files).map((f) => f.replace('./stills/', '').replace('.webp', '')).sort()
    const expected = ['nuit', ...STILL_STAGES.flatMap((d) => STILL_SEASONS.map((s) => stillName(d, s)))].sort()
    expect(names).toEqual(expected)
  })
})
