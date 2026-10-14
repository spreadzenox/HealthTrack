import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAnalysis, peekAnalysis, analysisCacheKey, _resetAnalysisRunner } from './analysisRunner'
import { bumpDataRevision } from '../storage/dataRevision'
import { runAnalysisTask } from '../workers/analysisTasks'

vi.mock('../workers/analysisTasks', () => ({ runAnalysisTask: vi.fn() }))

beforeEach(() => {
  localStorage.clear()
  _resetAnalysisRunner()
  runAnalysisTask.mockReset()
  runAnalysisTask.mockResolvedValue({ predicted: 3 })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('analysisRunner — cache', () => {
  it('calcule une fois puis sert le cache (mémoire et localStorage)', async () => {
    expect(peekAnalysis('todayPrediction').hit).toBe(false)
    expect(await getAnalysis('todayPrediction')).toEqual({ predicted: 3 })
    expect(await getAnalysis('todayPrediction')).toEqual({ predicted: 3 })
    _resetAnalysisRunner() // mémoire vidée, comme après un redémarrage
    expect(peekAnalysis('todayPrediction')).toEqual({ hit: true, result: { predicted: 3 } })
    expect(runAnalysisTask).toHaveBeenCalledTimes(1)
  })

  it('met en cache un résultat nul (pas assez de données) sans recalculer', async () => {
    runAnalysisTask.mockResolvedValue(null)
    expect(await getAnalysis('todayPrediction')).toBeNull()
    expect(await getAnalysis('todayPrediction')).toBeNull()
    expect(runAnalysisTask).toHaveBeenCalledTimes(1)
  })

  it('recalcule après une écriture (révision) et le lendemain', async () => {
    const day1 = new Date(2026, 9, 14, 9)
    const day2 = new Date(2026, 9, 15, 9)
    await getAnalysis('todayPrediction', day1)
    bumpDataRevision()
    expect(peekAnalysis('todayPrediction', day1).hit).toBe(false)
    await getAnalysis('todayPrediction', day1)
    expect(analysisCacheKey(day1)).not.toBe(analysisCacheKey(day2))
    await getAnalysis('todayPrediction', day2)
    expect(runAnalysisTask).toHaveBeenCalledTimes(3)
  })

  it('deux appels simultanés partagent le même calcul', async () => {
    const [a, b] = await Promise.all([getAnalysis('todayPrediction'), getAnalysis('todayPrediction')])
    expect(a).toBe(b)
    expect(runAnalysisTask).toHaveBeenCalledTimes(1)
  })

  it("une erreur n'est pas mise en cache", async () => {
    runAnalysisTask.mockRejectedValueOnce(new Error('boom'))
    await expect(getAnalysis('todayPrediction')).rejects.toThrow('boom')
    expect(await getAnalysis('todayPrediction')).toEqual({ predicted: 3 })
  })

  it('cache illisible dans localStorage : ignoré', async () => {
    localStorage.setItem('healthtrack-analysis-cache-v1', '{oops')
    expect(peekAnalysis('todayPrediction').hit).toBe(false)
    expect(await getAnalysis('todayPrediction')).toEqual({ predicted: 3 })
  })
})

describe('analysisRunner — Web Worker', () => {
  class FakeWorker {
    static instances = []
    constructor(url, opts) {
      this.url = String(url)
      this.opts = opts
      this.posted = []
      FakeWorker.instances.push(this)
    }
    postMessage(msg) {
      this.posted.push(msg)
      queueMicrotask(() => this.onmessage?.({ data: { id: msg.id, result: { fromWorker: msg.task } } }))
    }
    terminate() {}
  }

  beforeEach(() => {
    FakeWorker.instances = []
  })

  it('calcule dans le Worker quand il existe (rien sur le fil principal)', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    expect(await getAnalysis('todayPrediction')).toEqual({ fromWorker: 'todayPrediction' })
    expect(FakeWorker.instances).toHaveLength(1)
    expect(FakeWorker.instances[0].url).toMatch(/analysis\.worker/)
    expect(runAnalysisTask).not.toHaveBeenCalled()
  })

  it("repli sur le fil principal si le Worker tombe en erreur", async () => {
    class BrokenWorker extends FakeWorker {
      postMessage() {
        queueMicrotask(() => this.onerror?.({ preventDefault() {} }))
      }
    }
    vi.stubGlobal('Worker', BrokenWorker)
    expect(await getAnalysis('todayPrediction')).toEqual({ predicted: 3 })
    expect(runAnalysisTask).toHaveBeenCalledTimes(1)
  })

  it("une erreur renvoyée par la tâche dans le Worker est propagée", async () => {
    class FailingWorker extends FakeWorker {
      postMessage(msg) {
        queueMicrotask(() => this.onmessage?.({ data: { id: msg.id, error: 'calcul impossible' } }))
      }
    }
    vi.stubGlobal('Worker', FailingWorker)
    await expect(getAnalysis('todayPrediction')).rejects.toThrow('calcul impossible')
  })
})
