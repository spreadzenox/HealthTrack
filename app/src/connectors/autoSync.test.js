import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isSyncStale, triggerAutoSync, STALE_THRESHOLD_MS } from './autoSync'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('./connectorRegistry', () => ({
  CONNECTORS: [],
}))

vi.mock('../settings/connectorSettings', () => ({
  getConnectorSettings: vi.fn(),
  setConnectorSettings: vi.fn(),
}))

vi.mock('../storage/localHealthStorage', () => ({
  upsertEntries: vi.fn(),
  getLatestEntryAt: vi.fn().mockResolvedValue(null),
}))

vi.mock('../utils/debugLog', () => ({
  debugInfo: vi.fn(),
  debugWarn: vi.fn(),
  debugError: vi.fn(),
  debugDebug: vi.fn(),
}))

// ─── isSyncStale ──────────────────────────────────────────────────────────────

describe('isSyncStale', () => {
  it('returns true when lastSyncAt is null', () => {
    expect(isSyncStale(null)).toBe(true)
  })

  it('returns true when lastSyncAt is undefined', () => {
    expect(isSyncStale(undefined)).toBe(true)
  })

  it('returns true when last sync was more than 1 hour ago', () => {
    const twoHoursAgo = new Date(Date.now() - STALE_THRESHOLD_MS - 1).toISOString()
    expect(isSyncStale(twoHoursAgo)).toBe(true)
  })

  it('returns false when last sync was less than 1 hour ago', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    expect(isSyncStale(thirtyMinsAgo)).toBe(false)
  })

  it('returns false when last sync was exactly now', () => {
    expect(isSyncStale(new Date().toISOString())).toBe(false)
  })
})

// ─── triggerAutoSync ──────────────────────────────────────────────────────────

function makeConnector(overrides = {}) {
  return {
    id: 'test_connector',
    isAvailable: vi.fn().mockResolvedValue(true),
    checkPermissions: vi.fn().mockResolvedValue('granted'),
    sync: vi.fn().mockResolvedValue({ synced: 5, skipped: 0, errors: [] }),
    ...overrides,
  }
}

describe('triggerAutoSync', () => {
  let CONNECTORS
  let getConnectorSettings
  let setConnectorSettings
  let dispatchSpy

  beforeEach(async () => {
    vi.clearAllMocks()
    const registry = await import('./connectorRegistry')
    CONNECTORS = registry.CONNECTORS
    CONNECTORS.length = 0

    const settings = await import('../settings/connectorSettings')
    getConnectorSettings = settings.getConnectorSettings
    setConnectorSettings = settings.setConnectorSettings

    dispatchSpy = vi.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    dispatchSpy.mockRestore()
  })

  it('does nothing when no connectors are registered', async () => {
    await triggerAutoSync()
    expect(dispatchSpy).not.toHaveBeenCalled()
  })

  it('skips connector that is not enabled', async () => {
    const c = makeConnector()
    CONNECTORS.push(c)
    getConnectorSettings.mockReturnValue({ enabled: false, lastSyncAt: null })

    await triggerAutoSync()

    expect(c.isAvailable).not.toHaveBeenCalled()
    expect(c.sync).not.toHaveBeenCalled()
  })

  it('skips connector whose last sync is recent (not stale)', async () => {
    const c = makeConnector()
    CONNECTORS.push(c)
    const recentAt = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: recentAt })

    await triggerAutoSync()

    expect(c.isAvailable).not.toHaveBeenCalled()
    expect(c.sync).not.toHaveBeenCalled()
  })

  it('skips connector that is not available', async () => {
    const c = makeConnector({ isAvailable: vi.fn().mockResolvedValue(false) })
    CONNECTORS.push(c)
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null })

    await triggerAutoSync()

    expect(c.checkPermissions).not.toHaveBeenCalled()
    expect(c.sync).not.toHaveBeenCalled()
  })

  it('skips connector whose permissions are not granted', async () => {
    const c = makeConnector({ checkPermissions: vi.fn().mockResolvedValue('denied') })
    CONNECTORS.push(c)
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null })

    await triggerAutoSync()

    expect(c.sync).not.toHaveBeenCalled()
  })

  it('runs sync and updates settings when all conditions are met (no prior sync)', async () => {
    const c = makeConnector()
    CONNECTORS.push(c)
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null })

    await triggerAutoSync()

    expect(c.sync).toHaveBeenCalledOnce()
    expect(setConnectorSettings).toHaveBeenCalledWith(
      'test_connector',
      expect.objectContaining({ lastSyncAt: expect.any(String), lastSyncResult: expect.any(Object) }),
    )
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'health-entries-updated' }))
  })

  it('runs sync when last sync is stale (> 1 hour ago)', async () => {
    const c = makeConnector()
    CONNECTORS.push(c)
    const staleAt = new Date(Date.now() - STALE_THRESHOLD_MS - 5000).toISOString()
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: staleAt })

    await triggerAutoSync()

    expect(c.sync).toHaveBeenCalledOnce()
  })

  it('does not dispatch event when sync throws', async () => {
    const c = makeConnector({ sync: vi.fn().mockRejectedValue(new Error('bridge unavailable')) })
    CONNECTORS.push(c)
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null })

    await triggerAutoSync()

    expect(dispatchSpy).not.toHaveBeenCalled()
    expect(setConnectorSettings).not.toHaveBeenCalled()
  })

  it('handles isAvailable() throwing gracefully', async () => {
    const c = makeConnector({ isAvailable: vi.fn().mockRejectedValue(new Error('bridge crash')) })
    CONNECTORS.push(c)
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null })

    await expect(triggerAutoSync()).resolves.not.toThrow()
    expect(c.sync).not.toHaveBeenCalled()
  })

  it('handles checkPermissions() throwing gracefully', async () => {
    const c = makeConnector({ checkPermissions: vi.fn().mockRejectedValue(new Error('perm crash')) })
    CONNECTORS.push(c)
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null })

    await expect(triggerAutoSync()).resolves.not.toThrow()
    expect(c.sync).not.toHaveBeenCalled()
  })

  it('processes multiple connectors independently', async () => {
    const c1 = makeConnector({ id: 'c1' })
    const c2 = makeConnector({ id: 'c2', isAvailable: vi.fn().mockResolvedValue(false) })
    CONNECTORS.push(c1, c2)
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null })

    await triggerAutoSync()

    expect(c1.sync).toHaveBeenCalledOnce()
    expect(c2.sync).not.toHaveBeenCalled()
  })
})
