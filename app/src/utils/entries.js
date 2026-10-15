/**
 * Seules les saisies faites dans l'app (repas, bien-être, cigarette) sont supprimables :
 * une donnée synchronisée (Health Connect, Withings) reviendrait à la prochaine synchro.
 */
export function isDeletableEntry(entry) {
  return typeof entry?.source === 'string' && entry.source.startsWith('app_')
}

/**
 * Les cigarettes d'un jour tiennent sur une seule ligne (« 09:05 ×2 · 11:30 · 15:00 ») au lieu d'une ligne
 * chacune : le total est déjà dans le résumé du jour. La ligne prend la place de la dernière notée.
 */
export function groupCigarettes(items) {
  const cigarettes = items.filter((e) => e.type === 'cigarette')
  if (cigarettes.length < 2) return items
  const byTime = [...cigarettes].sort((a, b) => new Date(a.at) - new Date(b.at))
  const latest = byTime[byTime.length - 1]
  const group = { id: `cigarettes-${latest.id}`, type: 'cigarette_group', at: latest.at, entries: byTime }
  return items.filter((e) => e.type !== 'cigarette' || e === latest).map((e) => (e === latest ? group : e))
}
