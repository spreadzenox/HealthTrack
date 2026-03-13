import { useState, useRef } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f?.type?.startsWith('image/')) return
    setError(null)
    setResult(null)
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
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Erreur lors de l’analyse.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="app">
      <header className="header">
        <h1>HealthTrack</h1>
        <p>Photo d’assiette → ingrédients et quantités</p>
      </header>

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
          <button
            type="button"
            className="btn"
            onClick={analyze}
            disabled={loading}
          >
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
          <button type="button" className="btn btn-secondary" onClick={reset} style={{ marginTop: 16, width: '100%' }}>
            Nouvelle photo
          </button>
        </section>
      )}

      {result?.items?.length === 0 && !loading && (
        <p className="loading">Aucun ingrédient détecté. Essayez une autre photo.</p>
      )}

      <p className="settings-link">
        L’analyse est envoyée au serveur (OpenAI / Gemini ou modèle local).{' '}
        <a href="/health" target="_blank" rel="noopener noreferrer">État de l’API</a>
      </p>
    </div>
  )
}
