/**
 * PERF-JOUR — Les tâches d'une même révision des données partagent une seule lecture de la base (Tendances › Jour
 * lançait `dayStates` puis `analysisResults`, chacune relisant toutes les saisies). Partager n'est sûr que si aucune
 * tâche ne modifie les saisies qu'elle reçoit : vérifié ici sur des saisies gelées, résultats identiques.
 */
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { buildTourEntries } from '../services/tourData'
import { ANALYSIS_TASKS, runAnalysisTask, _resetSharedEntries } from './analysisTasks'
import { listEntriesForAnalysis } from '../storage/localHealthStorage'

vi.mock('../storage/localHealthStorage', async (orig) => ({
  ...(await orig()),
  listEntriesForAnalysis: vi.fn(),
}))

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value)) deepFreeze(v)
  }
  return value
}

const env = globalThis.process.env
const TZ = env.TZ
beforeEach(() => {
  env.TZ = 'Europe/Paris'
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 20, 20, 0))
  _resetSharedEntries()
  listEntriesForAnalysis.mockReset()
})
afterEach(() => {
  vi.useRealTimers()
  env.TZ = TZ
})

describe('analysisTasks : une lecture partagée par révision', () => {
  it('deux tâches de la même révision ne lisent la base qu’une fois', async () => {
    listEntriesForAnalysis.mockResolvedValue([])
    await Promise.all([runAnalysisTask('dayStates', 'v|3|2026-11-20'), runAnalysisTask('analysisResults', 'v|3|2026-11-20')])
    await runAnalysisTask('changes', 'v|3|2026-11-20')
    expect(listEntriesForAnalysis).toHaveBeenCalledTimes(1)
  })

  it('une nouvelle révision relit la base', async () => {
    listEntriesForAnalysis.mockResolvedValue([])
    await runAnalysisTask('dayStates', 'v|3|2026-11-20')
    await runAnalysisTask('dayStates', 'v|4|2026-11-20')
    expect(listEntriesForAnalysis).toHaveBeenCalledTimes(2)
  })

  it('sans clé (visite guidée, appel direct) : lecture à chaque tâche, rien de gardé', async () => {
    listEntriesForAnalysis.mockResolvedValue([])
    await runAnalysisTask('dayStates')
    await runAnalysisTask('dayStates')
    expect(listEntriesForAnalysis).toHaveBeenCalledTimes(2)
  })

  it('une lecture en échec n’est pas gardée : la tâche suivante relit', async () => {
    listEntriesForAnalysis.mockRejectedValueOnce(new Error('base fermée')).mockResolvedValue([])
    await expect(runAnalysisTask('dayStates', 'v|5|2026-11-20')).rejects.toThrow(/base fermée/)
    await runAnalysisTask('dayStates', 'v|5|2026-11-20')
    expect(listEntriesForAnalysis).toHaveBeenCalledTimes(2)
  })

  it('aucune tâche ne modifie les saisies reçues (saisies gelées : mêmes résultats, aucune erreur)', async () => {
    const entries = buildTourEntries({
      days: 45,
      now: new Date(2026, 10, 20, 20, 0),
      received: new Set(['steps', 'sleep', 'heartRate', 'restingHeartRate', 'hrv', 'calories']),
      face: true,
      weather: true,
      screen: true,
    })
    const frozen = deepFreeze(structuredClone(entries))
    for (const task of Object.keys(ANALYSIS_TASKS)) {
      const fresh = await ANALYSIS_TASKS[task](async () => structuredClone(entries))
      const shared = await ANALYSIS_TASKS[task](async () => frozen)
      expect(JSON.parse(JSON.stringify(shared)), task).toEqual(JSON.parse(JSON.stringify(fresh)))
    }
  }, 60000)
})
