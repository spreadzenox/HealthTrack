import { useEffect, useState } from 'react'

/**
 * Journal des Nouveautés chargé après le premier affichage (PERF-CHANGELOG) : ses centaines d'entrées pesaient
 * environ 200 Ko dans le fichier lu au démarrage, pour une pastille et une bannière seulement. Liste vide le temps
 * du chargement ; `given` (tests, page qui l'a déjà) court-circuite le chargement.
 */
export function useChangelog(given) {
  const [loaded, setLoaded] = useState(null)
  useEffect(() => {
    if (given) return undefined
    let alive = true
    import('../data/changelog').then(
      (m) => alive && setLoaded(m.CHANGELOG),
      () => {},
    )
    return () => {
      alive = false
    }
  }, [given])
  return given ?? loaded ?? []
}
