/**
 * Budget de lectures IndexedDB par page (garde-fou de régression D2) : `budget.json` donne, pour la démo
 * de `days` jours, le nombre maximal d'enregistrements qu'une page peut désérialiser à l'ouverture
 * (`idbRecords` de perf-check). Indépendant de la vitesse de la machine, donc stable en CI.
 * Les lectures du Web Worker des analyses ne sont pas comptées (hors page).
 */

/** Pages au-delà de leur budget (`max: null` : page mesurée sans budget). */
export function checkBudget(results, budget) {
  const over = []
  for (const { path, idbRecords } of results) {
    const max = budget.routes?.[path] ?? null
    if (max === null || idbRecords > max) over.push({ path, idbRecords, max })
  }
  return over
}
