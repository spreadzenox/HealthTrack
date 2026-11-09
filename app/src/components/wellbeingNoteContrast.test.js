import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/App.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const bodyOf = (selector) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, sel]) => sel.split(',').map((s) => s.trim()).includes(selector))
    .map(([, , body]) => body)
    .join(';')

// POLISH-CONTRASTE-NOTE (09/11) : le chiffre de la note choisie (vert sur vert pâle translucide) n'avait que
// 3,72:1 en clair. Il prend le couple du thème bien-être (mint-bg / mint-label), vérifié ≥ 4,5:1 dans les deux
// thèmes par tokens.test.js ; plus de fond translucide dont le contraste dépend de ce qu'il y a dessous.
describe('note de bien-être choisie : contraste (POLISH-CONTRASTE-NOTE)', () => {
  it('fond et chiffre viennent du couple mint vérifié', () => {
    const body = bodyOf('.wellbeing-circle-selected')
    expect(body).toMatch(/background:\s*var\(--mint-bg\)/)
    expect(body).toMatch(/color:\s*var\(--mint-label\)/)
  })
  it('le rond plein reprend la même couleur que le chiffre', () => {
    const body = bodyOf('.wellbeing-circle-selected .wellbeing-circle-dot')
    expect(body).toMatch(/background:\s*var\(--mint-label\)/)
    expect(body).toMatch(/border-color:\s*var\(--mint-label\)/)
  })
})
