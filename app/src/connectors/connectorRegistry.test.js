import { describe, it, expect, vi, afterEach } from 'vitest'

describe('connectorRegistry CONNECTORS list', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('shows Withings in mock/test mode without built-in OAuth', async () => {
    vi.stubEnv('VITE_WITHINGS_MOCK', 'true')
    vi.stubEnv('VITE_WITHINGS_CLIENT_ID', '')
    vi.stubEnv('VITE_WITHINGS_CLIENT_SECRET', '')
    const { CONNECTORS } = await import('./connectorRegistry')
    expect(CONNECTORS.some((c) => c.id === 'withings')).toBe(true)
    expect(CONNECTORS.some((c) => c.id === 'health_connect')).toBe(true)
  })

  it('hides Withings when no mock and no built-in credentials', async () => {
    vi.stubEnv('VITE_WITHINGS_MOCK', '')
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_WITHINGS_CLIENT_ID', '')
    vi.stubEnv('VITE_WITHINGS_CLIENT_SECRET', '')
    const { CONNECTORS } = await import('./connectorRegistry')
    expect(CONNECTORS.some((c) => c.id === 'withings')).toBe(false)
  })

  it('shows Withings when built-in OAuth credentials are set', async () => {
    vi.stubEnv('VITE_WITHINGS_MOCK', '')
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_WITHINGS_CLIENT_ID', 'test-id')
    vi.stubEnv('VITE_WITHINGS_CLIENT_SECRET', 'test-secret')
    vi.stubEnv('VITE_WITHINGS_REDIRECT_URI', 'http://localhost/callback')
    const { CONNECTORS } = await import('./connectorRegistry')
    expect(CONNECTORS.some((c) => c.id === 'withings')).toBe(true)
  })
})
