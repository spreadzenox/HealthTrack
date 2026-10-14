import { useNutritionTable } from '../data/nutritionTable'

/**
 * N'affiche ses enfants qu'une fois la table Ciqual chargée (perf D2 : elle arrive à la demande) :
 * leur état initial (ingrédients rapprochés de la base) ne se calcule jamais sans elle.
 */
export default function NutritionTableGate({ children }) {
  const table = useNutritionTable()
  if (!table) {
    return (
      <div className="loading" role="status">
        <div className="spinner" aria-hidden />
      </div>
    )
  }
  return children
}
