import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/components/AddStrip.css'), 'utf8')
const rules = (selector) =>
  [...css.matchAll(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g'))]
    .map((m) => m[1]).join('\n')
const prop = (selector, name) => rules(selector).match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim()

// GRANDE-POLICE-1 (revue du 09/11, 320 px en police ×1,3) : « Digestion » collé au bord de sa pastille et
// « + 1 cigarette » qui dépasse dans le bandeau d'ajout. La largeur minimale d'une case suit la police (rem), sans
// rien changer en taille normale (4,25rem = 68 px) ; le libellé de la cigarette passe à la ligne entre les mots.
describe('libellés du bandeau d’ajout entiers en grande police (GRANDE-POLICE-1)', () => {
  it('la largeur minimale d’une case suit la police, 68 px en taille normale', () => {
    const cols = prop('.add-strip-row', 'grid-auto-columns')
    const m = cols?.match(/^minmax\(max\(68px, (\d+(?:\.\d+)?)rem\), 1fr\)$/)
    expect(m).not.toBeNull()
    expect(Number(m[1]) * 16).toBe(68)
  })

  it('« + 1 cigarette » passe à la ligne entre les mots', () => {
    expect(prop('.add-chip-slot .btn.dashboard-cigarette-btn', 'white-space')).toBe('normal')
  })
})
