/**
 * Exécute les calculs d'analyse lourds (ex. « Prédiction du jour », ≈ 0,9 s de calcul sur un
 * téléphone milieu de gamme) dans un Web Worker, et garde le résultat en cache (perf D2) :
 *   - clé = version de l'app + révision des données (incrémentée à chaque écriture) + jour local ;
 *   - cache en mémoire et dans localStorage → l'Accueil affiche le résultat dès l'ouverture, sans
 *     recalcul tant qu'aucune donnée n'a changé ;
 *   - sans Worker (tests, vieille WebView) ou si le Worker échoue : calcul sur le fil principal.
 */
import { getDataRevision, isDataRevisionPersistent } from '../storage/dataRevision'
import { CURRENT_VERSION } from './updateCheck'

const STORAGE_KEY = 'healthtrack-analysis-cache-v1'

/** task → { key, result } */
const memory = new Map()
/** `${task}|${key}` → Promise */
const inFlight = new Map()
let worker = null
let workerBroken = false
let nextId = 1
const pending = new Map()

function dayKey(now = new Date()) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Clé de cache courante d'une tâche. */
export function analysisCacheKey(now = new Date()) {
  return `${CURRENT_VERSION}|${getDataRevision()}|${dayKey(now)}`
}

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

function store(task, key, result) {
  memory.set(task, { key, result })
  if (!isDataRevisionPersistent()) return
  try {
    const all = readStored()
    all[task] = { key, result }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    /* quota ou localStorage indisponible : cache mémoire seulement */
  }
}

/**
 * Résultat en cache encore valide, sans rien calculer (lecture synchrone, pour le premier rendu).
 * @returns {{ hit: boolean, result?: unknown }}
 */
export function peekAnalysis(task, now = new Date()) {
  const key = analysisCacheKey(now)
  const mem = memory.get(task)
  if (mem?.key === key) return { hit: true, result: mem.result }
  if (!isDataRevisionPersistent()) return { hit: false }
  const saved = readStored()[task]
  if (saved?.key === key) {
    memory.set(task, saved)
    return { hit: true, result: saved.result }
  }
  return { hit: false }
}

function getWorker() {
  if (workerBroken || typeof Worker === 'undefined') return null
  if (worker) return worker
  try {
    worker = new Worker(new URL('../workers/analysis.worker.js', import.meta.url), { type: 'module' })
  } catch {
    workerBroken = true
    return null
  }
  worker.onmessage = (e) => {
    const { id, result, error } = e.data || {}
    const p = pending.get(id)
    if (!p) return
    pending.delete(id)
    if (error) p.reject(new Error(error))
    else p.resolve(result)
  }
  worker.onerror = (e) => {
    // Worker inutilisable (chargement refusé…) : on repasse tout en calcul direct
    e?.preventDefault?.()
    workerBroken = true
    worker?.terminate()
    worker = null
    for (const p of pending.values()) p.fallback()
    pending.clear()
  }
  return worker
}

async function runOnMainThread(task) {
  const { runAnalysisTask } = await import('../workers/analysisTasks')
  return runAnalysisTask(task)
}

function runInWorker(task) {
  const w = getWorker()
  if (!w) return runOnMainThread(task)
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject, fallback: () => runOnMainThread(task).then(resolve, reject) })
    w.postMessage({ id, task })
  })
}

/**
 * Résultat d'une tâche d'analyse : depuis le cache si les données n'ont pas changé, sinon calculé
 * (dans le Worker si possible). Deux appels simultanés partagent le même calcul.
 * @param {'todayPrediction'} task
 * @returns {Promise<unknown>}
 */
export function getAnalysis(task, now = new Date()) {
  const cached = peekAnalysis(task, now)
  if (cached.hit) return Promise.resolve(cached.result)
  const key = analysisCacheKey(now)
  const flightKey = `${task}|${key}`
  if (inFlight.has(flightKey)) return inFlight.get(flightKey)
  const p = runInWorker(task)
    .then((result) => {
      // Une écriture pendant le calcul change la révision : le résultat reste rangé sous l'ancienne clé
      store(task, key, result ?? null)
      return result ?? null
    })
    .finally(() => inFlight.delete(flightKey))
  inFlight.set(flightKey, p)
  return p
}

/** Tests uniquement. */
export function _resetAnalysisRunner() {
  memory.clear()
  inFlight.clear()
  pending.clear()
  worker?.terminate?.()
  worker = null
  workerBroken = false
}
