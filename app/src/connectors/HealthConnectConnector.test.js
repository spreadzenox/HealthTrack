/**
 * Unit tests for HealthConnectConnector.
 *
 * The @capgo/capacitor-health plugin is mocked because it requires native
 * Capacitor bridge. We test the connector's logic/data-mapping in isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HealthConnectConnector, toEntryType } from './HealthConnectConnector'

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
  })

  it('has correct id and name', () => {
    expect(connector.id).toBe('health_connect')
    expect(connector.name).toContain('Health Connect')
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
      const { Capacitor } = await import('@capacitor/core')
      Health.isAvailable.mockRejectedValue(new Error('bridge error'))
      Capacitor.getPlatform.mockReturnValue('web')
      const details = await connector.availabilityDetails()
      expect(details.available).toBe(false)
      expect(details.reason).toBe('unavailable')
      expect(details.nativeReason).toBe('bridge error')
    })

    it('returns reason=provider_update_required when plugin throws on Android (e.g. IllegalStateException on Android 16)', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      const { Capacitor } = await import('@capacitor/core')
      Health.isAvailable.mockRejectedValue(new Error('IllegalStateException: Health Connect not available'))
      Capacitor.getPlatform.mockReturnValue('android')
      const details = await connector.availabilityDetails()
      expect(details.available).toBe(false)
      expect(details.reason).toBe('provider_update_required')
      expect(details.platform).toBe('android')
      expect(details.nativeReason).toBe('IllegalStateException: Health Connect not available')
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

    it('returns denied when any type is denied', async () => {
      const { Health } = await import('@capgo/capacitor-health')
      Health.checkAuthorization.mockResolvedValue({
        readAuthorized: ['steps'],
        readDenied: ['sleep'],
        writeAuthorized: [],
        writeDenied: [],
      })
      expect(await connector.checkPermissions()).toBe('denied')
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
