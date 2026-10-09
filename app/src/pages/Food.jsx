import { useState, useRef, useEffect } from 'react'
import '../Food.css'
import { listEntries, createEntry } from '../storage/localHealthStorage'
import { getGeminiApiKey, hasGeminiApiKey } from '../settings/geminiApiKey'
import { analyzeWithGemini } from '../services/geminiStandalone'
import { formatAt } from '../utils/format'
import MealEditor from '../components/MealEditor'
import DeleteEntryButton from '../components/DeleteEntryButton'
import { isDeletableEntry } from '../utils/entries'
import { itemForStorage, mealKcal } from '../services/mealEditing'
import SavedMealEditor from '../components/SavedMealEditor'

export default function Food() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [items, setItems] = useState([])
  const [savedId, setSavedId] = useState(null)
  const [recentMeals, setRecentMeals] = useState([])
  const [editingId, setEditingId] = useState(null)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const loadRecent = async () => {
    try {
      const data = await listEntries({ type: 'food', limit: 20 })
      setRecentMeals(data)
    } catch {
      // Liste indisponible : la page reste utilisable pour analyser une photo
    }
  }

  useEffect(() => {
    loadRecent()
  }, [])

  const handleFile = (f) => {
    if (!f?.type?.startsWith('image/')) return
    setError(null)
    setResult(null)
    setSavedId(null)
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(f)
  }

  const onInputChange = (e) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('dragover')
    const f = e.dataTransfer?.files?.[0]
    if (f) handleFile(f)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('dragover')
  }

  const onDragLeave = (e) => {
    e.currentTarget.classList.remove('dragover')
  }

  const analyze = async () => {
    if (!file) return
    if (!hasGeminiApiKey()) {
      setError('Ajoutez votre clé API Gemini dans Paramètres pour analyser une photo.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setSavedId(null)
    try {
      const apiKey = getGeminiApiKey()
      const data = await analyzeWithGemini(file, apiKey)
      setResult(data)
      setItems(data.items || [])
    } catch (err) {
      setError(err.message || "Erreur lors de l'analyse.")
    } finally {
      setLoading(false)
    }
  }

  const saveMeal = async () => {
    const toSave = items.filter((it) => it.ingredient)
    if (!toSave.length) return
    setSaving(true)
    setError(null)
    try {
      const id = await createEntry({
        type: 'food',
        source: 'app_food',
        payload: {
          items: toSave.map(itemForStorage),
          provider: result.provider,
          ...(result.model ? { model: result.model } : {}),
          ...(result.dish ? { dish: result.dish } : {}),
        },
      })
      setSavedId(id)
      loadRecent()
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setItems([])
    setSavedId(null)
    setError(null)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  return (
    <section className="food-page">
      <h2 className="page-title">Alimentation</h2>
      <p className="page-intro">Prenez une photo de votre assiette pour obtenir les ingrédients et quantités, puis enregistrez le repas.</p>

      <div
        className="upload-zone"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {/* Hidden input wired to camera (rear camera hint) */}
        <input
          ref={cameraInputRef}
          id="camera-upload"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onInputChange}
          aria-label="Prendre une photo"
          className="hidden-file-input"
        />
        {/* Hidden input wired to gallery (no capture attribute) */}
        <input
          ref={galleryInputRef}
          id="gallery-upload"
          type="file"
          accept="image/*"
          onChange={onInputChange}
          aria-label="Choisir depuis la galerie"
          className="hidden-file-input"
        />

        <div className="upload-actions">
          <label htmlFor="camera-upload" className="upload-btn">
            📷 {preview ? 'Reprendre' : 'Prendre une photo'}
          </label>
          <label htmlFor="gallery-upload" className="upload-btn">
            🖼️ {preview ? 'Galerie' : 'Choisir depuis la galerie'}
          </label>
        </div>
        {!preview && (
          <p className="hint">Utilisez l&apos;appareil photo ou la galerie sur mobile</p>
        )}
      </div>

      {preview && (
        <div className="preview-wrap">
          <img src={preview} alt="Aperçu" />
        </div>
      )}

      {preview && !result && (
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={reset}>
            Annuler
          </button>
          <button type="button" className="btn" onClick={analyze} disabled={loading}>
            {loading ? 'Analyse…' : 'Analyser les ingrédients'}
          </button>
        </div>
      )}

      {preview && !result && (
        <p className="hint gemini-privacy">
          🔒 Seule la photo, réduite et sans position GPS ni infos de l&apos;appareil, est envoyée à
          Google Gemini avec votre clé. Avec une clé gratuite, Google peut l&apos;utiliser pour
          améliorer ses produits.
        </p>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Analyse en cours…</p>
        </div>
      )}

      {error && <div className="error-msg" role="alert">{error}</div>}

      {result && !loading && (
        <section className="results" aria-labelledby="results-title">
          <h2 id="results-title">{result.dish || 'Ingrédients détectés'}</h2>
          <p className="provider-tag">Source : {result.model || result.provider}</p>
          {result.items?.length > 0 ? (
            !savedId && (
              <p className="results-hint">
                Vérifiez les quantités avant d&apos;enregistrer : l&apos;estimation sur photo peut se
                tromper de plusieurs dizaines de grammes.
              </p>
            )
          ) : (
            <p className="results-hint">
              Aucun ingrédient reconnu. Ajoutez-les ci-dessous ou essayez une autre photo.
            </p>
          )}
          <MealEditor items={items} onChange={setItems} disabled={Boolean(savedId) || saving} />
          <div className="actions">
            {savedId ? (
              <p className="saved-msg">✓ Repas enregistré</p>
            ) : (
              <button
                type="button"
                className="btn"
                onClick={saveMeal}
                disabled={saving || items.length === 0}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer ce repas'}
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={reset} style={{ flex: 1 }}>
              Nouvelle photo
            </button>
          </div>
        </section>
      )}

      <h3 className="section-title">Derniers repas enregistrés</h3>
      {recentMeals.length === 0 ? (
        <p className="empty-hint">Aucun repas enregistré pour l&apos;instant.</p>
      ) : (
        <ul className="meals-list">
          {recentMeals.map((e) => (
            <li key={e.id} className="meal-card">
              <div className="meal-head">
                <time className="meal-at">{formatAt(e.at)}</time>
                {mealKcal(e.payload?.items) > 0 && (
                  <span className="meal-kcal">≈ {mealKcal(e.payload.items).toLocaleString('fr-FR')} kcal</span>
                )}
              </div>
              {e.payload?.dish && <p className="meal-dish">{e.payload.dish}</p>}
              {editingId === e.id ? (
                <SavedMealEditor
                  entry={e}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null)
                    loadRecent()
                  }}
                />
              ) : (
                <div className="entry-card-row">
                  <ul className="meal-items">
                    {e.payload?.items?.slice(0, 6).map((item, i) => (
                      <li key={i}>{item.ingredient}{'\u00a0'}: {item.quantity}</li>
                    ))}
                    {e.payload?.items?.length > 6 && (
                      <li className="meal-more">+{e.payload.items.length - 6}</li>
                    )}
                  </ul>
                  {isDeletableEntry(e) && (
                    <div className="entry-edit">
                      <button
                        type="button"
                        className="entry-delete-btn"
                        onClick={() => setEditingId(e.id)}
                        aria-label="Modifier ce repas"
                      >
                        Modifier
                      </button>
                    </div>
                  )}
                  {isDeletableEntry(e) && (
                    <DeleteEntryButton
                      entryId={e.id}
                      label="ce repas"
                      onDeleted={(id) => setRecentMeals((meals) => meals.filter((m) => m.id !== id))}
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
