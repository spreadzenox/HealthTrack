import { useState, useEffect } from 'react'
import { getGeminiApiKey, setGeminiApiKey, hasGeminiApiKey } from '../settings/geminiApiKey'
import { GEMINI_MODELS, getGeminiModel, setGeminiModel } from '../settings/geminiModel'
import { isDebugModeEnabled, setDebugModeEnabled } from '../settings/debugMode'
import { useDebug } from '../contexts/DebugContext'
import { isCigaretteCounterPinned, setCigaretteCounterPinned } from '../settings/cigaretteCounter'
import '../Food.css'

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [geminiModel, setGeminiModelState] = useState(() => getGeminiModel())

  // Debug mode state
  const { refreshDebugMode } = useDebug()
  const [debugEnabled, setDebugEnabled] = useState(() => isDebugModeEnabled())

  const [cigarettePinned, setCigarettePinned] = useState(() => isCigaretteCounterPinned())

  useEffect(() => {
    setApiKey(getGeminiApiKey())
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
        <h3 className="section-title">Cigarettes</h3>
        <p className="page-intro">
          Le bouton « + 1 cigarette » de l&apos;accueil n&apos;apparaît que si une cigarette a été notée ces
          14 derniers jours. Activez-le ici pour noter la première, ou pour le garder toujours visible.
        </p>
        <div className="debug-toggle-row">
          <label className="connector-toggle" aria-label="Toujours afficher le bouton cigarette">
            <input
              type="checkbox"
              checked={cigarettePinned}
              onChange={() => {
                setCigaretteCounterPinned(!cigarettePinned)
                setCigarettePinned(!cigarettePinned)
              }}
              aria-checked={cigarettePinned}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </label>
          <span className="debug-toggle-label">
            {cigarettePinned ? 'Bouton toujours affiché' : 'Bouton affiché seulement si vous fumez'}
          </span>
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
