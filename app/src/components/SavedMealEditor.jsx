import { useState } from 'react'
import { updateEntry } from '../storage/localHealthStorage'
import { atToLocalInput, itemForStorage, itemsForEditing, localInputToAt } from '../services/mealEditing'
import { mealTimeError } from '../services/quickMeals'
import MealEditor from './MealEditor'

/**
 * Modification d'un repas déjà enregistré : ingrédients, grammes et heure du repas.
 * Seuls `payload.items` et `at` changent ; le plat, la source et le modèle sont conservés.
 */
export default function SavedMealEditor({ entry, onSaved, onCancel }) {
  const [items, setItems] = useState(() => itemsForEditing(entry.payload?.items))
  const initialTime = atToLocalInput(entry.at)
  const [time, setTime] = useState(initialTime)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const timeId = `meal-time-${entry.id}`

  const save = async () => {
    const toSave = items.filter((it) => it.ingredient)
    if (!toSave.length) {
      setError('Gardez au moins un ingrédient, ou supprimez le repas.')
      return
    }
    const changes = { payload: { ...entry.payload, items: toSave.map(itemForStorage) } }
    if (time !== initialTime) {
      const at = localInputToAt(time)
      const timeError = mealTimeError(at)
      if (timeError) {
        setError(timeError)
        return
      }
      changes.at = at
    }
    setSaving(true)
    setError(null)
    try {
      await updateEntry(entry.id, changes)
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      onSaved?.()
    } catch {
      setError('Modification impossible, réessayez.')
      setSaving(false)
    }
  }

  return (
    <div className="saved-meal-editor">
      <div className="sme-time">
        <label htmlFor={timeId}>Heure du repas</label>
        <input
          id={timeId}
          type="datetime-local"
          value={time}
          max={atToLocalInput(new Date().toISOString())}
          disabled={saving}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <MealEditor items={items} onChange={setItems} disabled={saving} />
      {error && <p className="error-msg" role="alert">{error}</p>}
      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Annuler
        </button>
        <button type="button" className="btn" onClick={save} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}
