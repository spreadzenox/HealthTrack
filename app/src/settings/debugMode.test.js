import { describe, it, expect, beforeEach } from 'vitest'
import {
  AUTHORISED_MACS,
  isDebugUnlocked,
  isDebugModeEnabled,
  setDebugModeEnabled,
  getDebugMac,
  setDebugMac,
} from './debugMode'

describe('debugMode settings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('AUTHORISED_MACS contains the expected MAC address', () => {
    expect(AUTHORISED_MACS).toContain('74:f6:7a:6c:6d:25')
  })

  describe('isDebugUnlocked', () => {
    it('returns false when no MAC is stored', () => {
      expect(isDebugUnlocked()).toBe(false)
    })

    it('returns true when the authorised MAC is stored (exact)', () => {
      localStorage.setItem('healthtrack_debug_mac', '74:f6:7a:6c:6d:25')
      expect(isDebugUnlocked()).toBe(true)
    })

    it('returns true when the authorised MAC is stored (upper-case)', () => {
      localStorage.setItem('healthtrack_debug_mac', '74:F6:7A:6C:6D:25')
      expect(isDebugUnlocked()).toBe(true)
    })

    it('returns false for a non-authorised MAC', () => {
      localStorage.setItem('healthtrack_debug_mac', 'AA:BB:CC:DD:EE:FF')
      expect(isDebugUnlocked()).toBe(false)
    })
  })

  describe('setDebugMac', () => {
    it('returns true for the authorised MAC and stores it normalised', () => {
      const result = setDebugMac('74:F6:7A:6C:6D:25')
      expect(result).toBe(true)
      expect(localStorage.getItem('healthtrack_debug_mac')).toBe('74:f6:7a:6c:6d:25')
    })

    it('returns false for an unknown MAC', () => {
      const result = setDebugMac('00:11:22:33:44:55')
      expect(result).toBe(false)
    })

    it('trims whitespace before comparing', () => {
      const result = setDebugMac('  74:F6:7A:6C:6D:25  ')
      expect(result).toBe(true)
    })
  })

  describe('getDebugMac', () => {
    it('returns empty string when nothing is stored', () => {
      expect(getDebugMac()).toBe('')
    })

    it('returns stored MAC', () => {
      localStorage.setItem('healthtrack_debug_mac', '74:f6:7a:6c:6d:25')
      expect(getDebugMac()).toBe('74:f6:7a:6c:6d:25')
    })
  })

  describe('isDebugModeEnabled', () => {
    it('returns false when not unlocked', () => {
      localStorage.setItem('healthtrack_debug_mode_enabled', 'true')
      expect(isDebugModeEnabled()).toBe(false)
    })

    it('returns false when unlocked but not enabled', () => {
      setDebugMac('74:F6:7A:6C:6D:25')
      expect(isDebugModeEnabled()).toBe(false)
    })

    it('returns true when unlocked and enabled', () => {
      setDebugMac('74:F6:7A:6C:6D:25')
      setDebugModeEnabled(true)
      expect(isDebugModeEnabled()).toBe(true)
    })

    it('returns false after being disabled', () => {
      setDebugMac('74:F6:7A:6C:6D:25')
      setDebugModeEnabled(true)
      setDebugModeEnabled(false)
      expect(isDebugModeEnabled()).toBe(false)
    })
  })

  describe('setDebugModeEnabled', () => {
    it('sets enabled=true in localStorage', () => {
      setDebugModeEnabled(true)
      expect(localStorage.getItem('healthtrack_debug_mode_enabled')).toBe('true')
    })

    it('removes the key when set to false', () => {
      setDebugModeEnabled(true)
      setDebugModeEnabled(false)
      expect(localStorage.getItem('healthtrack_debug_mode_enabled')).toBeNull()
    })
  })
})
