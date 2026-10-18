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
