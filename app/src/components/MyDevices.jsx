/**
 * « Mes appareils » (page Connecteurs) : apps santé / montres repérées sur le téléphone et apps qui
 * envoient réellement des mesures via Health Connect, avec ce qu'il reste à faire pour chacune
 * (« Voir le guide », « Ouvrir l'app »), et « qui envoie quoi » : mesures reçues par app, mesure
 * habituelle qui s'arrête, mesures courantes d'une montre jamais reçues. Logique dans src/devices/healthApps.js.
 */
import { useEffect, useState } from 'react'
import { listEntries } from '../storage/localHealthStorage'
import { summarizeHealthConnectSources, adviseDevices, missingWatchMetrics } from '../devices/healthApps'
import { detectPhoneApps, openPhoneApp } from '../devices/phoneApps'
import { formatAgo } from '../utils/timeAgo'
import { openGuide } from '../utils/openGuide'
import './MyDevices.css'

const SOURCE_WINDOW_DAYS = 30

const STATUS = {
  ok: { label: 'Reçu', className: 'device-status-ok' },
  bridged: { label: 'Relayé', className: 'device-status-ok' },
  stale: { label: 'En pause', className: 'device-status-warn' },
  action: { label: 'À brancher', className: 'device-status-action' },
}

async function defaultLoadEntries() {
  const since = new Date(Date.now() - SOURCE_WINDOW_DAYS * 24 * 3600 * 1000).toISOString()
  return listEntries({ source: 'health_connect', since, limit: Number.MAX_SAFE_INTEGER })
}

/**
 * @param {{ detect?: () => Promise<object[]|null>, loadEntries?: () => Promise<object[]>, openApp?: (pkg: string) => Promise<void>, now?: Date }} props
 *   `detect` renvoie null quand la détection n'est pas possible (navigateur).
 */
export default function MyDevices({ detect = detectPhoneApps, loadEntries = defaultLoadEntries, openApp = openPhoneApp, now }) {
  const [state, setState] = useState({ loading: true, rows: [], canDetect: false })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [installed, entries] = await Promise.all([
        detect().catch(() => null),
        loadEntries().catch(() => []),
      ])
      if (cancelled) return
      const at = now || new Date()
      const sources = summarizeHealthConnectSources(entries, at)
      const rows = adviseDevices({ installed: installed || [], sources, now: at })
      setState({ loading: false, rows, canDetect: installed !== null })
    })()
    return () => {
      cancelled = true
    }
  }, [detect, loadEntries, now])

  const { loading, rows, canDetect } = state

  return (
    <section className="my-devices" aria-labelledby="my-devices-title">
      <h3 id="my-devices-title" className="my-devices-title">Mes appareils</h3>
      {loading ? (
        <p className="my-devices-intro">Recherche de vos apps santé…</p>
      ) : rows.length === 0 ? (
        <p className="my-devices-intro">
          {canDetect
            ? 'Aucune app de montre ou de santé connue sur ce téléphone. Si vous en utilisez une, choisissez sa marque ci-dessous.'
            : 'Dans l’app Android, HealthTrack repère tout seul vos apps de montre et de santé (Huawei Health, Samsung Health, Garmin…) et vous dit comment les brancher.'}
        </p>
      ) : (
        <>
          <p className="my-devices-intro">
            {canDetect ? 'Repérés sur ce téléphone et dans vos données des 30 derniers jours.' : 'Apps qui ont envoyé des mesures ces 30 derniers jours.'}
          </p>
          <ul className="my-devices-list">
            {rows.map((row) => {
              const st = STATUS[row.status]
              const metrics = row.source?.metrics || []
              const types = metrics.map((m) => m.label)
              // Une mesure qui s'arrête alors que l'app envoie encore le reste (sinon « En pause » suffit).
              const stopped = row.status === 'ok' ? metrics.filter((m) => m.stopped) : []
              const missing = row.status === 'ok' ? missingWatchMetrics(metrics) : []
              const showGuide = row.status === 'action' && !!row.guideId
              const showOpen = canDetect && !!row.package && (row.status === 'action' || row.status === 'stale')
              return (
                <li key={row.id} className="my-device">
                  <div className="my-device-head">
                    <span className="my-device-name">{row.name}</span>
                    <span className={`my-device-status ${st.className}`}>{st.label}</span>
                  </div>
                  <p className="my-device-message">{row.message}</p>
                  {row.source && (
                    <p className="my-device-meta">
                      Dernières mesures {formatAgo(row.source.lastAt, now || new Date())}
                      {types.length > 0 && ` · ${types.join(', ')}`}
                    </p>
                  )}
                  {stopped.map((m) => (
                    <p key={m.key} className="my-device-alert" role="status">
                      {m.label[0].toUpperCase() + m.label.slice(1)} : plus rien depuis {m.gapDays} jours, alors que cette mesure
                      arrivait chaque jour. Ouvrez l’app de la montre pour synchroniser, ou vérifiez que ce partage est
                      toujours activé.
                    </p>
                  ))}
                  {missing.length > 0 && (
                    <p className="my-device-meta">
                      Jamais reçu en 30 jours : {missing.join(', ')}. Si votre montre en est capable, activez ce partage
                      vers Health Connect dans {row.name}.
                    </p>
                  )}
                  {(showGuide || showOpen) && (
                    <div className="my-device-actions">
                      {showGuide && (
                        <button type="button" className="btn btn-secondary connector-btn" onClick={() => openGuide(row.guideId)}>
                          Voir le guide
                        </button>
                      )}
                      {showOpen && (
                        <button type="button" className="btn btn-secondary connector-btn" onClick={() => openApp(row.package).catch(() => {})}>
                          Ouvrir {row.name}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
