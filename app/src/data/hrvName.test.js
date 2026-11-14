import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import process from 'node:process'
import { stripComments } from './wordingRules.js'
import { TREND_MEASURES } from '../services/trendsData'
import { BASELINE_METRICS } from '../services/baselines'
import { FACTORS } from '../services/analysisResults'

/**
 * POLISH-SIM-72 : une persona lisait « VFC » sur Aujourd'hui et « variabilité cardiaque » dans Sources sans voir que
 * c'était la même mesure. Un seul nom dans les textes visibles : « variabilité cardiaque ».
 */
const SRC = join(process.cwd(), 'src')
// Journal technique de la montre (mode diagnostic caché) : pas un texte de l'app
const ALLOWED = new Set(['devices/huawei/sync.js'])

function sources(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name !== 'changelog' && name !== '__mocks__') sources(p, out)
    } else if (/\.(js|jsx)$/.test(name) && !/\.test\./.test(name)) out.push(p)
  }
  return out
}

describe('variabilité cardiaque : un seul nom (POLISH-SIM-72)', () => {
  it('aucun texte de l’app ne dit « VFC »', () => {
    const found = sources(SRC)
      .filter((p) => !ALLOWED.has(relative(SRC, p)))
      .filter((p) => stripComments(readFileSync(p, 'utf8')).some((line) => /VFC/.test(line)))
      .map((p) => relative(SRC, p))
    expect(found).toEqual([])
  })

  it('Tendances, normes et Analyses portent le même nom', () => {
    expect(TREND_MEASURES.find((m) => m.key === 'hrv').label).toBe('Variabilité cardiaque')
    expect(BASELINE_METRICS.heartRateVariability.label).toBe('Variabilité cardiaque')
    expect(FACTORS.find((f) => f.key === 'hrv_ms').label).toBe('Variabilité cardiaque')
  })
})
