import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'

// POL-PLAY-101 (02/11) : Figtree (polices embarquées) n'a pas les lettres en exposant « ᵉ » (U+1D49) ni « ʳ » (U+02B3) :
// « 21ᵉ » s'affichait dans une police de secours. Les ordinaux passent par <Ordinal> (<sup> stylé).
const SRC = join(cwd(), 'src')
const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.(jsx?|json)$/.test(name) && !/\.test\./.test(name) ? [path] : []
  })

describe('lettres en exposant absentes de Figtree (POL-PLAY-101)', () => {
  it('aucun texte de l’app ne contient « ᵉ » ni « ʳ »', () => {
    const offenders = files(SRC).filter((path) => /[ᵉʳ]/.test(readFileSync(path, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('l’exposant des ordinaux a un style commun', () => {
    const css = readFileSync(join(SRC, 'index.css'), 'utf8')
    expect(css).toMatch(/\.ordinal sup\s*\{[^}]*font-size/)
  })
})
