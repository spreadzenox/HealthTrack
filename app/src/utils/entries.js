/**
 * Seules les saisies faites dans l'app (repas, bien-être, cigarette) sont supprimables :
 * une donnée synchronisée (Health Connect, Withings) reviendrait à la prochaine synchro.
 */
export function isDeletableEntry(entry) {
  return typeof entry?.source === 'string' && entry.source.startsWith('app_')
}
