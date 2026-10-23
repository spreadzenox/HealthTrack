import { describe, it, expect, beforeEach } from 'vitest'
import { isDebugModeEnabled, setDebugModeEnabled, isDebugMenuUnlocked, unlockDebugMenu, DEBUG_UNLOCK_TAPS } from './debugMode'

describe('debugMode settings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('is off by default', () => {
    expect(isDebugModeEnabled()).toBe(false)
  })

  it('turns on and off without any unlock step', () => {
    setDebugModeEnabled(true)
    expect(isDebugModeEnabled()).toBe(true)
    setDebugModeEnabled(false)
    expect(isDebugModeEnabled()).toBe(false)
    expect(localStorage.getItem('healthtrack_debug_mode_enabled')).toBeNull()
  })

  it('keeps a mode enabled before the MAC gate was removed', () => {
    localStorage.setItem('healthtrack_debug_mode_enabled', 'true')
    expect(isDebugModeEnabled()).toBe(true)
  })

  it('réglage caché déverrouillé une fois pour toutes (7 touches sur la version, VC-4)', () => {
    expect(DEBUG_UNLOCK_TAPS).toBe(7)
    expect(isDebugMenuUnlocked()).toBe(false)
    unlockDebugMenu()
    expect(isDebugMenuUnlocked()).toBe(true)
    // Déverrouiller n'active pas les journaux : c'est l'interrupteur qui le fait
    expect(isDebugModeEnabled()).toBe(false)
  })
})
