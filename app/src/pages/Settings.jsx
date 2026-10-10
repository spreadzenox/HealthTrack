import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getGeminiApiKey, setGeminiApiKey, hasGeminiApiKey } from '../settings/geminiApiKey'
import { GEMINI_MODELS, getGeminiModel, setGeminiModel } from '../settings/geminiModel'
import {
  isDebugUnlocked,
  isDebugModeEnabled,
  setDebugModeEnabled,
  getDebugMac,
  setDebugMac,
} from '../settings/debugMode'
import { useDebug } from '../contexts/DebugContext'
import { clearWithingsAuth, hasWithingsTokens } from '../settings/withingsSettings'
import { isWithingsDirectConnectAvailable } from '../settings/withingsConnectConfig'
import '../Food.css'
import '../components/WhatsNew.css'

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [geminiModel, setGeminiModelState] = useState(() => getGeminiModel())

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

      <Link to="/nouveautes" className="whats-new-settings-link">
        Nouveautés de l'application →
      </Link>

      <div className="settings-block">
        <h3 className="section-title">Analyse des ingrédients (mode autonome)</h3>
        <p className="page-intro">
          Pour analyser un repas en photo ou décrit en quelques mots <strong>sans serveur</strong>, ajoutez
          votre clé API Gemini. Elle reste sur cet appareil et n'est jamais envoyée ailleurs qu'à Google.
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
            ? 'Une clé est enregistrée (analyse photo et description disponibles).'
            : "Sans clé, ni l'analyse photo ni le remplissage à partir d'une description ne sont disponibles ; la saisie manuelle reste possible."}
        </p>
        <div className="actions">
          <button type="button" className="btn" onClick={handleSave}>
            Enregistrer
          </button>
          {saved && <span className="saved-msg">✓ Enregistré</span>}
        </div>

        <label htmlFor="gemini-model" className="input-label">
          Modèle Gemini
        </label>
        <select
          id="gemini-model"
          className="settings-input"
          value={geminiModel}
          onChange={(e) => {
            setGeminiModel(e.target.value)
            setGeminiModelState(getGeminiModel())
          }}
        >
          {GEMINI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <p className="hint">
          Si le modèle choisi n&apos;est pas disponible pour votre clé (ou son quota est épuisé), l&apos;app essaie
          automatiquement les autres.
        </p>

        <div className="gemini-privacy">
          <p className="hint">
            <strong>🔒 Ce qui est envoyé :</strong> uniquement la photo du repas, réduite et sans
            métadonnées (position GPS, date, modèle de téléphone), ou le texte d&apos;un repas décrit. Les
            calories sont calculées sur le téléphone ; aucune autre donnée de santé ne quitte l&apos;appareil.
          </p>
          <p className="hint">
            <strong>⚠️ Avec une clé gratuite</strong>, Google peut utiliser les photos et textes envoyés pour
            améliorer ses produits, et ils peuvent être relus par des personnes. Pour l&apos;éviter,
            activez la facturation sur votre projet Google AI Studio (offre payante).{' '}
            <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">
              Conditions Gemini
            </a>
          </p>
        </div>
      </div>

      {isWithingsDirectConnectAvailable() && hasWithingsTokens() && (
        <div className="settings-block">
          <h3 className="section-title">Compte Withings</h3>
          <p className="page-intro">
            Connexion directe Withings active. Sur Android, la balance est en général importée via{' '}
            <strong>Health Connect</strong> (onglet Connecteurs) sans compte développeur.
          </p>
          <div className="actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => clearWithingsAuth()}
            >
              Déconnecter Withings
            </button>
          </div>
        </div>
      )}

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
