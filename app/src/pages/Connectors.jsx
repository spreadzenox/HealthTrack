import { useState, useEffect, useCallback } from 'react'
import { CONNECTORS } from '../connectors/connectorRegistry'
import { getConnectorSettings, setConnectorSettings } from '../settings/connectorSettings'
import { upsertEntries, getLatestEntryAt } from '../storage/localHealthStorage'
import { useDebug } from '../contexts/DebugContext'
import DebugPanel from '../components/DebugPanel'
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
  const [availabilityNativeReason, setAvailabilityNativeReason] = useState(null)
  const [permissions, setPermissions] = useState('checking')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const [historyDays, setHistoryDays] = useState(DEFAULT_HISTORY_DAYS)
  const [checkCount, setCheckCount] = useState(0)
  const [settingsActionStatus, setSettingsActionStatus] = useState(null) // 'ok' | 'err' | null

  // Reload settings from localStorage when component mounts
  const reloadSettings = useCallback(() => {
    setSettings(getConnectorSettings(connector.id))
  }, [connector.id])

  const recheckAvailability = useCallback(() => {
    setAvailability('checking')
    setAvailabilityReason(null)
    setAvailabilityNativeReason(null)
    setSettingsActionStatus(null)
    setCheckCount((n) => n + 1)
  }, [])

  useEffect(() => {
    const currentSettings = getConnectorSettings(connector.id)
    reloadSettings()
    const detailsFn = connector.availabilityDetails
      ? connector.availabilityDetails.bind(connector)
      : () => connector.isAvailable().then((a) => ({ available: a }))

    // Run availability check first, then permissions check sequentially.
    // On Android, running both concurrently can saturate the Capacitor WebView
    // bridge message queue and cause one (or both) native calls to be dropped.
    // Serialising them ensures the bridge is free before the second call starts.
    withTimeout(detailsFn(), 12000, { available: false, reason: 'unavailable' })
      .then((details) => {
        const avail = details.available ? 'available' : 'unavailable'
        setAvailability(avail)
        setAvailabilityReason(details.reason || null)
        setAvailabilityNativeReason(details.nativeReason || null)
        // Now that availabilityDetails() has fully resolved (and the bridge is
        // idle), kick off the permissions check.
        return withTimeout(connector.checkPermissions(), 12000, 'not_asked')
      })
      .then((p) => {
        // p is undefined if the availability check threw (caught below)
        if (p !== undefined) setPermissions(p === 'not_asked' ? 'not_asked' : p)
      })
      .catch(() => {
        setAvailability('unavailable')
        setAvailabilityReason(null)
        setAvailabilityNativeReason(null)
        setPermissions('not_asked')
      })
  }, [connector, reloadSettings, checkCount])

  const handleToggleEnabled = () => {
    const next = !settings.enabled
    setConnectorSettings(connector.id, { enabled: next })
    reloadSettings()
  }

  const handleOpenSettings = async () => {
    setSettingsActionStatus(null)
    const ok = await connector.openHealthConnectSettings()
    setSettingsActionStatus(ok ? 'ok' : 'err')
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
              <strong>module système</strong> intégré — il n&apos;est pas dans le Play Store.{' '}
              Pour le mettre à jour, allez dans{' '}
              <strong>Paramètres → Mise à jour du logiciel → Mises à jour du système Google</strong>{' '}
              et installez la dernière version.
              {availabilityNativeReason && (
                <p className="connector-native-reason">Détail : {availabilityNativeReason}</p>
              )}
              {settingsActionStatus === 'err' && (
                <p className="connector-native-reason connector-native-reason-err">
                  Impossible d&apos;ouvrir automatiquement. Sur Android 16 / One UI 8 : <strong>Paramètres → Sécurité et confidentialité → Health Connect</strong>. Sur Android 13 et inférieur : Paramètres → Applis → Health Connect.
                </p>
              )}
              {settingsActionStatus === 'ok' && (
                <p className="connector-native-reason connector-native-reason-ok">Paramètres Health Connect ouverts.</p>
              )}
              <div className="connector-alert-actions">
                <button
                  type="button"
                  className="btn btn-secondary connector-btn"
                  onClick={handleOpenSettings}
                >
                  Ouvrir les paramètres Health Connect
                </button>
                <button
                  type="button"
                  className="btn btn-secondary connector-btn"
                  onClick={recheckAvailability}
                >
                  Revérifier la disponibilité
                </button>
              </div>
            </div>
          )}

          {availability === 'unavailable' && availabilityReason === 'sdk_unavailable' && (
            <div className="connector-alert connector-alert-warning">
              <strong>Health Connect non disponible sur cet appareil.</strong>{' '}
              Sur Android 14 et supérieur (dont Android 16 / One UI 8), Health Connect est un{' '}
              <strong>module système intégré</strong> — assurez-vous que votre appareil est à jour via{' '}
              <strong>Paramètres → Mise à jour du logiciel → Mises à jour du système Google</strong>.
              {availabilityNativeReason && (
                <p className="connector-native-reason">Détail : {availabilityNativeReason}</p>
              )}
              {settingsActionStatus === 'err' && (
                <p className="connector-native-reason connector-native-reason-err">
                  Impossible d&apos;ouvrir automatiquement. Sur Android 16 / One UI 8 : <strong>Paramètres → Sécurité et confidentialité → Health Connect</strong>. Sur Android 13 et inférieur : Paramètres → Applis → Health Connect.
                </p>
              )}
              {settingsActionStatus === 'ok' && (
                <p className="connector-native-reason connector-native-reason-ok">Paramètres Health Connect ouverts.</p>
              )}
              <div className="connector-alert-actions">
                <button
                  type="button"
                  className="btn btn-secondary connector-btn"
                  onClick={handleOpenSettings}
                >
                  Ouvrir les paramètres Health Connect
                </button>
                <button
                  type="button"
                  className="btn btn-secondary connector-btn"
                  onClick={recheckAvailability}
                >
                  Revérifier la disponibilité
                </button>
              </div>
            </div>
          )}

          {availability === 'unavailable' && availabilityReason === 'timeout' && (
            <div className="connector-alert connector-alert-warning">
              <strong>Health Connect ne répond pas.</strong>{' '}
              Le module natif Health Connect n&apos;a pas répondu dans les délais (10 s).
              Cela peut indiquer que le module système est bloqué ou nécessite une mise à jour.
              Essayez de mettre à jour via{' '}
              <strong>Paramètres → Mise à jour du logiciel → Mises à jour du système Google</strong>,
              puis relancez l&apos;application.
              <div className="connector-alert-actions">
                <button
                  type="button"
                  className="btn btn-secondary connector-btn"
                  onClick={recheckAvailability}
                >
                  Revérifier la disponibilité
                </button>
              </div>
            </div>
          )}

          {availability === 'unavailable' && availabilityReason !== 'provider_update_required' && availabilityReason !== 'sdk_unavailable' && availabilityReason !== 'timeout' && (
            <div className="connector-alert connector-alert-warning">
              <strong>Health Connect non disponible.</strong>{' '}
              Sur Android 14 et supérieur (dont Android 16 / One UI 8), Health Connect est{' '}
              <strong>intégré au système</strong> — assurez-vous que votre appareil est à jour via{' '}
              <strong>Paramètres → Mise à jour du logiciel → Mises à jour du système Google</strong>.{' '}
              Sur Android 8–13 uniquement, installez &quot;Health Connect&quot; depuis le Play Store.{' '}
              Activez ensuite la synchronisation dans Samsung Health → Paramètres → Health Connect.
              {availabilityNativeReason && (
                <p className="connector-native-reason">Détail : {availabilityNativeReason}</p>
              )}
              {settingsActionStatus === 'err' && (
                <p className="connector-native-reason connector-native-reason-err">
                  Impossible d&apos;ouvrir automatiquement. Sur Android 16 / One UI 8 : <strong>Paramètres → Sécurité et confidentialité → Health Connect</strong>. Sur Android 13 et inférieur : Paramètres → Applis → Health Connect.
                </p>
              )}
              {settingsActionStatus === 'ok' && (
                <p className="connector-native-reason connector-native-reason-ok">Paramètres Health Connect ouverts.</p>
              )}
              <div className="connector-alert-actions">
                <button
                  type="button"
                  className="btn btn-secondary connector-btn"
                  onClick={handleOpenSettings}
                >
                  Ouvrir les paramètres Health Connect
                </button>
                <button
                  type="button"
                  className="btn btn-secondary connector-btn"
                  onClick={recheckAvailability}
                >
                  Revérifier la disponibilité
                </button>
              </div>
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
  const { debugMode } = useDebug()

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

      {debugMode && <DebugPanel filter="HealthConnect" />}
    </section>
  )
}
