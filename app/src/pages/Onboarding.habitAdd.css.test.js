import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// REFONTE-5b-3 (captures à 320 px et en grande police, 27/11) : au temps 4 de l'accueil, le champ « Ajouter une
// habitude… » et le bouton « Ajouter » restaient sur une ligne, et le champ coupait son texte (« Ajouter une ha »).
// La rangée passe à la ligne quand le champ n'a plus la place de son texte ; seul, le bouton prend toute la largeur.
const css = readFileSync(join(process.cwd(), 'src/pages/Onboarding.css'), 'utf8')
const rules = (sel) =>
  [...css.matchAll(new RegExp(`(?:^|\\n)${sel.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`, 'g'))].map((m) => m[1]).join('\n')

describe('accueil, temps 4 : ajout d’une habitude sur un petit écran', () => {
  it('la rangée passe à la ligne', () => {
    expect(rules('.onb-habit-add')).toMatch(/flex-wrap:\s*wrap/)
  })
  it('le champ garde la place de son texte avant de passer à la ligne', () => {
    expect(rules('.onb-habit-input')).toMatch(/flex:\s*999 1 13em/)
  })
  it('seul sur sa ligne, le bouton prend toute la largeur', () => {
    expect(rules('.onb-habit-add .btn')).toMatch(/flex:\s*1 0 auto/)
  })
})
