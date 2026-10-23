/**
 * Premier essai de la lecture du visage dans l'onboarding (jalon 4c-2, journal/IDEES.md I154 écran 7) : active la
 * lecture (après la divulgation, faite par l'appelant), prend une lecture de test tout de suite et rend son estimation.
 * Une lecture de test ne compte jamais dans l'estimation du jour (testReadingEstimate). Ne lève jamais.
 */
import { faceSensePlugin, startFaceSense, testFaceSense } from './faceSense'
import { importPendingFaceBursts } from './faceBursts'
import { loadFaceMoodEntries } from './mood/faceMoodData'
import { testReadingEstimate } from './mood/faceMood'

/** Le natif met quelques secondes à prendre et analyser la rafale (comme le bouton « Tester » de Sources). */
export const FACE_TRIAL_WAIT_MS = 4000

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Rend { outcome, estimate } : outcome = 'denied' (caméra refusée), 'failed' (Android n'a pas démarré la lecture),
 * 'no_face' (activée, mais aucun visage lu) ou 'read' (estimate = { label, note, low, high }).
 */
export async function runFaceTrial({
  plugin = faceSensePlugin(),
  start = startFaceSense,
  test = testFaceSense,
  importBursts = importPendingFaceBursts,
  loadEntries = loadFaceMoodEntries,
  wait = sleep,
  waitMs = FACE_TRIAL_WAIT_MS,
  now = () => new Date(),
} = {}) {
  const res = await start(plugin)
  if (!res.permission) return { outcome: 'denied', estimate: null }
  if (!res.started) return { outcome: 'failed', estimate: null }
  try {
    await test(plugin)
    await wait(waitMs)
    await importBursts({ plugin })
    const { bursts, notes } = await loadEntries()
    const estimate = testReadingEstimate([...bursts, ...notes], { now: now() })
    return estimate ? { outcome: 'read', estimate } : { outcome: 'no_face', estimate: null }
  } catch {
    return { outcome: 'no_face', estimate: null }
  }
}
