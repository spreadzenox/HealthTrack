/* Web Worker : exécute une tâche d'analyse et renvoie { id, result } ou { id, error }. */
import { runAnalysisTask } from './analysisTasks'

self.onmessage = async (event) => {
  const { id, task, key } = event.data || {}
  try {
    self.postMessage({ id, result: await runAnalysisTask(task, key) })
  } catch (e) {
    self.postMessage({ id, error: String(e?.message || e) })
  }
}
