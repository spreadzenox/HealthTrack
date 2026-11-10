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
const px = (b, prop) => Number((b.match(new RegExp(`(?:^|;|\\s)${prop}:\\s*(\\d+)px`)) || [])[1])

// Revue --play --empty du 10/11 : à « 0/28 », le rail seul (couleur du thème, aussi foncé que le permet le contraste
// avec le fond) se lisait comme une barre pleine. La barre garde un point de départ, rond, de la hauteur du rail :
// une barre vide se voit vide.
describe('barres de progression : un point de départ visible à zéro (POLISH-BARRE-VIDE)', () => {
  for (const [file, rail, fill] of [
    ['src/components/DigestBlock.css', '.digest-progress', '.digest-progress-bar'],
    ['src/components/TodayCards.css', '.pistes-progress', '.pistes-progress-bar'],
  ]) {
    it(`${fill} a une largeur minimale égale à la hauteur du rail`, () => {
      const css = read(file)
      const h = px(body(css, rail), 'height')
      expect(h).toBeGreaterThan(0)
      expect(px(body(css, fill), 'min-width')).toBe(h)
    })
  }
})
