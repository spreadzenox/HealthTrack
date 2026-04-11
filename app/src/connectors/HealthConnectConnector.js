/**
 * HealthConnectConnector – reads health data from Android Health Connect.
 *
 * Samsung Galaxy Fit 3 data flow:
 *   Fit 3 → Samsung Health app → Health Connect (Android universal health platform)
 *                                        ↕
 *                              HealthTrack (this connector)
 *
 * On Android 14+ (API 34+) Health Connect is integrated as a system module —
 * it does NOT need to be installed separately. The Play Store app is only for
 * Android 8–13. If the SDK reports SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED on
 * Android 14+, it means the built-in Health Connect system module needs a system
 * update (OTA), not a manual Play Store install.
 *
 * In a web/browser environment (e.g. during unit tests or desktop dev),
 * the Capacitor bridge is absent: isAvailable() returns false gracefully.
 *
 * Reads: steps, sleep, heart rate, activity (workouts), calories, distance,
 *        resting heart rate, oxygen saturation, HRV.
 */
import { BaseConnector } from './BaseConnector'

/** Data types fetched from Health Connect (must match @capgo/capacitor-health identifiers). */
const READ_TYPES = [
  'steps',
  'sleep',
  'heartRate',
  'restingHeartRate',
  'heartRateVariability',
  'oxygenSaturation',
  'calories',
  'distance',
  'workouts',
]

/**
 * Map a @capgo/capacitor-health dataType to a HealthTrack entry type.
 * HealthTrack entry types: 'steps' | 'sleep' | 'heart_rate' | 'activity' | 'calories'
 */
function toEntryType(dataType) {
  const map = {
    steps: 'steps',
    sleep: 'sleep',
    heartRate: 'heart_rate',
    restingHeartRate: 'heart_rate',
    heartRateVariability: 'heart_rate',
    oxygenSaturation: 'heart_rate',
    calories: 'calories',
    distance: 'activity',
    workouts: 'activity',
  }
  return map[dataType] || dataType
}

/** Lazily import the Capacitor plugin to avoid crashing in web/test environments. */
async function getHealthPlugin() {
  try {
    const mod = await import('@capgo/capacitor-health')
    return mod.Health
  } catch {
    return null
  }
}

export class HealthConnectConnector extends BaseConnector {
  constructor() {
    super({
      id: 'health_connect',
      name: 'Health Connect (Samsung Fit 3)',
      description:
        'Importe les données de la Samsung Galaxy Fit 3 via Android Health Connect : ' +
        'pas à pas, sommeil, fréquence cardiaque, activités sportives, calories, SpO₂.',
      dataTypes: ['steps', 'sleep', 'heart_rate', 'activity', 'calories'],
    })
  }

  async isAvailable() {
    const Health = await getHealthPlugin()
    if (!Health) return false
    try {
      const result = await Health.isAvailable()
      return result.available === true
    } catch {
      return false
    }
  }

  /**
   * Returns detailed availability information including the reason when
   * Health Connect is not available.
   *
   * @returns {Promise<{ available: boolean, reason?: string, platform?: string }>}
   *   - available: true if Health Connect is ready to use
   *   - reason: one of 'provider_update_required' | 'sdk_unavailable' | 'unavailable' | 'no_bridge'
   *     - 'provider_update_required': Health Connect present but needs a Google Play System update
   *       (SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED). Common on Android 14+ including Android 16.
   *     - 'sdk_unavailable': Health Connect SDK returned SDK_UNAVAILABLE — device reports HC as
   *       not available even though it should be on Android 14+ (One UI 8, Android 16, etc.).
   *       Typically resolved by updating via Google Play System Updates.
   *     - 'unavailable': catch-all for other unavailability scenarios
   *     - 'no_bridge': Capacitor native bridge is absent (web/dev/test environment)
   *   - platform: 'android' or undefined
   */
  async availabilityDetails() {
    const Health = await getHealthPlugin()
    if (!Health) return { available: false, reason: 'no_bridge' }
    try {
      const result = await Health.isAvailable()
      if (result.available === true) {
        return { available: true, platform: result.platform }
      }
      // Map the native reason string to a stable enum value
      const reason = result.reason || ''
      if (reason.toLowerCase().includes('update')) {
        return { available: false, reason: 'provider_update_required', platform: result.platform }
      }
      // SDK_UNAVAILABLE is distinct from SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED:
      // it means Health Connect is absent/disabled on the device. On Android 14+ (including
      // Android 16 / One UI 8) this can still happen when system modules are out of date
      // or when the device reports HC as unavailable despite it being a built-in module.
      if (result.platform === 'android') {
        return { available: false, reason: 'sdk_unavailable', platform: result.platform }
      }
      return { available: false, reason: 'unavailable', platform: result.platform }
    } catch {
      return { available: false, reason: 'unavailable' }
    }
  }

  /**
   * Opens the Android Health Connect settings screen directly (permissions, data sources).
   * No-op in web/test environments.
   */
  async openHealthConnectSettings() {
    const Health = await getHealthPlugin()
    if (!Health || typeof Health.openHealthConnectSettings !== 'function') return
    try {
      await Health.openHealthConnectSettings()
    } catch {
      // ignore – settings intent may not be available on all devices
    }
  }

  async checkPermissions() {
    const Health = await getHealthPlugin()
    if (!Health) return 'not_asked'
    try {
      const status = await Health.checkAuthorization({ read: READ_TYPES, write: [] })
      if (status.readDenied && status.readDenied.length > 0) return 'denied'
      if (status.readAuthorized && status.readAuthorized.length > 0) return 'granted'
      return 'not_asked'
    } catch {
      return 'not_asked'
    }
  }

  async requestPermissions() {
    const Health = await getHealthPlugin()
    if (!Health) return 'denied'
    try {
      await Health.requestAuthorization({ read: READ_TYPES, write: [] })
      return await this.checkPermissions()
    } catch {
      return 'denied'
    }
  }

  /**
   * Sync health data from Health Connect into local HealthTrack storage.
   *
   * Strategy: fetch each data type independently; for large historical imports
   * (since > 30 days ago) we aggregate steps/calories/distance by day to avoid
   * storing tens of thousands of individual samples; heart rate and sleep are
   * stored as individual samples.
   *
   * @param {{ since: Date, until?: Date, writer: function }} opts
   */
  async sync({ since, until, writer }) {
    const Health = await getHealthPlugin()
    if (!Health) return { synced: 0, skipped: 0, errors: ['Health Connect non disponible'] }

    const endDate = (until || new Date()).toISOString()
    const startDate = since.toISOString()
    const errors = []
    let synced = 0
    const skipped = 0

    // Determine if this is a large historical fetch (> 30 days)
    const rangeMs = (until || new Date()).getTime() - since.getTime()
    const isHistorical = rangeMs > 30 * 24 * 60 * 60 * 1000

    // ── Steps ──────────────────────────────────────────────────────────────
    try {
      if (isHistorical) {
        const { samples } = await Health.queryAggregated({
          dataType: 'steps',
          startDate,
          endDate,
          bucket: 'day',
          aggregation: 'sum',
        })
        const entries = samples.map((s) => ({
          type: 'steps',
          source: 'health_connect',
          at: s.startDate,
          payload: {
            value: s.value,
            unit: s.unit,
            period: 'day',
            endDate: s.endDate,
            connector: 'health_connect',
          },
        }))
        await writer(entries)
        synced += entries.length
      } else {
        const { samples } = await Health.readSamples({
          dataType: 'steps',
          startDate,
          endDate,
          limit: 1000,
          ascending: true,
        })
        const entries = samples.map((s) => ({
          type: 'steps',
          source: 'health_connect',
          at: s.startDate,
          payload: {
            value: s.value,
            unit: s.unit,
            endDate: s.endDate,
            platformId: s.platformId,
            sourceName: s.sourceName,
            connector: 'health_connect',
          },
        }))
        await writer(entries)
        synced += entries.length
      }
    } catch (e) {
      errors.push(`steps: ${e.message || e}`)
    }

    // ── Sleep ──────────────────────────────────────────────────────────────
    try {
      const { samples } = await Health.readSamples({
        dataType: 'sleep',
        startDate,
        endDate,
        limit: 500,
        ascending: true,
      })
      const entries = samples.map((s) => ({
        type: 'sleep',
        source: 'health_connect',
        at: s.startDate,
        payload: {
          durationMinutes: s.value,
          sleepState: s.sleepState,
          endDate: s.endDate,
          unit: s.unit,
          platformId: s.platformId,
          sourceName: s.sourceName,
          connector: 'health_connect',
        },
      }))
      await writer(entries)
      synced += entries.length
    } catch (e) {
      errors.push(`sleep: ${e.message || e}`)
    }

    // ── Heart rate ─────────────────────────────────────────────────────────
    try {
      const { samples } = await Health.readSamples({
        dataType: 'heartRate',
        startDate,
        endDate,
        limit: 2000,
        ascending: true,
      })
      const entries = samples.map((s) => ({
        type: 'heart_rate',
        source: 'health_connect',
        at: s.startDate,
        payload: {
          bpm: s.value,
          unit: s.unit,
          subtype: 'heartRate',
          platformId: s.platformId,
          sourceName: s.sourceName,
          connector: 'health_connect',
        },
      }))
      await writer(entries)
      synced += entries.length
    } catch (e) {
      errors.push(`heartRate: ${e.message || e}`)
    }

    // ── Resting heart rate ─────────────────────────────────────────────────
    try {
      const { samples } = await Health.readSamples({
        dataType: 'restingHeartRate',
        startDate,
        endDate,
        limit: 500,
        ascending: true,
      })
      const entries = samples.map((s) => ({
        type: 'heart_rate',
        source: 'health_connect',
        at: s.startDate,
        payload: {
          bpm: s.value,
          unit: s.unit,
          subtype: 'restingHeartRate',
          platformId: s.platformId,
          sourceName: s.sourceName,
          connector: 'health_connect',
        },
      }))
      await writer(entries)
      synced += entries.length
    } catch (e) {
      errors.push(`restingHeartRate: ${e.message || e}`)
    }

    // ── Oxygen saturation (SpO₂) ───────────────────────────────────────────
    try {
      const { samples } = await Health.readSamples({
        dataType: 'oxygenSaturation',
        startDate,
        endDate,
        limit: 500,
        ascending: true,
      })
      const entries = samples.map((s) => ({
        type: 'heart_rate',
        source: 'health_connect',
        at: s.startDate,
        payload: {
          value: s.value,
          unit: s.unit,
          subtype: 'oxygenSaturation',
          platformId: s.platformId,
          sourceName: s.sourceName,
          connector: 'health_connect',
        },
      }))
      await writer(entries)
      synced += entries.length
    } catch (e) {
      errors.push(`oxygenSaturation: ${e.message || e}`)
    }

    // ── HRV ───────────────────────────────────────────────────────────────
    try {
      const { samples } = await Health.readSamples({
        dataType: 'heartRateVariability',
        startDate,
        endDate,
        limit: 500,
        ascending: true,
      })
      const entries = samples.map((s) => ({
        type: 'heart_rate',
        source: 'health_connect',
        at: s.startDate,
        payload: {
          value: s.value,
          unit: s.unit,
          subtype: 'heartRateVariability',
          platformId: s.platformId,
          sourceName: s.sourceName,
          connector: 'health_connect',
        },
      }))
      await writer(entries)
      synced += entries.length
    } catch (e) {
      errors.push(`heartRateVariability: ${e.message || e}`)
    }

    // ── Calories ───────────────────────────────────────────────────────────
    try {
      if (isHistorical) {
        const { samples } = await Health.queryAggregated({
          dataType: 'calories',
          startDate,
          endDate,
          bucket: 'day',
          aggregation: 'sum',
        })
        const entries = samples.map((s) => ({
          type: 'calories',
          source: 'health_connect',
          at: s.startDate,
          payload: {
            value: s.value,
            unit: s.unit,
            period: 'day',
            endDate: s.endDate,
            connector: 'health_connect',
          },
        }))
        await writer(entries)
        synced += entries.length
      } else {
        const { samples } = await Health.readSamples({
          dataType: 'calories',
          startDate,
          endDate,
          limit: 500,
          ascending: true,
        })
        const entries = samples.map((s) => ({
          type: 'calories',
          source: 'health_connect',
          at: s.startDate,
          payload: {
            value: s.value,
            unit: s.unit,
            endDate: s.endDate,
            platformId: s.platformId,
            sourceName: s.sourceName,
            connector: 'health_connect',
          },
        }))
        await writer(entries)
        synced += entries.length
      }
    } catch (e) {
      errors.push(`calories: ${e.message || e}`)
    }

    // ── Workouts / Activities ──────────────────────────────────────────────
    try {
      const { workouts } = await Health.queryWorkouts({
        startDate,
        endDate,
        limit: 200,
        ascending: true,
      })
      const entries = workouts.map((w) => ({
        type: 'activity',
        source: 'health_connect',
        at: w.startDate,
        payload: {
          workoutType: w.workoutType,
          durationSeconds: w.duration,
          totalCalories: w.totalEnergyBurned,
          totalDistanceMeters: w.totalDistance,
          endDate: w.endDate,
          sourceName: w.sourceName,
          platformId: w.platformId,
          connector: 'health_connect',
        },
      }))
      await writer(entries)
      synced += entries.length
    } catch (e) {
      errors.push(`workouts: ${e.message || e}`)
    }

    return { synced, skipped, errors }
  }
}

// Export the mapping helper for tests
export { toEntryType }
