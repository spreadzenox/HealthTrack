import { useState, useEffect } from 'react'
import { getGeminiApiKey, setGeminiApiKey, hasGeminiApiKey } from '../settings/geminiApiKey'
import '../Food.css'

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setApiKey(getGeminiApiKey())
  }, [])

  const handleSave = () => {
    setGeminiApiKey(apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="food-page">
      <h2 className="page-title">Paramètres</h2>

      <div className="settings-block">
        <h3 className="section-title">Analyse des ingrédients (mode autonome)</h3>
        <p className="page-intro">
          Pour utiliser l’analyse photo <strong>sans serveur</strong>, ajoutez votre clé API Gemini.
          Elle reste sur cet appareil et n’est jamais envoyée ailleurs qu’à Google.
        </p>
        <p className="hint">
          Créez une clé gratuite sur{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
            Google AI Studio
          </a>.
        </p>
        <label htmlFor="gemini-key" className="input-label">
          Clé API Gemini
        </label>
        <input
          id="gemini-key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Ex: AIza..."
          className="settings-input"
          aria-describedby="gemini-key-hint"
        />
        <p id="gemini-key-hint" className="hint">
          {hasGeminiApiKey()
            ? 'Une clé est enregistrée (analyse photo disponible).'
            : 'Sans clé, l’analyse photo n’est pas disponible : ajoutez une clé ci-dessus.'}
        </p>
        <div className="actions">
          <button type="button" className="btn" onClick={handleSave}>
            Enregistrer
          </button>
          {saved && <span className="saved-msg">✓ Enregistré</span>}
        </div>
      </div>
    </section>
  )
}
