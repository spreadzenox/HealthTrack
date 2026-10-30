import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[2] ?? ''
}

// Audit du 30/10 (POL-PLAY-53) : .hint (Paramètres, Premium, Montre, Nouveautés…) n'avait aucun style commun : ces
// phrases d'aide s'affichaient en grand texte encre, plus fort que les explications voisines (.page-intro).
describe('phrases d’aide .hint (POL-PLAY-53)', () => {
  it('ont le style secondaire des explications', () => {
    const hint = rule(read('./App.css'), '.hint')
    expect(hint).toContain('color: var(--text-muted)')
    expect(hint).toContain('font-size: 0.9rem')
  })
})
