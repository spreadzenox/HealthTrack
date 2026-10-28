/**
 * Table Ciqual (≈ 3 550 aliments, 1,3 Mo) chargée à la demande (perf D2) : elle n'est plus dans le
 * fichier principal de l'app, qui s'affiche sans l'attendre. Ses clés sont aussi les noms canoniques
 * d'ingrédients (prompt Gemini, recherche, rapprochement).
 *
 * - `loadNutritionTable()` : promesse partagée (un seul chargement), à attendre avant tout calcul.
 * - `getNutritionTable()` : table si déjà chargée, sinon null (rendu synchrone).
 * - `useNutritionTable()` : idem, et re-rend le composant au chargement (le démarre au besoin).
 *
 * En production, la table est un fichier JSON lu par `fetch` : l'application et le worker d'analyse
 * pointent vers le même fichier, au lieu d'embarquer chacun sa copie (2 × 2 Mo dans l'APK).
 */
import { useEffect, useSyncExternalStore } from 'react'
import tableUrl from './ingredientsNutrition.json?url'

let table = null
let loading = null
const listeners = new Set()

export function getNutritionTable() {
  return table
}

export function loadNutritionTable() {
  if (table) return Promise.resolve(table)
  if (!loading) {
    const source = import.meta.env.PROD
      ? fetchTableFile(tableUrl)
      : import('./ingredientsNutrition.json').then((mod) => mod.default)
    loading = source
      .then((loaded) => {
        table = loaded
        for (const fn of listeners) fn()
        return table
      })
      .catch((e) => {
        loading = null // nouvel essai au prochain appel
        throw e
      })
  }
  return loading
}

/** Lit la table depuis son fichier JSON ; refuse une réponse en erreur ou vide. */
export async function fetchTableFile(url, fetchFn = fetch) {
  const res = await fetchFn(url)
  if (!res.ok) throw new Error(`Table nutritionnelle introuvable (${res.status})`)
  const data = await res.json()
  if (!data || !Object.keys(data).length) throw new Error('Table nutritionnelle vide')
  return data
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useNutritionTable() {
  const current = useSyncExternalStore(subscribe, getNutritionTable, getNutritionTable)
  useEffect(() => {
    if (!current) loadNutritionTable().catch(() => {})
  }, [current])
  return current
}

/** Tests uniquement : revient à l'état « pas encore chargée ». */
export function _resetNutritionTable() {
  table = null
  loading = null
}
