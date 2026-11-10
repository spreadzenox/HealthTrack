import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const read = (f) => readFileSync(resolve(process.cwd(), f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const body = (css, selector) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, sel]) => sel.split(',').map((s) => s.trim()).includes(selector))
    .map(([, , b]) => b)
    .join(';')
const px = (b, prop) => Number((b.match(new RegExp(`(?:^|;|\\s)${prop}:\\s*(-?\\d+)px`)) || [])[1])

// Revue --play du 10/11 04:35 : dans « Votre profil » (Journal › Nutrition), chaque valeur touchable avait 44 px de
// haut pour 20 px de texte : trois lignes occupaient la moitié de l'écran et se lisaient comme du texte flottant.
// Les lignes se resserrent ; la zone de toucher garde ses 44 px par un débord invisible.
describe('Votre profil : lignes resserrées, cible tactile de 44 px (POLISH-PROFIL-SERRE)', () => {
  const css = read('src/pages/Nutrition.css')

  it('une valeur touchable ne fait pas plus de 32 px de haut à l’écran', () => {
    const h = px(body(css, '.nutrition-profile-sourced'), 'min-height')
    expect(h).toBeLessThanOrEqual(32)
  })

  it('son débord invisible porte la cible à au moins 44 px', () => {
    const b = body(css, '.nutrition-profile-sourced')
    const h = px(b, 'min-height')
    expect(b).toMatch(/position:\s*relative/)
    const after = body(css, '.nutrition-profile-sourced::after')
    expect(after).toMatch(/position:\s*absolute/)
    const top = -px(after, 'top')
    const bottom = -px(after, 'bottom')
    expect(h + top + bottom).toBeGreaterThanOrEqual(44)
  })
})
