/**
 * Les entrées réelles du monde de Pilou, lues sur le téléphone (rien ne sort) : jours d'usage pour la croissance,
 * lever et coucher habituels pour le cycle du jour (lus dans le sommeil, sinon 7 h et 22 h 30), hémisphère et météo
 * du moment (réglages météo de l'app). La scène appelle `loadWorldContext()` à l'ouverture et au changement de jour,
 * puis passe ces valeurs à `lightAt`, `weatherDecor` et `growthAt` (index.js).
 */
import { listEntries } from '../../storage/localHealthStorage'
import { localDateKey } from '../../services/analysisEngine'
import { computeSleepRegularity } from '../../services/sleepRegularity'
import { getWeatherSettings } from '../../services/weatherSync'
import { countUsageDays } from './growth.js'

/** Ce que la personne note elle-même : un jour avec l'une de ces sources est un jour d'usage. */
export const MANUAL_SOURCES = Object.freeze([
  'app_food',
  'app_wellbeing',
  'app_gut',
  'app_habit',
  'app_stool',
  'app_weight',
  'app_cigarette',
  'app_cycle',
  'app_context',
  'manual',
])

/** Les mesures automatiques (montre, Health Connect, météo, visage) ne comptent pas : seul ce qui est noté. */
export function usageDaysFromEntries(entries) {
  return countUsageDays(
    (entries || []).filter((e) => e && MANUAL_SOURCES.includes(e.source) && e.at).map((e) => localDateKey(e.at)),
  )
}

/** Lever et coucher habituels (minutes depuis minuit) d'après le sommeil des dernières semaines, sinon null. */
export function habitualSleep(sleepEntries, now = new Date()) {
  const r = computeSleepRegularity(sleepEntries || [], now)
  if (!r || r.status !== 'ok') return { wake: null, bedtime: null }
  return { wake: Math.round(r.wake.mean), bedtime: Math.round(r.bedtime.mean) }
}

/**
 * @returns {Promise<{ daysOfUse: number, wake: number|null, bedtime: number|null, hemisphere: 'nord'|'sud',
 *   weather: object|null }>}
 * Ne lève jamais : en cas d'erreur de lecture, valeurs neutres (îlot de départ, heures par défaut).
 */
export async function loadWorldContext({ now = new Date(), list = listEntries, weatherSettings = getWeatherSettings } = {}) {
  let daysOfUse = 0
  let sleep = { wake: null, bedtime: null }
  try {
    const perSource = await Promise.all(MANUAL_SOURCES.map((source) => list({ source, limit: 5000 })))
    daysOfUse = usageDaysFromEntries(perSource.flat())
  } catch {
    /* lecture impossible : îlot de départ */
  }
  try {
    const since = new Date(now.getTime() - 35 * 86_400_000).toISOString()
    sleep = habitualSleep(await list({ type: 'sleep', since, limit: 500 }), now)
  } catch {
    /* sans sommeil lisible : 7 h et 22 h 30 */
  }
  let settings = {}
  try {
    settings = weatherSettings() || {}
  } catch {
    settings = {}
  }
  const lat = settings.location?.lat
  return {
    daysOfUse,
    wake: sleep.wake,
    bedtime: sleep.bedtime,
    hemisphere: typeof lat === 'number' && lat < 0 ? 'sud' : 'nord',
    weather: settings.enabled ? settings.current || null : null,
  }
}
