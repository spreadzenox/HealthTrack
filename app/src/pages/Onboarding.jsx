import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FLOW_VERSION,
  GOALS,
  defaultTracks,
  finishOnboarding,
  goalsOf,
  loadOnboarding,
  markScreenSeen,
  saveOnboarding,
  wantsGut,
} from '../settings/onboarding'
import { createEntry, listEntries, updateEntry } from '../storage/localHealthStorage'
import { GUT_SOURCE, GUT_TYPE } from '../services/today'
import { FEATURES } from '../config/distribution'
import Premium from './Premium'
import { AHA_DAYS, summarizeImport } from '../services/firstImport'
import {
  BELLY,
  DATA_LEAVES,
  FEELINGS,
  IMPORT_PATIENCE_MS,
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
import { choiceToScore } from '../services/mood/wellbeingScale'
import { detectPhoneApps } from '../devices/phoneApps'
import { GOLD_AI_DAILY } from '../config/premiumBenefits'
import { useEntitlement } from '../hooks/useEntitlement'
import { lastLaunchDay } from '../services/entitlement'

const withTimeout = (promise, ms, fallback) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))])

const pad = (n) => String(n).padStart(2, '0')

/* ───────────────────────── Tuto (ACC-2) ───────────────────────── */

const TUTO_CARDS = 3

function TutoIllustration() {
  const pills = [
    { label: 'Repas', cls: 'onb-pill--meal' },
    { label: 'Sommeil', cls: 'onb-pill--sleep' },
    { label: 'Montre', cls: 'onb-pill--activity' },
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

const TABS_EXPLAINED = [
  { tab: 'Journal', text: 'voir vos journées, vos repas, vos mesures' },
  { tab: 'Analyses', text: `les liens que ${APP_NAME} trouve dans vos données` },
  { tab: 'Agir', text: 'vérifier une piste par un essai de deux semaines' },
]

function TutoStep({ card, onCard }) {
  const touch = useRef(null)
  const onTouchStart = (e) => {
    touch.current = e.touches?.[0]?.clientX ?? null
  }
  const onTouchEnd = (e) => {
    const start = touch.current
    const end = e.changedTouches?.[0]?.clientX
    touch.current = null
    if (start == null || end == null) return
    const dx = end - start
    if (dx < -40 && card < TUTO_CARDS - 1) onCard(card + 1)
    if (dx > 40 && card > 0) onCard(card - 1)
  }
  return (
    <div className="onb-tuto" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {card === 0 && (
        <>
          <TutoIllustration />
          <h1 className="onb-title">Bienvenue dans {APP_NAME}</h1>
          <p className="onb-lead">Vos repas, votre sommeil, votre montre et votre ressenti, au même endroit.</p>
        </>
      )}
      {card === 1 && (
        <>
          <h1 className="onb-title">{APP_NAME} cherche ce qui va avec vos bons et mauvais jours</h1>
          <p className="onb-lead">Trois onglets, trois usages.</p>
          <ul className="onb-tabs-list">
            {TABS_EXPLAINED.map((t) => (
              <li key={t.tab}>
                <span className="onb-tabs-name">{t.tab}</span>
                <span className="onb-tabs-text">{t.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {card === 2 && (
        <>
          <h1 className="onb-title">Vos données restent sur votre téléphone</h1>
          <p className="onb-lead">Elles n’en sortent que dans ces cas :</p>
          <h2 className="onb-leaves-group">Quand vous le demandez</h2>
          <ul className="onb-leaves">
            {DATA_LEAVES.onDemand.map((l) => (
              <li key={l.title}>
                <span className="onb-leaves-title">{l.title}</span>
                <span className="onb-leaves-detail">{l.detail}</span>
              </li>
            ))}
          </ul>
          <h2 className="onb-leaves-group">Si vous l’activez</h2>
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
      )}
      <div className="onb-dots" role="tablist" aria-label="Cartes">
        {Array.from({ length: TUTO_CARDS }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === card}
            aria-label={`Carte ${i + 1} sur ${TUTO_CARDS}`}
            className={`onb-dot${i === card ? ' is-current' : ''}`}
            onClick={() => onCard(i)}
          />
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── Objectifs (ACC-3) ───────────────────────── */

function GoalStep({ goals, onToggle }) {
  return (
    <>
      <h1 className="onb-title">Qu’est-ce qui vous amène ?</h1>
      <p className="onb-lead">Cochez tout ce qui compte pour vous. {APP_NAME} vous le montrera d’abord.</p>
      <fieldset className="onb-choices">
        <legend className="onb-sr">Ce qui vous amène</legend>
        {GOALS.map((g) => {
          const checked = goals.includes(g.id)
          return (
            <label key={g.id} className={`onb-choice${checked ? ' is-selected' : ''}`}>
              <span className="onb-choice-text">
                <span className="onb-choice-label">{g.label}</span>
                <span className="onb-choice-hint">{g.hint}</span>
              </span>
              <input type="checkbox" name="goals" checked={checked} onChange={() => onToggle(g.id)} />
            </label>
          )
        })}
      </fieldset>
      <p className="onb-fine">Vous pourrez le changer dans Paramètres.</p>
    </>
  )
}

/* ───────────────────────── Sources (ACC-4) ───────────────────────── */

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
        {name} n’est pas sur ce téléphone. Vous pourrez le relier plus tard dans Sources.
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
        {weather === 'unavailable' && <span className="onb-row-detail">Position indisponible. Choisissez une ville dans Sources.</span>}
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

function SourcesStep({ state, update, installed }) {
  const huaweiFound = (installed || []).some((a) => a.directWatch)
  return (
    <>
      <h1 className="onb-title">Branchez vos sources</h1>
      <p className="onb-lead">Chaque accès se donne ici, d’un geste, et se retire quand vous voulez.</p>
      <HealthCard health={state.health} onHealth={(health) => update({ health })} />
      {huaweiFound && <HuaweiCard huawei={state.huawei} onHuawei={(huawei) => update({ huawei })} />}
      <div className="onb-rows">
        <WeatherRow weather={state.weather} onWeather={(weather) => update({ weather })} />
        {isPhoneUsageAvailable() && <ScreenTimeRow screen={state.screen} onScreen={(screen) => update({ screen })} />}
      </div>
      <p className="onb-fine">D’autres sources se trouvent dans l’onglet Sources.</p>
    </>
  )
}

/* ───────────────────────── Ce qui a été trouvé (ACC-5) ───────────────────────── */

const pct = (p) => (p && p.total ? Math.round((p.done / p.total) * 100) : 0)

function FoundStep({ health, imported, onImported, installed, onConnect }) {
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

  if (!granted) {
    const name = healthStoreName()
    return (
      <>
        <h1 className="onb-title">Votre téléphone suffit pour commencer</h1>
        <p className="onb-lead">
          Sans {name}, {APP_NAME} part de vos notes, de vos repas et, si vous l’activez, de votre visage.
        </p>
        <div className="onb-row">
          <div className="onb-row-text">
            <span className="onb-row-title">Ce que vous noterez</span>
            <span className="onb-row-detail">bien-être, digestion, repas en photo</span>
          </div>
        </div>
        {health !== 'unavailable' && healthConnector() && (
          <button type="button" className="btn btn-secondary onb-action" onClick={onConnect}>
            Connecter {name}
          </button>
        )}
      </>
    )
  }

  const facts = entries ? summarizeImport(entries) : null
  const devices = entries ? foundDevices(entries, installed) : []
  const sharedSource = facts?.length && facts.every((f) => f.source === facts[0].source) ? facts[0].source : null

  return (
    <>
      <h1 className="onb-title">Voici ce que {APP_NAME} recevra</h1>
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
            Import de vos 30 derniers jours{progress ? ` · ${progress.done}/${progress.total}` : '…'}
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
      {facts?.length > 0 && (
        <>
          <h2 className="onb-leaves-group">Vos 30 derniers jours</h2>
          <ul className="onb-facts">
            {facts.map((f) => (
              <li key={f.key} className={`onb-fact onb-fact--${f.key}`}>
                <span className="onb-fact-value">{f.value}</span>
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
          L’import n’a pas abouti. {APP_NAME} réessaiera seule, ou relancez-le depuis l’onglet Sources.
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
  { title: 'Comment l’arrêter', text: 'à tout moment, dans Paramètres' },
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
          Accès à la caméra refusé : rien n’est activé. Vous pourrez revenir dessus depuis l’onglet Sources.
        </p>
      )}
      {face === 'failed' && (
        <p className="onb-note" role="status">
          La lecture n’a pas démarré. Vous pourrez réessayer depuis l’onglet Sources.
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

/* ───────────────────────── Première note (ACC-7) ───────────────────────── */

/** Visage dessiné (1 = bouche vers le bas, 5 = grand sourire), sans emoji. */
function Face({ value }) {
  const curve = (value - 3) * 4
  return (
    <svg className="onb-feeling-face" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <circle cx="16" cy="16" r="14" />
      <circle className="onb-face-eye" cx="11" cy="13" r="1.8" />
      <circle className="onb-face-eye" cx="21" cy="13" r="1.8" />
      <path d={`M10 ${21 - curve / 4} Q16 ${21 + curve} 22 ${21 - curve / 4}`} />
    </svg>
  )
}

function FirstStep({ goals, first, choice, onChoice }) {
  const gut = wantsGut(goals)
  const saved = first?.wellbeing != null || first?.gut != null
  return (
    <>
      <h1 className="onb-title">Comment vous sentez-vous maintenant ?</h1>
      <p className="onb-lead">Votre première note. Les premiers jours, elle sert aussi à régler l’estimation du visage sur vous.</p>
      <div className="onb-feelings" role="group" aria-label="Comment vous sentez-vous maintenant ?">
        {FEELINGS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`onb-feeling${choice.wellbeing === f.value ? ' is-selected' : ''}`}
            aria-pressed={choice.wellbeing === f.value}
            onClick={() => onChoice({ ...choice, wellbeing: f.value })}
          >
            <Face value={f.value} />
            <span className="onb-feeling-label">{f.label}</span>
          </button>
        ))}
      </div>
      {gut && (
        <>
          <h2 className="onb-question">Et votre ventre ?</h2>
          <div className="onb-gesture" role="group" aria-label="Et votre ventre ?">
            {BELLY.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`onb-gesture-btn${choice.gut === b.id ? ' is-selected' : ''}`}
                aria-pressed={choice.gut === b.id}
                onClick={() => onChoice({ ...choice, gut: b.id })}
              >
                {b.label}
              </button>
            ))}
          </div>
        </>
      )}
      {saved && (
        <p className="onb-note onb-note-ok" role="status">
          C’est noté. Vous la retrouverez dans le Journal.
        </p>
      )}
    </>
  )
}

/** Enregistre la première note : de vraies entrées (bien-être, ventre), modifiées si on revient sur l'écran. */
async function saveFirst(choice, first = {}) {
  const next = { ...first }
  if (choice.wellbeing != null) {
    const payload = { score: choiceToScore(choice.wellbeing) }
    if (first.wellbeingId != null) await updateEntry(first.wellbeingId, { payload })
    else next.wellbeingId = await createEntry({ type: 'wellbeing', source: 'app_wellbeing', payload })
    next.wellbeing = choice.wellbeing
  }
  if (choice.gut != null) {
    const payload = { level: choice.gut }
    if (first.gutId != null) await updateEntry(first.gutId, { payload })
    else next.gutId = await createEntry({ type: GUT_TYPE, source: GUT_SOURCE, payload })
    next.gut = choice.gut
  }
  window.dispatchEvent(new CustomEvent('health-entries-updated'))
  return next
}

/* ───────────────────────── Gold (ACC-9) ───────────────────────── */

function LaunchStep({ until }) {
  return (
    <>
      <span className="paywall-tag">gold</span>
      <h1 className="onb-title">Gold est offert pendant le test</h1>
      <p className="onb-lead">
        Toutes les analyses, sans rien payer{until ? `, jusqu’au ${lastLaunchDay(until)} inclus` : ''}. Aucune carte bancaire
        n’est demandée.
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
 * Nouvel accueil du premier lancement (ACC-1 à ACC-9, 08/11) : plein écran, sans barre d'onglets, reprend à l'écran
 * où la personne s'était arrêtée. « Continuer » n'est jamais bloqué par une autorisation ni par un choix.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const [STEPS] = useState(stepsFor)
  const [state, setState] = useState(() => {
    const s = loadOnboarding()
    // Ancien accueil commencé (avant le 08/11) : on repart du début, les réponses restent.
    if (s.flow !== FLOW_VERSION) return saveOnboarding({ flow: FLOW_VERSION, step: 0, card: 0 })
    const at = STEPS.indexOf(s.lastScreen)
    const step = at >= 0 ? at : Math.min(s.step || 0, STEPS.length - 1)
    return step === s.step ? s : saveOnboarding({ step })
  })
  const [installed, setInstalled] = useState(null)
  const [choice, setChoice] = useState(() => ({ wellbeing: state.first?.wellbeing ?? null, gut: state.first?.gut ?? null }))
  const [saveError, setSaveError] = useState(false)
  const [ent] = useEntitlement()
  const step = STEPS[state.step]
  const card = state.card || 0
  const goals = goalsOf(state)

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
    // La montre Huawei s'appaire depuis Sources (long, pas au milieu de l'accueil).
    navigate(s.huawei === 'pair' ? '/connectors' : '/', { replace: true })
  }

  const go = (i) => update({ step: i })
  const next = async () => {
    if (step === 'tuto' && card < TUTO_CARDS - 1) {
      update({ card: card + 1 })
      return
    }
    if (step === 'goal') update({ goals, tracks: defaultTracks(goals) })
    if (step === 'first' && (choice.wellbeing != null || choice.gut != null)) {
      try {
        update({ first: await saveFirst(choice, state.first || {}) })
      } catch {
        setSaveError(true)
        return
      }
    }
    if (state.step >= STEPS.length - 1) end()
    else go(state.step + 1)
  }
  const back = () => {
    if (step === 'tuto') update({ card: Math.max(0, card - 1) })
    else if (STEPS[state.step - 1] === 'tuto') update({ step: state.step - 1, card: TUTO_CARDS - 1 })
    else go(state.step - 1)
  }
  const atStart = step === 'tuto' && card === 0

  const toggleGoal = (id) => update({ goals: goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id] })

  const launch = ent.premium && ent.source === 'launch'
  const firstChosen = choice.wellbeing != null || choice.gut != null
  const firstSaved = state.first && choice.wellbeing === state.first.wellbeing && choice.gut === (state.first.gut ?? null)

  let footerLabel = 'Continuer'
  if (step === 'tuto') footerLabel = card < TUTO_CARDS - 1 ? 'Suivant' : 'Commencer'
  if (step === 'found' && state.health !== 'granted') footerLabel = 'Continuer sans'
  if (step === 'first' && firstChosen && !firstSaved) footerLabel = 'Enregistrer'
  const faceUndecided = step === 'face' && state.face == null && !isFaceSenseEnabled()
  const showFooter = !(step === 'premium' && !launch) && !faceUndecided

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
        <div
          className="onb-progress"
          role="progressbar"
          aria-label="Avancement"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={state.step + 1}
        >
          <span style={{ width: `${((state.step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <span className="onb-count">
          {pad(state.step + 1)}/{pad(STEPS.length)}
        </span>
        {step === 'tuto' && card < TUTO_CARDS - 1 && (
          <button type="button" className="onb-skip" onClick={() => update({ card: TUTO_CARDS - 1 })}>
            Passer
          </button>
        )}
      </div>

      <main className="onb-body">
        {step === 'tuto' && <TutoStep card={card} onCard={(c) => update({ card: c })} />}
        {step === 'goal' && <GoalStep goals={goals} onToggle={toggleGoal} />}
        {step === 'sources' && <SourcesStep state={state} update={update} installed={installed} />}
        {step === 'found' && (
          <FoundStep
            health={state.health}
            imported={!!state.imported}
            onImported={() => update({ imported: true })}
            installed={installed}
            onConnect={() => go(STEPS.indexOf('sources'))}
          />
        )}
        {step === 'face' && (
          <FaceStep
            face={state.face}
            onFace={(face) => update({ face })}
            onLater={() => update({ face: 'later', unlockLater: true, step: state.step + 1 })}
          />
        )}
        {step === 'first' && (
          <>
            <FirstStep goals={goals} first={state.first} choice={choice} onChoice={setChoice} />
            {saveError && (
              <p className="onb-note" role="alert">
                L’enregistrement n’a pas abouti. Réessayez, ou notez-le plus tard depuis Aujourd’hui.
              </p>
            )}
          </>
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

