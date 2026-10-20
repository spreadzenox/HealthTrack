import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = join(import.meta.dirname, '..')
const TOKENS = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8')

/** Variables `--nom: #hex` d'un bloc du fichier de tokens. */
function block(selector) {
  const start = TOKENS.indexOf(`${selector} {`)
  const body = TOKENS.slice(start, TOKENS.indexOf('\n}', start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]))
}
const LIGHT = block(':root')
const DARK = { ...LIGHT, ...block(":root[data-theme='dark']") }

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

/** Couples texte / fond utilisés par l'app (journal/DESIGN.md § 3). */
const TEXT_ON = {
  'color-bg': ['color-ink', 'color-ink-2', 'color-brand', 'color-ok', 'color-warn', 'color-alert', 'color-danger', 'color-info', 'color-violet'],
  'color-surface': ['color-ink', 'color-ink-2', 'color-brand', 'color-ok', 'color-warn', 'color-alert', 'color-danger', 'color-info', 'color-violet'],
  'color-brand': ['color-on-brand'],
  'color-badge': ['color-on-badge'],
  'mint-bg': ['mint-text', 'mint-label', 'color-ink'],
  'peach-bg': ['peach-text', 'peach-label', 'color-ink'],
  'lilac-bg': ['lilac-text', 'lilac-bar', 'color-ink'],
}

describe('tokens de design', () => {
  it('reprennent les couleurs validées par le propriétaire', () => {
    expect(LIGHT).toMatchObject({
      'color-bg': '#ffffff', 'color-surface': '#f4f6f5', 'color-border': '#e3e8e6',
      'color-ink': '#10231d', 'color-ink-2': '#4a5e57', 'color-brand': '#0b7a5e',
      'mint-bg': '#e3f5ee', 'peach-bg': '#ffebdd', 'lilac-bg': '#ece9ff', 'color-badge': '#c2410c',
      'accent-amber': '#ffb84d', 'accent-mint': '#5ee0b5',
    })
  })

  for (const [name, theme] of [['clair', LIGHT], ['sombre', DARK]]) {
    it(`gardent un contraste ≥ 4,5:1 pour chaque couple texte / fond (thème ${name})`, () => {
      const faibles = []
      for (const [bg, fgs] of Object.entries(TEXT_ON)) {
        for (const fg of fgs) {
          const c = contrast(theme[fg], theme[bg])
          if (c < 4.5) faibles.push(`${fg} sur ${bg} : ${c.toFixed(2)}`)
        }
      }
      expect(faibles).toEqual([])
    })
  }

  it('sont la seule source de couleurs des feuilles de style', () => {
    const files = []
    const walk = (dir) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f)
        if (statSync(p).isDirectory()) walk(p)
        else if (p.endsWith('.css') && !p.endsWith('tokens.css')) files.push(p)
      }
    }
    walk(SRC)
    const brutes = []
    for (const file of files) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        const code = line.replace(/\/\*.*?\*\//g, '')
        if (/#[0-9a-f]{3,8}\b|rgba?\(\s*\d|hsla?\(|(?<![\w-])(white|black)(?![\w-])/i.test(code)) {
          brutes.push(`${relative(SRC, file)}:${i + 1}  ${line.trim()}`)
        }
      })
    }
    expect(brutes).toEqual([])
  })
})
