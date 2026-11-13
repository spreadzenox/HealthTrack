import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SLOP_WORDING } from '../data/wordingRules.js'

// Version iOS (HealthTrack-iOS) : Android teste ses formules bannies (SLOP-1) sur ses pages, sa fiche Play et ses
// notes ; l'iPhone a ses propres pages (conditions, confidentialité) et sa propre fiche App Store, relues avec les
// mêmes règles. Vitest tourne depuis upstream/app, où scripts/upstream.sh a copié overlay/ ; la fiche est à la racine
// du dépôt (store/app-store/fr-FR).
const read = (p) => readFileSync(join(process.cwd(), p), 'utf8')
const pageText = (html) => html
  .replace(/<title>[\s\S]*?<\/title>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
const offences = (text) => SLOP_WORDING.filter(({ re }) => re.test(text)).map(({ re, why }) => `${why} : ${text.match(re)?.[0]}`)

const PAGES = {
  'conditions-iphone.html': pageText(read('public/conditions-iphone.html')),
  'confidentialite-iphone.html': pageText(read('public/confidentialite-iphone.html')),
}
const FICHE = Object.fromEntries(['description', 'promotional-text', 'subtitle', 'name'].map((f) => [f,
  read(`../../store/app-store/fr-FR/${f}.txt`)]))

describe("textes propres à l'iPhone : mêmes règles d'écriture qu'Android (SLOP-1)", () => {
  for (const [name, text] of Object.entries(PAGES)) {
    it(`${name} : aucune formule bannie, « diagnostic » dit une fois`, () => {
      expect(offences(text)).toEqual([])
      expect(text.match(/diagnostic/g)).toHaveLength(1)
    })
  }

  it('fiche App Store : aucune formule bannie, « aucun diagnostic » dit une fois, dans le dernier paragraphe', () => {
    for (const [name, text] of Object.entries(FICHE)) expect(offences(text), name).toEqual([])
    expect(FICHE.description.match(/diagnostic/g)).toHaveLength(1)
    expect(FICHE.description).toMatch(/ne pose aucun diagnostic/)
  })

  it('la règle se vérifie vraiment : une formule bannie est repérée', () => {
    expect(offences("C'est une estimation, pas un diagnostic.")).not.toEqual([])
  })
})
