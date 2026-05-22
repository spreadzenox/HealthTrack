/**
 * Withings Health API client (OAuth2 + measures).
 * All calls are made directly from the device; tokens stay in localStorage.
 */

import {
  getWithingsCredentials,
  getWithingsTokens,
  setWithingsTokens,
  setWithingsUserProfile,
} from '../settings/withingsSettings'
import { isWithingsMockMode } from '../settings/withingsConnectConfig'
import {
  mockExchangeWithingsCode,
  mockFetchWithingsMeasures,
  mockFetchAndCacheWithingsUser,
} from './withingsMockApi'

const AUTH_URL = 'https://account.withings.com/oauth2_user/authorize2'
const TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2'
const API_BASE = 'https://wbsapi.withings.net'

const SCOPES = 'user.info,user.metrics,user.activity'

/**
 * Builds the OAuth2 authorization URL.
 * @param {string} state
 */
export function buildWithingsAuthUrl(state) {
  const { clientId, redirectUri } = getWithingsCredentials()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    state,
    scope: SCOPES,
    redirect_uri: redirectUri,
  })
  return `${AUTH_URL}?${params.toString()}`
}

/**
 * Exchanges an authorization code for access + refresh tokens.
 * @param {string} code
 */
export async function exchangeWithingsCode(code) {
  if (isWithingsMockMode()) return mockExchangeWithingsCode(code)

  const { clientId, clientSecret, redirectUri } = getWithingsCredentials()
  const body = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const json = await res.json()
  if (json.status !== 0 || !json.body) {
    throw new Error(json.error || 'Échec de l’authentification Withings')
  }
  const expiresAt = Date.now() + (json.body.expires_in || 10800) * 1000
  const tokens = {
    accessToken: json.body.access_token,
    refreshToken: json.body.refresh_token,
    expiresAt,
    userid: json.body.userid != null ? String(json.body.userid) : undefined,
  }
  setWithingsTokens(tokens)
  return tokens
}

/**
 * Refreshes the access token if expired.
 * @returns {Promise<string>} valid access token
 */
export async function ensureWithingsAccessToken() {
  const tokens = getWithingsTokens()
  if (!tokens?.accessToken) throw new Error('Non connecté à Withings')

  if (isWithingsMockMode() || tokens.expiresAt > Date.now() + 60_000) {
    return tokens.accessToken
  }

  const { clientId, clientSecret } = getWithingsCredentials()
  const body = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: tokens.refreshToken,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const json = await res.json()
  if (json.status !== 0 || !json.body) {
    throw new Error(json.error || 'Impossible de rafraîchir le token Withings')
  }
  const updated = {
    accessToken: json.body.access_token,
    refreshToken: json.body.refresh_token || tokens.refreshToken,
    expiresAt: Date.now() + (json.body.expires_in || 10800) * 1000,
    userid: tokens.userid,
  }
  setWithingsTokens(updated)
  return updated.accessToken
}

async function withingsPost(path, params) {
  const accessToken = await ensureWithingsAccessToken()
  const body = new URLSearchParams({ ...params, action: params.action })
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body.toString(),
  })
  const json = await res.json()
  if (json.status !== 0) {
    throw new Error(json.error || `Erreur API Withings (${path})`)
  }
  return json.body
}

/**
 * Fetches body measures between two Unix timestamps.
 * @param {number} startdate
 * @param {number} enddate
 */
export async function fetchWithingsMeasures(startdate, enddate) {
  if (isWithingsMockMode()) return mockFetchWithingsMeasures(startdate, enddate)

  return withingsPost('/measure', {
    action: 'getmeas',
    startdate: String(Math.floor(startdate)),
    enddate: String(Math.floor(enddate)),
  })
}

/**
 * Loads user profile (sex, age) from Withings and caches it locally.
 */
export async function fetchAndCacheWithingsUser() {
  if (isWithingsMockMode()) return mockFetchAndCacheWithingsUser()

  const body = await withingsPost('/v2/user', { action: 'get' })
  const users = body?.users || []
  const user = users[0]
  if (!user) return null

  let age
  if (user.birthdate) {
    const birth = new Date(user.birthdate * 1000)
    const now = new Date()
    age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1
  }

  const sex = user.gender === 1 ? 'M' : user.gender === 0 ? 'F' : undefined
  const profile = { sex, age: age > 0 ? age : undefined }
  setWithingsUserProfile(profile)
  return profile
}
