/**
 * Carte d'un repas (N4) : « Riche en fructanes : oignon », un groupe FODMAP par ligne, simple d'abord. Le chevron
 * montre les grammes estimés, le repère de départ et d'où viennent les teneurs. Rien quand aucun groupe ne dépasse
 * son repère (un groupe inconnu n'est jamais présenté comme bas). Repères = hypothèses de départ (règle 6).
 */
import { useState } from 'react'
import { useNutritionTable } from '../data/nutritionTable'
import measurements from '../data/fodmapMeasurements.json'
import { estimateMealFodmap, mealFodmapHighlights } from '../services/fodmapGroups'
import { FODMAP_GROUPS } from '../services/fodmapChallenge'
import { shortFoodName } from '../utils/format'
import DetailsToggle from './DetailsToggle'
import './MealFodmapLine.css'

const LABELS = Object.fromEntries(FODMAP_GROUPS.map((g) => [g.id, g.label.toLowerCase()]))
LABELS.gos = 'GOS'
LABELS.fructose = 'fructose en excès'

/** « Ciqual (Anses), Ferjančič 2024 » : les sources des teneurs affichées (attribution des licences CC BY). */
function citeSources(highlights) {
  const keys = [...new Set(highlights.flatMap((h) => h.sources))]
  return keys.map((k) => (k === 'Ciqual' ? 'Ciqual (Anses)' : measurements.sources[k]?.cite ?? k)).join(', ')
}

const grams = (v) => v.toLocaleString('fr-FR', { maximumFractionDigits: v < 1 ? 2 : 1 })
const foodList = (foods) => foods.map((f) => shortFoodName(f).toLowerCase()).join(', ')

export default function MealFodmapLine({ items }) {
  const table = useNutritionTable()
  const [open, setOpen] = useState(false)
  if (!table) return null
  const highlights = mealFodmapHighlights(estimateMealFodmap(items, table, measurements))
  if (highlights.length === 0) return null
  return (
    <div className="meal-fodmap" data-testid="meal-fodmap">
      <ul className="meal-fodmap-list">
        {highlights.map((h) => (
          <li key={h.group}>
            <span className="meal-fodmap-tag">{h.probable ? 'Probablement riche' : 'Riche'} en {LABELS[h.group]}</span>
            {' '}{foodList(h.foods)}
            {open && (
              <span className="meal-fodmap-detail">
                ≈ {grams(h.g)} g · repère {grams(h.cutoff)} g par repas{h.probable && ' · teneurs approchées'}
              </span>
            )}
          </li>
        ))}
      </ul>
      <DetailsToggle on={open} onToggle={() => setOpen((v) => !v)} />
      {open && (
        <p className="meal-fodmap-note">
          Repères généraux (Varney 2017), une hypothèse de départ : vos propres données priment. Teneurs :{' '}
          {citeSources(highlights)}.
        </p>
      )}
    </div>
  )
}
