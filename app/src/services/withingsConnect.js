/**
 * Starts Withings OAuth in browser or in-app WebView.
 */
import { buildWithingsAuthUrl } from './withingsApi'
import { isWithingsMockMode } from '../settings/withingsConnectConfig'
import { connectWithingsMockAccount } from './withingsMockApi'

/**
 * Mock/demo: instant account connection (tests, VITE_WITHINGS_MOCK builds).
 * @returns {'granted'|'denied'}
 */
export async function connectWithingsAccount() {
  if (isWithingsMockMode()) {
    connectWithingsMockAccount()
    return 'granted'
  }

  const state = `ht_${Date.now()}`
  sessionStorage.setItem('withings_oauth_state', state)
  const url = buildWithingsAuthUrl(state)

  try {
    const { AppLauncher } = await import('@capacitor/app-launcher')
    const platform =
      typeof window !== 'undefined' && window?.Capacitor?.getPlatform?.()
        ? window.Capacitor.getPlatform()
        : 'web'
    if (platform === 'android' || platform === 'ios') {
      const result = await AppLauncher.openUrl({ url })
      if (result?.completed) return 'not_asked'
    }
  } catch {
    // fall through to full navigation
  }

  window.location.href = url
  return 'not_asked'
}
