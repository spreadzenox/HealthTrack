import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCanInstallUnknownApps = vi.fn()
const mockOpenInstallUnknownAppsSettings = vi.fn()
const mockInstallApk = vi.fn()
const mockWriteFile = vi.fn()
const mockGetUri = vi.fn()
const mockCapacitorHttpGet = vi.fn()

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'android',
  },
  CapacitorHttp: {
    get: mockCapacitorHttpGet,
  },
}))

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: mockWriteFile,
    getUri: mockGetUri,
  },
  Directory: { Cache: 'CACHE' },
}))

vi.mock('@m430/capacitor-app-install', () => ({
  AppInstallPlugin: {
    canInstallUnknownApps: mockCanInstallUnknownApps,
    openInstallUnknownAppsSettings: mockOpenInstallUnknownAppsSettings,
    installApk: mockInstallApk,
  },
}))

// We do not want window.open to throw in jsdom
globalThis.open = vi.fn()

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('installUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when no URL provided', async () => {
    const { installUpdate } = await import('./installUpdate.js')
    const result = await installUpdate('')
    expect(result).toEqual({ ok: false, message: 'Aucune URL' })
  })

  it('opens browser for non-APK URLs (web release page)', async () => {
    const { installUpdate } = await import('./installUpdate.js')
    const url = 'https://github.com/spreadzenox/HealthTrack/releases/tag/v15'
    const result = await installUpdate(url)
    expect(result).toEqual({ ok: true })
    expect(globalThis.open).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer')
  })

  describe('Android APK install via CapacitorHttp', () => {
    const APK_URL = 'https://objects.githubusercontent.com/HealthTrack-v15.apk'

    it('returns permission message when unknown sources not granted', async () => {
      mockCanInstallUnknownApps.mockResolvedValue({ granted: false })

      const { installUpdate } = await import('./installUpdate.js')
      const result = await installUpdate(APK_URL)

      expect(result.ok).toBe(false)
      expect(result.message).toMatch(/Autorisez/)
      expect(mockOpenInstallUnknownAppsSettings).toHaveBeenCalledOnce()
      expect(mockCapacitorHttpGet).not.toHaveBeenCalled()
    })

    it('uses CapacitorHttp (not fetch) to download the APK', async () => {
      mockCanInstallUnknownApps.mockResolvedValue({ granted: true })
      mockCapacitorHttpGet.mockResolvedValue({ status: 200, data: 'base64data==' })
      mockWriteFile.mockResolvedValue({})
      mockGetUri.mockResolvedValue({ uri: 'file:///data/cache/HealthTrack-update.apk' })
      mockInstallApk.mockResolvedValue({ completed: true })

      const { installUpdate } = await import('./installUpdate.js')
      const result = await installUpdate(APK_URL)

      expect(mockCapacitorHttpGet).toHaveBeenCalledWith({
        url: APK_URL,
        responseType: 'arraybuffer',
      })
      expect(result).toEqual({ ok: true })
    })

    it('writes the base64 data from CapacitorHttp directly to Filesystem', async () => {
      mockCanInstallUnknownApps.mockResolvedValue({ granted: true })
      const fakeBase64 = 'UEsDBBQA...'
      mockCapacitorHttpGet.mockResolvedValue({ status: 200, data: fakeBase64 })
      mockWriteFile.mockResolvedValue({})
      mockGetUri.mockResolvedValue({ uri: 'file:///data/cache/HealthTrack-update.apk' })
      mockInstallApk.mockResolvedValue({ completed: true })

      const { installUpdate } = await import('./installUpdate.js')
      await installUpdate(APK_URL)

      expect(mockWriteFile).toHaveBeenCalledWith({
        path: 'HealthTrack-update.apk',
        data: fakeBase64,
        directory: 'CACHE',
      })
    })

    it('strips file:// prefix before passing to installApk', async () => {
      mockCanInstallUnknownApps.mockResolvedValue({ granted: true })
      mockCapacitorHttpGet.mockResolvedValue({ status: 200, data: 'abc' })
      mockWriteFile.mockResolvedValue({})
      mockGetUri.mockResolvedValue({ uri: 'file:///data/cache/HealthTrack-update.apk' })
      mockInstallApk.mockResolvedValue({ completed: true })

      const { installUpdate } = await import('./installUpdate.js')
      await installUpdate(APK_URL)

      expect(mockInstallApk).toHaveBeenCalledWith({
        filePath: '/data/cache/HealthTrack-update.apk',
      })
    })

    it('returns error when CapacitorHttp returns non-2xx status', async () => {
      mockCanInstallUnknownApps.mockResolvedValue({ granted: true })
      mockCapacitorHttpGet.mockResolvedValue({ status: 403, data: '' })

      const { installUpdate } = await import('./installUpdate.js')
      const result = await installUpdate(APK_URL)

      expect(result.ok).toBe(false)
      expect(result.message).toMatch(/403/)
    })

    it('returns error when CapacitorHttp rejects (network failure)', async () => {
      mockCanInstallUnknownApps.mockResolvedValue({ granted: true })
      mockCapacitorHttpGet.mockRejectedValue(new Error('Network unreachable'))

      const { installUpdate } = await import('./installUpdate.js')
      const result = await installUpdate(APK_URL)

      expect(result.ok).toBe(false)
      expect(result.message).toBe('Network unreachable')
    })

    it('returns installation incomplete message when installApk does not complete', async () => {
      mockCanInstallUnknownApps.mockResolvedValue({ granted: true })
      mockCapacitorHttpGet.mockResolvedValue({ status: 200, data: 'abc' })
      mockWriteFile.mockResolvedValue({})
      mockGetUri.mockResolvedValue({ uri: '/data/cache/HealthTrack-update.apk' })
      mockInstallApk.mockResolvedValue({ completed: false, message: 'User cancelled' })

      const { installUpdate } = await import('./installUpdate.js')
      const result = await installUpdate(APK_URL)

      expect(result.ok).toBe(false)
      expect(result.message).toBe('User cancelled')
    })
  })
})
