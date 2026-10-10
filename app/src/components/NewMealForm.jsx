import { useEffect, useRef, useState } from 'react'
import { createEntry } from '../storage/localHealthStorage'
import { atToLocalInput, itemForStorage, itemsForEditing, localInputToAt } from '../services/mealEditing'
import { mealTimeError } from '../services/quickMeals'
import { analyzeMealText, MEAL_TEXT_MAX_LENGTH } from '../services/geminiStandalone'
import { getGeminiApiKey, hasGeminiApiKey } from '../settings/geminiApiKey'
import MealEditor from './MealEditor'

/**
 * Saisie d'un repas sans photo : vide (ingrédients ajoutés par recherche, ou déduits par Gemini
 * d'une description en quelques mots) ou pré-rempli à partir d'un repas déjà enregistré
 * (« Refaire »). Heure par défaut : maintenant.
 */
export default function NewMealForm({ title, dish, initialItems, onSaved, onCancel }) {
  const [items, setItems] = useState(() => itemsForEditing(initialItems))
  // Description libre → Gemini, seulement pour un repas vide (pas pour « Refaire »)
  const [describable] = useState(() => items.length === 0)
  const [canDescribe] = useState(hasGeminiApiKey)
  const [description, setDescription] = useState('')
  const [describing, setDescribing] = useState(false)
  const [described, setDescribed] = useState(null)
  const [initialTime] = useState(() => atToLocalInput(new Date().toISOString()))
  const [time, setTime] = useState(initialTime)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [])

  const describe = async () => {
    setDescribing(true)
    setError(null)
    try {
      const result = await analyzeMealText(description, getGeminiApiKey())
      if (!result.items.length) {
        setError('Aucun aliment reconnu : précisez la description ou ajoutez-les ci-dessous.')
        return
      }
      setItems(itemsForEditing(result.items))
      setDescribed({ model: result.model, dish: result.dish })
    } catch (err) {
      setError(err.message || 'Analyse impossible, réessayez ou ajoutez les aliments ci-dessous.')
    } finally {
      setDescribing(false)
    }
  }

  const mealDish = described ? described.dish : dish

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
        payload: {
          items: toSave.map(itemForStorage),
          provider: described ? 'gemini_text' : 'manual',
          ...(described?.model ? { model: described.model } : {}),
          ...(mealDish ? { dish: mealDish } : {}),
        },
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
      <h3 id="new-meal-title" className="new-meal-title">{described?.dish || title}</h3>
      {describable && !described && canDescribe && (
        <div className="meal-describe">
          <label htmlFor="meal-description">Décrivez votre repas</label>
          <textarea
            id="meal-description"
            rows={2}
            maxLength={MEAL_TEXT_MAX_LENGTH}
            placeholder="Ex. : 2 œufs au plat, une tartine beurrée et un café"
            value={description}
            disabled={describing || saving}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            type="button"
            className="btn"
            onClick={describe}
            disabled={describing || saving || !description.trim()}
          >
            {describing ? 'Analyse…' : '✨ Remplir avec Gemini'}
          </button>
          <p className="hint gemini-privacy">
            🎙️ Le micro du clavier permet de dicter. 🔒 Seul ce texte est envoyé à Google Gemini
            avec votre clé ; les nutriments sont calculés sur le téléphone.
          </p>
        </div>
      )}
      {described && (
        <p className="results-hint">
          Vérifiez les quantités avant d’enregistrer : les portions sont estimées d’après votre description.
        </p>
      )}
      {items.length === 0 && (
        <p className="results-hint">
          {describable && canDescribe ? 'Ou cherchez' : 'Cherchez'} chaque aliment ci-dessous, puis
          ajustez les grammes.{!canDescribe && ' Rien n’est envoyé en ligne.'}
          {describable && !canDescribe && ' Pour décrire le repas en quelques mots, ajoutez une clé Gemini dans Plus → Paramètres.'}
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
      <MealEditor items={items} onChange={setItems} disabled={saving || describing} />
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
