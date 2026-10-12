import { useState } from 'react'
import {
  getWithingsCredentials,
  setWithingsCredentials,
  hasWithingsCredentials,
  hasWithingsTokens,
  clearWithingsAuth,
} from '../settings/withingsSettings'
import '../Food.css'

/**
 * Identifiants API Withings + déconnexion, dans la carte Withings des Connecteurs
 * (avant : un bloc à part dans Paramètres, loin de l'interrupteur).
 * Replié une fois les identifiants enregistrés : on ne les touche qu'une fois.
 */
export default function WithingsSetup({ onChange }) {
  const [creds, setCreds] = useState(() => getWithingsCredentials())
  const [configured] = useState(() => hasWithingsCredentials())
  const [saved, setSaved] = useState(false)
  const [connected, setConnected] = useState(() => hasWithingsTokens())
  const [disconnected, setDisconnected] = useState(false)

  const update = (field) => (e) => setCreds((c) => ({ ...c, [field]: e.target.value }))

  const handleSave = () => {
    setWithingsCredentials(creds)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onChange?.()
  }

  const handleDisconnect = () => {
    clearWithingsAuth()
    setConnected(false)
    setDisconnected(true)
    onChange?.()
  }

  return (
    <details className="withings-setup" open={!configured}>
      <summary>Identifiants API Withings</summary>
      <p className="hint">
        Créez une application sur{' '}
        <a href="https://developer.withings.com/" target="_blank" rel="noopener noreferrer">
          developer.withings.com
        </a>{' '}
        ; son URL de redirection doit pointer vers <code>/connectors/withings/callback</code> de cette app.
      </p>
      <label htmlFor="withings-client-id" className="input-label">Client ID</label>
      <input
        id="withings-client-id"
        type="text"
        autoComplete="off"
        value={creds.clientId}
        onChange={update('clientId')}
        className="settings-input"
      />
      <label htmlFor="withings-secret" className="input-label">Client Secret</label>
      <input
        id="withings-secret"
        type="password"
        autoComplete="off"
        value={creds.clientSecret}
        onChange={update('clientSecret')}
        className="settings-input"
      />
      <label htmlFor="withings-redirect" className="input-label">URL de redirection OAuth</label>
      <input
        id="withings-redirect"
        type="url"
        autoComplete="off"
        value={creds.redirectUri}
        onChange={update('redirectUri')}
        placeholder="http://localhost:5173/connectors/withings/callback"
        className="settings-input"
      />
      <div className="actions">
        <button type="button" className="btn btn-secondary connector-btn" onClick={handleSave}>
          Enregistrer les identifiants
        </button>
        {saved && <span className="saved-msg">✓ Enregistré</span>}
        {connected && (
          <button type="button" className="btn btn-secondary connector-btn" onClick={handleDisconnect}>
            Déconnecter Withings
          </button>
        )}
        {disconnected && <span className="saved-msg">✓ Compte Withings déconnecté</span>}
      </div>
    </details>
  )
}
