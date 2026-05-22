/**
 * Withings OAuth credentials and tokens — stored locally only.
 * Credentials come from build-time env (official app) or legacy localStorage (dev).
 */

import { getBuiltInWithingsCredentials } from './withingsBuiltInCredentials'

const CREDS_KEY = 'healthtrack_withings_credentials'
const TOKENS_KEY = 'healthtrack_withings_tokens'
const USER_KEY = 'healthtrack_withings_user'

/**
 * @returns {{ clientId: string, clientSecret: string, redirectUri: string }}
 */
export function getWithingsCredentials() {
  const builtIn = getBuiltInWithingsCredentials()
  if (builtIn) return builtIn

  try {
    const raw = localStorage.getItem(CREDS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { clientId: '', clientSecret: '', redirectUri: '' }
}

/**
 * @param {{ clientId?: string, clientSecret?: string, redirectUri?: string }} patch
 */
export function setWithingsCredentials(patch) {
  const current = getWithingsCredentials()
  const updated = {
    clientId: (patch.clientId ?? current.clientId).trim(),
    clientSecret: (patch.clientSecret ?? current.clientSecret).trim(),
    redirectUri: (patch.redirectUri ?? current.redirectUri).trim(),
  }
  if (!updated.clientId && !updated.clientSecret && !updated.redirectUri) {
    localStorage.removeItem(CREDS_KEY)
  } else {
    localStorage.setItem(CREDS_KEY, JSON.stringify(updated))
  }
}

export function hasWithingsCredentials() {
  const { clientId, clientSecret, redirectUri } = getWithingsCredentials()
  return Boolean(clientId && clientSecret && redirectUri)
}

/**
 * @returns {{ accessToken: string, refreshToken: string, expiresAt: number, userid?: string } | null}
 */
export function getWithingsTokens() {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

/**
 * @param {object|null} tokens
 */
export function setWithingsTokens(tokens) {
  if (!tokens) {
    localStorage.removeItem(TOKENS_KEY)
    return
  }
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
}

export function hasWithingsTokens() {
  const t = getWithingsTokens()
  return Boolean(t?.accessToken)
}

/**
 * @returns {{ sex?: 'M'|'F', age?: number } | null}
 */
export function getWithingsUserProfile() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

export function setWithingsUserProfile(profile) {
  if (!profile) {
    localStorage.removeItem(USER_KEY)
    return
  }
  localStorage.setItem(USER_KEY, JSON.stringify(profile))
}

export function clearWithingsAuth() {
  localStorage.removeItem(TOKENS_KEY)
  localStorage.removeItem(USER_KEY)
}
