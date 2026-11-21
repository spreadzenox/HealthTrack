import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/components/DayChecklist.css'), 'utf8')
const rule = (selector) =>
  css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

// POLISH-SIM-131 (persona « Stressé et pressé » J1) : « Encore 1 chose aujourd’hui » sous une pastille pleine et deux
// vides, alors que deux choses sur trois étaient notées. Pleine = fait, vide = à faire (comme les repas, comprendre.SPEC).
describe('pastilles de Ma journée : pleine = fait (POLISH-SIM-131)', () => {
  it('une pastille faite est remplie, une pastille à faire ne l’est pas', () => {
    expect(rule('.day-dot:not(.is-todo)')).toMatch(/background:\s*var\(--color-brand\)/)
    expect(rule('.day-dot.is-todo')).not.toMatch(/background:\s*var\(--color-brand\)/)
  })
})
