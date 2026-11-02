/**
 * Budget de lectures IndexedDB par page (garde-fou de régression D2) : `budget.json` donne, pour la démo
 * de `days` jours, le nombre maximal d'enregistrements qu'une page peut désérialiser à l'ouverture
 * (`idbRecords` de perf-check). Indépendant de la vitesse de la machine, donc stable en CI.
 * Les lectures du Web Worker des analyses (`workerRecords`) s'ajoutent à celles de la page.
 */

/** Pages au-delà de leur budget (`max: null` : page mesurée sans budget). */
export function checkBudget(results, budget) {
  const over = []
  for (const { path, idbRecords, workerRecords = 0 } of results) {
    const max = budget.routes?.[path] ?? null
    const total = idbRecords + workerRecords
    if (max === null || total > max) over.push({ path, idbRecords: total, max })
  }
  return over
}

/**
 * Le Worker des analyses a-t-il fini ses lectures ? (I139) Entre deux échantillons espacés de 500 ms : aucune
 * requête en cours, aucune nouvelle lecture, et chaque tâche reçue a répondu. Le calme seul ne suffit pas :
 * une tâche calcule parfois plus de 500 ms entre deux lectures, et la mesure s'arrêtait avant sa dernière phase.
 * `tasks` / `replies` : messages reçus et envoyés par le Worker (0 / 0 si le cache évite tout calcul).
 */
export function workerSettled(last, s) {
  if (!last) return false
  return s.pending === 0 && s.reads === last.reads && s.replies >= s.tasks
}
