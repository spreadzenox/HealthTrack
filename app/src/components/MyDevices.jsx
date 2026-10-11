/**
 * « Mes appareils » (page Connecteurs) : apps santé / montres repérées sur le téléphone et apps qui
 * envoient réellement des mesures via Health Connect, avec ce qu'il reste à faire pour chacune
 * (« Voir le guide », « Ouvrir l'app »). Logique dans src/devices/healthApps.js.
 */
import { useEffect, useState } from 'react'
import { listEntries } from '../storage/localHealthStorage'
import { detectInstalledApps, summarizeHealthConnectSources, adviseDevices } from '../devices/healthApps'
import { formatAgo } from '../utils/timeAgo'
import './MyDevices.css'

const SOURCE_WINDOW_DAYS = 30

const TYPE_LABELS = {
  heart_rate: 'cœur',
  sleep: 'sommeil',
  steps: 'pas',
  calories: 'dépense',
  activity: 'séances',
  respiratory_rate: 'respiration',
  body_temperature: 'température',
  blood_pressure: 'tension',
  blood_glucose: 'glycémie',
  weight: 'poids',
  body_composition: 'masse grasse',
}

const STATUS = {
  ok: { label: 'Reçu', className: 'device-status-ok' },
  bridged: { label: 'Relayé', className: 'device-status-ok' },
  stale: { label: 'En pause', className: 'device-status-warn' },
  action: { label: 'À brancher', className: 'device-status-action' },
}

function isNative() {
  return typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true
}

async function getAppLauncher() {
  try {
    return (await import('@capacitor/app-launcher')).AppLauncher
  } catch {
    return null
  }
}

async function defaultDetect() {
  // Outil de captures (`npm run visual -- --devices`) : apps « installées » simulées dans le navigateur.
  const fake = typeof window !== 'undefined' ? window.__healthtrackFakeInstalledPackages : null
  if (Array.isArray(fake)) return detectInstalledApps(async (pkg) => fake.includes(pkg))
  if (!isNative()) return null
  const launcher = await getAppLauncher()
  if (!launcher) return null
  return detectInstalledApps(async (pkg) => (await launcher.canOpenUrl({ url: pkg }))?.value === true)
}

async function defaultLoadEntries() {
  const since = new Date(Date.now() - SOURCE_WINDOW_DAYS * 24 * 3600 * 1000).toISOString()
  return listEntries({ source: 'health_connect', since, limit: Number.MAX_SAFE_INTEGER })
}

async function defaultOpenApp(pkg) {
  const launcher = await getAppLauncher()
  await launcher?.openUrl({ url: pkg })
}

function openGuide(guideId) {
  const el = document.getElementById(`guide-${guideId}`)
  if (!el) return
  el.open = true
  el.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}

/**
 * @param {{ detect?: () => Promise<object[]|null>, loadEntries?: () => Promise<object[]>, openApp?: (pkg: string) => Promise<void>, now?: Date }} props
 *   `detect` renvoie null quand la détection n'est pas possible (navigateur).
 */
export default function MyDevices({ detect = defaultDetect, loadEntries = defaultLoadEntries, openApp = defaultOpenApp, now }) {
  const [state, setState] = useState({ loading: true, rows: [], canDetect: false })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [installed, entries] = await Promise.all([
        detect().catch(() => null),
        loadEntries().catch(() => []),
      ])
      if (cancelled) return
      const sources = summarizeHealthConnectSources(entries)
      const rows = adviseDevices({ installed: installed || [], sources, now: now || new Date() })
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
              const types = Object.keys(TYPE_LABELS).filter((t) => row.source?.types.includes(t)).map((t) => TYPE_LABELS[t])
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
