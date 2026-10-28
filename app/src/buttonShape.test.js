import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[2] ?? ''
}

// DESIGN.md : boutons pilule de 52 à 56 px. Avant POL-PLAY-24, « Découvrir le premium », « Restaurer un achat »,
// « Ajouter une source »… restaient en rectangle arrondi (rayon 12 px) à côté des pilules de l'Accueil.
describe('forme des boutons (POL-PLAY-24)', () => {
  it('.btn est une pilule d’au moins la hauteur de bouton', () => {
    const btn = rule(read('./App.css'), '.btn')
    expect(btn).toContain('border-radius: var(--radius-pill)')
    expect(btn).toContain('min-height: var(--button-height)')
  })

  it('les boutons Photo / Galerie / Décrire du Journal sont aussi des pilules', () => {
    expect(rule(read('./App.css'), '.upload-btn')).toContain('border-radius: var(--radius-pill)')
  })

  it('les boutons compacts gardent une cible tactile de 44 px', () => {
    expect(rule(read('./pages/Connectors.css'), '.connector-btn')).toContain('min-height: var(--tap-min)')
  })

  it('aucune feuille ne remet un .btn en rectangle', () => {
    for (const file of ['./App.css', './Food.css', './components/UpdateBanner.css', './pages/Connectors.css']) {
      const css = read(file)
      for (const [, selector, body] of css.matchAll(/([^{}]*\.btn[^{}]*)\{([^}]*)\}/g)) {
        if (/border-radius/.test(body)) expect(body, `${file} ${selector.trim()}`).toMatch(/border-radius: var\(--radius-pill\)/)
      }
    }
  })
})
