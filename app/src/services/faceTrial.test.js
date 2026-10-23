import { describe, expect, it, vi } from 'vitest'
import { runFaceTrial } from './faceTrial'

const NOW = new Date('2026-10-23T12:00:00Z')
const testBurst = {
  type: 'face_burst',
  at: new Date(NOW.getTime() - 5000).toISOString(),
  payload: { trigger: 'manual', valid: 3, frames: 3, values: { smile: 0.6, valence: 0.4, arousal: 0.1 } },
}

function deps(overrides = {}) {
  return {
    plugin: {},
    start: vi.fn(async () => ({ started: true, permission: true })),
    test: vi.fn(async () => true),
    importBursts: vi.fn(async () => ({})),
    loadEntries: vi.fn(async () => ({ bursts: [testBurst], notes: [] })),
    wait: vi.fn(async () => {}),
    now: () => NOW,
    ...overrides,
  }
}

describe('runFaceTrial', () => {
  it('active la lecture, prend une lecture de test et rend son estimation', async () => {
    const d = deps()
    const r = await runFaceTrial(d)
    expect(d.start).toHaveBeenCalledOnce()
    expect(d.test).toHaveBeenCalledOnce()
    expect(d.wait).toHaveBeenCalledOnce()
    expect(d.importBursts).toHaveBeenCalledOnce()
    expect(r.outcome).toBe('read')
    expect(r.estimate).toEqual(expect.objectContaining({ label: expect.any(String), note: expect.any(Number) }))
  })

  it('caméra refusée : ne teste rien', async () => {
    const d = deps({ start: vi.fn(async () => ({ started: false, permission: false })) })
    expect(await runFaceTrial(d)).toEqual({ outcome: 'denied', estimate: null })
    expect(d.test).not.toHaveBeenCalled()
  })

  it('Android refuse de démarrer : échec sans test', async () => {
    const d = deps({ start: vi.fn(async () => ({ started: false, permission: true })) })
    expect((await runFaceTrial(d)).outcome).toBe('failed')
    expect(d.test).not.toHaveBeenCalled()
  })

  it('aucun visage lu (ou rafale ancienne) : no_face, sans estimation', async () => {
    const old = { ...testBurst, at: new Date(NOW.getTime() - 10 * 60000).toISOString() }
    const d = deps({ loadEntries: vi.fn(async () => ({ bursts: [old], notes: [] })) })
    expect(await runFaceTrial(d)).toEqual({ outcome: 'no_face', estimate: null })
  })

  it('base illisible : no_face, ne lève pas', async () => {
    const d = deps({ loadEntries: vi.fn(async () => { throw new Error('idb') }) })
    expect((await runFaceTrial(d)).outcome).toBe('no_face')
  })
})
