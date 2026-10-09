import { useId, useState } from 'react'
import { itemKcal, mealKcal, searchIngredients, setItemGrams } from '../services/mealEditing'
import './MealEditor.css'

const STEP_G = 10
const DEFAULT_G = 100

/**
 * Liste d'ingrédients modifiable avant enregistrement : grammes, suppression, ajout et
 * remplacement par recherche dans la base, kcal par ingrédient et total.
 */
export default function MealEditor({ items, onChange, disabled = false }) {
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [replaceIndex, setReplaceIndex] = useState(null)
  const suggestions = searchIngredients(query, 6)
  const total = mealKcal(items)

  const update = (index, next) => onChange(items.map((it, i) => (i === index ? next : it)))
  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index))
    setReplaceIndex(null)
  }
  const nudge = (index, delta) => {
    const current = items[index].quantity_g ?? 0
    update(index, setItemGrams(items[index], current + delta))
  }

  const pick = (name) => {
    if (replaceIndex != null && items[replaceIndex]) {
      const { ingredient: _old, unknown: _u, confidence: _c, ...rest } = items[replaceIndex]
      update(replaceIndex, { ...rest, ingredient: name })
    } else {
      onChange([...items, setItemGrams({ ingredient: name }, DEFAULT_G)])
    }
    setQuery('')
    setReplaceIndex(null)
  }

  const startReplace = (index) => {
    setReplaceIndex(index)
    setQuery(items[index].ingredient)
  }

  const searchLabel = replaceIndex != null ? `Remplacer par` : 'Ajouter un ingrédient'

  return (
    <div className="meal-editor">
      <ul className="meal-editor-list">
        {items.map((item, i) => {
          const kcal = itemKcal(item)
          return (
            <li key={i} className={`meal-editor-item${item.unknown ? ' is-unknown' : ''}`}>
              <div className="mei-head">
                <span className="mei-name">{item.ingredient}</span>
                {item.confidence === 'low' && <span className="mei-badge">à vérifier</span>}
              </div>
              {item.unknown && (
                <p className="mei-warn">
                  Aliment absent de la base : ses nutriments ne seront pas comptés.
                  {!disabled && (
                    <button
                      type="button"
                      className="mei-link"
                      onClick={() => startReplace(i)}
                      aria-label={`Remplacer ${item.ingredient}`}
                    >
                      Remplacer
                    </button>
                  )}
                </p>
              )}
              <div className="mei-controls">
                <button
                  type="button"
                  className="mei-step"
                  onClick={() => nudge(i, -STEP_G)}
                  disabled={disabled || !item.quantity_g}
                  aria-label={`Retirer ${STEP_G} g à ${item.ingredient}`}
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="5"
                  className="mei-grams"
                  value={item.quantity_g ?? ''}
                  placeholder="?"
                  disabled={disabled}
                  onChange={(e) => update(i, setItemGrams(item, e.target.value))}
                  aria-label={`Grammes de ${item.ingredient}`}
                />
                <span className="mei-unit">g</span>
                <button
                  type="button"
                  className="mei-step"
                  onClick={() => nudge(i, STEP_G)}
                  disabled={disabled}
                  aria-label={`Ajouter ${STEP_G} g à ${item.ingredient}`}
                >
                  +
                </button>
                <span className="mei-kcal">{kcal != null ? `${kcal} kcal` : '—'}</span>
                {!disabled && (
                  <button
                    type="button"
                    className="mei-remove"
                    onClick={() => remove(i)}
                    aria-label={`Supprimer ${item.ingredient}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {items.length > 0 && (
        <p className="meal-editor-total">
          Total estimé : <strong>≈ {total.toLocaleString('fr-FR')} kcal</strong>
          {items.some((it) => it.unknown) && (
            <span className="mei-total-note"> (hors aliments absents de la base)</span>
          )}
        </p>
      )}

      {!disabled && (
        <div className="meal-editor-add">
          <label className="mei-search-label" htmlFor={searchId}>{searchLabel}</label>
          <div className="mei-search-row">
            <input
              id={searchId}
              type="search"
              className="mei-search"
              placeholder="ex. riz, poulet, huile d’olive…"
              value={query}
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
            />
            {replaceIndex != null && (
              <button
                type="button"
                className="mei-link"
                onClick={() => { setReplaceIndex(null); setQuery('') }}
              >
                Annuler
              </button>
            )}
          </div>
          {suggestions.length > 0 && (
            <ul className="mei-suggestions" role="listbox" aria-label="Suggestions d’ingrédients">
              {suggestions.map((name) => (
                <li key={name} role="option" aria-selected="false" tabIndex={0}
                  onClick={() => pick(name)}
                  onKeyDown={(e) => { if (e.key === 'Enter') pick(name) }}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
          {query.trim().length >= 2 && suggestions.length === 0 && (
            <p className="mei-none">Aucun aliment trouvé — essayez un mot plus simple.</p>
          )}
        </div>
      )}
    </div>
  )
}
