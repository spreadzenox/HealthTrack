import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/Food.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
// Toutes les règles dont la liste de sélecteurs contient `selector`.
const rulesFor = (selector) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, sel]) => sel.split(',').map((s) => s.trim()).includes(selector))
    .map(([, sel, body]) => ({ selectors: sel.split(',').map((s) => s.trim()), body }))

// Revue du 09/11 (Données, Sources, Paramètres) : la phrase d'introduction avait le style d'un titre de section
// (gras, même taille) ; « Les apps et appareils… » et « Mes appareils » se lisaient comme deux titres. Leçon : même
// apparence = même type d'information.
describe('phrase d’introduction des pages ≠ titre de section (INTRO-TITRE)', () => {
  it('l’intro ne partage aucune règle avec .section-title', () => {
    for (const sel of ['.food-page .page-intro', '.journal-page .page-intro']) {
      for (const r of rulesFor(sel)) expect(r.selectors).not.toContain('.section-title')
    }
  })

  it('l’intro est en graisse normale', () => {
    const body = rulesFor('.food-page .page-intro').map((r) => r.body).join(';')
    expect(body).toMatch(/font-weight:\s*400/)
  })
})
