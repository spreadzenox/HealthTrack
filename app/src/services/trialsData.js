/**
 * Lecture des données d'Agir (ORG-8) : essais enregistrés, résumés des 45 derniers jours (tenue d'après la montre et
 * le téléphone) et séries des résultats (bien-être, confort digestif) pour les lendemains. Rien n'est calculé ailleurs
 * que sur le téléphone.
 */
import { createEntry, listEntries, updateEntry } from '../storage/localHealthStorage'
import { buildDailyJournal } from './dailyJournal'
import { outcomeSeries } from './analysisResults'
import { TRIAL_SOURCE, TRIAL_TYPE } from './trials'

const DAY_MS = 86_400_000
const WINDOW_DAYS = 45

export async function readTrialsData(now = new Date()) {
  const since = new Date(now.getTime() - WINDOW_DAYS * DAY_MS).toISOString()
  const [trials, sleep, steps, phone, wellbeing, faces, gut] = await Promise.all([
    listEntries({ type: TRIAL_TYPE, limit: Infinity }),
    listEntries({ type: 'sleep', since, limit: Infinity }),
    listEntries({ type: 'steps', since, limit: Infinity }),
    listEntries({ type: 'phone_usage', since, limit: Infinity }),
    listEntries({ type: 'wellbeing', since, limit: Infinity }),
    listEntries({ type: 'face_burst', since, limit: Infinity }),
    listEntries({ type: 'gut', since, limit: Infinity }),
  ])
  const summaries = new Map(buildDailyJournal([...sleep, ...steps, ...phone]).map((d) => [d.dateKey, d.summary]))
  const series = outcomeSeries([...wellbeing, ...faces, ...gut])
  return { trials, summaries, outcomes: { wellbeing: series.wellbeing, digestion: series.digestion } }
}

export async function saveNewTrial(payload) {
  const e = await createEntry({ type: TRIAL_TYPE, source: TRIAL_SOURCE, payload, at: payload.startedAt })
  window.dispatchEvent(new CustomEvent('health-entries-updated'))
  return e
}

export async function saveTrial(id, payload) {
  await updateEntry(id, { payload })
  window.dispatchEvent(new CustomEvent('health-entries-updated'))
}
