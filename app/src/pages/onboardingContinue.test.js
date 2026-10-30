import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/pages/Onboarding.css'), 'utf8')

const rule = (selector) => css.match(new RegExp(`${selector.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

// Audit onboarding play à 360 px en sombre (POL-PLAY-58) : « Continuer » désactivé (aucun choix fait) gardait le fond
// émeraude à 60 % d'opacité et passait pour un bouton actif, qui ne réagissait pas au toucher.
describe('« Continuer » désactivé de l’onboarding (POL-PLAY-58)', () => {
  it('prend un fond neutre et un texte secondaire, sans simple transparence', () => {
    const disabled = rule('.onb-continue:disabled')
    expect(disabled).toMatch(/background:\s*var\(--surface\)/)
    expect(disabled).toMatch(/color:\s*var\(--text-muted\)/)
    expect(disabled).toMatch(/opacity:\s*1/)
  })
})
