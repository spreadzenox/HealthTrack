/**
 * Version iOS (HealthTrack-iOS), CYCLE-iOS-1 (décision du propriétaire du 10/11 vers 18:50, « Ok cycle ») : le cycle
 * noté dans l'app Santé (règles, saignements hors des règles, symptômes), lu par le plugin natif `CycleHealth`
 * (`ios/App/App/CycleHealthPlugin.swift`, correspondance dans `ios/HalcyaRules` › `CycleRule`) et rangé avec la brique
 * partagée d'Android (`services/cycle.js`) : mêmes entrées `type: 'cycle'`, mêmes heures, source `health_connect`
 * comme les autres mesures de Santé sur iPhone. Rien ne sort du téléphone. Le cycle reste un contexte, jamais une
 * cause ni un diagnostic.
 *
 * Échantillons rendus par le plugin : `{ kind: 'period', flow }`, `{ kind: 'spotting' }`,
 * `{ kind: 'symptom', symptom }`, avec `start` (ms) et `sourceName` (app qui a écrit dans Santé).
 */
import { localDateKey } from '../services/analysisEngine'
import { FLOWS, periodEntry, spottingEntry, symptomEntry } from '../services/cycle'

/** Source des mesures de l'app Santé sur iPhone (même connecteur que Health Connect sur Android). */
export const CYCLE_SANTE_SOURCE = 'health_connect'

/**
 * Plugin enregistré à la demande (une fois) : sur Android et dans les tests qui simulent @capacitor/core, rien n'est
 * touché. Rendu **dans un objet** : le plugin de Capacitor répond à toute propriété, `then` compris ; rendu tel quel par
 * une fonction `async`, il passerait pour une promesse qui ne se résout jamais (build de captures de la PR #439).
 */
let registered = null
async function cyclePlugin(plugin) {
  if (plugin) return { CycleHealth: plugin }
  registered ??= (await import('@capacitor/core')).registerPlugin('CycleHealth')
  return { CycleHealth: registered }
}

/** Rang d'un flux : deux apps qui notent le même jour, on garde la saisie la plus forte (non précisé en dernier). */
const flowRank = (flow) => ['unknown', 'light', 'medium', 'heavy'].indexOf(FLOWS.includes(flow) ? flow : 'unknown')

function toEntry(sample, day) {
  if (sample.kind === 'period') return periodEntry(day, sample.flow, CYCLE_SANTE_SOURCE)
  if (sample.kind === 'spotting') return spottingEntry(day, CYCLE_SANTE_SOURCE)
  if (sample.kind === 'symptom') return symptomEntry(day, sample.symptom, CYCLE_SANTE_SOURCE)
  return null
}

/** Entrées de la brique partagée, une par jour et par sous-type (symptôme compris). */
export function cycleEntriesFromSante(samples) {
  const byAt = new Map()
  for (const s of samples || []) {
    if (!s || !Number.isFinite(s.start)) continue
    let entry = null
    try {
      entry = toEntry(s, localDateKey(new Date(s.start)))
    } catch {
      entry = null // symptôme hors de la brique partagée (`SYMPTOMS` de cycle.js)
    }
    if (!entry) continue
    entry.payload = { ...entry.payload, connector: 'health_connect', ...(s.sourceName ? { sourceName: s.sourceName } : {}) }
    const seen = byAt.get(entry.at)
    if (seen && !(entry.payload.subtype === 'period' && flowRank(entry.payload.flow) > flowRank(seen.payload.flow))) continue
    byAt.set(entry.at, entry)
  }
  return [...byAt.values()]
}

/** Lit le cycle dans Santé entre `since` et `until`, l'écrit par `writer` ; rend le nombre d'entrées écrites. */
export async function syncCycleFromSante({ since, until, writer, plugin }) {
  const { CycleHealth } = await cyclePlugin(plugin)
  const res = await CycleHealth.readCycle({ start: since.getTime(), end: (until || new Date()).getTime() })
  const entries = cycleEntriesFromSante(res?.samples)
  if (entries.length) await writer(entries)
  return entries.length
}

// ── CYCLE-iOS-2 : l'autorisation ─────────────────────────────────────────────────────────────────────────────────────

/** Même clé que le connecteur (correctif 08) : Santé a été autorisée sur cet iPhone (HealthKit ne dit pas ce qui l'est). */
export const IOS_HEALTHKIT_ASKED_KEY = 'halcya_ios_healthkit_asked'
/** Le cycle a été demandé à Santé sur cet iPhone (accueil, Paramètres ou Sources) : ne plus le proposer (CYCLE-iOS-3). */
export const IOS_CYCLE_ASKED_KEY = 'halcya_ios_cycle_asked'
/** Période relue quand le cycle est autorisé après l'accueil : celle de l'import de Santé (6 mois). */
const BACKFILL_DAYS = 183

/**
 * Une seule feuille d'Apple pour les mesures `read` (noms du module Santé) et, si `cycle`, les règles et les symptômes.
 * Après elle, la demande du module Santé ne montre plus rien (tout est déjà demandé).
 */
export async function requestSanteAuthorization({ read = [], cycle = false, plugin } = {}) {
  const { CycleHealth } = await cyclePlugin(plugin)
  const res = await CycleHealth.requestAuthorization({ read, cycle })
  if (cycle) store(IOS_CYCLE_ASKED_KEY, '1')
  return res
}

const read = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const store = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // stockage indisponible : la proposition reviendra, sans autre effet
  }
}
const platformOf = (platform) => platform ?? (typeof window !== 'undefined' ? window.Capacitor?.getPlatform?.() : undefined)

/**
 * CYCLE-iOS-3 : proposer la lecture du cycle dans Sources à qui a « Mon cycle » et a autorisé Santé avant que le
 * cycle y soit (testeurs du 10/11) ; jamais une fois le cycle demandé.
 */
export function shouldOfferCycleSante({ platform, goals = [] } = {}) {
  return platformOf(platform) === 'ios' && goals.includes('cycle') && read(IOS_HEALTHKIT_ASKED_KEY) === '1' && read(IOS_CYCLE_ASKED_KEY) !== '1'
}

/**
 * « Mon cycle » coché dans les Paramètres après l'accueil : si Santé est déjà autorisée sur cet iPhone, la feuille
 * d'Apple pour le cycle seul, puis les 6 derniers mois relus (une synchro ordinaire ne relirait que les derniers
 * jours). Rend le nombre d'entrées écrites. Sans Santé autorisée, rien : le cycle viendra avec les autres mesures.
 */
export async function askCycleAfterOnboarding({ platform, plugin, writer, now = new Date() } = {}) {
  if (platformOf(platform) !== 'ios' || read(IOS_HEALTHKIT_ASKED_KEY) !== '1') return 0
  const { CycleHealth } = await cyclePlugin(plugin)
  await CycleHealth.requestAuthorization({ read: [], cycle: true })
  store(IOS_CYCLE_ASKED_KEY, '1')
  const write = writer ?? (async (entries) => (await import('../storage/localHealthStorage')).upsertEntries(entries))
  const since = new Date(now.getTime() - BACKFILL_DAYS * 86400000)
  return syncCycleFromSante({ since, until: now, writer: write, plugin: CycleHealth })
}
