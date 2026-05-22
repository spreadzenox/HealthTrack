/**
 * WithingsConnector – syncs Body Scan / scale data via Withings OAuth2 API.
 *
 * Data flow:
 *   Body Scan → Withings cloud → Withings API → HealthTrack (this connector)
 */
import { BaseConnector } from './BaseConnector'
import {
  WITHINGS_MEASURE_TYPES,
  WITHINGS_TYPE_TO_FIELD,
  normalizeWithingsMeasure,
} from './withingsMeasureTypes'
import {
  hasWithingsCredentials,
  hasWithingsTokens,
} from '../settings/withingsSettings'
import {
  buildWithingsAuthUrl,
  fetchWithingsMeasures,
  fetchAndCacheWithingsUser,
  ensureWithingsAccessToken,
} from '../services/withingsApi'

const SOURCE = 'withings'

/** Measure types imported from Body Scan and compatible scales. */
const SYNC_MEASURE_TYPES = new Set([
  WITHINGS_MEASURE_TYPES.WEIGHT,
  WITHINGS_MEASURE_TYPES.HEIGHT,
  WITHINGS_MEASURE_TYPES.FAT_RATIO,
  WITHINGS_MEASURE_TYPES.FAT_MASS,
  WITHINGS_MEASURE_TYPES.FAT_FREE_MASS,
  WITHINGS_MEASURE_TYPES.MUSCLE_MASS,
  WITHINGS_MEASURE_TYPES.BONE_MASS,
  WITHINGS_MEASURE_TYPES.HYDRATION,
  WITHINGS_MEASURE_TYPES.HEART_RATE,
  WITHINGS_MEASURE_TYPES.PULSE_WAVE_VELOCITY,
  WITHINGS_MEASURE_TYPES.VISCERAL_FAT,
  WITHINGS_MEASURE_TYPES.VISCERAL_FAT_INDEX,
  WITHINGS_MEASURE_TYPES.VASCULAR_AGE,
  WITHINGS_MEASURE_TYPES.BASAL_METABOLIC_RATE,
  WITHINGS_MEASURE_TYPES.EXTRACELLULAR_WATER,
  WITHINGS_MEASURE_TYPES.INTRACELLULAR_WATER,
  WITHINGS_MEASURE_TYPES.SYSTOLIC_BP,
  WITHINGS_MEASURE_TYPES.DIASTOLIC_BP,
])

/**
 * Converts a Withings measure group into HealthTrack entries.
 * @param {object} grp  measure group from API
 * @returns {Array<{ type: string, source: string, at: string, payload: object }>}
 */
export function withingsGroupToEntries(grp) {
  const at = new Date(grp.date * 1000).toISOString()
  const measures = grp.measures || []

  const bodyPayload = { deviceid: grp.deviceid, model: grp.model }
  let hasBody = false
  let weightKg = null
  let heightCm = null
  const entries = []

  for (const m of measures) {
    const typeId = m.type
    if (!SYNC_MEASURE_TYPES.has(typeId)) continue

    const field = WITHINGS_TYPE_TO_FIELD[typeId]
    if (!field) continue

    const val = normalizeWithingsMeasure(typeId, m.value, m.unit)
    if (val == null) continue

    if (typeId === WITHINGS_MEASURE_TYPES.WEIGHT) {
      weightKg = val
      entries.push({
        type: 'weight',
        source: SOURCE,
        at,
        payload: { valueKg: val, ...bodyPayload },
      })
    } else if (typeId === WITHINGS_MEASURE_TYPES.HEIGHT) {
      heightCm = val
      entries.push({
        type: 'height',
        source: SOURCE,
        at,
        payload: { valueCm: val },
      })
    } else {
      bodyPayload[field] = val
      hasBody = true
    }
  }

  if (hasBody) {
    if (weightKg != null) bodyPayload.valueKg = weightKg
    entries.push({
      type: 'body_composition',
      source: SOURCE,
      at,
      payload: bodyPayload,
    })
  }

  return entries
}

export class WithingsConnector extends BaseConnector {
  constructor() {
    super({
      id: 'withings',
      name: 'Withings Body Scan',
      description:
        'Balance Withings Body Scan : poids, taille, masse grasse, masse musculaire, BMR, âge vasculaire et autres biomarqueurs.',
      dataTypes: ['weight', 'height', 'body_composition'],
    })
  }

  async isAvailable() {
    return hasWithingsCredentials()
  }

  async availabilityDetails() {
    if (!hasWithingsCredentials()) {
      return {
        available: false,
        reason: 'credentials_missing',
        platform: 'web',
      }
    }
    return { available: true, platform: 'web' }
  }

  async checkPermissions() {
    if (!hasWithingsCredentials()) return 'not_asked'
    return hasWithingsTokens() ? 'granted' : 'not_asked'
  }

  async requestPermissions() {
    if (!hasWithingsCredentials()) return 'denied'
    const state = `ht_${Date.now()}`
    sessionStorage.setItem('withings_oauth_state', state)
    const url = buildWithingsAuthUrl(state)
    window.location.href = url
    return 'not_asked'
  }

  /**
   * Opens Withings OAuth (alias for requestPermissions on web).
   */
  startOAuth() {
    return this.requestPermissions()
  }

  async sync({ since, until, writer }) {
    const errors = []
    let synced = 0
    let skipped = 0

    try {
      await ensureWithingsAccessToken()
      try {
        await fetchAndCacheWithingsUser()
      } catch (e) {
        errors.push(`Profil utilisateur : ${e.message}`)
      }

      const startdate = Math.floor(since.getTime() / 1000)
      const enddate = Math.floor((until || new Date()).getTime() / 1000)
      const body = await fetchWithingsMeasures(startdate, enddate)
      const measuregrps = body?.measuregrps || []

      const allEntries = []
      for (const grp of measuregrps) {
        allEntries.push(...withingsGroupToEntries(grp))
      }

      if (allEntries.length > 0) {
        const result = await writer(allEntries)
        synced = result?.inserted ?? allEntries.length
        skipped = result?.skipped ?? 0
      }
    } catch (e) {
      errors.push(e.message || String(e))
    }

    return { synced, skipped, errors }
  }
}

export { SOURCE as WITHINGS_SOURCE }
