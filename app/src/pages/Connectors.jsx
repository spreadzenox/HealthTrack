import { useState, useEffect, useCallback, useMemo } from 'react'
import { CONNECTORS } from '../connectors/connectorRegistry'
import { getConnectorSettings, setConnectorSettings } from '../settings/connectorSettings'
import { hasWithingsCredentials } from '../settings/withingsSettings'
import { upsertEntries, getLatestEntryAt } from '../storage/localHealthStorage'
import { useDebug } from '../contexts/DebugContext'
import DebugPanel from '../components/DebugPanel'
import MethodNote from '../components/MethodNote'
import WatchGuides from '../components/WatchGuides'
import MyDevices from '../components/MyDevices'
import BleDevices from '../components/BleDevices'
import WatchDiagnostic from '../components/WatchDiagnostic'
import WithingsSetup from '../components/WithingsSetup'
import WeatherCard from '../components/WeatherCard'
import PhoneUsageCard from '../components/PhoneUsageCard'
import FaceSenseCard from '../components/FaceSenseCard'
import { isFaceSenseAvailable, isFaceSenseEnabled } from '../services/faceSense'
import { READ_TYPE_LABELS } from '../connectors/HealthConnectConnector'
import { splitSourcesByStatus, visibleConnectorIds, sourceTone } from '../connectors/connectorsLayout'
import { FEATURES } from '../config/distribution'
import { noteFirstGrant, readsAllFailed, syncSince, historyOptions } from '../connectors/syncWindow'
import { getWeatherSettings } from '../services/weatherSync'
import { getPhoneUsageSettings } from '../services/phoneUsageSync'
import { getWatchAutoSyncState } from '../services/watchAutoSync'
import { detectPhoneApps } from '../devices/phoneApps'
import useDisclosure from '../hooks/useDisclosure'
import './Connectors.css'
import { appLocale } from '../i18n/locale.js'
import { APP_NAME } from '../config/brand'

/**
 * How far back to look when doing the first historical import.
 * Default: 6 months, bounded by the source's read window (30 days for Health Connect).
 */
const DEFAULT_HISTORY_DAYS = 180

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
    return new Intl.DateTimeFormat(appLocale(), {
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

const SYSTEM_UPDATE = (
  <strong>Paramètres → Mise à jour du logiciel → Mises à jour du système Google</strong>
)

/** Message affiché quand Health Connect est indisponible, selon la raison remontée par le natif. */
const UNAVAILABLE_MESSAGES = {
  provider_update_required: {
    title: 'Health Connect nécessite une mise à jour.',
    body: (
      <>
        Sur Android 14 et supérieur (dont Android 16 / One UI 8), Health Connect est un <strong>module système</strong>{' '}
        intégré — il n’est pas dans le Play Store. Pour le mettre à jour, allez dans {SYSTEM_UPDATE} et installez la
        dernière version.
      </>
    ),
    settings: true,
  },
  sdk_unavailable: {
    title: 'Health Connect non disponible sur cet appareil.',
    body: (
      <>
        Sur Android 14 et supérieur (dont Android 16 / One UI 8), Health Connect est un{' '}
        <strong>module système intégré</strong> — assurez-vous que votre appareil est à jour via {SYSTEM_UPDATE}.
      </>
    ),
    settings: true,
  },
  timeout: {
    title: 'Health Connect ne répond pas.',
    body: (
      <>
        Le module natif Health Connect n’a pas répondu dans les délais (10 s). Cela peut indiquer que le module
        système est bloqué ou nécessite une mise à jour. Essayez de mettre à jour via {SYSTEM_UPDATE}, puis relancez
        l’application.
      </>
    ),
    settings: false,
  },
  default: {
    title: 'Health Connect non disponible.',
    body: (
      <>
        Sur Android 14 et supérieur (dont Android 16 / One UI 8), Health Connect est <strong>intégré au système</strong>{' '}
        — assurez-vous que votre appareil est à jour via {SYSTEM_UPDATE}. Sur Android 8–13 uniquement, installez
        &quot;Health Connect&quot; depuis le Play Store. Activez ensuite la synchronisation dans Samsung Health →
        Paramètres → Health Connect.
      </>
    ),
    settings: true,
  },
}

function ConnectorCard({ connector }) {
  const [settings, setSettings] = useState(() => getConnectorSettings(connector.id))
  const [availability, setAvailability] = useState('checking')
  const [availabilityReason, setAvailabilityReason] = useState(null)
  const [availabilityNativeReason, setAvailabilityNativeReason] = useState(null)
  const [permissions, setPermissions] = useState('checking')
  // Types Health Connect demandés mais pas encore autorisés (ex. ajoutés par une mise à jour)
  const [missingTypes, setMissingTypes] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const readWindowDays = connector.readWindowDays ?? null
  const [historyDays, setHistoryDays] = useState(() => Math.min(DEFAULT_HISTORY_DAYS, readWindowDays ?? Infinity))
  const [checkCount, setCheckCount] = useState(0)
  const [settingsActionStatus, setSettingsActionStatus] = useState(null) // 'ok' | 'err' | null
  const [disclosure, askConsent] = useDisclosure()

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
        if (p === 'granted') noteFirstGrant(connector.id)
        if (p !== undefined) setPermissions(p === 'not_asked' ? 'not_asked' : p)
        setMissingTypes(connector.missingReadTypes || [])
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
    if (connector.id === 'health_connect' && !(await askConsent('health_connect'))) return
    setPermissions('checking')
    try {
      const result = await withTimeout(connector.requestPermissions(), 15000, 'denied')
      if (result === 'granted') noteFirstGrant(connector.id)
      setPermissions(result)
      setMissingTypes(connector.missingReadTypes || [])
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

      const currentSettings = getConnectorSettings(connector.id)
      // Incrémentale (dernière synchro − 2 h) ou premier import, borné à ce que la source laisse lire.
      const latestAt = currentSettings.lastSyncAt ? null : await getLatestEntryAt(connector.id)
      const since = syncSince({ now, settings: currentSettings, latestAt, historyDays, readWindowDays })

      const result = await connector.sync({
        since,
        until: now,
        writer: async (entries) => {
          await upsertEntries(entries)
        },
      })

      if (readsAllFailed(result)) {
        // Rien d'importé : lastSyncAt n'avance pas, le prochain essai repartira du même point.
        setConnectorSettings(connector.id, { lastAttemptAt: now.toISOString(), lastSyncResult: result })
        reloadSettings()
        setSyncMsg(`Rien n’a pu être importé. Erreurs : ${result.errors.join('; ')}`)
        return
      }

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

  const isWithings = connector.id === 'withings'
  const withingsNeedsCreds = isWithings && !hasWithingsCredentials()
  const canSync = availability === 'available' && permissions === 'granted' && !withingsNeedsCreds

  return (
    <div className={`connector-card ${settings.enabled ? 'connector-card-enabled' : ''}`}>
      {disclosure}
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
        {connector.importedList?.length > 0 && (
          <MethodNote summary="Ce qui est importé">
            {connector.importedList.join(', ').replace(/^./, (c) => c.toUpperCase())}.
          </MethodNote>
        )}
        {settings.enabled && (
          <div className="connector-badges">
            <span className="connector-badge-label">Plateforme :</span>
            <StatusBadge status={availability} />
            <span className="connector-badge-label">Permissions :</span>
            <StatusBadge status={permissions} />
          </div>
        )}
      </div>

      {settings.enabled && (
        <div className="connector-body">
          {availability === 'unavailable' && (() => {
            const msg = UNAVAILABLE_MESSAGES[availabilityReason] || UNAVAILABLE_MESSAGES.default
            return (
              <div className="connector-alert connector-alert-warning">
                <strong>{msg.title}</strong> {msg.body}
                {msg.settings && availabilityNativeReason && (
                  <p className="connector-native-reason">Détail : {availabilityNativeReason}</p>
                )}
                {settingsActionStatus === 'err' && (
                  <p className="connector-native-reason connector-native-reason-err">
                    Impossible d’ouvrir automatiquement. Sur Android 16 / One UI 8 : <strong>Paramètres → Sécurité et confidentialité → Health Connect</strong>. Sur Android 13 et inférieur : Paramètres → Applis → Health Connect.
                  </p>
                )}
                {settingsActionStatus === 'ok' && (
                  <p className="connector-native-reason connector-native-reason-ok">Paramètres Health Connect ouverts.</p>
                )}
                <div className="connector-alert-actions">
                  {msg.settings && (
                    <button type="button" className="btn btn-secondary connector-btn" onClick={handleOpenSettings}>
                      Ouvrir les paramètres Health Connect
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary connector-btn" onClick={recheckAvailability}>
                    Revérifier la disponibilité
                  </button>
                </div>
              </div>
            )
          })()}

          {isWithings && <WithingsSetup onChange={recheckAvailability} />}

          {availability === 'available' && !withingsNeedsCreds && permissions !== 'granted' && (
            <div className="connector-alert connector-alert-info">
              <p>
                {isWithings
                  ? 'Connectez votre compte Withings pour importer poids, taille et composition corporelle.'
                  : 'Autorisez l’accès à vos données de santé pour démarrer la synchronisation.'}
              </p>
              <button
                type="button"
                className="btn btn-secondary connector-btn"
                onClick={handleRequestPermissions}
              >
                {isWithings ? 'Connecter Withings' : 'Demander les autorisations'}
              </button>
            </div>
          )}

          {canSync && missingTypes.length > 0 && (
            <div className="connector-alert connector-alert-info">
              <p>
                <strong>Nouvelles mesures disponibles</strong> : {missingTypes.map((t) => READ_TYPE_LABELS[t] || t).join(', ')}.
                Autorisez-les pour les recevoir de votre montre, balance ou tensiomètre (rien d’autre ne change).
              </p>
              <button
                type="button"
                className="btn btn-secondary connector-btn"
                onClick={handleRequestPermissions}
              >
                Autoriser ces mesures
              </button>
            </div>
          )}

          {canSync && (
            <div className="connector-sync-section">
              {!settings.lastSyncAt && (
                <div className="connector-history-picker">
                  <label htmlFor={`history-${connector.id}`} className="input-label">
                    Importer l’historique des derniers :
                  </label>
                  <select
                    id={`history-${connector.id}`}
                    className="settings-input connector-select"
                    value={historyDays}
                    onChange={(e) => setHistoryDays(Number(e.target.value))}
                  >
                    {historyOptions(readWindowDays).map((o) => (
                      <option key={o.days} value={o.days}>{o.label}</option>
                    ))}
                  </select>
                  {readWindowDays && (
                    <p className="connector-history-note">
                      Android laisse lire les 30 jours qui précèdent votre première autorisation.
                    </p>
                  )}
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
                  {syncing ? 'Synchronisation…' : settings.lastSyncAt ? 'Mettre à jour' : "Importer l’historique"}
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

/** Une montre Huawei / Honor est probable : l'app compagnon (Huawei Santé, Honor Santé) est installée. */
const hasHuaweiCompanion = (installed) => (installed || []).some((app) => app.directWatch)

export default function Connectors() {
  const { debugMode } = useDebug()
  // Une seule détection des apps du téléphone, partagée avec « Mes appareils » (même promesse, donc un seul appel natif).
  const [detectApps] = useState(() => {
    const detection = detectPhoneApps().catch(() => null)
    return () => detection
  })
  const [watchDetected, setWatchDetected] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancelled = false
    detectApps().then((installed) => {
      if (!cancelled && hasHuaweiCompanion(installed)) setWatchDetected(true)
    })
    return () => {
      cancelled = true
    }
  }, [detectApps])

  // États figés à l'ouverture : une carte qu'on active ne saute pas d'un groupe à l'autre sous le doigt.
  // Seule la détection (asynchrone) de l'app Huawei Santé peut faire apparaître la carte de la montre.
  const [initial] = useState(() => ({
    connectorIds: visibleConnectorIds(CONNECTORS.map((c) => c.id), {
      withingsApi: FEATURES.withingsApi,
      withingsInUse: Boolean(getConnectorSettings('withings')?.enabled) || hasWithingsCredentials(),
    }),
    enabled: new Set(CONNECTORS.filter((c) => getConnectorSettings(c.id)?.enabled).map((c) => c.id)),
    weatherEnabled: Boolean(getWeatherSettings().enabled),
    phoneUsageEnabled: Boolean(getPhoneUsageSettings().enabled),
    watchEverConnected: Boolean(getWatchAutoSyncState()?.everConnected),
    faceSenseEnabled: isFaceSenseEnabled(),
    faceSenseAvailable: isFaceSenseAvailable(),
  }))
  const layout = useMemo(
    () =>
      splitSourcesByStatus({
        ...initial,
        isConnectorEnabled: (id) => initial.enabled.has(id),
        // le mode diagnostic caché montre toujours la carte de la montre (dépannage)
        watchDetected: watchDetected || debugMode,
      }),
    [initial, watchDetected, debugMode],
  )

  // Retour 8 du 24/10 : chaque carte prend le pastel de son thème (menthe corps et bien-être, lilas contexte).
  const renderSource = (id) => {
    const card = renderSourceCard(id)
    const tone = sourceTone(id)
    return card && tone ? (
      <div key={id} className={`source-tint source-tint-${tone}`} data-tone={tone}>
        {card}
      </div>
    ) : card
  }

  const renderSourceCard = (id) => {
    if (id === 'watch') return <WatchDiagnostic key={id} troubleshooting={debugMode} />
    if (id === 'weather') return <WeatherCard key={id} />
    if (id === 'phone') return <PhoneUsageCard key={id} />
    if (id === 'face') return <FaceSenseCard key={id} />
    if (id === 'ble') return <BleDevices key={id} />
    if (id === 'guides') return <WatchGuides key={id} />
    const connector = CONNECTORS.find((c) => c.id === id)
    return connector ? (
      <div key={id} className="connectors-list">
        <ConnectorCard connector={connector} />
      </div>
    ) : null
  }

  const nothingActive = layout.nothingSending
  // une montre détectée (app Huawei Santé installée) mais pas encore appairée reste en vue (POL-8)
  const toConnectInView = nothingActive ? layout.toConnect : layout.toConnect.filter((id) => id === 'watch')
  const toConnectInPanel = layout.toConnect.filter((id) => !toConnectInView.includes(id))

  return (
    <section className="food-page">
      <h2 className="page-title">Vos sources</h2>
      <p className="page-intro">
        Ce qui envoie déjà vos mesures, puis ce qui reste à brancher. Vos mesures sont rangées <strong>sur ce téléphone</strong>, jamais chez {APP_NAME}.
      </p>

      <MyDevices detect={detectApps} />

      {/* POL-PLAY-45 : sans titre, les sources actives (météo, Health Connect…) se lisaient comme des « appareils ». */}
      {layout.active.length > 0 && (
        <div className="connectors-active">
          <h3 className="connectors-toconnect-title">Ce que lit {APP_NAME}</h3>
          {layout.active.map(renderSource)}
        </div>
      )}

      {/* VC-25 : un seul geste pour brancher quelque chose. Au premier lancement, les sources à brancher restent en
          vue ; dès qu'une source envoie, elles rejoignent « Ajouter une source » (l'ancien volet « Brancher une autre
          source » faisait doublon avec ce bouton). */}
      {toConnectInView.length > 0 && (
        <div className="connectors-toconnect">
          <h3 className="connectors-toconnect-title">Sources à brancher</h3>
          {toConnectInView.map(renderSource)}
        </div>
      )}

      <div className="connectors-add">
        <button
          type="button"
          className="btn btn-secondary connectors-add-btn"
          aria-expanded={adding}
          aria-controls="connectors-add-panel"
          onClick={() => setAdding((v) => !v)}
        >
          Ajouter une source
        </button>
        {adding && (
          <div id="connectors-add-panel" className="connectors-add-panel">
            <p className="page-intro">
              {nothingActive
                ? 'Une montre, une bague, une balance ou un capteur qui n’apparaît pas plus haut.'
                : 'Une autre source du téléphone, une montre, une bague, une balance ou un capteur.'}
            </p>
            {toConnectInPanel.map(renderSource)}
            {layout.addable.map(renderSource)}
          </div>
        )}
      </div>

      {debugMode && <DebugPanel filter="HealthConnect" />}
    </section>
  )
}
