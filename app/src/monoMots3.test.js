import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// MONO-MOTS-3 (leçon de design 11 : « police mono pour les chiffres seulement ») : les dernières étiquettes qui
// mettaient des mots entiers en police à chasse fixe. Les chiffres, eux, passent par `monoDigits`.
const read = (p) => readFileSync(resolve(p), 'utf8')
const rule = (css, sel) => css.match(new RegExp(`(?:^|\\n)${sel.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`))?.[1]

const WORDS = {
  'src/pages/WatchData.css': ['.watch-data-tag', '.watch-data-value strong', '.watch-data-date,\n.watch-data-meta'],
  'src/pages/Nutrition.css': ['.nutrition-partial-tag'],
  'src/pages/Onboarding.css': ['.onb-import-line', '.onb-fact-value', '.onb-facts-source', '.onb-fact-source', '.onb-measure-status'],
}

// Classes que plus aucun composant n'utilise : retirées (ce qui ne sert pas est retiré, leçon 15)
const DEAD = {
  'src/pages/Recommendations.css': ['.reco-meta-line', '.reco-evidence', '.reco-link-meta', '.reco-link-src'],
  'src/components/WellbeingNudges.css': ['.mood-chip'],
  'src/pages/Onboarding.css': ['.onb-tile-num', '.onb-choice-num', '.onb-gesture-btn.mono'],
}

describe('MONO-MOTS-3 : plus de mots en police mono', () => {
  it.each(Object.entries(WORDS))('%s : les étiquettes de mots sont dans la police du texte', (file, sels) => {
    const css = read(file)
    for (const sel of sels) {
      const body = rule(css, sel)
      expect(body, sel).toBeDefined()
      expect(body, sel).not.toMatch(/font-mono/)
    }
  })

  it.each(Object.entries(DEAD))('%s : les règles mortes sont retirées', (file, sels) => {
    const css = read(file)
    for (const sel of sels) expect(css.includes(sel), sel).toBe(false)
  })
})
