import { describe, it, expect, beforeEach } from 'vitest'
import { isDebugModeEnabled, setDebugModeEnabled } from './debugMode'

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
})
