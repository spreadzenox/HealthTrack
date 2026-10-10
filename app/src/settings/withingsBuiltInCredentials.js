/**
 * OAuth credentials bundled at build time (official APK / CI).
 * End users never enter Client ID / secret — the maintainer registers one
 * Withings developer app and injects values via VITE_WITHINGS_* env vars.
 */

const APP_ID = 'com.healthtrack.app'

/**
 * Default redirect URIs for OAuth (register all in the Withings developer console).
 */
export function getDefaultWithingsRedirectUris() {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return {
    /** Capacitor Android / iOS deep link */
    native: `${APP_ID}://connectors/withings/callback`,
    /** Vite dev server or hosted web build */
    web: origin ? `${origin}/connectors/withings/callback` : '',
  }
}

/**
 * @returns {{ clientId: string, clientSecret: string, redirectUri: string } | null}
 */
export function getBuiltInWithingsCredentials() {
  const clientId = (import.meta.env.VITE_WITHINGS_CLIENT_ID || '').trim()
  const clientSecret = (import.meta.env.VITE_WITHINGS_CLIENT_SECRET || '').trim()
  const envRedirect = (import.meta.env.VITE_WITHINGS_REDIRECT_URI || '').trim()

  if (!clientId || !clientSecret) return null

  let redirectUri = envRedirect
  if (!redirectUri) {
    const platform =
      typeof window !== 'undefined' && window?.Capacitor?.getPlatform?.()
        ? window.Capacitor.getPlatform()
        : 'web'
    const defaults = getDefaultWithingsRedirectUris()
    redirectUri = platform === 'android' || platform === 'ios'
      ? defaults.native
      : defaults.web
  }

  if (!redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

export function hasBuiltInWithingsCredentials() {
  return getBuiltInWithingsCredentials() != null
}
