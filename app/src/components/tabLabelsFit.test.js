import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/components/TabBar.css'), 'utf8')
const rules = (selector) =>
  [...css.matchAll(new RegExp(`(?:^|\\n)${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`, 'g'))].map((m) => m[1]).join('\n')
const prop = (selector, name) => rules(selector).match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim()

// NAV-LIBELLE-320 (revue du 06/11, 320 px en police ×1,3) : « Aujourd'… » et « Analys… » coupés dans la barre du bas,
// « NutritionTendances » collés dans les sous-onglets. Le libellé suit la largeur de son onglet (unités cqi), sans
// jamais dépasser sa taille d'origine (min avec 1em) : rien ne change à la taille du Galaxy A56 en police normale.
describe('libellés des onglets entiers sur petit écran (NAV-LIBELLE-320)', () => {
  it('barre du bas : chaque onglet est un conteneur, le libellé est borné par sa largeur', () => {
    expect(prop('.tabbar-link', 'container-type')).toBe('inline-size')
    expect(prop('.tabbar-label', 'font-size')).toMatch(/^min\(1em, \d+(\.\d+)?cqi\)$/)
  })

  it('sous-onglets du Journal et d’Analyses : bornés par la largeur de la rangée', () => {
    expect(prop('.journal-tabs', 'container-type')).toBe('inline-size')
    expect(prop('.journal-tab', 'font-size')).toMatch(/^min\(1em, \d+(\.\d+)?cqi\)$/)
  })
})
