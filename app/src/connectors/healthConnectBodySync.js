/**
 * Maps Health Connect body samples to HealthTrack entries.
 * Used when Withings (or other scales) sync via Health Connect.
 */

const SOURCE = 'health_connect'

/**
 * @param {Array<{ startDate: string, value: number, unit?: string, sourceName?: string, platformId?: string }>} samples
 * @param {'weight'|'height'|'bodyFat'|'basalCalories'} dataType
 * @returns {Array<{ type: string, source: string, at: string, payload: object }>}
 */
export function healthConnectBodySamplesToEntries(samples, dataType) {
  const entries = []

  for (const s of samples) {
    if (!s?.startDate || s.value == null) continue

    if (dataType === 'weight') {
      entries.push({
        type: 'weight',
        source: SOURCE,
        at: s.startDate,
        payload: {
          valueKg: s.value,
          unit: s.unit,
          sourceName: s.sourceName,
          platformId: s.platformId,
          connector: SOURCE,
        },
      })
      continue
    }

    if (dataType === 'height') {
      entries.push({
        type: 'height',
        source: SOURCE,
        at: s.startDate,
        payload: {
          valueCm: s.value,
          unit: s.unit,
          sourceName: s.sourceName,
          connector: SOURCE,
        },
      })
      continue
    }

    const bodyPayload = {
      sourceName: s.sourceName,
      platformId: s.platformId,
      connector: SOURCE,
    }

    if (dataType === 'bodyFat') {
      bodyPayload.fatRatioPct = s.value
    } else if (dataType === 'basalCalories') {
      bodyPayload.bmrKcal = Math.round(s.value)
    } else {
      continue
    }

    entries.push({
      type: 'body_composition',
      source: SOURCE,
      at: s.startDate,
      payload: bodyPayload,
    })
  }

  return entries
}
