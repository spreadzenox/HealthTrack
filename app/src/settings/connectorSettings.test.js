import { describe, it, expect, beforeEach } from 'vitest'
import {
  getConnectorSettings,
  setConnectorSettings,
  listConfiguredConnectorIds,
} from './connectorSettings'

describe('connectorSettings', () => {
  beforeEach(() => {
    // Clear only the connector settings keys
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('healthtrack_connector_')) keysToRemove.push(key)
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  })

  it('returns defaults when no settings stored', () => {
    const s = getConnectorSettings('test_connector')
    expect(s.enabled).toBe(false)
    expect(s.lastSyncAt).toBeNull()
    expect(s.lastSyncResult).toBeNull()
    expect(s.historicalSince).toBeNull()
  })

  it('persists enabled flag', () => {
    setConnectorSettings('test_connector', { enabled: true })
    expect(getConnectorSettings('test_connector').enabled).toBe(true)
  })

  it('persists lastSyncAt', () => {
    const now = new Date().toISOString()
    setConnectorSettings('test_connector', { lastSyncAt: now })
    expect(getConnectorSettings('test_connector').lastSyncAt).toBe(now)
  })

  it('merges partial updates without clearing other fields', () => {
    setConnectorSettings('test_connector', { enabled: true, lastSyncAt: '2026-01-01T00:00:00Z' })
    setConnectorSettings('test_connector', { lastSyncAt: '2026-06-01T00:00:00Z' })
    const s = getConnectorSettings('test_connector')
    expect(s.enabled).toBe(true)
    expect(s.lastSyncAt).toBe('2026-06-01T00:00:00Z')
  })

  it('listConfiguredConnectorIds returns ids of connectors with stored settings', () => {
    setConnectorSettings('connector_a', { enabled: true })
    setConnectorSettings('connector_b', { enabled: false })
    const ids = listConfiguredConnectorIds()
    expect(ids).toContain('connector_a')
    expect(ids).toContain('connector_b')
  })

  it('listConfiguredConnectorIds excludes connectors without stored settings', () => {
    setConnectorSettings('connector_exists', { enabled: true })
    const ids = listConfiguredConnectorIds()
    expect(ids).not.toContain('connector_not_here')
  })
})
