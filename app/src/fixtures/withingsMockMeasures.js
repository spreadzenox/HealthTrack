/**
 * Synthetic Withings Body Scan measure groups for tests and demo mode.
 */
import { WITHINGS_MEASURE_TYPES } from '../connectors/withingsMeasureTypes'

const BASE_DATE = Math.floor(new Date('2026-05-21T08:00:00Z').getTime() / 1000)

/** @returns {object} Withings API getmeas body */
export function buildMockWithingsMeasuresBody() {
  return {
    measuregrps: [
      {
        grpid: 9001,
        date: BASE_DATE,
        deviceid: 'mock-body-scan',
        model: 'Body Scan',
        measures: [
          { type: WITHINGS_MEASURE_TYPES.WEIGHT, value: 73500, unit: -3 },
          { type: WITHINGS_MEASURE_TYPES.HEIGHT, value: 178, unit: -2 },
          { type: WITHINGS_MEASURE_TYPES.FAT_RATIO, value: 192, unit: -1 },
          { type: WITHINGS_MEASURE_TYPES.FAT_MASS, value: 14100, unit: -3 },
          { type: WITHINGS_MEASURE_TYPES.MUSCLE_MASS, value: 35800, unit: -3 },
          { type: WITHINGS_MEASURE_TYPES.BONE_MASS, value: 3100, unit: -3 },
          { type: WITHINGS_MEASURE_TYPES.HYDRATION, value: 582, unit: -1 },
          { type: WITHINGS_MEASURE_TYPES.BASAL_METABOLIC_RATE, value: 1685, unit: 0 },
          { type: WITHINGS_MEASURE_TYPES.VISCERAL_FAT_INDEX, value: 42, unit: 0 },
          { type: WITHINGS_MEASURE_TYPES.VASCULAR_AGE, value: 38, unit: 0 },
          { type: WITHINGS_MEASURE_TYPES.HEART_RATE, value: 62, unit: 0 },
          { type: WITHINGS_MEASURE_TYPES.PULSE_WAVE_VELOCITY, value: 65, unit: -1 },
          { type: WITHINGS_MEASURE_TYPES.EXTRACELLULAR_WATER, value: 15200, unit: -3 },
          { type: WITHINGS_MEASURE_TYPES.INTRACELLULAR_WATER, value: 22100, unit: -3 },
        ],
      },
      {
        grpid: 9000,
        date: BASE_DATE - 86400,
        deviceid: 'mock-body-scan',
        measures: [
          { type: WITHINGS_MEASURE_TYPES.WEIGHT, value: 73600, unit: -3 },
          { type: WITHINGS_MEASURE_TYPES.FAT_RATIO, value: 193, unit: -1 },
        ],
      },
    ],
  }
}

export function buildMockWithingsUserBody() {
  return {
    users: [
      {
        gender: 1,
        birthdate: Math.floor(new Date('1988-03-15').getTime() / 1000),
      },
    ],
  }
}
