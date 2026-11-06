import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const rule = (file, selector) => {
  const css = readFileSync(resolve(process.cwd(), file), 'utf8')
  return css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] || ''
}

// Revue C1 du 06/11 13:35 (grande police, 360 px) : dans Paramètres → « Ce qui vous amène », le rond radio de « Tout
// comprendre de mes données » rétrécissait quand le libellé passait sur deux lignes. Un rond de choix garde sa taille.
describe('ronds radio des choix : taille fixe', () => {
  it.each([
    ['src/Food.css', '.theme-choice input'],
    ['src/pages/Premium.css', '.paywall-plan input'],
    ['src/pages/Onboarding.css', '.onb-choice input'],
  ])('%s %s ne rétrécit pas', (file, selector) => {
    expect(rule(file, selector)).toMatch(/flex-shrink:\s*0/)
  })
})
