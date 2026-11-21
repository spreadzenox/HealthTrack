import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/pages/Recommendations.css'), 'utf8')
const rule = (selector) =>
  css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

// DEM-IOS-15 : la barre floutée d'une piste verrouillée (`.pistes-first-blur`, `flex: 1`) est un span vide posé dans
// `.reco-piste-title`, un span ordinaire : elle mesurait 0 × 0 et la piste n'avait aucun titre visible. Le titre
// verrouillé est un conteneur flexible, la barre prend donc la largeur de la carte et sa hauteur.
describe('piste verrouillée : la barre floutée se voit (DEM-IOS-15)', () => {
  it('le titre verrouillé est un conteneur flexible', () => {
    expect(rule('.reco-piste-title.is-locked')).toMatch(/display:\s*flex/)
  })
})
