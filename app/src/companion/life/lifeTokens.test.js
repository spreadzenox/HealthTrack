import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// POLISH-MEET-DARK : la carte de la rencontre et ses bulles restaient claires sous un texte clair en thème sombre.
const read = (p) => readFileSync(join(import.meta.dirname, p), 'utf8')
const TOKENS = read('../../theme/tokens.css')
const LIFE = read('life.tokens.css')

function block(css, selector) {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) return {}
  const body = css.slice(start, css.indexOf('\n}', start))
  const long = (h) => (h.length === 4 ? `#${[...h.slice(1)].map((c) => c + c).join('')}` : h)
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6}|#[0-9a-f]{3})\b/gi)].map((m) => [m[1], long(m[2])]))
}
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const LIGHT = { ...block(TOKENS, ':root'), ...block(LIFE, ':root') }
const DARK = { ...LIGHT, ...block(TOKENS, ":root[data-theme='dark']"), ...block(LIFE, ":root[data-theme='dark']") }

describe('couleurs du compagnon (rencontre, bulles)', () => {
  for (const [name, t] of [['clair', LIGHT], ['sombre', DARK]]) {
    it(`le texte reste lisible sur la carte et les bulles (thème ${name})`, () => {
      for (const bg of ['life-card', 'life-white', 'life-sky-top', 'life-sky-low']) {
        expect(contrast(t['color-ink'], t[bg]), `color-ink sur ${bg}`).toBeGreaterThanOrEqual(4.5)
        expect(contrast(t['color-ink-2'], t[bg]), `color-ink-2 sur ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
})
