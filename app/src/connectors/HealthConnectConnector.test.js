/**
 * Unit tests for HealthConnectConnector.
 *
 * The @capgo/capacitor-health plugin is mocked because it requires native
 * Capacitor bridge. We test the connector's logic/data-mapping in isolation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HealthConnectConnector, toEntryType, _resetHealthPluginCache, READ_TYPE_LABELS } from './HealthConnectConnector'

// Mock the capacitor health plugin
vi.mock('@capgo/capacitor-health', () => ({
  Health: {
    isAvailable: vi.fn(),
    checkAuthorization: vi.fn(),
    requestAuthorization: vi.fn(),
    readSamples: vi.fn(),
    queryAggregated: vi.fn(),
    queryWorkouts: vi.fn(),
    openHealthConnectSettings: vi.fn(),
  },
}))

// Mock @capacitor/app-launcher (used by openSamsungHealth and openGooglePlaySystemUpdates)
vi.mock('@capacitor/app-launcher', () => ({
  AppLauncher: {
    openUrl: vi.fn().mockResolvedValue({ completed: true }),
  },
}))

// Mock @capacitor/core so getPlatform() returns 'web' by default in tests
// (this is used as a fallback when window.Capacitor is not set)
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn().mockReturnValue('web'),
  },
}))


describe('toEntryType', () => {
  it('maps steps to steps', () => expect(toEntryType('steps')).toBe('steps'))
  it('maps sleep to sleep', () => expect(toEntryType('sleep')).toBe('sleep'))
  it('maps heartRate to heart_rate', () => expect(toEntryType('heartRate')).toBe('heart_rate'))
  it('maps restingHeartRate to heart_rate', () => expect(toEntryType('restingHeartRate')).toBe('heart_rate'))
  it('maps oxygenSaturation to heart_rate', () => expect(toEntryType('oxygenSaturation')).toBe('heart_rate'))
  it('maps calories to calories', () => expect(toEntryType('calories')).toBe('calories'))
  it('maps workouts to activity', () => expect(toEntryType('workouts')).toBe('activity'))
  it('maps distance to activity', () => expect(toEntryType('distance')).toBe('activity'))
  it('returns unknown types as-is', () => expect(toEntryType('unknown')).toBe('unknown'))
})

describe('HealthConnectConnector', () => {
  let connector

  beforeEach(async () => {
    connector = new HealthConnectConnector()
    vi.clearAllMocks()
    // Reset the plugin cache so each test gets a fresh import call
    _resetHealthPluginCache()
  })

  afterEach(() => {
    _resetHealthPluginCache()
  })

  it('has correct id and name', () => {
    expect(connector.id).toBe('health_connect')
    expect(connector.name).toBe('Health Connect')
    expect(connector.description).toMatch(/^Montre, bague, balance : /)
  })

  it('has the expected dataTypes', () => {
    expect(connector.dataTypes).toContain('steps')
    expect(connector.dataTypes).toContain('sleep')
    expect(connector.dataTypes).toContain('heart_rate')
    expect(connector.dataTypes).toContain('activity')
    expect(connector.dataTypes).toContain('calories')
  })

  describe('isAvailable', () => {
    it('returns true when Health.isAvailable returns available=true', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.isAvailable.mockResolvedValue({ available: true })
      expect(await connector.isAvailable()).toBe(true)
    })

    it('returns false when Health.isAvailable returns available=false', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.isAvailable.mockResolvedValue({ available: false, reason: 'not installed' })
      expect(await connector.isAvailable()).toBe(false)
    })

    it('returns false when the plugin throws', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.isAvailable.mockRejectedValue(new Error('bridge not available'))
      expect(await connector.isAvailable()).toBe(false)
    })
  })

  describe('availabilityDetails', () => {
    it('returns available=true when Health Connect is ready', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.isAvailable.mockResolvedValue({ available: true, platform: 'android' })
      const details = await connector.availabilityDetails()
      expect(details.available).toBe(true)
      expect(details.platform).toBe('android')
    })

    it('returns reason=provider_update_required when Health Connect needs an update', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.isAvailable.mockResolvedValue({
        available: false,
        reason: 'Health Connect needs an update.',
        platform: 'android',
      })
      const details = await connector.availabilityDetails()
      expect(details.available).toBe(false)
      expect(details.reason).toBe('provider_update_required')
      expect(details.platform).toBe('android')
      expect(details.nativeReason).toBe('Health Connect needs an update.')
    })

    it('returns reason=sdk_unavailable when Health Connect is unavailable on Android', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.isAvailable.mockResolvedValue({
        available: false,
        reason: 'Health Connect is unavailable on this device.',
        platform: 'android',
      })
      const details = await connector.availabilityDetails()
      expect(details.available).toBe(false)
      expect(details.reason).toBe('sdk_unavailable')
      expect(details.platform).toBe('android')
      expect(details.nativeReason).toBe('Health Connect is unavailable on this device.')
    })

    it('returns reason=unavailable when platform is not android and Health Connect is unavailable', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.isAvailable.mockResolvedValue({
        available: false,
        reason: 'Not supported.',
        platform: 'web',
      })
      const details = await connector.availabilityDetails()
      expect(details.available).toBe(false)
      expect(details.reason).toBe('unavailable')
      expect(details.nativeReason).toBe('Not supported.')
    })

    it('returns reason=unavailable with nativeReason from error when plugin throws on web', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      // window.Capacitor is not set in jsdom, so getPlatformSync() returns 'web'.
      Health.isAvailable.mockRejectedValue(new Error('bridge error'))
      const details = await connector.availabilityDetails()
      expect(details.available).toBe(false)
      expect(details.reason).toBe('unavailable')
      expect(details.nativeReason).toBe('bridge error')
    })

    it('returns reason=provider_update_required when plugin throws on Android (e.g. IllegalStateException on Android 16)', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.isAvailable.mockRejectedValue(new Error('IllegalStateException: Health Connect not available'))
      // Simulate Android: set window.Capacitor.getPlatform to return 'android'
      globalThis.window = globalThis.window || {}
      const origCapacitor = globalThis.window.Capacitor
      globalThis.window.Capacitor = { getPlatform: () => 'android', isNativePlatform: () => true, Plugins: {} }
      try {
        _resetHealthPluginCache()
        const details = await connector.availabilityDetails()
        expect(details.available).toBe(false)
        expect(details.reason).toBe('provider_update_required')
        expect(details.platform).toBe('android')
        expect(details.nativeReason).toBe('IllegalStateException: Health Connect not available')
      } finally {
        if (origCapacitor !== undefined) {
          globalThis.window.Capacitor = origCapacitor
        } else {
          delete globalThis.window.Capacitor
        }
        _resetHealthPluginCache()
      }
    })
  })

  describe('openHealthConnectSettings', () => {
    it('returns true when the plugin call succeeds', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.openHealthConnectSettings.mockResolvedValue(undefined)
      const result = await connector.openHealthConnectSettings()
      expect(result).toBe(true)
    })

    it('returns false when the plugin call throws', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.openHealthConnectSettings.mockRejectedValue(new Error('intent not available'))
      const result = await connector.openHealthConnectSettings()
      expect(result).toBe(false)
    })
  })

  describe('openSamsungHealth', () => {
    it('returns true when AppLauncher.openUrl succeeds with samsunghealth:// scheme', async () => {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      AppLauncher.openUrl.mockResolvedValue({ completed: true })
      const result = await connector.openSamsungHealth()
      expect(result).toBe(true)
      expect(AppLauncher.openUrl).toHaveBeenCalledWith({ url: 'samsunghealth://' })
    })

    it('returns false when samsunghealth:// resolves with completed=false', async () => {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      // All URLs resolve with completed=false (e.g. no handler registered)
      AppLauncher.openUrl.mockResolvedValue({ completed: false })
      const result = await connector.openSamsungHealth()
      expect(result).toBe(false)
    })

    it('falls back to market:// if samsunghealth:// throws, and returns true', async () => {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      AppLauncher.openUrl
        .mockRejectedValueOnce(new Error('app not installed'))
        .mockResolvedValueOnce({ completed: true })
      const result = await connector.openSamsungHealth()
      expect(result).toBe(true)
      expect(AppLauncher.openUrl).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'market://details?id=com.sec.android.app.shealth' })
      )
    })

    it('falls back to HTTPS Play Store if market:// also throws', async () => {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      AppLauncher.openUrl
        .mockRejectedValueOnce(new Error('no Samsung Health'))
        .mockRejectedValueOnce(new Error('no Play Store'))
        .mockResolvedValueOnce({ completed: true })
      const result = await connector.openSamsungHealth()
      expect(result).toBe(true)
      expect(AppLauncher.openUrl).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://play.google.com/store/apps/details?id=com.sec.android.app.shealth' })
      )
    })

    it('returns false when all fallbacks throw', async () => {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      AppLauncher.openUrl.mockRejectedValue(new Error('no bridge'))
      const result = await connector.openSamsungHealth()
      expect(result).toBe(false)
    })
  })

  describe('openGooglePlaySystemUpdates', () => {
    it('returns true and opens the Health Connect system module Play listing', async () => {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      AppLauncher.openUrl.mockResolvedValue({ completed: true })
      const result = await connector.openGooglePlaySystemUpdates()
      expect(result).toBe(true)
      expect(AppLauncher.openUrl).toHaveBeenCalledWith({
        url: 'market://details?id=com.google.android.healthconnect.controller',
      })
    })

    it('falls back to HTTPS Play Store when market:// throws', async () => {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      AppLauncher.openUrl
        .mockRejectedValueOnce(new Error('no market'))
        .mockResolvedValueOnce({ completed: true })
      const result = await connector.openGooglePlaySystemUpdates()
      expect(result).toBe(true)
      expect(AppLauncher.openUrl).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://play.google.com/store/apps/details?id=com.google.android.healthconnect.controller' })
      )
    })

    it('returns false when AppLauncher.openUrl resolves with completed=false for all URLs', async () => {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      AppLauncher.openUrl.mockResolvedValue({ completed: false })
      const result = await connector.openGooglePlaySystemUpdates()
      expect(result).toBe(false)
    })

    it('returns false when all URLs throw', async () => {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      AppLauncher.openUrl.mockRejectedValue(new Error('blocked'))
      const result = await connector.openGooglePlaySystemUpdates()
      expect(result).toBe(false)
    })
  })

  describe('checkPermissions', () => {
    it('returns granted when all types are authorized', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.checkAuthorization.mockResolvedValue({
        readAuthorized: ['steps', 'sleep'],
        readDenied: [],
        writeAuthorized: [],
        writeDenied: [],
      })
      expect(await connector.checkPermissions()).toBe('granted')
    })

    it('returns granted when only some types are authorized, and lists the missing ones', async () => {
      // Après une mise à jour qui demande de nouveaux types (respiration, tension…), les anciens
      // types restent autorisés : la synchro ne doit pas s'arrêter pour autant.
      const { Health } = await import('@capgo/capacitor-health')
      Health.checkAuthorization.mockResolvedValue({
        readAuthorized: ['steps', 'sleep'],
        readDenied: ['respiratoryRate', 'bloodPressure'],
        writeAuthorized: [],
        writeDenied: [],
      })
      expect(await connector.checkPermissions()).toBe('granted')
      expect(connector.missingReadTypes).toEqual(['respiratoryRate', 'bloodPressure'])
    })

    it('returns denied when every type is denied', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.checkAuthorization.mockResolvedValue({
        readAuthorized: [],
        readDenied: ['steps', 'sleep'],
        writeAuthorized: [],
        writeDenied: [],
      })
      expect(await connector.checkPermissions()).toBe('denied')
    })

    it('asks for the new vital-sign types', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.checkAuthorization.mockResolvedValue({ readAuthorized: [], readDenied: [] })
      await connector.checkPermissions()
      const { read } = Health.checkAuthorization.mock.calls[0][0]
      for (const t of ['respiratoryRate', 'bodyTemperature', 'bloodPressure', 'bloodGlucose', 'weight', 'bodyFat']) {
        expect(read).toContain(t)
      }
    })

    it('returns not_asked when nothing is authorized or denied', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.checkAuthorization.mockResolvedValue({
        readAuthorized: [],
        readDenied: [],
        writeAuthorized: [],
        writeDenied: [],
      })
      expect(await connector.checkPermissions()).toBe('not_asked')
    })
  })

  describe('sync', () => {
    const makeWriter = () => {
      const written = []
      const writer = async (entries) => { written.push(...entries) }
      return { written, writer }
    }

    it('syncs steps samples into entries with type=steps', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockImplementation(({ dataType }) => {
        if (dataType === 'steps') {
          return Promise.resolve({ samples: [
            { startDate: '2026-01-01T08:00:00Z', endDate: '2026-01-01T09:00:00Z', value: 1200, unit: 'count', platformId: 'abc', sourceName: 'Galaxy Fit3' },
          ] })
        }
        return Promise.resolve({ samples: [] })
      })
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })

      const { written, writer } = makeWriter()
      const since = new Date('2026-01-01T00:00:00Z')
      const until = new Date('2026-01-01T12:00:00Z')
      const result = await connector.sync({ since, until, writer })

      const stepEntries = written.filter((e) => e.type === 'steps')
      expect(stepEntries.length).toBeGreaterThan(0)
      expect(stepEntries[0].source).toBe('health_connect')
      expect(stepEntries[0].payload.value).toBe(1200)
      expect(result.synced).toBeGreaterThan(0)
    })

    // Le plugin trie puis garde les `limit` premiers échantillons (ordre croissant) : sur 30 jours de FC dense,
    // les jours les plus récents étaient perdus, et la synchro suivante repartait de maintenant (jamais relus).
    const DAY = 24 * 3600000
    const densePlugin = (dataType, everyMs) => ({ dataType: t, startDate, endDate, limit }) => {
      if (t !== dataType) return Promise.resolve({ samples: [] })
      const out = []
      for (let at = Math.ceil(Date.parse(startDate) / everyMs) * everyMs; at < Date.parse(endDate); at += everyMs) {
        const iso = new Date(at).toISOString()
        out.push({ startDate: iso, endDate: iso, value: 60, unit: 'bpm', platformId: `r${Math.floor(at / 3600000)}` })
      }
      return Promise.resolve({ samples: limit > 0 ? out.slice(0, limit) : out })
    }

    it('FC dense sur 30 jours : rien n’est coupé, les jours récents compris', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockImplementation(densePlugin('heartRate', 5 * 60000)) // 288 par jour, 8 640 en 30 jours
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })
      const { written, writer } = makeWriter()
      const since = new Date('2026-01-01T00:00:00Z')
      const until = new Date('2026-01-31T00:00:00Z')
      await connector.sync({ since, until, writer })
      const hr = written.filter((e) => e.type === 'heart_rate' && e.payload.subtype === 'heartRate')
      expect(hr).toHaveLength(30 * 288)
      expect(new Set(hr.map((e) => e.at)).size).toBe(hr.length)
      expect(hr.at(-1).at).toBe('2026-01-30T23:55:00.000Z')
    })

    it('historique de 2 ans : la FC brute des 30 derniers jours seulement', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockImplementation(densePlugin('heartRate', 3600000))
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })
      const { written, writer } = makeWriter()
      await connector.sync({ since: new Date('2024-01-31T00:00:00Z'), until: new Date('2026-01-31T00:00:00Z'), writer })
      const hr = written.filter((e) => e.type === 'heart_rate' && e.payload.subtype === 'heartRate')
      expect(hr).toHaveLength(30 * 24)
      expect(hr[0].at).toBe('2026-01-01T00:00:00.000Z')
    })

    it('pas en échantillons : une journée plus dense que la limite est redécoupée', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockImplementation(densePlugin('steps', 60000)) // 1 440 par jour > limite de 1 000
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })
      const { written, writer } = makeWriter()
      await connector.sync({ since: new Date('2026-01-01T00:00:00Z'), until: new Date('2026-01-03T00:00:00Z'), writer })
      const steps = written.filter((e) => e.type === 'steps')
      expect(steps).toHaveLength(2 * 1440)
      expect(steps.at(-1).at).toBe('2026-01-02T23:59:00.000Z')
    })

    // POL-PLAY-67 : historique long, types peu denses lus d'un bloc à `limit: 500` → les plus récents perdus.
    it('historique de 2 ans : FC au repos, VFC, sommeil, SpO₂ et poids complets, jusqu’au dernier jour', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      const daily = densePlugin('restingHeartRate', DAY)
      const types = ['restingHeartRate', 'heartRateVariability', 'sleep', 'weight']
      const nightSpo2 = densePlugin('oxygenSaturation', 10 * 60000) // 144 par jour : 105 000 en 2 ans
      Health.readSamples.mockImplementation((q) =>
        q.dataType === 'oxygenSaturation' ? nightSpo2(q) : types.includes(q.dataType) ? daily({ ...q, dataType: 'restingHeartRate' }) : Promise.resolve({ samples: [] }))
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })
      const { written, writer } = makeWriter()
      await connector.sync({ since: new Date('2024-01-31T00:00:00Z'), until: new Date('2026-01-31T00:00:00Z'), writer })
      const days = 731
      const sub = (s) => written.filter((e) => e.payload.subtype === s)
      expect(sub('restingHeartRate')).toHaveLength(days)
      expect(sub('restingHeartRate').at(-1).at).toBe('2026-01-30T00:00:00.000Z')
      expect(sub('heartRateVariability')).toHaveLength(days)
      expect(written.filter((e) => e.type === 'sleep')).toHaveLength(days)
      expect(written.filter((e) => e.type === 'weight')).toHaveLength(days)
      expect(sub('oxygenSaturation')).toHaveLength(days * 144)
      expect(sub('oxygenSaturation').at(-1).at).toBe('2026-01-30T23:50:00.000Z')
    })

    it('type peu dense sous la limite : une seule lecture, pas une par jour', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockImplementation(densePlugin('restingHeartRate', DAY))
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })
      const { writer } = makeWriter()
      await connector.sync({ since: new Date('2026-01-01T00:00:00Z'), until: new Date('2026-01-31T00:00:00Z'), writer })
      const calls = Health.readSamples.mock.calls.filter(([q]) => q.dataType === 'restingHeartRate')
      expect(calls).toHaveLength(1)
    })

    it('séances : plus de 200 sur l’historique → toutes lues', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockResolvedValue({ samples: [] })
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockImplementation(({ startDate, endDate, limit }) => {
        const out = []
        for (let at = Math.ceil(Date.parse(startDate) / DAY) * DAY; at < Date.parse(endDate); at += DAY) {
          const iso = new Date(at).toISOString()
          out.push({ startDate: iso, endDate: iso, workoutType: 'running', duration: 1800, platformId: `w${at}` })
        }
        return Promise.resolve({ workouts: out.slice(0, limit) })
      })
      const { written, writer } = makeWriter()
      await connector.sync({ since: new Date('2025-01-31T00:00:00Z'), until: new Date('2026-01-31T00:00:00Z'), writer })
      const acts = written.filter((e) => e.type === 'activity')
      expect(acts).toHaveLength(365)
      expect(acts.at(-1).at).toBe('2026-01-30T00:00:00.000Z')
    })

    it('onProgress : types lus / total, dans l’ordre, puis done === total à la fin', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockResolvedValue({ samples: [] })
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })
      const calls = []
      const { writer } = makeWriter()
      await connector.sync({
        since: new Date('2026-01-01T00:00:00Z'),
        until: new Date('2026-01-02T00:00:00Z'),
        writer,
        onProgress: (p) => calls.push(p),
      })
      const total = calls[0].total
      expect(total).toBe(14)
      expect(calls.map((c) => c.done)).toEqual([...Array(total + 1).keys()])
      expect(calls[0].label).toBe('pas')
      expect(calls[1].label).toBe('sommeil')
      expect(calls.at(-1)).toEqual({ done: total, total, label: null })
    })

    it('une erreur dans onProgress n’interrompt pas l’import', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockImplementation(({ dataType }) =>
        Promise.resolve({ samples: dataType === 'sleep' ? [{ startDate: '2026-01-01T22:00:00Z', endDate: '2026-01-02T06:00:00Z', value: 480 }] : [] }))
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })
      const { written, writer } = makeWriter()
      const result = await connector.sync({
        since: new Date('2026-01-01T00:00:00Z'),
        until: new Date('2026-01-02T12:00:00Z'),
        writer,
        onProgress: () => { throw new Error('boom') },
      })
      expect(written.filter((e) => e.type === 'sleep')).toHaveLength(1)
      expect(result.errors).toEqual([])
    })

    it('syncs sleep samples with sleepState in payload', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockImplementation(({ dataType }) => {
        if (dataType === 'sleep') {
          return Promise.resolve({ samples: [
            { startDate: '2026-01-01T22:00:00Z', endDate: '2026-01-02T06:00:00Z', value: 480, unit: 'minute', sleepState: 'deep', platformId: 'xyz', sourceName: 'Samsung Health' },
          ] })
        }
        return Promise.resolve({ samples: [] })
      })
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })

      const { written, writer } = makeWriter()
      await connector.sync({ since: new Date('2026-01-01T00:00:00Z'), until: new Date('2026-01-02T12:00:00Z'), writer })

      const sleepEntries = written.filter((e) => e.type === 'sleep')
      expect(sleepEntries.length).toBe(1)
      expect(sleepEntries[0].payload.durationMinutes).toBe(480)
      expect(sleepEntries[0].payload.sleepState).toBe('deep')
    })

    it('syncs heart rate samples', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockImplementation(({ dataType }) => {
        if (dataType === 'heartRate') {
          return Promise.resolve({ samples: [
            { startDate: '2026-01-01T10:00:00Z', endDate: '2026-01-01T10:00:01Z', value: 72, unit: 'bpm', platformId: 'hr1', sourceName: 'Fit3' },
          ] })
        }
        return Promise.resolve({ samples: [] })
      })
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })

      const { written, writer } = makeWriter()
      await connector.sync({ since: new Date('2026-01-01T00:00:00Z'), until: new Date('2026-01-01T12:00:00Z'), writer })

      const hrEntries = written.filter((e) => e.type === 'heart_rate')
      expect(hrEntries.length).toBeGreaterThan(0)
      expect(hrEntries[0].payload.bpm).toBe(72)
      expect(hrEntries[0].payload.subtype).toBe('heartRate')
    })

    it('syncs workouts as activity entries', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockResolvedValue({ samples: [] })
      Health.queryAggregated.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({
        workouts: [
          {
            startDate: '2026-01-01T07:00:00Z',
            endDate: '2026-01-01T07:45:00Z',
            workoutType: 'running',
            duration: 2700,
            totalEnergyBurned: 350,
            totalDistance: 5200,
            sourceName: 'Samsung Health',
            platformId: 'w1',
          },
        ],
      })

      const { written, writer } = makeWriter()
      await connector.sync({ since: new Date('2026-01-01T00:00:00Z'), until: new Date('2026-01-01T12:00:00Z'), writer })

      const actEntries = written.filter((e) => e.type === 'activity')
      expect(actEntries.length).toBe(1)
      expect(actEntries[0].payload.workoutType).toBe('running')
      expect(actEntries[0].payload.durationSeconds).toBe(2700)
    })

    it('uses aggregated steps for historical ranges (> 30 days)', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.queryAggregated.mockImplementation(({ dataType }) => {
        if (dataType === 'steps') {
          return Promise.resolve({ samples: [
            { startDate: '2025-01-01T00:00:00Z', endDate: '2025-01-01T23:59:59Z', value: 8000, unit: 'count' },
          ] })
        }
        return Promise.resolve({ samples: [] })
      })
      Health.readSamples.mockResolvedValue({ samples: [] })
      Health.queryWorkouts.mockResolvedValue({ workouts: [] })

      const { written, writer } = makeWriter()
      const since = new Date('2025-01-01T00:00:00Z')
      const until = new Date('2026-01-01T00:00:00Z') // > 30 days
      await connector.sync({ since, until, writer })

      // queryAggregated should have been called for steps
      expect(Health.queryAggregated).toHaveBeenCalledWith(
        expect.objectContaining({ dataType: 'steps', bucket: 'day' })
      )
      const stepEntries = written.filter((e) => e.type === 'steps')
      expect(stepEntries.length).toBe(1)
      expect(stepEntries[0].payload.period).toBe('day')
    })

    it('collects errors from failing data types but continues', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.readSamples.mockRejectedValue(new Error('Permission denied'))
      Health.queryAggregated.mockRejectedValue(new Error('Permission denied'))
      Health.queryWorkouts.mockRejectedValue(new Error('Permission denied'))

      const { written, writer } = makeWriter()
      const result = await connector.sync({
        since: new Date('2026-01-01T00:00:00Z'),
        until: new Date('2026-01-01T12:00:00Z'),
        writer,
      })

      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.synced).toBe(0)
      expect(written.length).toBe(0)
    })
  })
})

describe('HealthConnectConnector — mesures vitales et corps', () => {
  const RANGE = { since: new Date('2026-01-01T00:00:00Z'), until: new Date('2026-01-01T12:00:00Z') }
  let connector
  let written
  const writer = async (entries) => { written.push(...entries) }

  beforeEach(async () => {
    connector = new HealthConnectConnector()
    vi.clearAllMocks()
    _resetHealthPluginCache()
    written = []
    const { Health } = await import('@capgo/capacitor-health')
    Health.queryAggregated.mockResolvedValue({ samples: [] })
    Health.queryWorkouts.mockResolvedValue({ workouts: [] })
    Health.checkAuthorization.mockResolvedValue(undefined)
  })

  function mockSamples(byType) {
    return import('@capgo/capacitor-health').then(({ Health }) => {
      Health.readSamples.mockImplementation(({ dataType }) => Promise.resolve({ samples: byType[dataType] || [] }))
    })
  }

  const sample = (value, extra = {}) => ({
    startDate: '2026-01-01T03:00:00Z', endDate: '2026-01-01T03:00:00Z', value, platformId: 'p', sourceName: 'nodomain.freeyourgadget.gadgetbridge', ...extra,
  })

  it('stores respiratory rate, body temperature, blood pressure and glucose as their own entry types', async () => {
    await mockSamples({
      respiratoryRate: [sample(14.5, { unit: 'bpm' })],
      bodyTemperature: [sample(36.7, { unit: 'celsius' })],
      bloodPressure: [sample(124, { unit: 'mmHg', systolic: 124, diastolic: 79 })],
      bloodGlucose: [sample(95, { unit: 'mg/dL' })],
    })
    await connector.sync({ ...RANGE, writer })
    const byType = Object.fromEntries(written.map((e) => [e.type, e]))
    expect(byType.respiratory_rate.payload.value).toBe(14.5)
    expect(byType.body_temperature.payload.valueC).toBe(36.7)
    expect(byType.blood_pressure.payload).toMatchObject({ systolic: 124, diastolic: 79 })
    expect(byType.blood_glucose.payload.mgDl).toBe(95)
    for (const e of written) {
      expect(e.source).toBe('health_connect')
      expect(e.payload.sourceName).toBe('nodomain.freeyourgadget.gadgetbridge')
    }
    // Jamais rangées dans heart_rate : elles fausseraient la FC du jour.
    expect(written.some((e) => e.type === 'heart_rate')).toBe(false)
  })

  it('stores weight and body fat like a weigh-in', async () => {
    await mockSamples({ weight: [sample(77.24)], bodyFat: [sample(23.1)] })
    await connector.sync({ ...RANGE, writer })
    expect(written.find((e) => e.type === 'weight').payload.valueKg).toBe(77.2)
    expect(written.find((e) => e.type === 'body_composition').payload.fatRatioPct).toBe(23.1)
  })

  it('ignores implausible values', async () => {
    await mockSamples({
      respiratoryRate: [sample(0)],
      bodyTemperature: [sample(98.6)],
      bloodPressure: [sample(0, { systolic: 0, diastolic: 0 })],
      weight: [sample(-1)],
    })
    await connector.sync({ ...RANGE, writer })
    expect(written).toEqual([])
  })

  it('only reads the types that are authorized when the authorization is known', async () => {
    const { Health } = await import('@capgo/capacitor-health')
    Health.checkAuthorization.mockResolvedValue({ readAuthorized: ['steps', 'heartRate'], readDenied: ['bloodPressure'] })
    await mockSamples({})
    const result = await connector.sync({ ...RANGE, writer })
    const read = Health.readSamples.mock.calls.map((c) => c[0].dataType)
    expect(read).toContain('steps')
    expect(read).toContain('heartRate')
    expect(read).not.toContain('bloodPressure')
    expect(read).not.toContain('sleep')
    expect(Health.queryWorkouts).not.toHaveBeenCalled()
    expect(result.errors).toEqual([])
  })

  it('keeps syncing the other types when a new type fails', async () => {
    const { Health } = await import('@capgo/capacitor-health')
    Health.readSamples.mockImplementation(({ dataType }) => {
      if (dataType === 'bloodGlucose') return Promise.reject(new Error('SecurityException'))
      if (dataType === 'steps') return Promise.resolve({ samples: [sample(500)] })
      return Promise.resolve({ samples: [] })
    })
    const result = await connector.sync({ ...RANGE, writer })
    expect(written.some((e) => e.type === 'steps')).toBe(true)
    expect(result.errors.join(' ')).toContain('bloodGlucose')
  })
})

describe('carte Health Connect (VC-27)', () => {
  it('une phrase avec des marques connues, sans Gadgetbridge ; la liste complète des types est à part', () => {
    const c = new HealthConnectConnector()
    expect(c.description).not.toMatch(/Gadgetbridge/)
    expect(c.description).toMatch(/Samsung Health, Garmin, Withings/)
    expect(c.description.length).toBeLessThan(140)
    expect(c.importedList).toEqual(Object.values(READ_TYPE_LABELS))
    expect(c.importedList).toContain('VFC')
  })
})
