import { describe, it, expect } from 'vitest'
import { shouldShowUnlockReminder, UNLOCK_REMINDER_DELAY_MS } from './onboarding'
import { describeFaceUnlock } from '../services/faceSense'

// Version iOS (HealthTrack-iOS) : la lecture au déverrouillage n'existe pas sur iPhone (aucune app ne peut lire la
// caméra quand l'iPhone se déverrouille). Le plugin FaceSense de l'iPhone (ios/App/App/FaceSensePlugin.swift) rend
// donc `unlockAvailable: false` : le rappel d'Android (POL-PLAY-84) ne doit jamais apparaître, même après « Plus tard ».
const IPHONE_STATUS = { mode: 'app_open', enabled: false, running: false, unlockAvailable: false, unlock: false, permission: false }

describe('rappel de la lecture au déverrouillage sur iPhone', () => {
  it('jamais montré, même après « Plus tard » et le délai écoulé', () => {
    const now = new Date('2026-11-05T10:00:00Z')
    const doneAt = new Date(now.getTime() - 3 * UNLOCK_REMINDER_DELAY_MS).toISOString()
    expect(describeFaceUnlock(IPHONE_STATUS)).toBeNull()
    expect(shouldShowUnlockReminder({ unlockLater: true, doneAt }, describeFaceUnlock(IPHONE_STATUS), now)).toBe(false)
    expect(shouldShowUnlockReminder({ unlockLater: true, doneAt }, describeFaceUnlock({ ...IPHONE_STATUS, enabled: true }), now)).toBe(false)
  })

  it('témoin : le même état, avec la lecture au déverrouillage disponible (Android), le montrerait', () => {
    const now = new Date('2026-11-05T10:00:00Z')
    const doneAt = new Date(now.getTime() - 3 * UNLOCK_REMINDER_DELAY_MS).toISOString()
    expect(shouldShowUnlockReminder({ unlockLater: true, doneAt }, describeFaceUnlock({ ...IPHONE_STATUS, unlockAvailable: true }), now)).toBe(true)
  })
})
