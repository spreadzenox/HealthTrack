import { useState, useRef, useEffect } from 'react'
import '../Food.css'
import { listEntries, createEntry } from '../storage/localHealthStorage'
import { getGeminiApiKey, hasGeminiApiKey } from '../settings/geminiApiKey'
import { analyzeWithGemini } from '../services/geminiStandalone'

function formatAt(at) {
  if (!at) return ''
  try {
    return new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return at
  }
}

export default function Food() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [recentMeals, setRecentMeals] = useState([])
  const inputRef = useRef(null)

  const loadRecent = async () => {
    try {
      const data = await listEntries({ type: 'food', limit: 20 })
      setRecentMeals(data)
    } catch {}
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
    } catch (err) {
      setError(err.message || 'Erreur lors de l’analyse.')
    } finally {
      setLoading(false)
    }
  }

  const saveMeal = async () => {
    if (!result?.items?.length) return
    setSaving(true)
    setError(null)
    try {
      const id = await createEntry({
        type: 'food',
        source: 'app_food',
        payload: { items: result.items, provider: result.provider },
      })
      setSavedId(id)
      loadRecent()
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
    } catch (err) {
      setError(err.message || 'Erreur lors de l’enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setSavedId(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
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
        <input
          ref={inputRef}
          id="file-upload"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onInputChange}
          aria-label="Choisir une photo"
        />
        <label htmlFor="file-upload">
          {preview ? 'Changer la photo' : '📷 Prendre une photo ou choisir une image'}
        </label>
        <p className="hint">
          {preview ? 'Cliquez pour modifier' : 'Utilisez l’appareil photo ou la galerie sur mobile'}
        </p>
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

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Analyse en cours…</p>
        </div>
      )}

      {error && <div className="error-msg" role="alert">{error}</div>}

      {result?.items?.length > 0 && (
        <section className="results" aria-labelledby="results-title">
          <h2 id="results-title">Ingrédients détectés</h2>
          <p className="provider-tag">Source: {result.provider}</p>
          <ul>
            {result.items.map((item, i) => (
              <li key={i}>
                <span className="ingredient">{item.ingredient}</span>
                <span className="quantity">{item.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="actions">
            {savedId ? (
              <p className="saved-msg">✓ Repas enregistré</p>
            ) : (
              <button
                type="button"
                className="btn"
                onClick={saveMeal}
                disabled={saving}
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

      {result?.items?.length === 0 && !loading && result !== null && (
        <p className="loading">Aucun ingrédient détecté. Essayez une autre photo.</p>
      )}

      <h3 className="section-title">Derniers repas enregistrés</h3>
      {recentMeals.length === 0 ? (
        <p className="empty-hint">Aucun repas enregistré pour l’instant.</p>
      ) : (
        <ul className="meals-list">
          {recentMeals.map((e) => (
            <li key={e.id} className="meal-card">
              <time className="meal-at">{formatAt(e.at)}</time>
              <ul className="meal-items">
                {e.payload?.items?.slice(0, 6).map((item, i) => (
                  <li key={i}>{item.ingredient}: {item.quantity}</li>
                ))}
                {e.payload?.items?.length > 6 && (
                  <li className="meal-more">+{e.payload.items.length - 6}</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
