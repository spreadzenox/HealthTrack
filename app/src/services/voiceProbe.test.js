import { describe, it, expect } from 'vitest'
import { probeVoice, voiceVerdict, voiceProbeDiagnostic, voiceProbeLine } from './voiceProbe'

const a56 = {
  sdk: 36,
  language: 'fr-FR',
  available: true,
  onDevice: true,
  defaultService: 'com.google.android.as',
  services: ['com.google.android.as', 'com.samsung.android.bixby.agent'],
  supportFrom: 'on_device',
  support: { installed: ['en-US', 'fr-FR'], pending: [], supported: ['de-DE'], online: [] },
  errors: [],
}

describe('voiceVerdict', () => {
  it('distingue installé, en cours, téléchargeable, inconnu, en ligne seulement, rien', () => {
    expect(voiceVerdict(null)).toBeNull()
    expect(voiceVerdict(a56)).toBe('on_device_fr')
    expect(voiceVerdict({ ...a56, support: { installed: ['fr_FR'] } })).toBe('on_device_fr')
    expect(voiceVerdict({ ...a56, support: { installed: ['en-US'], pending: ['fr-FR'] } })).toBe('on_device_fr_pending')
    expect(voiceVerdict({ ...a56, support: { installed: ['en-US'], supported: ['fr'] } })).toBe('on_device_fr_downloadable')
    expect(voiceVerdict({ ...a56, support: { installed: ['en-US'], supported: ['frr-XX'] } })).toBe('on_device_no_fr')
    expect(voiceVerdict({ ...a56, support: undefined })).toBe('on_device_unknown_language')
    expect(voiceVerdict({ ...a56, onDevice: false, support: undefined })).toBe('online_only')
    expect(voiceVerdict({ sdk: 36, available: false, onDevice: false })).toBe('none')
  })

  it('un moteur par défaut sans reconnaissance locale qui connaît le français en local compte quand même', () => {
    expect(voiceVerdict({ ...a56, onDevice: false, supportFrom: 'default' })).toBe('on_device_fr')
  })
})

describe('probeVoice', () => {
  it('rend null hors de l’app ou en cas d’erreur, sans jamais lever', async () => {
    expect(await probeVoice(null)).toBeNull()
    expect(await probeVoice({ probe: () => Promise.reject(new Error('x')) })).toBeNull()
    expect(await probeVoice({ probe: async () => a56 })).toBe(a56)
  })
})

describe('voiceProbeDiagnostic', () => {
  it('garde des faits sur le téléphone, jamais un son', () => {
    const r = voiceProbeDiagnostic(a56)
    expect(r).toMatchObject({
      verdict: 'on_device_fr',
      available: true,
      onDevice: true,
      defaultService: 'com.google.android.as',
      services: ['com.google.android.as', 'com.samsung.android.bixby.agent'],
      installed: ['en-US', 'fr-FR'],
      supportFrom: 'on_device',
    })
    expect(voiceProbeDiagnostic(null)).toBeNull()
    expect(voiceProbeDiagnostic({ ...a56, support: undefined, supportError: 5, supportTimeout: true, errors: ['defaultService: SecurityException'] }))
      .toMatchObject({ installed: null, supportError: 5, supportTimeout: true, errors: ['defaultService: SecurityException'] })
  })
})

describe('voiceProbeLine', () => {
  it('dit en clair ce que le téléphone sait faire', () => {
    expect(voiceProbeLine(null)).toBeNull()
    expect(voiceProbeLine(a56)).toBe('Voix (sonde, aucun micro ouvert) : reconnaissance en français sur le téléphone, installée · moteur par défaut : Android System Intelligence · moteurs : Android System Intelligence, Bixby')
    expect(voiceProbeLine({ ...a56, support: { installed: [], supported: ['fr-FR'] } })).toMatch(/français téléchargeable/)
    expect(voiceProbeLine({ ...a56, onDevice: false, support: undefined, defaultService: undefined, services: ['com.example.asr'] }))
      .toBe('Voix (sonde, aucun micro ouvert) : seulement une reconnaissance en ligne (le son partirait du téléphone : pas utilisée) · moteurs : com.example.asr')
    expect(voiceProbeLine({ sdk: 30, available: false, services: [] })).toBe('Voix (sonde, aucun micro ouvert) : aucune reconnaissance vocale sur ce téléphone')
  })
})
