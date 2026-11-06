import { describe, it, expect } from 'vitest'
import { isNarrowBox } from './useNarrowBox'

describe('isNarrowBox', () => {
  it('largeur exprimée en rem : la grande police compte comme un écran plus étroit', () => {
    // 320 px, police ×1,3 (racine 20,8 px) : ~280 px utiles = 13,5 rem → étroit
    expect(isNarrowBox(280, 20.8, 16)).toBe(true)
    // 360 px, police ×1,3 : 320 px = 15,4 rem → étroit
    expect(isNarrowBox(320, 20.8, 16)).toBe(true)
    // 320 px, police normale : 280 px = 17,5 rem → trois colonnes
    expect(isNarrowBox(280, 16, 16)).toBe(false)
    // 360 px, police normale
    expect(isNarrowBox(320, 16, 16)).toBe(false)
  })

  it('pas encore mesuré (0 px, jsdom) : jamais étroit', () => {
    expect(isNarrowBox(0, 16, 16)).toBe(false)
    expect(isNarrowBox(280, 0, 16)).toBe(false)
  })
})
