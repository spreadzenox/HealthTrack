import { describe, it, expect } from 'vitest'
import { pilouSprite, SPRITES } from './sprites.js'
import { DOUZE } from './animateur.js'

describe('Pilou — images pré-rendues', () => {
  it('a une image pour chacune des 12 expressions', () => {
    for (const e of DOUZE) expect(SPRITES[e], e).toBeTruthy()
  })
  it('rend Tranquille pour une expression inconnue', () => {
    expect(pilouSprite('inconnue')).toBe(SPRITES.tranquille)
    expect(pilouSprite()).toBe(SPRITES.tranquille)
  })
})
