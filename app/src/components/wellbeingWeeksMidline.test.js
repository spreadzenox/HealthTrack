import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/components/Horizon.css'), 'utf8')
const rule = (selector) => css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] || ''

// Revue C1 du 06/11 (WEEKS-MIDLINE) : dans l'historique du bien-être, le pointillé veut dire « moyenne » et le
// milieu de l'échelle (2,5) est un trait plein. Le graphique « Sur quelques semaines » marquait ce milieu en
// pointillé : on l'aurait lu comme une moyenne. Même code que l'historique : trait plein.
describe('« Sur quelques semaines » : repère du milieu de l’échelle (WEEKS-MIDLINE)', () => {
  it('le repère 2,5 / 5 est un trait plein, pas un pointillé', () => {
    const before = rule('.wb-weeks-track::before')
    expect(before).toMatch(/border-top:\s*1px solid/)
    expect(before).not.toMatch(/dashed/)
  })
})
