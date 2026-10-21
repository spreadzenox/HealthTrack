import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFaceOnOpen, FACE_READ_EVENT, APP_OPEN_INTERVAL_MS } from './faceAppOpen'

const NOW = Date.UTC(2026, 9, 21, 8, 0)

function memory(enabled = true) {
  const m = new Map([['healthtrack_face_sense', JSON.stringify({ enabled })]])
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
}

const plugin = (outcome = 'face') => ({ readNow: vi.fn(async () => ({ outcome })) })

afterEach(() => vi.restoreAllMocks())

describe('lecture du visage à l’ouverture de l’app (variante play)', () => {
  it('lit une fois, en le signalant avant et après la capture', async () => {
    const events = []
    const on = (e) => events.push(e.detail)
    window.addEventListener(FACE_READ_EVENT, on)
    const p = plugin()
    const storage = memory()
    expect(await readFaceOnOpen({ enabled: true, plugin: p, storage, now: NOW, visible: () => true })).toBe('face')
    window.removeEventListener(FACE_READ_EVENT, on)
    expect(p.readNow).toHaveBeenCalledTimes(1)
    expect(events).toEqual([{ phase: 'start' }, { phase: 'end', outcome: 'face' }])
  })

  it('rien en sideload, lecture désactivée, app cachée ou plugin ancien', async () => {
    const p = plugin()
    expect(await readFaceOnOpen({ enabled: false, plugin: p, storage: memory(), now: NOW, visible: () => true })).toBe(null)
    expect(await readFaceOnOpen({ enabled: true, plugin: p, storage: memory(false), now: NOW, visible: () => true })).toBe(null)
    expect(await readFaceOnOpen({ enabled: true, plugin: p, storage: memory(), now: NOW, visible: () => false })).toBe(null)
    expect(await readFaceOnOpen({ enabled: true, plugin: {}, storage: memory(), now: NOW, visible: () => true })).toBe(null)
    expect(p.readNow).not.toHaveBeenCalled()
  })

  it('pas deux lectures en moins de 30 min (pas de bandeau qui clignote à chaque retour dans l’app)', async () => {
    const p = plugin()
    const storage = memory()
    const opts = { enabled: true, plugin: p, storage, visible: () => true }
    await readFaceOnOpen({ ...opts, now: NOW })
    expect(await readFaceOnOpen({ ...opts, now: NOW + 10 * 60_000 })).toBe(null)
    await readFaceOnOpen({ ...opts, now: NOW + APP_OPEN_INTERVAL_MS })
    expect(p.readNow).toHaveBeenCalledTimes(2)
  })

  it('une seule lecture à la fois', async () => {
    let release
    const p = { readNow: vi.fn(() => new Promise((r) => { release = () => r({ outcome: 'face' }) })) }
    const opts = { enabled: true, plugin: p, storage: memory(), now: NOW, visible: () => true }
    const a = readFaceOnOpen(opts)
    const b = readFaceOnOpen({ ...opts, storage: memory() })
    release()
    expect(await a).toBe('face')
    expect(await b).toBe('face')
    expect(p.readNow).toHaveBeenCalledTimes(1)
  })
})
