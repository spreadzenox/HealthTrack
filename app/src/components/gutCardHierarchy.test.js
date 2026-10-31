import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/components/TodayCards.css'), 'utf8')
const rule = (selector) => css.match(new RegExp(`(?:^|\\n)${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`))?.[1] || ''
const prop = (selector, name) => rule(selector).match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim()

// Audit Accueil vierge sombre du 31/10 (POL-PLAY-90) : « Votre ventre » et la question du soir avaient la même
// couleur d'étiquette et presque le même poids : deux titres empilés. Seul le titre garde la couleur d'étiquette.
describe('carte « Votre ventre » : un seul titre (POL-PLAY-90)', () => {
  it('la question du soir prend le texte de la carte, pas la couleur du titre', () => {
    expect(prop('.gut-card .today-card-title', 'color')).toBe('var(--peach-label)')
    expect(prop('.gut-evening-title', 'color')).toBe('var(--peach-text)')
  })

  it('la question est plus légère que le titre', () => {
    expect(Number(prop('.gut-evening-title', 'font-weight'))).toBeLessThan(Number(prop('.today-card-title', 'font-weight')))
  })
})
