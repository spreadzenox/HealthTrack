import { useEffect, useState } from 'react'
import MeetPilou from '../companion/life/MeetPilou'
import OnboardingPilou from '../companion/life/OnboardingPilou'
import { useNavigate } from 'react-router-dom'
import {
  FLOW_VERSION,
  OBJECTIVES,
  chooseObjectives,
  finishOnboarding,
  goalsOf,
  loadOnboarding,
  markScreenSeen,
  saveOnboarding,
  wantsGut,
} from '../settings/onboarding'
import { listEntries } from '../storage/localHealthStorage'
import { getHabits, setHabits } from '../settings/habits'
import { CUSTOM_PREFIX, MAX_HABIT_LABEL, SUGGESTED_HABITS, customHabit } from '../services/habits'
import { FEATURES } from '../config/distribution'
import Premium from './Premium'
import { AHA_DAYS, summarizeImport } from '../services/firstImport'
import {
  autoTiles,
  DATA_LEAVES,
  IMPORT_PATIENCE_MS,
  TEMPS,
  dailyNotes,
  dailySummary,
  foundDevices,
  healthConnector,
  healthStoreName,
  importProgressNow,
  onImportProgress,
  startImport,
  stepsFor,
} from '../services/onboardingFlow'
import { getFaceSenseStatus, isAppOpenMode, isFaceSenseEnabled, startFaceUnlock } from '../services/faceSense'
import { runFaceTrial } from '../services/faceTrial'
import { CHANGELOG } from '../data/changelog'
import { getLastSeenId, markAllSeen } from '../services/whatsNew'
import { APP_NAME } from '../config/brand'
import './Onboarding.css'
import { getApproxPosition } from '../services/approxPosition'
import { disableWeather, enableWeather, getWeatherSettings, syncWeather } from '../services/weatherSync'
import {
  disablePhoneUsage,
  enablePhoneUsage,
  getPhoneUsageSettings,
  isPhoneUsageAvailable,
  openPhoneUsageAccessSettings,
} from '../services/phoneUsageSync'
import { detectPhoneApps } from '../devices/phoneApps'
import { GOLD_AI_DAILY } from '../config/premiumBenefits'
import { useEntitlement } from '../hooks/useEntitlement'
import { STATUS_LABEL, measureStatuses } from '../devices/deviceCapabilities'
import { lastLaunchDay } from '../services/entitlement'
import { monoDigits } from '../utils/monoDigits'

const withTimeout = (promise, ms, fallback) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))])

/* ───────────────────────── Ouverture (une carte, étape 5b) ───────────────────────── */

function TutoIllustration() {
  const pills = [
    { label: 'Repas', cls: 'onb-pill--meal' },
    { label: 'Sommeil', cls: 'onb-pill--sleep' },
    { label: 'Appareils', cls: 'onb-pill--activity' },
    { label: 'Ressenti', cls: 'onb-pill--wellbeing' },
  ]
  return (
    <div className="onb-tuto-ill" aria-hidden="true">
      <div className="onb-tuto-pills">
        {pills.map((p) => (
          <span key={p.label} className={`onb-pill ${p.cls}`}>
            {p.label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 220 70" className="onb-tuto-curve">
        <path className="onb-ill-line" d="M6 58 C40 58 52 30 88 34 C124 38 140 12 214 10" />
        <circle className="onb-ill-dot" cx="88" cy="34" r="6" />
      </svg>
    </div>
  )
}

/** Carte d'ouverture : ce qu'est Halcya et les seuls cas où des données quittent le téléphone. */
function IntroStep() {
  return (
    <>
      <TutoIllustration />
      <h1 className="onb-title">Bienvenue dans {APP_NAME}</h1>
      <p className="onb-lead">Vos repas, votre sommeil, vos appareils et votre ressenti, au même endroit.</p>
      <h2 className="onb-question">Vos données restent sur votre téléphone</h2>
      <p className="onb-lead">Elles n’en sortent que dans ces cas :</p>
      <h3 className="onb-leaves-group">Quand vous le demandez</h3>
      <ul className="onb-leaves">
        {DATA_LEAVES.onDemand.map((l) => (
          <li key={l.title}>
            <span className="onb-leaves-title">{l.title}</span>
            <span className="onb-leaves-detail">{l.detail}</span>
          </li>
        ))}
      </ul>
      <h3 className="onb-leaves-group">Si vous l’activez</h3>
      <ul className="onb-leaves">
        {DATA_LEAVES.ifEnabled.map((l) => (
          <li key={l.title}>
            <span className="onb-leaves-title">{l.title}</span>
            <span className="onb-leaves-detail">{l.detail}</span>
          </li>
        ))}
      </ul>
      <p className="onb-fine">
        La lecture du visage se fait sur le téléphone : aucune image n’en sort. Pour l’abonnement, seul un numéro
        anonyme est vérifié. {APP_NAME} ne pose pas de diagnostic. En continuant, vous confirmez avoir 18 ans ou plus.
      </p>
    </>
  )
}

/* ───────────────────────── Temps 1 : objectifs ───────────────────────── */

function GoalStep({ gut, onGut }) {
  return (
    <>
      <h1 className="onb-title">Qu’est-ce qui vous amène ?</h1>
      <p className="onb-lead">Choisissez ce que vous voulez améliorer.</p>
      <fieldset className="onb-choices">
        <legend className="onb-sr">Vos objectifs</legend>
        {OBJECTIVES.map((g) => {
          const checked = g.locked || gut
          return (
            <label key={g.id} className={`onb-choice${checked ? ' is-selected' : ''}${g.locked ? ' is-locked' : ''}`}>
              <span className="onb-choice-text">
                <span className="onb-choice-label">{g.label}</span>
                <span className="onb-choice-hint">{g.hint}</span>
                {g.locked && <span className="onb-choice-badge">Toujours suivi</span>}
                {!g.locked && checked && <span className="onb-choice-badge">Ajouté</span>}
              </span>
              <input type="checkbox" name="goals" checked={checked} disabled={g.locked} onChange={g.locked ? undefined : () => onGut(!gut)} />
            </label>
          )
        })}
      </fieldset>
      <p className="onb-fine">Inclus : le bien-être + 1 objectif.</p>
      <p className="onb-fine">Vous pourrez le changer dans Réglages › Paramètres (roue en haut à droite).</p>
    </>
  )
}

/* ───────────────────────── Temps 2 : montre et sources ───────────────────────── */

function Switch({ checked, onChange, label, disabled = false }) {
  return (
    <label className="onb-switch">
      <span className="onb-sr">{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={onChange} disabled={disabled} aria-label={label} />
      <span className="onb-switch-track" aria-hidden="true" />
    </label>
  )
}

function HealthCard({ health, onHealth }) {
  const [busy, setBusy] = useState(false)
  const connector = healthConnector()
  const name = healthStoreName()

  useEffect(() => {
    if (health === 'granted') return undefined
    if (!connector) {
      if (health !== 'unavailable') onHealth('unavailable')
      return undefined
    }
    let alive = true
    withTimeout(connector.availabilityDetails(), 12000, { available: false })
      .then((d) => {
        if (!alive) return null
        if (!d.available) {
          onHealth('unavailable')
          return null
        }
        if (health === 'unavailable') onHealth(null)
        return withTimeout(connector.checkPermissions(), 12000, 'not_asked')
      })
      .then((p) => {
        if (alive && p === 'granted') onHealth('granted')
      })
      .catch(() => alive && onHealth('unavailable'))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Accès donné : l'import des 30 derniers jours part tout de suite, en arrière-plan.
  useEffect(() => {
    if (health === 'granted' && connector) startImport().catch(() => {})
  }, [health, connector])

  if (health === 'unavailable') {
    return (
      <p className="onb-quiet" role="status">
        {name} n’est pas sur ce téléphone. Vous pourrez le relier plus tard dans Réglages › Sources.
      </p>
    )
  }

  const connect = async () => {
    setBusy(true)
    try {
      const result = await withTimeout(connector.requestPermissions(), 60000, 'denied')
      onHealth(result === 'granted' ? 'granted' : 'declined')
    } catch {
      onHealth('declined')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="onb-card onb-card-main" aria-labelledby="onb-hc-title">
      <h2 id="onb-hc-title" className="onb-card-title">
        {name}
      </h2>
      <p className="onb-card-sub">{name === 'Santé' ? 'votre iPhone et votre montre' : 'votre téléphone, vos montres, bagues et balances'}</p>
      <p className="onb-card-text">
        {APP_NAME} lit vos pas, votre sommeil, ce que vos appareils mesurent et vos 30 derniers jours. Elle n’écrit rien et
        n’envoie rien. Vous choisissez type par type.
      </p>
      {health === 'granted' ? (
        <p className="onb-note onb-note-ok" role="status">
          Connecté.
        </p>
      ) : (
        <>
          {health === 'declined' && (
            <p className="onb-note" role="status">
              Sans cet accès, {APP_NAME} vivra de vos notes et de votre visage. Vous pourrez le donner plus tard dans
              Sources.
            </p>
          )}
          <button type="button" className="btn btn-primary onb-action" onClick={connect} disabled={busy || !connector}>
            {busy ? `${name} est ouvert…` : health === 'declined' ? 'Réessayer' : `Connecter ${name}`}
          </button>
        </>
      )}
    </section>
  )
}

/** Montre Huawei : seulement si Huawei Santé ou Honor Santé est installée (ACC-4 b). */
function HuaweiCard({ huawei, onHuawei }) {
  return (
    <section className="onb-card" aria-labelledby="onb-huawei-title">
      <h2 id="onb-huawei-title" className="onb-card-title">
        Montre Huawei trouvée
      </h2>
      <p className="onb-card-sub">Huawei Santé est installée sur ce téléphone</p>
      <p className="onb-card-text">
        Huawei ne partage pas avec Health Connect : {APP_NAME} peut lire votre montre directement, en Bluetooth, sans la
        retirer de Huawei Santé.
      </p>
      {huawei === 'pair' ? (
        <p className="onb-note onb-note-ok" role="status">
          À la fin de l’accueil, Sources s’ouvrira sur l’appairage.
        </p>
      ) : (
        <button type="button" className="btn btn-secondary onb-action" onClick={() => onHuawei('pair')}>
          Relier ma montre
        </button>
      )}
    </section>
  )
}

function WeatherRow({ weather, onWeather }) {
  const [busy, setBusy] = useState(false)
  const on = weather === 'on' || (weather == null && getWeatherSettings().enabled)

  const toggle = async () => {
    if (on) {
      disableWeather()
      onWeather('off')
      return
    }
    setBusy(true)
    try {
      const pos = await getApproxPosition()
      enableWeather({ ...pos, name: null })
      onWeather('on')
      syncWeather({ force: true }).catch(() => {})
    } catch {
      onWeather('unavailable')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="onb-row">
      <div className="onb-row-text">
        <span className="onb-row-title">Météo</span>
        <span className="onb-row-detail">
          votre ville, à quelques kilomètres près : le téléphone demande votre position approximative
        </span>
        {weather === 'unavailable' && <span className="onb-row-detail">Position indisponible. Choisissez une ville dans Réglages › Sources.</span>}
      </div>
      <Switch checked={on} onChange={toggle} disabled={busy} label="Météo" />
    </div>
  )
}

function ScreenTimeRow({ screen, onScreen }) {
  const on = screen === 'on' || (screen == null && getPhoneUsageSettings().enabled)
  const toggle = async () => {
    if (on) {
      disablePhoneUsage()
      onScreen('off')
      return
    }
    enablePhoneUsage()
    onScreen('on')
    openPhoneUsageAccessSettings().catch(() => {})
  }
  return (
    <div className="onb-row">
      <div className="onb-row-text">
        <span className="onb-row-title">Temps d’écran</span>
        <span className="onb-row-detail">
          le temps passé sur le téléphone, le soir surtout, sans rien lire de ce que vous y faites. Android ouvre un
          réglage : activez-y {APP_NAME}.
        </span>
      </div>
      <Switch checked={on} onChange={toggle} label="Temps d’écran" />
    </div>
  )
}

const WATCH_CHOICES = [
  { id: 'yes', label: 'Oui' },
  { id: 'no', label: 'Non, pas pour l’instant' },
]

/** « Oui » ouvre les cartes des sources ; « Non » ne demande aucune permission et ne lance aucun import. */
function WatchStep({ state, update, installed }) {
  const huaweiFound = (installed || []).some((a) => a.directWatch)
  const watch = state.watch === 'yes' || state.watch === 'no' ? state.watch : null
  const name = healthStoreName()
  return (
    <>
      <h1 className="onb-title">Avez-vous une montre, un bracelet ou une balance ?</h1>
      <p className="onb-lead">On les branche une seule fois.</p>
      <div className="onb-face-modes" role="radiogroup" aria-label="Avez-vous une montre, un bracelet ou une balance ?">
        {WATCH_CHOICES.map((c) => (
          <label key={c.id} className={`onb-face-mode${watch === c.id ? ' is-selected' : ''}`}>
            <input type="radio" name="watch" checked={watch === c.id} onChange={() => update({ watch: c.id })} />
            <span className="onb-face-mode-title">{c.label}</span>
          </label>
        ))}
      </div>
      {watch === 'yes' && (
        <>
          <HealthCard health={state.health} onHealth={(health) => update({ health })} />
          {huaweiFound && <HuaweiCard huawei={state.huawei} onHuawei={(huawei) => update({ huawei })} />}
          {/* POLISH-SIM-115 : le poids d'une balance arrive par la même source et se voit dans Tendances */}
          <p className="onb-quiet">Une balance connectée ? Votre poids arrive aussi par {name}, à voir dans Tendances.</p>
          <p className="onb-fine">Une seule fois. Ensuite, vos sources se gèrent dans Réglages › Sources.</p>
        </>
      )}
      {watch === 'no' && (
        <p className="onb-quiet" role="status">
          Si votre téléphone compte vos pas, vous pourrez relier {name} dans Réglages › Sources.
        </p>
      )}
      <h2 className="onb-leaves-group">Sur ce téléphone</h2>
      <div className="onb-rows">
        <WeatherRow weather={state.weather} onWeather={(weather) => update({ weather })} />
        {isPhoneUsageAvailable() && <ScreenTimeRow screen={state.screen} onScreen={(screen) => update({ screen })} />}
      </div>
    </>
  )
}

/* ───────────────────────── Temps 3 : ce que Halcya suit seule ───────────────────────── */

const weatherOn = (weather) => weather === 'on' || (weather == null && getWeatherSettings().enabled)
const screenOn = (screen) => screen === 'on' || (screen == null && getPhoneUsageSettings().enabled)

function AutoStep({ watch, weather, screen, children }) {
  const phoneUsage = isPhoneUsageAvailable()
  const { tiles, maybe, off, later } = autoTiles({
    watch,
    on: { weather: weatherOn(weather), screen: phoneUsage && screenOn(screen) },
    available: { screen: phoneUsage },
  })
  return (
    <>
      <h1 className="onb-title">Ce que {APP_NAME} suit pour vous, sans rien faire</h1>
      <p className="onb-lead">Pour information : rien à valider.</p>
      {tiles.length > 0 && (
        <ul className="onb-auto" aria-label="Suivi sans rien faire">
          {tiles.map((t) => (
            <li key={t.id} data-tone={t.tone}>
              {t.label}
            </li>
          ))}
        </ul>
      )}
      {maybe.length > 0 && <p className="onb-quiet">Selon votre montre : {maybe.join(', ')}.</p>}
      {tiles.length > 0 && (
        <p className="onb-fine">
          {watch
            ? 'Rien à cocher : tout se fait en arrière-plan, grâce à votre montre et à votre téléphone.'
            : 'Rien à cocher : tout se fait en arrière-plan.'}
        </p>
      )}
      {off.length > 0 && <p className="onb-quiet">Activables dans Réglages › Sources : {off.join(', ')}.</p>}
      {later.length > 0 && <p className="onb-quiet">Avec une montre ou un bracelet : {later.join(', ')}.</p>}
      {children}
    </>
  )
}

/* ───────────────────────── Ce qui a été trouvé (sous le temps 3, accès donné) ───────────────────────── */

const pct = (p) => (p && p.total ? Math.round((p.done / p.total) * 100) : 0)

function FoundStep({ health, imported, onImported, installed, huawei }) {
  const [progress, setProgress] = useState(importProgressNow)
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState(false)
  const granted = health === 'granted'

  useEffect(() => {
    if (!granted) return undefined
    let alive = true
    const off = onImportProgress(setProgress)
    const work = imported ? Promise.resolve() : startImport().then((r) => {
      onImported()
      if (r.synced === 0 && r.errors?.length && alive) setError(true)
    })
    const load = async () => {
      const since = new Date(Date.now() - AHA_DAYS * 24 * 3600 * 1000).toISOString()
      const list = await listEntries({ source: 'health_connect', since, limit: 100000 })
      if (alive) setEntries(list)
    }
    withTimeout(work, IMPORT_PATIENCE_MS, null)
      .then(load)
      .catch(() => alive && setError(true))
    // L'import peut finir après la patience : on relit alors
    work.then(load).catch(() => {})
    return () => {
      alive = false
      off()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granted])

  if (!granted) return null

  const facts = entries ? summarizeImport(entries) : null
  const devices = entries ? foundDevices(entries, installed) : []
  // Apps installées dont on connaît les limites ; la montre Huawei seulement si elle est reliée ou à relier
  const appIds = (installed || []).filter((app) => !app.directWatch || huawei === 'pair').map((app) => app.id)
  const measures = entries ? measureStatuses({ entries, appIds }) : null
  const sharedSource = facts?.length && facts.every((f) => f.source === facts[0].source) ? facts[0].source : null

  return (
    <>
      <h2 className="onb-question">Ce que {APP_NAME} a trouvé</h2>
      {!entries && !error && (
        <>
          <div
            className="onb-import-bar"
            role="progressbar"
            aria-label="Import de vos 30 derniers jours"
            aria-valuemin={0}
            aria-valuemax={progress?.total || 1}
            aria-valuenow={progress?.done || 0}
          >
            <span style={{ width: `${pct(progress)}%` }} />
          </div>
          <p className="onb-import-line">
            {monoDigits(`Import de vos 30 derniers jours${progress ? ` · ${progress.done}/${progress.total}` : '…'}`)}
          </p>
        </>
      )}
      {devices.length > 0 && (
        <ul className="onb-devices" aria-label="Appareils trouvés">
          {devices.map((d) => (
            <li key={d.id} className={`onb-device${d.sending ? '' : ' is-silent'}`}>
              <span className="onb-device-name">{d.name}</span>
              <span className="onb-device-detail">
                {d.sending ? 'envoie ses données' : `installée mais n’envoie encore rien : ${d.hint}`}
              </span>
            </li>
          ))}
        </ul>
      )}
      {measures?.groups.map((g) => (
        <section key={g.theme} className={`onb-measures onb-measures--${g.theme}`} aria-label={g.label}>
          <h2 className="onb-leaves-group">{g.label}</h2>
          <ul className="onb-measure-list">
            {g.items.map((m) => (
              <li key={m.id} className={`onb-measure is-${m.status}`}>
                <span className="onb-measure-name">{m.label}</span>
                <span className="onb-measure-status">{STATUS_LABEL[m.status]}</span>
                {m.reason && <span className="onb-measure-reason">{m.reason}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {measures?.groups.length > 0 && measures.notMeasured.length > 0 && (
        <p className="onb-fine">Pas mesuré par vos appareils : {measures.notMeasured.map((l) => (l.startsWith('FC') ? l : l.toLowerCase())).join(', ')}.</p>
      )}
      {facts?.length > 0 && (
        <>
          <h2 className="onb-leaves-group">Vos 30 derniers jours</h2>
          <ul className="onb-facts">
            {facts.map((f) => (
              <li key={f.key} className={`onb-fact onb-fact--${f.key}`}>
                <span className="onb-fact-value">{monoDigits(f.value)}</span>
                <span className="onb-fact-label">{f.label}</span>
                {!sharedSource && <span className="onb-fact-source">{f.source}</span>}
              </li>
            ))}
          </ul>
          {sharedSource && <p className="onb-facts-source">D’après {sharedSource}</p>}
          <p className="onb-fine">Vos 30 derniers jours sont importés. {APP_NAME} les comparera à votre digestion et à votre bien-être.</p>
        </>
      )}
      {entries && !facts?.length && (
        <p className="onb-note" role="status">
          Rien à importer pour l’instant. Les données arriveront au fil des jours.
        </p>
      )}
      {error && (
        <p className="onb-note" role="status">
          L’import n’a pas abouti. {APP_NAME} réessaiera seule, ou relancez-le depuis Réglages › Sources.
        </p>
      )}
    </>
  )
}

/* ───────────────────────── Visage (ACC-6) ───────────────────────── */

const FACE_LINES = [
  { title: 'Ce qui est lu', text: 'l’expression du visage, par la caméra avant' },
  { title: 'Ce qui est gardé', text: 'l’image est effacée aussitôt, seul le score de la lecture reste' },
  { title: 'Où', text: 'sur ce téléphone, et dans sa sauvegarde si elle est activée' },
  { title: 'Ce que c’est', text: 'une estimation de votre bien-être par un modèle, pas un avis médical' },
  { title: 'Comment l’arrêter', text: 'à tout moment, dans Réglages › Paramètres' },
]

function FaceStep({ face, onFace, onLater }) {
  const [busy, setBusy] = useState(false)
  const appOpen = FEATURES.faceAppOpen
  // Variante play : la lecture au déverrouillage existe seulement si le natif la propose (faceUnlockPlay).
  const [unlockKnown, setUnlockKnown] = useState(appOpen ? null : true)
  const [mode, setMode] = useState(null)
  useEffect(() => {
    if (!appOpen) return undefined
    let alive = true
    getFaceSenseStatus().then((s) => {
      if (alive) setUnlockKnown(isAppOpenMode(s) && s.unlockAvailable === true)
    })
    return () => {
      alive = false
    }
  }, [appOpen])
  const modes = []
  if (unlockKnown) modes.push('unlock')
  if (appOpen) modes.push('open')
  const chosen = mode ?? modes[0] ?? null
  const already = face == null && isFaceSenseEnabled()

  const activate = async () => {
    setBusy(true)
    try {
      const unlock = chosen === 'unlock' && appOpen
      const r = await runFaceTrial(unlock ? { start: (plugin) => startFaceUnlock(plugin) } : undefined)
      onFace({ read: 'on', no_face: 'on', denied: 'denied', failed: 'failed' }[r.outcome] || 'failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="onb-title">Votre bien-être, sans rien noter</h1>
      <p className="onb-lead">
        Quand vous regardez votre téléphone, {APP_NAME} peut lire votre expression quelques secondes et en tirer une
        estimation de votre bien-être.
      </p>
      {modes.length > 0 && (
        <div className="onb-face-modes" role="radiogroup" aria-label="Quand lire">
          {modes.map((m) => (
            <label key={m} className={`onb-face-mode${chosen === m ? ' is-selected' : ''}${m === 'unlock' ? ' is-strong' : ''}`}>
              <input type="radio" name="face-mode" checked={chosen === m} onChange={() => setMode(m)} />
              <span className="onb-face-mode-title">{m === 'unlock' ? 'À chaque déverrouillage' : `Quand vous ouvrez ${APP_NAME}`}</span>
              <span className="onb-face-mode-detail">
                {m === 'unlock' ? 'une vingtaine de lectures par jour' : 'quelques lectures par jour'}
              </span>
            </label>
          ))}
        </div>
      )}
      <dl className="onb-face-lines">
        {FACE_LINES.map((l) => (
          <div key={l.title}>
            <dt>{l.title}</dt>
            <dd>{l.text}</dd>
          </div>
        ))}
      </dl>
      {busy && (
        <p className="onb-note" role="status">
          Regardez l’écran quelques secondes…
        </p>
      )}
      {(face === 'on' || already) && (
        <p className="onb-note onb-note-ok" role="status">
          C’est activé.
        </p>
      )}
      {face === 'denied' && (
        <p className="onb-note" role="status">
          Accès à la caméra refusé : rien n’est activé. Vous pourrez revenir dessus depuis Réglages › Sources.
        </p>
      )}
      {face === 'failed' && (
        <p className="onb-note" role="status">
          La lecture n’a pas démarré. Vous pourrez réessayer depuis Réglages › Sources.
        </p>
      )}
      {face !== 'on' && !already && (modes.length > 0 || !appOpen) && (
        <div className="onb-face-actions">
          <button type="button" className="btn btn-primary onb-action" onClick={activate} disabled={busy}>
            {busy ? 'Lecture en cours…' : 'Activer'}
          </button>
          {!busy && (
            <button type="button" className="btn btn-secondary onb-action" onClick={onLater}>
              Plus tard
            </button>
          )}
          {chosen === 'unlock' && (
            <p className="onb-fine">
              Android vous demandera ensuite les notifications : pendant la lecture, {APP_NAME} affiche la sienne.
            </p>
          )}
        </div>
      )}
    </>
  )
}

/* ───────────────────────── Temps 4 : ce que vous noterez ───────────────────────── */

/** Habitudes de départ : celles déjà choisies, sinon la méditation, proposée cochée (SPEC « comprendre » § 4). */
const startingHabits = (chosen) => (chosen ? getHabits() : SUGGESTED_HABITS.slice(0, 1))

function NotesStep({ gut, habits, onHabits }) {
  const [name, setName] = useState('')
  const ids = habits.map((h) => h.id)
  const custom = habits.find((h) => h.id.startsWith(CUSTOM_PREFIX))
  const notes = dailyNotes(gut)
  const toggle = (h) => onHabits(ids.includes(h.id) ? habits.filter((x) => x.id !== h.id) : [...habits, h])
  const add = () => {
    const h = customHabit(name)
    if (!h) return
    onHabits([...habits.filter((x) => !x.id.startsWith(CUSTOM_PREFIX)), h])
    setName('')
  }
  return (
    <>
      <h1 className="onb-title">Ce que vous noterez chaque jour</h1>
      <p className="onb-lead">Décochez les habitudes qui ne vous parlent pas.</p>
      <ul className="onb-notes" aria-label="Chaque jour">
        {notes.map((n) => (
          <li key={n.id} data-tone={n.tone}>
            <span className="onb-notes-label">{n.label}</span>
            <span className="onb-notes-detail">{n.detail}</span>
          </li>
        ))}
      </ul>
      <fieldset className="onb-choices onb-habits" data-tone="honey">
        <legend className="onb-leaves-group">Vos habitudes, par oui ou non</legend>
        {[...SUGGESTED_HABITS, ...(custom ? [custom] : [])].map((h) => (
          <label key={h.id} className={`onb-choice${ids.includes(h.id) ? ' is-selected' : ''}`}>
            <span className="onb-choice-text">
              <span className="onb-choice-label">{h.label}</span>
            </span>
            <input type="checkbox" name="habits" checked={ids.includes(h.id)} onChange={() => toggle(h)} />
          </label>
        ))}
      </fieldset>
      {!custom && (
        <div className="onb-habit-add">
          <input
            type="text"
            className="onb-habit-input"
            value={name}
            maxLength={MAX_HABIT_LABEL}
            placeholder="Ajouter une habitude…"
            aria-label="Ajouter une habitude"
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
          <button type="button" className="btn btn-secondary" onClick={add} disabled={!customHabit(name)}>
            Ajouter
          </button>
        </div>
      )}
      <p className="onb-summary" role="status">
        {monoDigits(dailySummary(notes.length + habits.length))}
      </p>
      <p className="onb-motto">Partez de ce que vous faites déjà : ce n’est pas une liste de bonnes résolutions.</p>
    </>
  )
}

/* ───────────────────────── Gold (ACC-9) ───────────────────────── */

function LaunchStep({ until }) {
  return (
    <>
      <span className="paywall-tag">gold</span>
      <h1 className="onb-title">Gold est offert pendant le test</h1>
      <p className="onb-lead">
        Gold est la formule payante de Halcya, avec toutes les analyses. Comme l’app est encore en test, vous l’avez sans
        rien payer{until ? `, jusqu’au ${lastLaunchDay(until)} inclus` : ''}. Aucune carte bancaire n’est demandée.
      </p>
      <div className="onb-card onb-gold">
        <span className="onb-card-title">Gold</span>
        <span className="onb-card-text">{GOLD_AI_DAILY} analyses par jour, rapport pour votre médecin</span>
        <span className="onb-gold-tag">offert</span>
      </div>
    </>
  )
}

/* ───────────────────────── Parcours ───────────────────────── */

/**
 * Accueil du premier lancement, en 4 temps (refonte « Compagnon », étape 5b) : plein écran, sans barre d'onglets,
 * reprend à l'écran où la personne s'était arrêtée. « Continuer » n'est jamais bloqué par une autorisation ni par un
 * choix. Étape 12 (lot VIE) : la rencontre de Pilou et son nom après l'ouverture, Pilou en tête de chaque temps.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const [STEPS] = useState(stepsFor)
  const [state, setState] = useState(() => {
    const s = loadOnboarding()
    // Accueil d'une version précédente, commencé : on repart du début, les réponses restent.
    if (s.flow !== FLOW_VERSION) return saveOnboarding({ flow: FLOW_VERSION, step: 0 })
    const at = STEPS.indexOf(s.lastScreen)
    const step = at >= 0 ? at : Math.min(s.step || 0, STEPS.length - 1)
    return step === s.step ? s : saveOnboarding({ step })
  })
  const [installed, setInstalled] = useState(null)
  const [habits, setHabitList] = useState(() => startingHabits(state.habitsChosen))
  const [ent] = useEntitlement()
  const step = STEPS[state.step]
  const gut = wantsGut(goalsOf(state))
  const temps = TEMPS.indexOf(step)

  const update = (patch) => setState(saveOnboarding(patch))

  // VC-5 : une installation neuve n'a rien « de nouveau » à lire ; le bandeau Nouveautés attend la prochaine version.
  useEffect(() => {
    if (getLastSeenId() === null) markAllSeen(CHANGELOG)
  }, [])

  // I156 : les écrans vus restent sur le téléphone, pour le diagnostic que les testeurs peuvent joindre.
  useEffect(() => {
    if (step) markScreenSeen(step, STEPS.length)
  }, [step, STEPS.length])

  // Apps santé installées (montre Huawei, apps qui n'envoient encore rien) : une fois, sans jamais bloquer.
  useEffect(() => {
    let alive = true
    withTimeout(detectPhoneApps().catch(() => null), 8000, null).then((apps) => alive && setInstalled(apps))
    return () => {
      alive = false
    }
  }, [])

  const end = () => {
    const s = finishOnboarding('completed')
    // La montre Huawei s'appaire depuis Sources (long, pas au milieu de l'accueil) ; sinon la visite guidée (ACC-8)
    // s'ouvre sur l'Accueil. Elle reste relançable par « Voir un exemple ».
    if (s.huawei !== 'pair') saveOnboarding({ tour: 'pending' })
    navigate(s.huawei === 'pair' ? '/connectors' : '/', { replace: true })
  }

  // Les habitudes sont un réglage ordinaire (settings/habits.js) : enregistrées au premier changement, ou à la
  // sortie du temps 4 si la personne garde la proposition.
  const chooseHabits = (list) => {
    setHabitList(setHabits(list))
    update({ habitsChosen: true })
  }

  const go = (i) => update({ step: i })
  const next = () => {
    if (step === 'goal') update(chooseObjectives(state, gut))
    if (step === 'notes') chooseHabits(habits)
    if (state.step >= STEPS.length - 1) end()
    else go(state.step + 1)
  }
  const back = () => go(state.step - 1)
  const atStart = state.step === 0

  const launch = ent.premium && ent.source === 'launch'

  let footerLabel = 'Continuer'
  if (step === 'intro') footerLabel = 'Commencer'
  if (step === 'notes') footerLabel = 'C’est parti !'
  const faceUndecided = step === 'face' && state.face == null && !isFaceSenseEnabled()
  const showFooter = !(step === 'premium' && !launch) && !faceUndecided && step !== 'meet'

  return (
    <div className="onboarding">
      <div className="onb-top">
        {atStart ? (
          <span className="onb-back-spacer" />
        ) : (
          <button type="button" className="onb-back" onClick={back} aria-label="Retour">
            ‹
          </button>
        )}
        {temps >= 0 && (
          <>
            <div
              className="onb-progress onb-progress--segments"
              role="progressbar"
              aria-label="Avancement"
              aria-valuemin={1}
              aria-valuemax={TEMPS.length}
              aria-valuenow={temps + 1}
            >
              {TEMPS.map((t, i) => (
                <span key={t} className={i <= temps ? 'is-done' : undefined} />
              ))}
            </div>
            <span className="onb-count">
              {temps + 1} sur {TEMPS.length}
            </span>
          </>
        )}
      </div>

      <main className="onb-body">
        {step === 'intro' && <IntroStep />}
        {step === 'goal' && <GoalStep gut={gut} onGut={(on) => update(chooseObjectives(state, on))} />}
        {step === 'watch' && <WatchStep state={state} update={update} installed={installed} />}
        {/* Lot VIE (étape 12) : la rencontre ; Pilou en tête de chaque temps (order: -1, OnboardingPilou.css) */}
        {step === 'meet' && <MeetPilou mode="onboarding" onDone={() => go(state.step + 1)} />}
        {temps >= 0 && <OnboardingPilou step={step} gut={gut} watch={state.watch} />}
        {step === 'auto' && (
          <AutoStep watch={state.watch === 'yes'} weather={state.weather} screen={state.screen}>
            <FoundStep
              health={state.health}
              imported={!!state.imported}
              onImported={() => update({ imported: true })}
              installed={installed}
              huawei={state.huawei}
            />
          </AutoStep>
        )}
        {step === 'notes' && <NotesStep gut={gut} habits={habits} onHabits={chooseHabits} />}
        {step === 'face' && (
          <FaceStep
            face={state.face}
            onFace={(face) => update({ face })}
            onLater={() => {
              update({ face: 'later', unlockLater: true })
              // Dernier écran (variante sans Gold) : « Plus tard » termine l'accueil
              if (state.step >= STEPS.length - 1) end()
              else go(state.step + 1)
            }}
          />
        )}
        {step === 'premium' && (launch ? <LaunchStep until={ent.launchUntil} /> : <Premium context="onboarding" onClose={end} />)}
      </main>

      {showFooter && (
        <div className="onb-footer">
          <button type="button" className="btn onb-continue" onClick={next}>
            {footerLabel}
          </button>
        </div>
      )}
    </div>
  )
}
