import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkBudget } from './budget.mjs'

// jsdom : import.meta.url n'est pas une URL file:, on part du dossier de l'app (racine de vitest)
const DIR = resolve(process.cwd(), 'scripts/perf')

describe('budget de lectures IndexedDB (garde-fou D2)', () => {
  const budget = { days: 1095, routes: { '/': 800, '/food': 150 } }

  it('aucun dépassement : liste vide', () => {
    expect(checkBudget([{ path: '/', idbRecords: 700 }, { path: '/food', idbRecords: 150 }], budget)).toEqual([])
  })

  it('signale chaque page qui lit plus que son budget', () => {
    expect(checkBudget([{ path: '/', idbRecords: 801 }, { path: '/food', idbRecords: 1647 }], budget)).toEqual([
      { path: '/', idbRecords: 801, max: 800 },
      { path: '/food', idbRecords: 1647, max: 150 },
    ])
  })

  it("une page mesurée sans budget est signalée (pour qu'on lui en donne un)", () => {
    expect(checkBudget([{ path: '/new', idbRecords: 3 }], budget)).toEqual([{ path: '/new', idbRecords: 3, max: null }])
  })

  it('le budget du dépôt couvre toutes les pages mesurées par défaut', () => {
    const repoBudget = JSON.parse(readFileSync(resolve(DIR, 'budget.json'), 'utf8'))
    const src = readFileSync(resolve(DIR, 'perf-check.mjs'), 'utf8')
    const routes = JSON.parse(src.match(/const DEFAULT_ROUTES = (\[[^\]]*\])/)[1].replace(/'/g, '"'))
    expect(Object.keys(repoBudget.routes).sort()).toEqual([...routes].sort())
  })
})
