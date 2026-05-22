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
import {
  getWithingsCredentials,
  setWithingsCredentials,
  hasWithingsCredentials,
  clearWithingsAuth,
} from '../settings/withingsSettings'
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

  const [withingsClientId, setWithingsClientId] = useState('')
  const [withingsSecret, setWithingsSecret] = useState('')
  const [withingsRedirect, setWithingsRedirect] = useState('')
  const [withingsSaved, setWithingsSaved] = useState(false)

  useEffect(() => {
    setApiKey(getGeminiApiKey())
    const creds = getWithingsCredentials()
    setWithingsClientId(creds.clientId)
    setWithingsSecret(creds.clientSecret)
    setWithingsRedirect(creds.redirectUri)
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

      <div className="settings-block">
        <h3 className="section-title">Withings Body Scan</h3>
        <p className="page-intro">
          Pour synchroniser votre balance, créez une application sur{' '}
          <a href="https://developer.withings.com/" target="_blank" rel="noopener noreferrer">
            developer.withings.com
          </a>{' '}
          et renseignez les identifiants ci-dessous. L&apos;URL de redirection doit pointer vers{' '}
          <code>/connectors/withings/callback</code> de cette app (ex.{' '}
          <code>https://votre-domaine/connectors/withings/callback</code> ou{' '}
          <code>http://localhost:5173/connectors/withings/callback</code> en développement).
        </p>
        <label htmlFor="withings-client-id" className="input-label">Client ID</label>
        <input
          id="withings-client-id"
          type="text"
          autoComplete="off"
          value={withingsClientId}
          onChange={(e) => setWithingsClientId(e.target.value)}
          className="settings-input"
        />
        <label htmlFor="withings-secret" className="input-label">Client Secret</label>
        <input
          id="withings-secret"
          type="password"
          autoComplete="off"
          value={withingsSecret}
          onChange={(e) => setWithingsSecret(e.target.value)}
          className="settings-input"
        />
        <label htmlFor="withings-redirect" className="input-label">URL de redirection OAuth</label>
        <input
          id="withings-redirect"
          type="url"
          autoComplete="off"
          value={withingsRedirect}
          onChange={(e) => setWithingsRedirect(e.target.value)}
          placeholder="http://localhost:5173/connectors/withings/callback"
          className="settings-input"
        />
        <p className="hint">
          {hasWithingsCredentials()
            ? 'Identifiants Withings enregistrés. Connectez-vous depuis Connecteurs.'
            : 'Renseignez les trois champs pour activer le connecteur Withings.'}
        </p>
        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setWithingsCredentials({
                clientId: withingsClientId,
                clientSecret: withingsSecret,
                redirectUri: withingsRedirect,
              })
              setWithingsSaved(true)
              setTimeout(() => setWithingsSaved(false), 2000)
            }}
          >
            Enregistrer Withings
          </button>
          {withingsSaved && <span className="saved-msg">✓ Enregistré</span>}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              clearWithingsAuth()
            }}
          >
            Déconnecter Withings
          </button>
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
