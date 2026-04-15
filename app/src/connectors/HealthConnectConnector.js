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
import { debugInfo, debugWarn, debugError, debugDebug } from '../utils/debugLog'

const TAG = 'HealthConnect'

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

/**
 * Returns the current Capacitor platform.
 * Reads window.Capacitor synchronously first (no dynamic import, avoids potential
 * WebView re-entry/deadlock on Android). Falls back to 'web'.
 *
 * NOTE: unit tests mock @capacitor/core but not window.Capacitor, so in tests
 * this always returns 'web'. callers that need Android detection under tests
 * should accept an optional override.
 */
function getPlatformSync() {
  try {
    return (typeof window !== 'undefined' && window?.Capacitor?.getPlatform?.()) || 'web'
  } catch {
    return 'web'
  }
}

/**
 * Async platform detection — imports @capacitor/core but prefers the synchronous
 * window.Capacitor path on real devices to avoid potential WebView import deadlocks.
 * On real Android devices window.Capacitor IS set, so the sync path is taken.
 * In unit tests window.Capacitor is not set so we fall through to the dynamic import
 * which respects vi.mock() overrides.
 */
async function getPlatformAsync() {
  // Real device: window.Capacitor.getPlatform() is available synchronously
  const sync = getPlatformSync()
  if (sync !== 'web') return sync
  // Test / web environment: fall back to dynamic import
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.getPlatform()
  } catch {
    return 'web'
  }
}

/** Lazily import the Capacitor plugin to avoid crashing in web/test environments. */
async function getHealthPlugin() {
  try {
    const mod = await import('@capgo/capacitor-health')
    const Health = mod.Health

    // Probe specific expected method names WITHOUT iterating proxy keys.
    // (Object.keys() / getOwnPropertyNames() on a Capacitor native proxy can
    //  trigger bridge calls for every key, potentially deadlocking the WebView thread.)
    const EXPECTED_METHODS = ['isAvailable', 'checkAuthorization', 'requestAuthorization', 'readSamples', 'queryAggregated', 'queryWorkouts', 'openHealthConnectSettings']
    let nativeMethods = []
    try {
      nativeMethods = Health
        ? EXPECTED_METHODS.filter((m) => typeof Health[m] === 'function')
        : []
    } catch (probeErr) {
      debugWarn(TAG, 'Probe méthodes Health échouée', { error: String(probeErr) })
    }
    const hasNativeMethods = nativeMethods.length > 0

    // Also check direct plugin registration via window.Capacitor
    let healthInRegistry = false
    try {
      const pluginsRegistry = (typeof window !== 'undefined' && window?.Capacitor?.Plugins) || {}
      healthInRegistry = 'Health' in pluginsRegistry
    } catch {
      // ignore
    }

    debugInfo(TAG, 'Plugin @capgo/capacitor-health chargé', {
      pluginType: typeof Health,
      pluginIsNull: Health == null,
      nativeMethodsFound: nativeMethods,
      hasNativeMethods,
      healthInCapacitorRegistry: healthInRegistry,
      isNativePlatform: !!(typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.()),
      platform: getPlatformSync(),
    })
    return Health
  } catch (e) {
    debugWarn(TAG, 'Plugin @capgo/capacitor-health introuvable (environnement web/test)', { error: e?.message || String(e) })
    return null
  }
}


/**
 * Collect device/environment diagnostics useful for remote debugging.
 * Never throws — always returns a plain object.
 */
async function collectDeviceInfo() {
  const info = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    jsPlatform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
    language: typeof navigator !== 'undefined' ? navigator.language : 'N/A',
    screenWidth: typeof screen !== 'undefined' ? screen.width : 'N/A',
    screenHeight: typeof screen !== 'undefined' ? screen.height : 'N/A',
    windowCapacitorPresent: typeof window !== 'undefined' && 'Capacitor' in window,
    isNativePlatform: typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true,
    capacitorPlatformRaw: typeof window !== 'undefined' ? window?.Capacitor?.getPlatform?.() ?? 'N/A' : 'N/A',
  }

  // Try to get richer native device info via the Capacitor plugin bridge if available.
  // We access the Device plugin via window.Capacitor.Plugins to avoid a hard import
  // dependency on @capacitor/device (not installed in this project).
  try {
    const DevicePlugin =
      typeof window !== 'undefined' &&
      window?.Capacitor?.Plugins?.Device

    if (DevicePlugin && typeof DevicePlugin.getInfo === 'function') {
      const deviceInfo = await DevicePlugin.getInfo()
      if (deviceInfo) {
        info.deviceManufacturer = deviceInfo.manufacturer
        info.deviceModel = deviceInfo.model
        info.deviceName = deviceInfo.name
        info.osVersion = deviceInfo.osVersion
        info.androidSDKVersion = deviceInfo.androidSDKVersion
        info.platform = deviceInfo.platform
        info.isVirtual = deviceInfo.isVirtual
        info.webViewVersion = deviceInfo.webViewVersion
      }
    } else {
      info.deviceInfoError = 'Device plugin not available on this bridge'
    }
  } catch (deviceErr) {
    info.deviceInfoError = String(deviceErr)
  }

  return info
}

/**
 * Lazily import AppLauncher to avoid crashing in web/test environments.
 * AppLauncher is required to open non-http URLs (custom schemes) on Android
 * from inside a Capacitor WebView — window.open() does not fire Android intents
 * for custom schemes on Android 11+.
 */
async function getAppLauncher() {
  try {
    const mod = await import('@capacitor/app-launcher')
    return mod.AppLauncher
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
   * @returns {Promise<{ available: boolean, reason?: string, nativeReason?: string, platform?: string }>}
   *   - available: true if Health Connect is ready to use
   *   - reason: one of 'provider_update_required' | 'sdk_unavailable' | 'unavailable' | 'no_bridge' | 'timeout'
   *     - 'provider_update_required': Health Connect present but needs a Google Play System update
   *       (SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED). Common on Android 14+ including Android 16.
   *     - 'sdk_unavailable': Health Connect SDK returned SDK_UNAVAILABLE — device reports HC as
   *       not available even though it should be on Android 14+ (One UI 8, Android 16, etc.).
   *       Typically resolved by updating via Google Play System Updates.
   *     - 'unavailable': catch-all for other unavailability scenarios
   *     - 'no_bridge': Capacitor native bridge is absent (web/dev/test environment)
   *     - 'timeout': native call did not respond within 10 s
   *   - nativeReason: raw reason string returned by the native plugin (useful for diagnostics)
   *   - platform: 'android' or undefined
   */
  async availabilityDetails() {
    debugInfo(TAG, 'Début vérification disponibilité Health Connect')

    // Collect device info early so it is logged even if something below hangs
    const deviceInfo = await collectDeviceInfo()
    debugInfo(TAG, 'Informations appareil', deviceInfo)

    const Health = await getHealthPlugin()

    // Platform: sync first (real Android device), async fallback (tests/web).
    // getPlatformSync() reads window.Capacitor which is set on all real Capacitor builds.
    // The async fallback handles test environments where window.Capacitor is not mocked.
    const platform = await getPlatformAsync()
    debugInfo(TAG, `Plateforme détectée : ${platform}`)

    if (!Health) {
      debugWarn(TAG, 'Aucun bridge natif Capacitor détecté → no_bridge', { reason: 'no_bridge' })
      return { available: false, reason: 'no_bridge' }
    }

    // Verify method presence immediately after getHealthPlugin() returns.
    // This distinguishes a real native proxy (has isAvailable) from a web stub.
    const hasIsAvailable = typeof Health.isAvailable === 'function'
    debugInfo(TAG, 'Vérification méthode Health.isAvailable', {
      hasIsAvailable,
      platform,
      isNative: getPlatformSync() === 'android',
    })

    if (!hasIsAvailable) {
      debugError(TAG, 'Health.isAvailable() absent du proxy — plugin natif non chargé', {
        platform,
        bridgePresent: !!(typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.()),
      })
      return { available: false, reason: 'no_bridge', platform }
    }

    // Quick bridge responsiveness test — getPluginVersion() is lightweight and synchronous
    // on the native side. If it times out, the bridge is hung.
    try {
      if (typeof Health.getPluginVersion === 'function') {
        const versionResult = await Promise.race([
          Health.getPluginVersion(),
          new Promise((resolve) => setTimeout(() => resolve({ __timeout: true }), 3000)),
        ])
        if (versionResult?.__timeout) {
          debugError(TAG, 'Bridge Capacitor suspendu — getPluginVersion() timeout 3s', { platform })
        } else {
          debugInfo(TAG, 'Bridge Capacitor opérationnel', { pluginVersion: versionResult?.version, platform })
        }
      }
    } catch (pingErr) {
      debugWarn(TAG, 'getPluginVersion() échouée (non bloquant)', { error: String(pingErr) })
    }

    // Run getAvailabilityStatus() in parallel (if available in patched build) to
    // get exact SDK status codes for diagnosis — non-blocking, best-effort.
    if (typeof Health.getAvailabilityStatus === 'function') {
      Promise.race([
        Health.getAvailabilityStatus(),
        new Promise((resolve) => setTimeout(() => resolve({ __timeout: true }), 5000)),
      ]).then((statusResult) => {
        if (statusResult?.__timeout) {
          debugWarn(TAG, 'getAvailabilityStatus() timeout 5s')
        } else {
          debugInfo(TAG, 'Statut SDK détaillé (getAvailabilityStatus)', statusResult)
        }
      }).catch((e) => {
        debugWarn(TAG, 'getAvailabilityStatus() échouée', { error: String(e) })
      })
    }

    // Fall back to isAvailable() — always available in non-patched builds.
    debugInfo(TAG, `Méthode d'appel : isAvailable`)

    try {
      debugInfo(TAG, 'Appel Health.isAvailable() — en attente de la réponse native…')
      const t0 = Date.now()

      // Wrap with a 10-second timeout so we can detect a hanging native call.
      const TIMEOUT_MS = 10000
      let timedOut = false
      const result = await Promise.race([
        Health.isAvailable(),
        new Promise((resolve) => {
          setTimeout(() => {
            timedOut = true
            resolve({ __timeout: true })
          }, TIMEOUT_MS)
        }),
      ])

      const elapsed = Date.now() - t0
      debugInfo(TAG, `Health.isAvailable() a répondu en ${elapsed} ms`, { timedOut })

      if (timedOut || result?.__timeout) {
        debugError(TAG, `Health.isAvailable() n'a pas répondu après ${TIMEOUT_MS} ms → timeout`, {
          platform,
          deviceInfo,
        })
        return { available: false, reason: 'timeout', platform }
      }

      // Log the complete raw result — every key/value — so nothing is hidden.
      debugInfo(TAG, 'Réponse brute Health.isAvailable()', {
        rawResult: result,
        available: result?.available,
        reason: result?.reason,
        platform: result?.platform,
        statusCode: result?.statusCode,
        sdkInt: result?.sdkInt,
        systemModuleStatus: result?.systemModuleStatus,
        defaultProviderStatus: result?.defaultProviderStatus,
        elapsedMs: elapsed,
      })

      if (result.available === true) {
        debugInfo(TAG, 'Health Connect DISPONIBLE ✅', { platform: result.platform })
        return { available: true, platform: result.platform }
      }

      // Map the native reason string to a stable enum value
      const nativeReason = result.reason || ''
      debugWarn(TAG, `Health Connect NON disponible — raison native : "${nativeReason}"`, {
        nativeReason,
        platform: result.platform,
        fullResult: result,
      })

      if (nativeReason.toLowerCase().includes('update')) {
        debugWarn(TAG, 'Diagnostic : SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED → mise à jour système nécessaire')
        return { available: false, reason: 'provider_update_required', nativeReason, platform: result.platform }
      }

      // SDK_UNAVAILABLE is distinct from SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED:
      // it means Health Connect is absent/disabled on the device. On Android 14+ (including
      // Android 16 / One UI 8) this can still happen when system modules are out of date
      // or when the device reports HC as unavailable despite it being a built-in module.
      if (result.platform === 'android' || platform === 'android') {
        debugWarn(TAG, 'Diagnostic : SDK_UNAVAILABLE sur Android → module HC absent ou désactivé')
        return { available: false, reason: 'sdk_unavailable', nativeReason, platform: result.platform ?? platform }
      }
      debugWarn(TAG, 'Diagnostic : indisponible (raison inconnue)')
      return { available: false, reason: 'unavailable', nativeReason, platform: result.platform }
    } catch (e) {
      // If the native bridge itself throws (e.g. IllegalStateException on Android 16),
      // determine the platform so the UI can show the right guidance.
      const errMsg = e?.message || String(e)
      debugError(TAG, `Exception pendant Health.isAvailable() : ${errMsg}`, {
        errorType: e?.name,
        errorMessage: errMsg,
        errorStack: e?.stack,
        platform,
      })

      if (platform === 'android') {
        debugWarn(TAG, 'Exception sur Android → considéré comme provider_update_required')
        return { available: false, reason: 'provider_update_required', nativeReason: errMsg, platform }
      }
      return { available: false, reason: 'unavailable', nativeReason: errMsg, platform }
    }
  }

  /**
   * Opens the Android Health Connect settings screen directly (permissions, data sources).
   * Returns true on success, false when the intent could not be fired.
   * No-op (returns false) in web/test environments.
   */
  async openHealthConnectSettings() {
    debugInfo(TAG, 'Tentative ouverture paramètres Health Connect')
    const Health = await getHealthPlugin()
    if (!Health || typeof Health.openHealthConnectSettings !== 'function') {
      debugWarn(TAG, 'openHealthConnectSettings non disponible sur ce bridge')
      return false
    }
    try {
      await Health.openHealthConnectSettings()
      debugInfo(TAG, 'Paramètres Health Connect ouverts avec succès')
      return true
    } catch (e) {
      debugError(TAG, `Échec ouverture paramètres Health Connect : ${e?.message || e}`)
      return false
    }
  }

  /**
   * Attempts to open Samsung Health via deep-link so the user can enable the
   * Health Connect integration inside Samsung Health settings.
   *
   * Uses @capacitor/app-launcher because window.open() does not fire Android
   * intents for custom URL schemes (like samsunghealth://) inside a Capacitor
   * WebView on Android 11+. Falls back to a Play Store search link if Samsung
   * Health is not installed (i.e. AppLauncher.openUrl rejects).
   *
   * Returns true when an intent was dispatched, false in web/test environments.
   */
  async openSamsungHealth() {
    debugInfo(TAG, 'Tentative ouverture Samsung Health')
    const AppLauncher = await getAppLauncher()
    if (!AppLauncher) {
      debugWarn(TAG, 'AppLauncher non disponible')
      return false
    }
    // Try deep-link first, then market:// scheme, then HTTPS Play Store as final fallback
    const urls = [
      'samsunghealth://',
      'market://details?id=com.sec.android.app.shealth',
      'https://play.google.com/store/apps/details?id=com.sec.android.app.shealth',
    ]
    for (const url of urls) {
      try {
        debugDebug(TAG, `Essai URL Samsung Health : ${url}`)
        const result = await AppLauncher.openUrl({ url })
        if (result && result.completed) {
          debugInfo(TAG, `Samsung Health ouvert via : ${url}`)
          return true
        }
      } catch (e) {
        debugDebug(TAG, `URL Samsung Health échouée : ${url}`, { error: e?.message })
      }
    }
    debugError(TAG, 'Aucune URL Samsung Health n\'a fonctionné')
    return false
  }

  /**
   * Attempts to open the Health Connect system module page in Google Play so
   * the user can trigger a Google Play System Update for Health Connect.
   *
   * On Android 14+ Health Connect ships as a standalone system module under
   * com.google.android.healthconnect.controller (not com.google.android.gms).
   * Opening this Play listing prompts the system to check for/apply the update.
   *
   * Uses @capacitor/app-launcher for the same reason as openSamsungHealth().
   * Returns true when an intent was dispatched.
   */
  async openGooglePlaySystemUpdates() {
    debugInfo(TAG, 'Tentative ouverture Google Play System Updates (Health Connect)')
    const AppLauncher = await getAppLauncher()
    if (!AppLauncher) {
      debugWarn(TAG, 'AppLauncher non disponible')
      return false
    }
    const urls = [
      'market://details?id=com.google.android.healthconnect.controller',
      'https://play.google.com/store/apps/details?id=com.google.android.healthconnect.controller',
    ]
    for (const url of urls) {
      try {
        debugDebug(TAG, `Essai URL Google Play HC : ${url}`)
        const result = await AppLauncher.openUrl({ url })
        if (result && result.completed) {
          debugInfo(TAG, `Google Play HC ouvert via : ${url}`)
          return true
        }
      } catch (e) {
        debugDebug(TAG, `URL Google Play HC échouée : ${url}`, { error: e?.message })
      }
    }
    debugError(TAG, 'Aucune URL Google Play HC n\'a fonctionné')
    return false
  }

  async checkPermissions() {
    debugInfo(TAG, 'Vérification des permissions Health Connect')
    const Health = await getHealthPlugin()
    if (!Health) {
      debugWarn(TAG, 'Bridge absent → permissions non demandées')
      return 'not_asked'
    }
    const platform = await getPlatformAsync()
    const hasCheckAuth = typeof Health.checkAuthorization === 'function'
    debugInfo(TAG, 'Vérification méthode Health.checkAuthorization', { hasCheckAuth, platform })
    if (!hasCheckAuth) {
      debugWarn(TAG, 'Health.checkAuthorization absent → permissions non demandées', { platform })
      return 'not_asked'
    }
    try {
      debugInfo(TAG, 'Appel Health.checkAuthorization()…', { readTypes: READ_TYPES })
      const status = await Health.checkAuthorization({ read: READ_TYPES, write: [] })
      debugInfo(TAG, 'Résultat checkAuthorization()', status)
      if (status.readDenied && status.readDenied.length > 0) {
        debugWarn(TAG, `Permissions refusées pour : ${status.readDenied.join(', ')}`)
        return 'denied'
      }
      if (status.readAuthorized && status.readAuthorized.length > 0) {
        debugInfo(TAG, `Permissions accordées pour : ${status.readAuthorized.join(', ')}`)
        return 'granted'
      }
      debugInfo(TAG, 'Permissions non encore demandées')
      return 'not_asked'
    } catch (e) {
      debugError(TAG, `Exception pendant checkAuthorization : ${e?.message || e}`, { error: e })
      return 'not_asked'
    }
  }

  async requestPermissions() {
    debugInfo(TAG, 'Demande de permissions Health Connect', { readTypes: READ_TYPES })
    const Health = await getHealthPlugin()
    if (!Health) {
      debugWarn(TAG, 'Bridge absent → impossible de demander les permissions')
      return 'denied'
    }
    const hasRequestAuth = typeof Health.requestAuthorization === 'function'
    debugInfo(TAG, 'Vérification méthode Health.requestAuthorization', { hasRequestAuth, platform: await getPlatformAsync() })
    if (!hasRequestAuth) {
      debugWarn(TAG, 'Health.requestAuthorization absent → denied')
      return 'denied'
    }
    try {
      debugInfo(TAG, 'Appel Health.requestAuthorization()…')
      await Health.requestAuthorization({ read: READ_TYPES, write: [] })
      debugInfo(TAG, 'requestAuthorization() terminé, vérification du résultat…')
      return await this.checkPermissions()
    } catch (e) {
      debugError(TAG, `Exception pendant requestAuthorization : ${e?.message || e}`, { error: e })
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
    debugInfo(TAG, 'Début synchronisation', {
      since: since?.toISOString(),
      until: (until || new Date()).toISOString(),
    })

    const Health = await getHealthPlugin()
    if (!Health) {
      debugError(TAG, 'Bridge absent → synchronisation impossible')
      return { synced: 0, skipped: 0, errors: ['Health Connect non disponible'] }
    }

    const endDate = (until || new Date()).toISOString()
    const startDate = since.toISOString()
    const errors = []
    let synced = 0
    const skipped = 0

    // Determine if this is a large historical fetch (> 30 days)
    const rangeMs = (until || new Date()).getTime() - since.getTime()
    const isHistorical = rangeMs > 30 * 24 * 60 * 60 * 1000
    debugInfo(TAG, `Mode sync : ${isHistorical ? 'historique (> 30 j)' : 'incrémental'}`, {
      startDate,
      endDate,
      rangeDays: Math.round(rangeMs / (24 * 60 * 60 * 1000)),
    })

    // ── Steps ──────────────────────────────────────────────────────────────
    try {
      debugDebug(TAG, 'Lecture des pas…')
      if (isHistorical) {
        const { samples } = await Health.queryAggregated({
          dataType: 'steps',
          startDate,
          endDate,
          bucket: 'day',
          aggregation: 'sum',
        })
        debugInfo(TAG, `Pas (agrégés) : ${samples.length} jours récupérés`)
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
        debugInfo(TAG, `Pas (échantillons) : ${samples.length} entrées récupérées`)
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
      debugError(TAG, `Erreur lecture pas : ${e?.message || e}`, { error: e })
      errors.push(`steps: ${e.message || e}`)
    }

    // ── Sleep ──────────────────────────────────────────────────────────────
    try {
      debugDebug(TAG, 'Lecture du sommeil…')
      const { samples } = await Health.readSamples({
        dataType: 'sleep',
        startDate,
        endDate,
        limit: 500,
        ascending: true,
      })
      debugInfo(TAG, `Sommeil : ${samples.length} entrées récupérées`)
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
      debugError(TAG, `Erreur lecture sommeil : ${e?.message || e}`, { error: e })
      errors.push(`sleep: ${e.message || e}`)
    }

    // ── Heart rate ─────────────────────────────────────────────────────────
    try {
      debugDebug(TAG, 'Lecture fréquence cardiaque…')
      const { samples } = await Health.readSamples({
        dataType: 'heartRate',
        startDate,
        endDate,
        limit: 2000,
        ascending: true,
      })
      debugInfo(TAG, `FC : ${samples.length} entrées récupérées`)
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
      debugError(TAG, `Erreur lecture FC : ${e?.message || e}`, { error: e })
      errors.push(`heartRate: ${e.message || e}`)
    }

    // ── Resting heart rate ─────────────────────────────────────────────────
    try {
      debugDebug(TAG, 'Lecture FC repos…')
      const { samples } = await Health.readSamples({
        dataType: 'restingHeartRate',
        startDate,
        endDate,
        limit: 500,
        ascending: true,
      })
      debugInfo(TAG, `FC repos : ${samples.length} entrées récupérées`)
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
      debugError(TAG, `Erreur lecture FC repos : ${e?.message || e}`, { error: e })
      errors.push(`restingHeartRate: ${e.message || e}`)
    }

    // ── Oxygen saturation (SpO₂) ───────────────────────────────────────────
    try {
      debugDebug(TAG, 'Lecture SpO₂…')
      const { samples } = await Health.readSamples({
        dataType: 'oxygenSaturation',
        startDate,
        endDate,
        limit: 500,
        ascending: true,
      })
      debugInfo(TAG, `SpO₂ : ${samples.length} entrées récupérées`)
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
      debugError(TAG, `Erreur lecture SpO₂ : ${e?.message || e}`, { error: e })
      errors.push(`oxygenSaturation: ${e.message || e}`)
    }

    // ── HRV ───────────────────────────────────────────────────────────────
    try {
      debugDebug(TAG, 'Lecture HRV…')
      const { samples } = await Health.readSamples({
        dataType: 'heartRateVariability',
        startDate,
        endDate,
        limit: 500,
        ascending: true,
      })
      debugInfo(TAG, `HRV : ${samples.length} entrées récupérées`)
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
      debugError(TAG, `Erreur lecture HRV : ${e?.message || e}`, { error: e })
      errors.push(`heartRateVariability: ${e.message || e}`)
    }

    // ── Calories ───────────────────────────────────────────────────────────
    try {
      debugDebug(TAG, 'Lecture calories…')
      if (isHistorical) {
        const { samples } = await Health.queryAggregated({
          dataType: 'calories',
          startDate,
          endDate,
          bucket: 'day',
          aggregation: 'sum',
        })
        debugInfo(TAG, `Calories (agrégées) : ${samples.length} jours récupérés`)
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
        debugInfo(TAG, `Calories (échantillons) : ${samples.length} entrées récupérées`)
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
      debugError(TAG, `Erreur lecture calories : ${e?.message || e}`, { error: e })
      errors.push(`calories: ${e.message || e}`)
    }

    // ── Workouts / Activities ──────────────────────────────────────────────
    try {
      debugDebug(TAG, 'Lecture activités/entraînements…')
      const { workouts } = await Health.queryWorkouts({
        startDate,
        endDate,
        limit: 200,
        ascending: true,
      })
      debugInfo(TAG, `Activités : ${workouts.length} entraînements récupérés`)
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
      debugError(TAG, `Erreur lecture activités : ${e?.message || e}`, { error: e })
      errors.push(`workouts: ${e.message || e}`)
    }

    debugInfo(TAG, 'Synchronisation terminée', { synced, skipped, errors })
    return { synced, skipped, errors }
  }
}

// Export the mapping helper for tests
export { toEntryType }
