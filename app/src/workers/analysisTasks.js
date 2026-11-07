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
import { computeFaceMoodCorrelations } from '../services/mood/faceMoodDays'
import { summarizeGutLinks } from '../services/gutLinks'
import { gutWeeks } from '../services/gutWeeks'
import { mealHoursEffect } from '../services/mood/mealHours'
import { wellbeingWeeks } from '../services/mood/wellbeingWeeks'
import { computeAnalysisResults, contributionsByDay } from '../services/analysisResults'
import { estimateStatesFromEntries } from '../services/method/stateSpace'
import { changesFromEntries } from '../services/method/changeSeries'

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
      // Facteurs comparés à l'humeur estimée par le visage (Y automatique, sans note).
      faceMood: computeFaceMoodCorrelations(entries),
      // Repas → ventre (jalon 5) : notes par fenêtre et bilans du soir ; le ventre n'explique jamais le bien-être.
      gut: summarizeGutLinks(entries),
      // Ventre, « Sur quelques semaines » : jours calmes, de gêne et de douleur par semaine (description seulement).
      gutWeeks: gutWeeks(entries),
      // Bien-être « dans les heures » : lectures du visage après un repas comparées au reste du jour (ANALYSES-ONGLETS-5).
      mealHours: mealHoursEffect(entries),
      // Bien-être « Sur quelques semaines » : estimé et notes, moyennes par semaine (description seulement).
      wellbeingWeeks: wellbeingWeeks(entries),
      totalDays: countTotalDataDays(entries),
    }
  },
  /**
   * ORG-5d — Analyses (Bien-être, Digestion) : le contrat des résultats (services/analysisResults.js), seuils de
   * déblocage compris. Forme stable, sérialisable.
   */
  analysisResults: async () => {
    const entries = await listEntriesForAnalysis()
    const results = computeAnalysisResults(entries)
    // « Ce qui a pu peser ce jour-là » (Tendances) : les 3 plus grandes contributions de chaque jour, sur le modèle.
    return { ...results, contributions: contributionsByDay(results, entries) }
  },
  /**
   * TS-1 — Tendances et Aujourd'hui : estimation de chaque jour (bien-être, confort digestif), fourchette, attendu des
   * 7 jours à venir, courbe digestive montrée ou non, note à demander ou non.
   */
  dayStates: async () => estimateStatesFromEntries(await listEntriesForAnalysis()),
  /**
   * TS-2 — Changements durables par courbe (Tendances, vue Mois ; rapport médecin) : date, niveaux avant et après.
   * « Au même moment » : `sameTime` ; norme des écarts : `normStart` (services/method/changes.js).
   */
  changes: async () => changesFromEntries(await listEntriesForAnalysis()),
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
