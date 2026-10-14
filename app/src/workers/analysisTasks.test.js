import { describe, it, expect, vi } from 'vitest'
import { runAnalysisTask } from './analysisTasks'
import { computeTodayPrediction } from '../services/analysisEngine'

vi.mock('../storage/localHealthStorage', () => ({ listEntriesForAnalysis: vi.fn().mockResolvedValue([{ id: 1 }]) }))
vi.mock('../services/analysisEngine', () => ({ computeTodayPrediction: vi.fn(() => ({ predicted: 2 })) }))

describe('analysisTasks', () => {
  it('todayPrediction relit la base puis calcule', async () => {
    expect(await runAnalysisTask('todayPrediction')).toEqual({ predicted: 2 })
    expect(computeTodayPrediction).toHaveBeenCalledWith([{ id: 1 }])
  })

  it('tâche inconnue : erreur explicite', async () => {
    await expect(runAnalysisTask('nope')).rejects.toThrow(/inconnue/)
  })
})
