/**
 * « Capteurs Bluetooth » (page Connecteurs) : recherche des appareils à proximité, identification
 * automatique par profil Bluetooth standard ou famille de fabricant (src/devices/ble/drivers.js),
 * mesure cardio en direct (FC + VFC) sur tout appareil au profil 0x180D, et réception des mesures des
 * tensiomètres, balances, thermomètres et oxymètres standard.
 */
import { useEffect, useRef, useState } from 'react'
import { isBleAvailable, receiveMeasurements, scanDevices, startHeartRateSession } from '../devices/ble/bleService'
import { describeMeasurement, measurementsToEntries } from '../devices/ble/measurements'
import { summarizeHeartRateSession, sessionToEntries } from '../devices/ble/heartRate'
import { upsertEntries } from '../storage/localHealthStorage'
import { openGuide } from '../utils/openGuide'
import { APP_NAME } from '../config/brand'
import './MyDevices.css'
import './BleDevices.css'

const SESSION_MS = 5 * 60 * 1000
const SCAN_MS = 8000

const HRV_REASONS = {
  short: 'VFC non calculée : il faut au moins 1 minute de battements propres.',
  noisy: 'VFC non calculée : trop de battements parasites (capteur mal ajusté ou peau trop sèche ?).',
  no_rr: 'Ce capteur n’envoie pas l’intervalle entre les battements : fréquence cardiaque seulement.',
}

function formatClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function deviceView(d) {
  const { driver, vendor } = d
  if (driver.mode === 'direct') {
    return {
      status: { label: 'Connexion directe', className: 'device-status-ok' },
      message: `${driver.label} : ${APP_NAME} se connecte directement à elle (${driver.measures}), sans l’app du fabricant.`,
    }
  }
  if (driver.supported) {
    return {
      status: { label: 'Compatible', className: 'device-status-ok' },
      message: `${driver.label}${vendor ? ` ${vendor.name}` : ''} : ${driver.measures}, lus directement.`,
    }
  }
  if (driver.kind === 'standard') {
    return {
      status: { label: 'Bientôt', className: 'device-status-warn' },
      message: `${driver.label} reconnu (${driver.measures}) : la lecture directe arrive dans une prochaine version.`,
    }
  }
  return {
    status: { label: 'Via son app', className: 'device-status-action' },
    message: `Montre ${vendor.name} : elle reste reliée à son app officielle (une montre ne parle qu’à une app à la fois) ; ses données arrivent par Health Connect.`,
  }
}

/** Ouvre (et déplie au besoin) la carte de connexion directe d'une famille de protocole dans Connecteurs. */
function openDirectCard(cardId) {
  const el = document.getElementById(cardId)
  if (!el) return
  const details = el.closest('details')
  if (details) details.open = true
  el.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}

/**
 * @param {{ available?: boolean, scan?: Function, startSession?: Function, save?: Function, sessionMs?: number }} props
 */
export default function BleDevices({
  available = isBleAvailable(),
  scan = scanDevices,
  startSession = startHeartRateSession,
  receive = receiveMeasurements,
  save = upsertEntries,
  sessionMs = SESSION_MS,
}) {
  const [phase, setPhase] = useState('idle') // idle | scanning | done | measuring | receiving | result | received
  const [devices, setDevices] = useState([])
  const [error, setError] = useState(null)
  const [live, setLive] = useState(null) // { device, startedAt, bpm, beats }
  const [result, setResult] = useState(null)
  const [, setTick] = useState(0)
  const samplesRef = useRef([])
  const stopRef = useRef(null)
  const finishingRef = useRef(false)
  const deviceRef = useRef(null)
  const [incoming, setIncoming] = useState(null) // { device, items }
  const cancelRef = useRef(null)
  // Numéro de la réception en cours : une réception annulée (ou remplacée) qui aboutit après coup est ignorée.
  const receiveSeqRef = useRef(0)
  const aliveRef = useRef(true)

  useEffect(() => {
    if (phase !== 'measuring') return undefined
    const tick = setInterval(() => setTick((t) => t + 1), 1000)
    const auto = setTimeout(() => finish(), sessionMs)
    return () => {
      clearInterval(tick)
      clearTimeout(auto)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sessionMs])

  // quitter la page pendant une mesure : on coupe proprement la connexion
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      stopRef.current?.()
      cancelRef.current?.()
    }
  }, [])

  async function runScan() {
    setPhase('scanning')
    setError(null)
    setDevices([])
    try {
      const list = await scan({ durationMs: SCAN_MS, onUpdate: setDevices })
      setDevices(list)
      setPhase('done')
    } catch {
      setError(`Bluetooth indisponible : vérifiez qu’il est activé et que ${APP_NAME} a l’autorisation « Appareils à proximité ».`)
      setPhase('idle')
    }
  }

  async function measure(device) {
    samplesRef.current = []
    finishingRef.current = false
    deviceRef.current = device
    setResult(null)
    setError(null)
    setLive({ device, startedAt: Date.now(), bpm: null, beats: 0 })
    setPhase('measuring')
    try {
      const stop = await startSession(device.deviceId, {
        onSample: (s) => {
          samplesRef.current.push(s)
          setLive((l) => (l ? { ...l, bpm: s.bpm || l.bpm, beats: l.beats + (s.rrMs?.length || 0) } : l))
        },
        onDisconnect: () => finish({ disconnected: true }),
      })
      // Annulé, terminé ou page quittée pendant la connexion : on coupe tout de suite.
      if (finishingRef.current || !aliveRef.current) await stop()
      else stopRef.current = stop
    } catch {
      if (finishingRef.current || !aliveRef.current) return
      finishingRef.current = true
      setError(`Connexion impossible à ${device.name || 'cet appareil'} : est-il allumé et libre (pas connecté à une autre app) ?`)
      setLive(null)
      setPhase('done')
    }
  }

  async function receiveFrom(device) {
    const seq = ++receiveSeqRef.current
    const stale = () => seq !== receiveSeqRef.current || !aliveRef.current
    setError(null)
    setResult(null)
    setIncoming({ device, items: [] })
    setPhase('receiving')
    let session
    try {
      session = await receive(device.deviceId, device.driver.id, {
        onMeasurement: (m) => setIncoming((cur) => (cur ? { ...cur, items: [...cur.items, m] } : cur)),
      })
    } catch {
      if (stale()) return
      setError(`Connexion impossible à ${device.name || 'cet appareil'} : allumez-le (le symbole Bluetooth doit clignoter) et réessayez.`)
      setIncoming(null)
      setPhase('done')
      return
    }
    if (stale()) {
      // Annulé pendant la connexion : on referme cette session.
      await session.cancel()
      return
    }
    cancelRef.current = session.cancel
    const measurements = await session.done
    if (stale()) return
    cancelRef.current = null
    const entries = measurementsToEntries(measurements, { deviceName: device.name || device.driver.label })
    if (entries.length > 0) {
      try {
        await save(entries)
      } catch {
        setError('Mesure reçue mais pas enregistrée (stockage indisponible).')
      }
    }
    setResult({ device, measurements, saved: entries.length })
    setIncoming(null)
    setPhase('received')
  }

  async function cancelReceive() {
    receiveSeqRef.current++
    const cancel = cancelRef.current
    cancelRef.current = null
    setIncoming(null)
    setPhase('done')
    await cancel?.()
  }

  async function finish({ disconnected = false, cancel = false } = {}) {
    if (finishingRef.current) return
    finishingRef.current = true
    const stop = stopRef.current
    stopRef.current = null
    await stop?.()
    const samples = samplesRef.current
    const device = deviceRef.current
    if (cancel) {
      setLive(null)
      setPhase('done')
      return
    }
    const summary = summarizeHeartRateSession(samples)
    if (summary) {
      try {
        await save(sessionToEntries(samples, summary, { deviceName: device?.name }))
      } catch {
        setError('Mesure faite mais pas enregistrée (stockage indisponible).')
      }
    }
    setResult({ summary, disconnected })
    setLive(null)
    setPhase('result')
  }

  const recognized = devices.filter((d) => d.driver.id !== 'unknown')
  const unknownCount = devices.length - recognized.length
  const hasWatch = recognized.some((d) => d.driver.kind === 'vendor' || d.driver.kind === 'family')

  return (
    <section className="my-devices ble-devices" aria-labelledby="ble-devices-title">
      <h3 id="ble-devices-title" className="my-devices-title">Capteurs Bluetooth</h3>
      <p className="my-devices-intro">
        Ceinture cardio, montre qui diffuse sa fréquence cardiaque, tensiomètre, balance… {APP_NAME} reconnaît tout seul les
        appareils au profil Bluetooth standard, quelle que soit la marque.
      </p>

      {!available ? (
        <p className="my-devices-intro">Dans l’app Android, un bouton lance la recherche des appareils autour de vous.</p>
      ) : phase === 'measuring' && live ? (
        <div className="my-device ble-live" aria-live="polite">
          <p className="ble-live-title">Mesure en cours — {live.device.name || 'capteur cardio'}</p>
          <p className="ble-live-bpm">
            <span className="ble-live-value">{live.bpm ?? '—'}</span> <span className="ble-live-unit">bpm</span>
          </p>
          <p className="my-device-meta">
            {formatClock(Date.now() - live.startedAt)} / {formatClock(sessionMs)} · {live.beats} battements reçus
          </p>
          <p className="my-device-message">Restez assis ou allongé, immobile, et respirez normalement. Le matin au réveil, c’est idéal pour suivre votre VFC.</p>
          <div className="my-device-actions">
            <button type="button" className="btn btn-primary connector-btn" onClick={() => finish()}>
              Terminer et enregistrer
            </button>
            <button type="button" className="btn btn-secondary connector-btn" onClick={() => finish({ cancel: true })}>
              Annuler
            </button>
          </div>
        </div>
      ) : phase === 'receiving' && incoming ? (
        <div className="my-device ble-live" aria-live="polite">
          <p className="ble-live-title">En attente de {incoming.device.name || incoming.device.driver.label}…</p>
          <p className="my-device-message">
            {incoming.device.driver.howTo} : la mesure arrive ici dès que l’appareil l’envoie (les mesures gardées en mémoire aussi).
          </p>
          {incoming.items.length > 0 && (
            <ul className="ble-received">
              {incoming.items.slice(-5).map((m, i) => (
                <li key={i}>{describeMeasurement(m)}</li>
              ))}
            </ul>
          )}
          <p className="my-device-meta">La première fois, Android peut demander d’appairer l’appareil (parfois avec un code affiché sur son écran).</p>
          <div className="my-device-actions">
            <button type="button" className="btn btn-secondary connector-btn" onClick={cancelReceive}>
              Annuler
            </button>
          </div>
        </div>
      ) : phase === 'received' && result ? (
        <div className="my-device ble-result">
          {result.saved > 0 ? (
            <>
              <p className="ble-live-title">
                {result.saved === 1 ? '1 mesure enregistrée' : `${result.saved} mesures enregistrées`} — {result.device.name || result.device.driver.label}
              </p>
              <ul className="ble-received">
                {result.measurements.slice(-5).map((m, i) => (
                  <li key={i}>{describeMeasurement(m)}</li>
                ))}
              </ul>
              <p className="my-device-meta">
                Retrouvez-les dans « Vos derniers jours » et vos Pistes. Une mesure isolée compte peu : c’est la tendance qui parle.
                Une estimation, pas un diagnostic — en cas de valeur inhabituelle, parlez-en à un professionnel de santé.
              </p>
            </>
          ) : (
            <p className="my-device-message">
              Aucune mesure reçue. Faites la mesure, puis appuyez sur « Recevoir la mesure » tant que l’appareil affiche le symbole
              Bluetooth. Si l’appareil demande un appairage, acceptez-le dans Android puis réessayez.
            </p>
          )}
          <div className="my-device-actions">
            <button type="button" className="btn btn-secondary connector-btn" onClick={() => setPhase('done')}>
              OK
            </button>
          </div>
        </div>
      ) : phase === 'result' && result ? (
        <div className="my-device ble-result">
          {result.summary ? (
            <>
              <p className="ble-live-title">
                Enregistré : FC moyenne {result.summary.meanBpm} bpm (de {result.summary.minBpm} à {result.summary.maxBpm})
                {result.summary.rmssdMs != null && ` · VFC (RMSSD) ${Math.round(result.summary.rmssdMs)} ms`}
              </p>
              {result.summary.rmssdMs == null && <p className="my-device-message">{HRV_REASONS[result.summary.quality]}</p>}
              {result.disconnected && <p className="my-device-message">Le capteur s’est déconnecté avant la fin.</p>}
              <p className="my-device-meta">
                La VFC varie beaucoup d’un jour à l’autre : comparez-la à votre propre norme (carte « Votre cœur ») plutôt qu’à des
                valeurs de référence. Une estimation, pas un diagnostic.
              </p>
            </>
          ) : (
            <p className="my-device-message">Aucune fréquence cardiaque reçue : le capteur est-il bien porté (peau humidifiée pour une ceinture) ?</p>
          )}
          <div className="my-device-actions">
            <button type="button" className="btn btn-secondary connector-btn" onClick={() => setPhase('done')}>
              OK
            </button>
          </div>
        </div>
      ) : (
        <>
          <button type="button" className="btn btn-primary connector-btn" onClick={runScan} disabled={phase === 'scanning'}>
            {phase === 'scanning' ? 'Recherche en cours…' : phase === 'done' ? 'Relancer la recherche' : 'Rechercher autour de moi'}
          </button>
          {phase === 'done' && devices.length === 0 && (
            <p className="my-devices-intro ble-empty">
              Aucun appareil trouvé. Allumez le capteur (une ceinture cardio s’allume quand on la porte, peau humidifiée) ou activez
              la diffusion de la fréquence cardiaque sur votre montre, puis relancez.
            </p>
          )}
          {recognized.length > 0 && (
            <ul className="my-devices-list ble-list">
              {recognized.map((d) => {
                const v = deviceView(d)
                return (
                  <li key={d.deviceId} className="my-device">
                    <div className="my-device-head">
                      <span className="my-device-name">{d.name || d.driver.label}</span>
                      <span className={`my-device-status ${v.status.className}`}>{v.status.label}</span>
                    </div>
                    <p className="my-device-message">{v.message}</p>
                    {d.bonded && <p className="my-device-meta">Appairée à ce téléphone</p>}
                    {(d.driver.supported || d.direct || (d.driver.kind === 'vendor' && d.vendor?.guideId)) && (
                      <div className="my-device-actions">
                        {d.driver.mode === 'live' && (
                          <button type="button" className="btn btn-primary connector-btn" onClick={() => measure(d)}>
                            Mesurer ma VFC (5 min)
                          </button>
                        )}
                        {d.driver.mode === 'receive' && (
                          <button type="button" className="btn btn-primary connector-btn" onClick={() => receiveFrom(d)}>
                            Recevoir la mesure
                          </button>
                        )}
                        {d.direct && (
                          <button
                            type="button"
                            className={`btn ${d.driver.mode === 'direct' ? 'btn-primary' : 'btn-secondary'} connector-btn`}
                            onClick={() => openDirectCard(d.direct.cardId)}
                          >
                            Se connecter en direct
                          </button>
                        )}
                        {d.driver.kind === 'vendor' && (
                          <button type="button" className="btn btn-secondary connector-btn" onClick={() => openGuide(d.vendor.guideId)}>
                            Voir le guide
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {hasWatch && (
            <p className="my-device-meta ble-tip">
              Astuce : beaucoup de montres peuvent diffuser leur fréquence cardiaque en Bluetooth (réglage « diffusion » ou
              « partage de la fréquence cardiaque », souvent dans les réglages d’entraînement). Elles apparaissent alors ici comme
              capteur cardio compatible.
            </p>
          )}
          {unknownCount > 0 && (
            <p className="my-device-meta ble-unknown">
              {unknownCount === 1 ? '1 autre appareil non reconnu' : `${unknownCount} autres appareils non reconnus`} (téléphones,
              écouteurs…) : leur empreinte (nom, services, sans adresse) reste sur ce téléphone pour ajouter leur prise en charge plus tard.
            </p>
          )}
        </>
      )}
      {error && <p className="my-device-message ble-error" role="alert">{error}</p>}
    </section>
  )
}
