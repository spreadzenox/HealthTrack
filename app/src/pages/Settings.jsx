import { useState, useEffect } from 'react'
import { getGeminiApiKey, setGeminiApiKey, hasGeminiApiKey } from '../settings/geminiApiKey'
import { GEMINI_MODELS, getGeminiModel, setGeminiModel } from '../settings/geminiModel'
import { isDebugModeEnabled, setDebugModeEnabled } from '../settings/debugMode'
import { useDebug } from '../contexts/DebugContext'
import { isCigaretteCounterPinned, setCigaretteCounterPinned } from '../settings/cigaretteCounter'
import { THEME_CHOICES, getThemeChoice, setThemeChoice, applyTheme } from '../theme/theme'
import { FEATURES } from '../config/distribution'
import { getLastQuota } from '../services/aiRelay'
import { getEntitlement, refreshEntitlement, describeEntitlement, manageSubscriptionUrl } from '../services/entitlement'
import '../Food.css'

/** Variante play : l'analyse passe par le relais Halcya, sans clé (jalon 6a). */
function RelayAiBlock() {
  const quota = getLastQuota()
  return (
    <div className="settings-block">
      <h3 className="section-title">Analyse des repas (IA)</h3>
      <p className="page-intro">
        Pour remplir un repas depuis une photo ou une description, l’app la fait analyser par Gemini (Google Cloud,
        en Europe) via notre serveur, seulement quand vous touchez « Analyser ». Aucune clé à saisir. Sans IA, la
        saisie manuelle reste possible.
      </p>
      {quota && (
        <p className="hint">
          {quota.remaining > 1 ? `${quota.remaining} analyses restantes aujourd’hui.` : `${quota.remaining} analyse restante aujourd’hui.`}
        </p>
      )}
      <div className="gemini-privacy">
        <p className="hint">
          <strong>🔒 Ce qui est envoyé :</strong> uniquement la photo du repas, réduite et sans métadonnées
          (position GPS, date, modèle de téléphone), ou le texte d’un repas décrit, avec un identifiant aléatoire
          qui sert à compter les analyses du jour. Notre serveur ne garde rien et Google ne s’en sert pas pour
          entraîner ses modèles. Les calories sont calculées sur le téléphone ; aucune autre donnée de santé ne
          quitte l’appareil.
        </p>
      </div>
    </div>
  )
}

/** Variante play : état de l'abonnement, établi par le relais (jalon 6c), et lien de gestion Google Play. */
function SubscriptionBlock() {
  const [ent, setEnt] = useState(() => getEntitlement())

  useEffect(() => {
    let alive = true
    refreshEntitlement().then((next) => alive && setEnt(next))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="settings-block">
      <h3 className="section-title">Abonnement</h3>
      <p className="page-intro">{describeEntitlement(ent)}</p>
      {ent.source === 'play' && (
        <a className="btn btn-secondary settings-link-btn" href={manageSubscriptionUrl(ent.productId)} target="_blank" rel="noopener noreferrer">
          Gérer mon abonnement dans Google Play
        </a>
      )}
    </div>
  )
}

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [geminiModel, setGeminiModelState] = useState(() => getGeminiModel())

  // Debug mode state
  const { refreshDebugMode } = useDebug()
  const [debugEnabled, setDebugEnabled] = useState(() => isDebugModeEnabled())

  const [cigarettePinned, setCigarettePinned] = useState(() => isCigaretteCounterPinned())
  const [theme, setTheme] = useState(() => getThemeChoice())

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

  const handleTheme = (value) => {
    setThemeChoice(value)
    setTheme(value)
    applyTheme()
  }

  return (
    <section className="food-page">
      <h2 className="page-title">Paramètres</h2>

      <div className="settings-block">
        <h3 className="section-title">Apparence</h3>
        <div className="theme-choices" role="radiogroup" aria-label="Thème">
          {THEME_CHOICES.map((c) => (
            <label key={c.value} className={`theme-choice${theme === c.value ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="theme"
                value={c.value}
                checked={theme === c.value}
                onChange={() => handleTheme(c.value)}
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      {FEATURES.billing && <SubscriptionBlock />}

      {FEATURES.aiRelay ? <RelayAiBlock /> : (
      <div className="settings-block">
        <h3 className="section-title">Analyse des repas (Gemini)</h3>
        <p className="page-intro">
          Pour remplir un repas depuis une photo ou une description, ajoutez votre clé Gemini, gratuite sur{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
            Google AI Studio
          </a>. Elle reste sur ce téléphone. Sans clé, la saisie manuelle reste possible.
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
        />
        <div className="actions">
          <button type="button" className="btn" onClick={handleSave}>
            Enregistrer
          </button>
          {saved ? (
            <span className="saved-msg">✓ Enregistré</span>
          ) : (
            hasGeminiApiKey() && <span className="saved-msg">✓ Clé enregistrée</span>
          )}
        </div>

        <details className="settings-advanced">
          <summary>Choisir le modèle</summary>
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
            S&apos;il n&apos;est pas disponible pour votre clé (ou son quota est épuisé), l&apos;app essaie
            automatiquement les autres.
          </p>
        </details>

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
      )}

      <div className="settings-block">
        <h3 className="section-title">Cigarettes</h3>
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
          <span className="debug-toggle-label">Toujours afficher « + 1 cigarette » sur l&apos;accueil</span>
        </div>
        <p className="hint">Sinon, le bouton n&apos;apparaît que si une cigarette a été notée ces 14 derniers jours.</p>
      </div>

      {/* ── Mode diagnostic ─────────────────────────────────────────────────────── */}
      <div className="settings-block">
        <h3 className="section-title">Mode diagnostic</h3>
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
          <span className="debug-toggle-label">Afficher les journaux techniques</span>
        </div>
        <p className="hint">Connexions et analyses, pour comprendre un problème ou les transmettre.</p>
      </div>
    </section>
  )
}
