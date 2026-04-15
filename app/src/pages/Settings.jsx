import { useState, useEffect } from 'react'
import { getGeminiApiKey, setGeminiApiKey, hasGeminiApiKey } from '../settings/geminiApiKey'
import {
  isDebugUnlocked,
  isDebugModeEnabled,
  setDebugModeEnabled,
  getDebugMac,
  setDebugMac,
} from '../settings/debugMode'
import { useDebug } from '../contexts/DebugContext'
import '../Food.css'

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  // Debug mode state
  const { refreshDebugMode } = useDebug()
  const [macInput, setMacInput] = useState(() => getDebugMac())
  const [unlocked, setUnlocked] = useState(() => isDebugUnlocked())
  const [debugEnabled, setDebugEnabled] = useState(() => isDebugModeEnabled())
  const [macError, setMacError] = useState(null)

  useEffect(() => {
    setApiKey(getGeminiApiKey())
  }, [])

  const handleSave = () => {
    setGeminiApiKey(apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleMacSave = () => {
    const authorised = setDebugMac(macInput)
    setUnlocked(authorised)
    if (!authorised) {
      setMacError('Adresse MAC non autorisée. Le mode debug est réservé au développeur.')
      // If debug was enabled but MAC is now wrong, disable it
      setDebugModeEnabled(false)
      setDebugEnabled(false)
      refreshDebugMode()
    } else {
      setMacError(null)
    }
  }

  const handleDebugToggle = () => {
    const next = !debugEnabled
    setDebugModeEnabled(next)
    setDebugEnabled(next)
    refreshDebugMode()
  }

  return (
    <section className="food-page">
      <h2 className="page-title">Paramètres</h2>

      <div className="settings-block">
        <h3 className="section-title">Analyse des ingrédients (mode autonome)</h3>
        <p className="page-intro">
          Pour utiliser l'analyse photo <strong>sans serveur</strong>, ajoutez votre clé API Gemini.
          Elle reste sur cet appareil et n'est jamais envoyée ailleurs qu'à Google.
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
            : "Sans clé, l'analyse photo n'est pas disponible : ajoutez une clé ci-dessus."}
        </p>
        <div className="actions">
          <button type="button" className="btn" onClick={handleSave}>
            Enregistrer
          </button>
          {saved && <span className="saved-msg">✓ Enregistré</span>}
        </div>
      </div>

      {/* ── Mode debug ─────────────────────────────────────────────────────── */}
      <div className="settings-block">
        <h3 className="section-title">Mode debug</h3>
        <p className="page-intro">
          Le mode debug affiche des informations techniques directement dans l'application.
          Il est réservé au développeur et nécessite une adresse MAC autorisée.
        </p>

        <label htmlFor="debug-mac" className="input-label">
          Adresse MAC de l'appareil
        </label>
        <input
          id="debug-mac"
          type="text"
          autoComplete="off"
          value={macInput}
          onChange={(e) => { setMacInput(e.target.value); setMacError(null) }}
          placeholder="Ex: AA:BB:CC:DD:EE:FF"
          className="settings-input"
          aria-describedby="debug-mac-hint"
        />
        {macError && (
          <p id="debug-mac-hint" className="hint hint-error" role="alert">
            {macError}
          </p>
        )}
        {!macError && unlocked && (
          <p id="debug-mac-hint" className="hint hint-success">
            ✓ Appareil autorisé pour le mode debug.
          </p>
        )}
        {!macError && !unlocked && (
          <p id="debug-mac-hint" className="hint">
            Entrez l'adresse MAC de votre appareil pour déverrouiller le mode debug.
          </p>
        )}
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={handleMacSave}>
            Vérifier l'adresse MAC
          </button>
        </div>

        {unlocked && (
          <div className="debug-toggle-row">
            <label className="connector-toggle" aria-label="Activer le mode debug">
              <input
                type="checkbox"
                checked={debugEnabled}
                onChange={handleDebugToggle}
                aria-checked={debugEnabled}
                data-testid="debug-mode-toggle"
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </label>
            <span className="debug-toggle-label">
              {debugEnabled ? 'Mode debug activé' : 'Mode debug désactivé'}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
