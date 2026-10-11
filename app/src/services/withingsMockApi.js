/**
 * In-memory Withings API for mock/demo mode (tests, emulator builds without secrets).
 */
import {
  buildMockWithingsMeasuresBody,
  buildMockWithingsUserBody,
} from '../fixtures/withingsMockMeasures'
import { setWithingsTokens, setWithingsUserProfile } from '../settings/withingsSettings'

export function connectWithingsMockAccount() {
  setWithingsTokens({
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    userid: 'mock_user_1',
  })
  const profile = { sex: 'M', age: 38 }
  setWithingsUserProfile(profile)
  return profile
}

export async function mockFetchWithingsMeasures() {
  return buildMockWithingsMeasuresBody()
}

export async function mockFetchAndCacheWithingsUser() {
  const body = buildMockWithingsUserBody()
  const user = body.users[0]
  const profile = { sex: 'M', age: 38 }
  setWithingsUserProfile(profile)
  return profile
}

export async function mockExchangeWithingsCode() {
  return connectWithingsMockAccount()
}
