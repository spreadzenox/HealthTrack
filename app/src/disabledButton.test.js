import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/App.css'), 'utf8')

const rule = (selector) => css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

// Audit Repas à 360 px (POL-PLAY-74) : « Remplir avec l’IA » et « Enregistrer ce repas » désactivés gardaient le fond
// émeraude à 60 % d’opacité et passaient pour des boutons actifs qui ne réagissent pas (même défaut que POL-PLAY-58).
describe('boutons .btn désactivés (POL-PLAY-74)', () => {
  it('prennent un fond neutre, un texte secondaire et une bordure, sans simple transparence', () => {
    const disabled = rule('.btn:disabled')
    expect(disabled).toMatch(/background:\s*var\(--surface\)/)
    expect(disabled).toMatch(/color:\s*var\(--text-muted\)/)
    expect(disabled).toMatch(/border:\s*2px solid var\(--border\)/)
    expect(disabled).not.toMatch(/opacity:\s*0\.\d/)
  })

  it('ne changent pas de fond au survol', () => {
    expect(css).toMatch(/\.btn:hover:not\(:disabled\)/)
  })
})
