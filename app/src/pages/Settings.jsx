import { useState, useEffect } from 'react'
import { getGeminiApiKey, setGeminiApiKey, hasGeminiApiKey } from '../settings/geminiApiKey'
import { GEMINI_MODELS, getGeminiModel, setGeminiModel } from '../settings/geminiModel'
import { isDebugModeEnabled, setDebugModeEnabled } from '../settings/debugMode'
import { useDebug } from '../contexts/DebugContext'
import {
  getWithingsCredentials,
  setWithingsCredentials,
  hasWithingsCredentials,
  hasWithingsTokens,
  clearWithingsAuth,
} from '../settings/withingsSettings'
import '../Food.css'

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [geminiModel, setGeminiModelState] = useState(() => getGeminiModel())

  // Debug mode state
  const { refreshDebugMode } = useDebug()
  const [debugEnabled, setDebugEnabled] = useState(() => isDebugModeEnabled())

  const [withingsClientId, setWithingsClientId] = useState('')
  const [withingsSecret, setWithingsSecret] = useState('')
  const [withingsRedirect, setWithingsRedirect] = useState('')
  const [withingsSaved, setWithingsSaved] = useState(false)
  const [withingsConnected, setWithingsConnected] = useState(() => hasWithingsTokens())
  const [withingsDisconnected, setWithingsDisconnected] = useState(false)

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
          {withingsConnected && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                clearWithingsAuth()
                setWithingsConnected(false)
                setWithingsDisconnected(true)
              }}
            >
              Déconnecter Withings
            </button>
          )}
          {withingsDisconnected && <span className="saved-msg">✓ Compte Withings déconnecté</span>}
        </div>
      </div>

      {/* ── Mode diagnostic ─────────────────────────────────────────────────────── */}
      <div className="settings-block">
        <h3 className="section-title">Mode diagnostic</h3>
        <p className="page-intro">
          Affiche les journaux techniques (connexions, analyses) dans l'application, pour
          comprendre un problème ou les transmettre.
        </p>

        <div className="debug-toggle-row">
          <label className="connector-toggle" aria-label="Activer le mode diagnostic">
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
            {debugEnabled ? 'Mode diagnostic activé' : 'Mode diagnostic désactivé'}
          </span>
        </div>
      </div>
    </section>
  )
}
