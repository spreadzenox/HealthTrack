import { useEffect, useRef, useState } from 'react'
import { createEntry } from '../storage/localHealthStorage'
import { atToLocalInput, itemForStorage, itemsForEditing, localInputToAt } from '../services/mealEditing'
import { mealTimeError } from '../services/quickMeals'
import MealEditor from './MealEditor'

/**
 * Saisie d'un repas sans photo : vide (ingrédients ajoutés par recherche) ou pré-rempli à partir
 * d'un repas déjà enregistré (« Refaire »). Heure par défaut : maintenant.
 */
export default function NewMealForm({ title, dish, initialItems, onSaved, onCancel }) {
  const [items, setItems] = useState(() => itemsForEditing(initialItems))
  const [initialTime] = useState(() => atToLocalInput(new Date().toISOString()))
  const [time, setTime] = useState(initialTime)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [])

  const save = async () => {
    const toSave = items.filter((it) => it.ingredient)
    if (!toSave.length) {
      setError('Ajoutez au moins un ingrédient.')
      return
    }
    // Heure inchangée = au moment de l'enregistrement (le formulaire a pu rester ouvert)
    const at = time === initialTime ? new Date().toISOString() : localInputToAt(time)
    const timeError = mealTimeError(at)
    if (timeError) {
      setError(timeError)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createEntry({
        type: 'food',
        source: 'app_food',
        at,
        payload: { items: toSave.map(itemForStorage), provider: 'manual', ...(dish ? { dish } : {}) },
      })
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      onSaved?.()
    } catch {
      setError('Enregistrement impossible, réessayez.')
      setSaving(false)
    }
  }

  return (
    <section className="new-meal" ref={ref} aria-labelledby="new-meal-title">
      <h3 id="new-meal-title" className="new-meal-title">{title}</h3>
      {items.length === 0 && (
        <p className="results-hint">
          Cherchez chaque aliment ci-dessous, puis ajustez les grammes. Rien n’est envoyé en ligne.
        </p>
      )}
      <div className="sme-time">
        <label htmlFor="new-meal-time">Heure du repas</label>
        <input
          id="new-meal-time"
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
        <button type="button" className="btn" onClick={save} disabled={saving || items.length === 0}>
          {saving ? 'Enregistrement…' : 'Enregistrer ce repas'}
        </button>
      </div>
    </section>
  )
}
