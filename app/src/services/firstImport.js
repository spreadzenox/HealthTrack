/**
 * Import du premier jour (jalon 4b, journal/IDEES.md I154 écrans 4 à 6) : Health Connect lu juste après
 * l'autorisation donnée dans l'onboarding, puis le « aha » des 30 derniers jours.
 *
 * - L'import passe par la même fenêtre que les autres synchros (syncWindow.js : 30 jours avant la première
 *   autorisation) et note la synchro comme réussie, pour que la synchro automatique reprenne de là.
 * - Le résumé ne montre que ce qui est venu : 3 ou 4 chiffres au plus, chacun avec sa source ; aucun zéro
 *   trompeur (critère C1 de la version candidate). Rien n'est jugé « bon » ou « mauvais » (D6).
 */
import { getConnectorSettings, setConnectorSettings } from '../settings/connectorSettings'
import { upsertEntries } from '../storage/localHealthStorage'
import { noteFirstGrant, readsAllFailed, syncSince } from '../connectors/syncWindow'
import { matchHealthApp } from '../devices/healthApps'
import { mainSleepPeriods } from './sleepRegularity'
import { localDateKey } from './wellbeingSeries'
import { isDaytimeHrv } from './hrv'
import { appLocale } from '../i18n/locale.js'
import { totalOf } from './activityTotals'

const DAY_MS = 24 * 3600 * 1000

/** Jours résumés dans le « aha ». */
export const AHA_DAYS = 30

/**
 * Lit Health Connect pour la première fois et enregistre le résultat comme une synchro normale.
 * @param {{ connector: object, onProgress?: function, now?: Date, writer?: function }} p
 * @returns {Promise<{ synced: number, skipped: number, errors: string[] }>}
 */
export async function runFirstImport({ connector, onProgress, now = new Date(), writer = upsertEntries }) {
  setConnectorSettings(connector.id, { enabled: true })
  noteFirstGrant(connector.id, now)
  const settings = getConnectorSettings(connector.id)
  const readWindowDays = connector.readWindowDays ?? null
  const since = syncSince({ now, settings, latestAt: null, historyDays: readWindowDays ?? AHA_DAYS, readWindowDays })
  const result = await connector.sync({ since, until: now, writer, onProgress })
  if (readsAllFailed(result)) {
    setConnectorSettings(connector.id, { lastAttemptAt: now.toISOString(), lastSyncResult: result })
  } else {
    setConnectorSettings(connector.id, { lastSyncAt: now.toISOString(), lastSyncResult: result })
    window.dispatchEvent(new CustomEvent('health-entries-updated'))
  }
  return result
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

const fmtInt = (n) => Math.round(n).toLocaleString(appLocale())

/** « Garmin Connect via Health Connect » : les apps d'origine, sinon Health Connect seul. */
function sourceLine(entries) {
  const names = [...new Set(entries.map((e) => {
    const raw = e.payload?.sourceName
    return raw ? (matchHealthApp(raw)?.name || raw) : null
  }).filter(Boolean))]
  if (!names.length) return 'Health Connect'
  const shown = names.length > 2 ? `${names.slice(0, 2).join(', ')}…` : names.join(' et ')
  return `${shown} via Health Connect`
}

/**
 * Le « aha » : ce que les 30 derniers jours importés racontent, en 4 chiffres au plus.
 * @param {object[]} entries  entrées Health Connect importées
 * @returns {Array<{ key: string, value: string, label: string, source: string }>}  vide si rien n'est venu
 */
export function summarizeImport(entries, now = new Date()) {
  const from = now.getTime() - AHA_DAYS * DAY_MS
  const recent = (entries || []).filter((e) => e?.source === 'health_connect' && Date.parse(e.at) >= from)
  const facts = []

  const sleep = recent.filter((e) => e.type === 'sleep')
  const nights = [...mainSleepPeriods(sleep).values()]
  if (nights.length) {
    const asleep = nights.map((p) => p.asleep.reduce((s, [a, b]) => s + (b - a), 0) / 60000)
    const avg = asleep.reduce((s, v) => s + v, 0) / asleep.length
    facts.push({
      key: 'sleep',
      value: formatDuration(avg),
      label: `de sommeil en moyenne, sur ${nights.length} nuit${nights.length > 1 ? 's' : ''}`,
      source: sourceLine(sleep),
    })
  }

  const steps = recent.filter((e) => e.type === 'steps' && typeof e.payload?.value === 'number')
  const byDay = new Map()
  for (const e of steps) byDay.set(localDateKey(e.at), [...(byDay.get(localDateKey(e.at)) || []), e])
  // Une source par heure, total du jour compris (activityTotals.js) : jamais montre + téléphone additionnés
  const stepDays = [...byDay.values()].map((list) => totalOf(list, 'steps')).filter((v) => v > 0)
  if (stepDays.length) {
    facts.push({
      key: 'steps',
      value: fmtInt(stepDays.reduce((s, v) => s + v, 0) / stepDays.length),
      label: `pas par jour en moyenne, sur ${stepDays.length} jour${stepDays.length > 1 ? 's' : ''}`,
      source: sourceLine(steps),
    })
  }

  const hrv = recent.filter((e) => e.type === 'heart_rate' && e.payload?.subtype === 'heartRateVariability'
    && typeof e.payload.value === 'number' && !isDaytimeHrv(e.payload))
  if (hrv.length) {
    facts.push({
      key: 'hrv',
      value: `${Math.round(hrv.reduce((s, e) => s + e.payload.value, 0) / hrv.length)} ms`,
      label: `de VFC en moyenne, sur ${hrv.length} mesure${hrv.length > 1 ? 's' : ''}`,
      source: sourceLine(hrv),
    })
  }

  const resting = recent.filter((e) => e.type === 'heart_rate' && e.payload?.subtype === 'restingHeartRate' && typeof e.payload.bpm === 'number')
  if (resting.length && facts.length < 4) {
    facts.push({
      key: 'resting',
      value: `${Math.round(resting.reduce((s, e) => s + e.payload.bpm, 0) / resting.length)} bpm`,
      label: 'de fréquence cardiaque au repos en moyenne',
      source: sourceLine(resting),
    })
  }

  const workouts = recent.filter((e) => e.type === 'activity')
  if (workouts.length && facts.length < 4) {
    facts.push({
      key: 'workouts',
      value: String(workouts.length),
      label: workouts.length > 1 ? 'séances de sport' : 'séance de sport',
      source: sourceLine(workouts),
    })
  }

  return facts.slice(0, 4)
}
