import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Version iOS (HealthTrack-iOS) : sur iPhone, sans abonnement, Analyses › « Pistes à tester » montre chaque piste
// verrouillée par une barre floutée (`.pistes-first-blur`, TodayCards.css) puis « Débloquer ». La barre est un `span`
// vide qui ne prend sa largeur (`flex: 1`) et sa hauteur que dans un conteneur flexible ; dans le titre de la piste
// (`.reco-piste-title`, bloc ordinaire), elle restait invisible : la carte n'avait plus que « Débloquer » (captures de
// l'iPhone 16e, 08/11). Correctif 50 ; demandé aussi à Android (DEMANDES.md). Vitest tourne depuis upstream/app
const css = readFileSync(join(process.cwd(), 'src/pages/Recommendations.css'), 'utf8')
const cards = readFileSync(join(process.cwd(), 'src/components/TodayCards.css'), 'utf8')
const rule = (source, selector) =>
  source.match(new RegExp(`(?:^|\\n)${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

describe('Analyses, piste verrouillée : la barre floutée se voit', () => {
  it('le titre d’une piste verrouillée est un conteneur flexible, à la hauteur d’une ligne', () => {
    const locked = rule(css, '.reco-piste-title.is-locked')
    expect(locked).toMatch(/display:\s*flex/)
    expect(locked).toMatch(/align-items:\s*center/)
    expect(locked).toMatch(/min-height:/)
  })

  it('la barre floutée garde sa largeur flexible et sa hauteur', () => {
    const blur = rule(cards, '.pistes-first-blur')
    expect(blur).toMatch(/flex:\s*1/)
    expect(blur).toMatch(/height:\s*12px/)
  })
})
