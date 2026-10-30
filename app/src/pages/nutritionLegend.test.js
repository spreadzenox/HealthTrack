import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/pages/Nutrition.css'), 'utf8')

const background = (selector) => css.match(new RegExp(`\\.${selector}\\s*\\{[^}]*background:\\s*([^;]+);`))?.[1]?.trim()

// Audit démo sombre du 30/10 (POL-PLAY-56) : « bas » (#ff7b72) et « limite dépassée » (#ff8a65) se confondaient dans
// la légende et les barres ; et un repère pas encore atteint n'est pas une alerte (règle 6) : couleur neutre.
describe('couleurs des barres de Nutrition (POL-PLAY-56)', () => {
  it('donne une couleur différente à chaque état', () => {
    const colors = ['ok', 'partial', 'low', 'over'].map((s) => background(`nutrition-bar-${s}`))
    expect(colors.every(Boolean)).toBe(true)
    expect(new Set(colors).size).toBe(4)
  })

  it('ne colore pas « bas » comme une alerte', () => {
    expect(background('nutrition-bar-low')).not.toMatch(/danger|alert/)
  })
})
