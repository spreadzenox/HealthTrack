import { describe, it, expect } from 'vitest'
import { resolveDistribution, featuresFor, DISTRIBUTION, FEATURES } from './distribution'

describe('variante de distribution', () => {
  it('sideload par défaut, y compris pour une valeur inconnue', () => {
    expect(resolveDistribution(undefined)).toBe('sideload')
    expect(resolveDistribution('')).toBe('sideload')
    expect(resolveDistribution('store')).toBe('sideload')
    expect(DISTRIBUTION).toBe('sideload')
  })

  it('reconnaît play sans tenir compte de la casse ni des espaces', () => {
    expect(resolveDistribution('play')).toBe('play')
    expect(resolveDistribution(' PLAY ')).toBe('play')
  })

  it("seule la variante sideload a l'auto-mise à jour", () => {
    expect(featuresFor('sideload').selfUpdate).toBe(true)
    expect(featuresFor('play').selfUpdate).toBe(false)
    expect(FEATURES.selfUpdate).toBe(true)
  })

  it('lecture du visage : au déverrouillage en sideload, à l’ouverture de l’app en play', () => {
    expect(featuresFor('sideload')).toMatchObject({ faceUnlock: true, faceAppOpen: false })
    expect(featuresFor('play')).toMatchObject({ faceUnlock: false, faceAppOpen: true })
  })
})
