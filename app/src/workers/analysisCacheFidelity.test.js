/**
 * Le cache des analyses (perf D2) passe par JSON (localStorage) et par le clonage structuré du
 * Web Worker : un résultat relu doit être identique au calcul, sinon l'écran changerait selon
 * qu'il vient du cache ou non (NaN / Infinity / undefined / Map perdus…).
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { generateDemoEntries } from '../../scripts/visual/demoData.mjs'
import { listEntriesForAnalysis } from '../storage/localHealthStorage'
import { ANALYSIS_TASKS } from './analysisTasks'

vi.mock('../storage/localHealthStorage', () => ({ listEntriesForAnalysis: vi.fn() }))

beforeAll(() => {
  const now = new Date().toISOString()
  const entries = generateDemoEntries({ days: 120 }).map((e, i) => ({ id: i + 1, created_at: now, payload: {}, ...e }))
  listEntriesForAnalysis.mockResolvedValue(entries)
})

describe('analyses : résultat identique après passage par le cache', () => {
  for (const task of Object.keys(ANALYSIS_TASKS)) {
    it(task, async () => {
      const result = await ANALYSIS_TASKS[task]()
      expect(result).not.toBeNull()
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(result)
      expect(structuredClone(result)).toStrictEqual(result)
    })
  }
})
