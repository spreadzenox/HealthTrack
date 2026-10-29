import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[2] ?? ''
}

// Audit du 29/10 (POL-PLAY-41) : la carte d'analyse d'une photo est une section .results, dont les lignes
// d'ingrédients (.results li) sont en flex « espace entre » : « Riche en fructanes : … oignon, ail » s'étirait d'un
// bord à l'autre, et « Enregistrer ce repas » se coupait sur deux lignes dans un demi-bouton.
describe('carte d’analyse d’un repas (POL-PLAY-41)', () => {
  it('les lignes FODMAP ne reprennent pas la mise en page des lignes d’ingrédients', () => {
    const li = rule(read('./components/MealFodmapLine.css'), '.meal-fodmap-list li')
    expect(li).toContain('display: block')
    expect(li).toContain('padding: 0')
    expect(li).toContain('border: 0')
  })

  it('« Enregistrer ce repas » prend toute la ligne, « Nouvelle photo » ou « Annuler » dessous', () => {
    const css = read('./Food.css')
    expect(rule(css, '.results .actions,\n.new-meal .actions')).toContain('flex-direction: column')
  })
})
