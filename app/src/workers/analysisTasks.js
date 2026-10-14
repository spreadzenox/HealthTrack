/**
 * Calculs lourds exécutables hors du fil principal (perf D2) : chaque tâche relit elle-même la base
 * (IndexedDB est accessible depuis un Web Worker) et renvoie un résultat sérialisable.
 * Utilisé par `analysis.worker.js` et, en repli (pas de Worker, Worker en échec), directement.
 */
import { listEntriesForAnalysis } from '../storage/localHealthStorage'
import { loadNutritionTable } from '../data/nutritionTable'
import {
  computeTodayPrediction,
  computeBasicCorrelations,
  computeAdvancedAnalysis,
  countTotalDataDays,
} from '../services/analysisEngine'
import { computeTagEffects } from '../services/behaviorTags'
import { computeLaggedEffects } from '../services/laggedEffects'

export const ANALYSIS_TASKS = {
  /** Accueil — « Prédiction du jour ». */
  todayPrediction: async () => computeTodayPrediction(await listEntriesForAnalysis()),
  /** Analyses — onglet « Analyse simple » (corrélations, habitudes, effets décalés). */
  basicAnalysis: async () => {
    const entries = await listEntriesForAnalysis()
    return {
      correlations: computeBasicCorrelations(entries),
      tagEffects: computeTagEffects(entries),
      laggedEffects: computeLaggedEffects(entries),
      totalDays: countTotalDataDays(entries),
    }
  },
  /** Analyses — onglet « Analyse avancée ». */
  advancedAnalysis: async () => {
    const entries = await listEntriesForAnalysis()
    return { result: computeAdvancedAnalysis(entries), totalDays: countTotalDataDays(entries) }
  },
}

/**
 * @param {string} task
 * @returns {Promise<unknown>}
 */
export async function runAnalysisTask(task) {
  const fn = ANALYSIS_TASKS[task]
  if (!fn) throw new Error(`Tâche d'analyse inconnue : ${task}`)
  // Les nutriments des repas entrent dans le jeu de données : table chargée avant tout calcul
  await loadNutritionTable()
  return fn()
}
