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
    expect(featuresFor('sideload')).toMatchObject({ faceUnlock: true, faceAppOpen: false, aiRelay: false })
    expect(featuresFor('play')).toMatchObject({ faceUnlock: false, faceAppOpen: true, aiRelay: true })
    // Abonnement Google Play : seulement dans la variante play ; la sideload ne perd aucune fonction
    expect(featuresFor('play').billing).toBe(true)
    expect(featuresFor('sideload').billing).toBe(false)
  })

  it('réglage « Mode diagnostic » visible d’emblée en sideload seulement (VC-4)', () => {
    expect(featuresFor('sideload').debugMenu).toBe(true)
    expect(featuresFor('play').debugMenu).toBe(false)
  })

  it('nom technique du modèle d’IA : jamais dans la variante play (31/10)', () => {
    expect(featuresFor('play').aiModelName).toBe(false)
    expect(featuresFor('sideload').aiModelName).toBe(true)
  })
})
