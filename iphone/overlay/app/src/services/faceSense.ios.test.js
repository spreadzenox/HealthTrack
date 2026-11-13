import { describe, it, expect, afterEach } from 'vitest'
import { faceSensePlugin } from './faceSense'

// Sur iPhone, isNativePlatform() est vrai mais le plugin FaceSense (Java) n'existe pas : on le traite comme absent
describe('faceSensePlugin sur iOS', () => {
  afterEach(() => {
    delete window.Capacitor
  })

  it('plugin natif absent (Capacitor.isPluginAvailable faux) → aucun plugin', () => {
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', isPluginAvailable: () => false }
    expect(faceSensePlugin()).toBeNull()
  })

  it('plugin natif présent (Android) → le plugin', () => {
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', isPluginAvailable: (n) => n === 'FaceSense' }
    expect(faceSensePlugin()).not.toBeNull()
  })
})
