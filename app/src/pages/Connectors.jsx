import { useState, useEffect, useCallback } from 'react'
import { CONNECTORS } from '../connectors/connectorRegistry'
import { getConnectorSettings, setConnectorSettings } from '../settings/connectorSettings'
import { upsertEntries, getLatestEntryAt } from '../storage/localHealthStorage'
import './Connectors.css'

/**
 * How far back to look when doing the first historical import.
 * Default: 6 months.
 */
const DEFAULT_HISTORY_DAYS = 180

/**
 * How far back to look on a regular incremental sync (when lastSyncAt is set).
 * Add a 2-hour overlap to catch delayed sync from the watch.
 */
const SYNC_OVERLAP_MS = 2 * 60 * 60 * 1000

/**
 * Races a promise against a timeout. If the timeout fires first the provided
 * fallback value is returned, preventing status badges from being stuck on
 * "Vérification…" indefinitely when the native bridge hangs.
 */
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(isoString))
  } catch {
    return isoString
  }
}

function StatusBadge({ status }) {
  const labels = {
    available: { label: 'Disponible', className: 'badge-available' },
    unavailable: { label: 'Non disponible', className: 'badge-unavailable' },
    checking: { label: 'Vérification…', className: 'badge-checking' },
    granted: { label: 'Autorisé', className: 'badge-available' },
    denied: { label: 'Refusé', className: 'badge-unavailable' },
    not_asked: { label: 'Non demandé', className: 'badge-checking' },
  }
  const { label, className } = labels[status] || { label: status, className: '' }
  return <span className={`connector-badge ${className}`}>{label}</span>
}

function ConnectorCard({ connector }) {
  const [settings, setSettings] = useState(() => getConnectorSettings(connector.id))
  const [availability, setAvailability] = useState('checking')
  const [availabilityReason, setAvailabilityReason] = useState(null)
  const [permissions, setPermissions] = useState('checking')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const [historyDays, setHistoryDays] = useState(DEFAULT_HISTORY_DAYS)

  // Reload settings from localStorage when component mounts
  const reloadSettings = useCallback(() => {
    setSettings(getConnectorSettings(connector.id))
  }, [connector.id])

  useEffect(() => {
    reloadSettings()
    const detailsFn = connector.availabilityDetails
      ? connector.availabilityDetails.bind(connector)
      : () => connector.isAvailable().then((a) => ({ available: a }))
    withTimeout(detailsFn(), 8000, { available: false, reason: 'unavailable' })
      .then((details) => {
        setAvailability(details.available ? 'available' : 'unavailable')
        setAvailabilityReason(details.reason || null)
      })
      .catch(() => {
        setAvailability('unavailable')
        setAvailabilityReason(null)
      })
    withTimeout(connector.checkPermissions(), 8000, 'not_asked')
      .then((p) => setPermissions(p === 'not_asked' ? 'not_asked' : p))
      .catch(() => setPermissions('not_asked'))
  }, [connector, reloadSettings])

  const handleToggleEnabled = () => {
    const next = !settings.enabled
    setConnectorSettings(connector.id, { enabled: next })
    reloadSettings()
  }

  const handleRequestPermissions = async () => {
    setPermissions('checking')
    try {
      const result = await withTimeout(connector.requestPermissions(), 15000, 'denied')
      setPermissions(result)
    } catch {
      setPermissions('denied')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      // Determine the time range for this sync
      const now = new Date()

      let since
      const currentSettings = getConnectorSettings(connector.id)

      if (currentSettings.lastSyncAt) {
        // Incremental sync: from lastSyncAt minus overlap
        since = new Date(new Date(currentSettings.lastSyncAt).getTime() - SYNC_OVERLAP_MS)
      } else {
        // First sync: historical import
        const latestAt = await getLatestEntryAt('health_connect')
        if (latestAt) {
          since = new Date(new Date(latestAt).getTime() - SYNC_OVERLAP_MS)
        } else {
          since = new Date(now.getTime() - historyDays * 24 * 60 * 60 * 1000)
        }
      }

      const result = await connector.sync({
        since,
        until: now,
        writer: async (entries) => {
          await upsertEntries(entries)
        },
      })

      const newSettings = {
        lastSyncAt: now.toISOString(),
        lastSyncResult: result,
      }
      setConnectorSettings(connector.id, newSettings)
      reloadSettings()

      if (result.errors && result.errors.length > 0) {
        setSyncMsg(`${result.synced} données importées, ${result.skipped} ignorées. Erreurs : ${result.errors.join('; ')}`)
      } else {
        setSyncMsg(`✓ ${result.synced} nouvelles entrées importées, ${result.skipped} déjà présentes.`)
      }
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
    } catch (e) {
      setSyncMsg(`Erreur : ${e.message || 'synchronisation impossible'}`)
    } finally {
      setSyncing(false)
    }
  }

  const canSync = availability === 'available' && permissions === 'granted'

  return (
    <div className={`connector-card ${settings.enabled ? 'connector-card-enabled' : ''}`}>
      <div className="connector-card-header">
        <div className="connector-card-title-row">
          <h3 className="connector-name">{connector.name}</h3>
          <label className="connector-toggle" aria-label={`Activer ${connector.name}`}>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={handleToggleEnabled}
              aria-checked={settings.enabled}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </label>
        </div>
        <p className="connector-description">{connector.description}</p>
        <div className="connector-badges">
          <span className="connector-badge-label">Plateforme :</span>
          <StatusBadge status={availability} />
          <span className="connector-badge-label">Permissions :</span>
          <StatusBadge status={permissions} />
        </div>
      </div>

      {settings.enabled && (
        <div className="connector-body">
          {availability === 'unavailable' && availabilityReason === 'provider_update_required' && (
            <div className="connector-alert connector-alert-warning">
              <strong>Health Connect nécessite une mise à jour.</strong>{' '}
              Sur Android 14 et supérieur (dont Android 16 / One UI 8), Health Connect est un{' '}
              <strong>module système</strong> intégré — il n'est pas dans le Play Store.{' '}
              Pour le mettre à jour, allez dans{' '}
              <strong>Paramètres → Mise à jour du logiciel → Mises à jour du système Google</strong>{' '}
              et installez la dernière version. Relancez ensuite l'application.
            </div>
          )}

          {availability === 'unavailable' && availabilityReason === 'sdk_unavailable' && (
            <div className="connector-alert connector-alert-warning">
              <strong>Health Connect non disponible sur cet appareil.</strong>{' '}
              Sur Android 14 et supérieur (dont Android 16 / One UI 8), Health Connect est un{' '}
              <strong>module système intégré</strong> — il n'y a pas d'application à installer.{' '}
              Si votre appareil l'indique comme non disponible, essayez les étapes suivantes :{' '}
              <ol style={{ margin: '0.5em 0 0.5em 1.2em', padding: 0 }}>
                <li>
                  Allez dans <strong>Paramètres → Mise à jour du logiciel → Mises à jour du système Google</strong>{' '}
                  et installez toutes les mises à jour disponibles.
                </li>
                <li>
                  Vérifiez que <strong>Samsung Health</strong> est à jour et que la synchronisation avec{' '}
                  Health Connect est activée dans Samsung Health → Paramètres → Health Connect.
                </li>
                <li>
                  Ouvrez les paramètres Health Connect pour vérifier que l'accès est configuré :
                </li>
              </ol>
              <button
                type="button"
                className="btn btn-secondary connector-btn"
                onClick={() => connector.openHealthConnectSettings && connector.openHealthConnectSettings()}
              >
                Ouvrir les paramètres Health Connect
              </button>
            </div>
          )}

          {availability === 'unavailable' && availabilityReason !== 'provider_update_required' && availabilityReason !== 'sdk_unavailable' && (
            <div className="connector-alert connector-alert-warning">
              <strong>Health Connect non disponible.</strong>{' '}
              Sur Android 14 et supérieur (dont Android 16 / One UI 8), Health Connect est{' '}
              <strong>intégré au système</strong> — assurez-vous que votre appareil est à jour via{' '}
              <strong>Paramètres → Mise à jour du logiciel → Mises à jour du système Google</strong>.{' '}
              Sur Android 8–13 uniquement, installez &quot;Health Connect&quot; depuis le Play Store.{' '}
              Activez ensuite la synchronisation dans Samsung Health → Paramètres → Health Connect.
            </div>
          )}

          {availability === 'available' && permissions !== 'granted' && (
            <div className="connector-alert connector-alert-info">
              <p>Autorisez l'accès à vos données de santé pour démarrer la synchronisation.</p>
              <button
                type="button"
                className="btn btn-secondary connector-btn"
                onClick={handleRequestPermissions}
              >
                Demander les autorisations
              </button>
            </div>
          )}

          {canSync && (
            <div className="connector-sync-section">
              {!settings.lastSyncAt && (
                <div className="connector-history-picker">
                  <label htmlFor={`history-${connector.id}`} className="input-label">
                    Importer l'historique des derniers :
                  </label>
                  <select
                    id={`history-${connector.id}`}
                    className="settings-input connector-select"
                    value={historyDays}
                    onChange={(e) => setHistoryDays(Number(e.target.value))}
                  >
                    <option value={7}>7 jours</option>
                    <option value={30}>30 jours</option>
                    <option value={90}>3 mois</option>
                    <option value={180}>6 mois</option>
                    <option value={365}>1 an</option>
                    <option value={730}>2 ans</option>
                  </select>
                </div>
              )}

              <div className="connector-sync-row">
                <div className="connector-sync-meta">
                  <span className="connector-sync-label">Dernière synchro :</span>
                  <span className="connector-sync-date">{formatDate(settings.lastSyncAt)}</span>
                  {settings.lastSyncResult && (
                    <span className="connector-sync-summary">
                      {settings.lastSyncResult.synced} entrées •{' '}
                      {settings.lastSyncResult.errors?.length > 0
                        ? `${settings.lastSyncResult.errors.length} erreur(s)`
                        : 'OK'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn connector-btn"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? 'Synchronisation…' : settings.lastSyncAt ? 'Mettre à jour' : "Importer l'historique"}
                </button>
              </div>

              {syncMsg && (
                <p className={`connector-sync-msg ${syncMsg.startsWith('✓') ? 'connector-sync-msg-ok' : 'connector-sync-msg-err'}`}>
                  {syncMsg}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Connectors() {
  return (
    <section className="food-page">
      <h2 className="page-title">Connecteurs</h2>
      <p className="page-intro">
        Connectez des sources de données santé externes pour importer automatiquement vos mesures
        (montre connectée, balance, etc.) dans HealthTrack. Toutes les données restent{' '}
        <strong>uniquement sur cet appareil</strong>.
      </p>

      <div className="connectors-list">
        {CONNECTORS.map((connector) => (
          <ConnectorCard key={connector.id} connector={connector} />
        ))}
      </div>

      <div className="connector-help">
        <h3 className="section-title">Comment connecter la Samsung Galaxy Fit 3 ?</h3>
        <ol className="connector-steps">
          <li>Assurez-vous que <strong>Samsung Health</strong> est à jour et synchronisé avec la montre.</li>
          <li>
            Dans Samsung Health, allez dans <em>Paramètres → Health Connect → Autorisations de l&apos;application → Samsung Health</em> et activez toutes les catégories.
          </li>
          <li>
            Sur <strong>Android 14 et supérieur</strong> (Android 14 / 15 / 16, One UI 7 / 8…), Health Connect est un{' '}
            <strong>module système intégré</strong> — il n&apos;y a pas d&apos;application à installer depuis le Play Store.{' '}
            Si la plateforme s&apos;affiche comme non disponible, mettez votre téléphone à jour via{' '}
            <em>Paramètres → Mise à jour du logiciel → Mises à jour du système Google</em>.{' '}
            Sur Android 8–13 uniquement, installez &quot;Health Connect&quot; depuis le Play Store.
          </li>
          <li>Revenez ici, activez le connecteur, puis appuyez sur <strong>Importer l&apos;historique</strong>.</li>
        </ol>
      </div>
    </section>
  )
}
