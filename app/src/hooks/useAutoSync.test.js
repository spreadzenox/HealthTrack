import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const sync = vi.fn(async () => ({ ran: false }))
vi.mock('../connectors/autoSync', () => ({ triggerAutoSync: vi.fn() }))
vi.mock('../services/weatherSync', () => ({ syncWeather: vi.fn() }))
vi.mock('../services/phoneUsageSync', () => ({ syncPhoneUsage: vi.fn() }))
vi.mock('../services/watchPresence', () => ({ listenWatchPresence: vi.fn() }))
vi.mock('../services/spo2Slots', () => ({ compactWatchSpo2Once: vi.fn(async () => null) }))
vi.mock('../services/timezoneContext', () => ({ recordTimezoneContext: vi.fn() }))
vi.mock('../services/watchAutoSync', () => ({ syncWatchIfStale: (...a) => sync(...a), WATCH_FOREGROUND_CHECK_MS: 5 * 60_000 }))

import { useAutoSync } from './useAutoSync'

afterEach(() => {
  vi.useRealTimers()
  sync.mockClear()
})

describe('useAutoSync — montre relue même app restée à l’écran (18/10/2026)', () => {
  it('vérifie la resynchro toutes les 5 min tant que la page est visible, plus rien après démontage', async () => {
    vi.useFakeTimers()
    const { unmount } = renderHook(() => useAutoSync())
    await vi.advanceTimersByTimeAsync(0)
    expect(sync).toHaveBeenCalledTimes(1) // à l'ouverture
    await vi.advanceTimersByTimeAsync(5 * 60_000)
    expect(sync).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(10 * 60_000)
    expect(sync).toHaveBeenCalledTimes(4)
    unmount()
    await vi.advanceTimersByTimeAsync(30 * 60_000)
    expect(sync).toHaveBeenCalledTimes(4)
  })

  it('page cachée : pas de vérification par le minuteur (la relecture native s’en charge)', async () => {
    vi.useFakeTimers()
    const spy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    const { unmount } = renderHook(() => useAutoSync())
    await vi.advanceTimersByTimeAsync(0)
    const atOpen = sync.mock.calls.length
    await vi.advanceTimersByTimeAsync(20 * 60_000)
    expect(sync.mock.calls.length).toBe(atOpen)
    unmount()
    spy.mockRestore()
  })
})
