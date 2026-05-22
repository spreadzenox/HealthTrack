/**
 * Withings measure type IDs (Body Scan and compatible scales).
 * @see https://developer.withings.com/developer-guide/v3/data-api/all-available-health-data/
 */

export const WITHINGS_MEASURE_TYPES = {
  WEIGHT: 1,
  HEIGHT: 4,
  FAT_FREE_MASS: 5,
  FAT_RATIO: 6,
  FAT_MASS: 8,
  DIASTOLIC_BP: 9,
  SYSTOLIC_BP: 10,
  HEART_RATE: 11,
  TEMPERATURE: 12,
  MUSCLE_MASS: 76,
  HYDRATION: 77,
  BONE_MASS: 88,
  PULSE_WAVE_VELOCITY: 91,
  VISCERAL_FAT: 123,
  VASCULAR_AGE: 155,
  EXTRACELLULAR_WATER: 168,
  INTRACELLULAR_WATER: 169,
  VISCERAL_FAT_INDEX: 170,
  BASAL_METABOLIC_RATE: 226,
}

/** Maps Withings type id → HealthTrack payload field name */
export const WITHINGS_TYPE_TO_FIELD = {
  [WITHINGS_MEASURE_TYPES.WEIGHT]: 'valueKg',
  [WITHINGS_MEASURE_TYPES.HEIGHT]: 'valueCm',
  [WITHINGS_MEASURE_TYPES.FAT_RATIO]: 'fatRatioPct',
  [WITHINGS_MEASURE_TYPES.FAT_MASS]: 'fatMassKg',
  [WITHINGS_MEASURE_TYPES.FAT_FREE_MASS]: 'fatFreeMassKg',
  [WITHINGS_MEASURE_TYPES.MUSCLE_MASS]: 'muscleMassKg',
  [WITHINGS_MEASURE_TYPES.BONE_MASS]: 'boneMassKg',
  [WITHINGS_MEASURE_TYPES.HYDRATION]: 'hydrationPct',
  [WITHINGS_MEASURE_TYPES.HEART_RATE]: 'standingHrBpm',
  [WITHINGS_MEASURE_TYPES.PULSE_WAVE_VELOCITY]: 'pwvMps',
  [WITHINGS_MEASURE_TYPES.VISCERAL_FAT]: 'visceralFatKg',
  [WITHINGS_MEASURE_TYPES.VISCERAL_FAT_INDEX]: 'visceralFatIndex',
  [WITHINGS_MEASURE_TYPES.VASCULAR_AGE]: 'vascularAgeYears',
  [WITHINGS_MEASURE_TYPES.BASAL_METABOLIC_RATE]: 'bmrKcal',
  [WITHINGS_MEASURE_TYPES.EXTRACELLULAR_WATER]: 'extracellularWaterKg',
  [WITHINGS_MEASURE_TYPES.INTRACELLULAR_WATER]: 'intracellularWaterKg',
  [WITHINGS_MEASURE_TYPES.SYSTOLIC_BP]: 'systolicBpMmHg',
  [WITHINGS_MEASURE_TYPES.DIASTOLIC_BP]: 'diastolicBpMmHg',
}

/**
 * Converts a raw Withings measure value to a human-readable number.
 * @param {number} value
 * @param {number} unit  power-of-10 exponent (e.g. -3 → divide by 1000)
 */
export function decodeWithingsValue(value, unit) {
  if (value == null || unit == null) return null
  const n = Number(value) * Math.pow(10, Number(unit))
  return Number.isFinite(n) ? n : null
}

/**
 * Height from Withings is in meters; convert to cm for storage.
 */
export function normalizeWithingsMeasure(typeId, value, unit) {
  const raw = decodeWithingsValue(value, unit)
  if (raw == null) return null
  if (typeId === WITHINGS_MEASURE_TYPES.HEIGHT) return Math.round(raw * 100 * 10) / 10
  if (typeId === WITHINGS_MEASURE_TYPES.FAT_RATIO || typeId === WITHINGS_MEASURE_TYPES.HYDRATION) {
    return Math.round(raw * 10) / 10
  }
  return Math.round(raw * 100) / 100
}
