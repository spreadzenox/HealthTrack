import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GOALS, TRACKS, defaultTracks, loadOnboarding, saveOnboarding, finishOnboarding } from '../settings/onboarding'
import { getConnector } from '../connectors/connectorRegistry'
import { listEntries } from '../storage/localHealthStorage'
import { AHA_DAYS, runFirstImport, summarizeImport } from '../services/firstImport'
import useDisclosure from '../hooks/useDisclosure'
import './Onboarding.css'

const WATCHES = [
  {
    id: 'health_connect',
    label: 'Une montre ou une bague qui écrit dans Health Connect',
    hint: 'Garmin, Oura, Samsung, Withings, Fitbit, Xiaomi…',
  },
  { id: 'huawei', label: 'Une montre compatible Huawei', hint: 'reliée directement en Bluetooth' },
  { id: 'none', label: 'Pas de montre', hint: 'le téléphone et vos notes suffisent pour commencer' },
]

/**
 * Écrans dans l'ordre (jalon 4a : 1 à 3 ; 4b : Health Connect puis import et « aha », seulement avec une montre
 * Health Connect, le « aha » seulement si l'accès est donné ; visage, premier geste et paywall viendront en 4c).
 */
function stepsFor(state) {
  const steps = ['goal', 'tracks', 'watch']
  if (state.watch === 'health_connect') {
    steps.push('health')
    if (state.health === 'granted') steps.push('aha')
  }
  return steps
}

/** Au-delà, l'import continue en arrière-plan et l'on peut passer à la suite. */
export const IMPORT_PATIENCE_MS = 20000

const withTimeout = (promise, ms, fallback) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))])

const pad = (n) => String(n).padStart(2, '0')

/** Choix à rond radio ou case (rayon 18 px, bordure 2 px), numéroté en mono quand `index` est donné. */
function Choice({ type, name, checked, onChange, label, hint, index }) {
  return (
    <label className={`onb-choice${checked ? ' is-selected' : ''}`}>
      {index != null && (
        <span className="onb-choice-num" aria-hidden>
          {pad(index)}
        </span>
      )}
      <span className="onb-choice-text">
        <span className="onb-choice-label">{label}</span>
        <span className="onb-choice-hint">{hint}</span>
      </span>
      <input type={type} name={name} checked={checked} onChange={onChange} />
    </label>
  )
}

function GoalStep({ goal, onGoal }) {
  return (
    <>
      <div className="onb-illustration" aria-hidden>
        <svg viewBox="0 0 120 64" width="120" height="64">
          <path className="onb-ill-line" d="M8 48 C30 48 34 26 56 28 C78 30 82 14 112 12" />
          <circle className="onb-ill-dot" cx="56" cy="28" r="6" />
        </svg>
      </div>
      <h1 className="onb-title">Comprenez ce qui va avec vos bons et mauvais jours</h1>
      <p className="onb-lead">Repas, sommeil, montres et bien-être, analysés sur votre téléphone.</p>
      <ul className="onb-tiles">
        <li>
          <span className="onb-tile-num">0 Mo</span> envoyé sans votre accord
        </li>
        <li>
          <span className="onb-tile-num">2–48 h</span> de délai entre repas et ventre
        </li>
        <li>
          <span className="onb-tile-num">1 geste</span> pour tout exporter
        </li>
      </ul>
      <fieldset className="onb-choices">
        <legend className="onb-question">Qu’est-ce qui vous amène ?</legend>
        {GOALS.map((g, i) => (
          <Choice
            key={g.id}
            type="radio"
            name="goal"
            index={i + 1}
            checked={goal === g.id}
            onChange={() => onGoal(g.id)}
            label={g.label}
            hint={g.hint}
          />
        ))}
      </fieldset>
      <p className="onb-lock">
        <span aria-hidden>🔒</span> Local par défaut · l’IA seulement si vous le voulez
      </p>
      <p className="onb-fine">En continuant, vous confirmez avoir 18 ans ou plus.</p>
    </>
  )
}

function TracksStep({ tracks, onToggle }) {
  return (
    <>
      <h1 className="onb-title">Que voulez-vous suivre ?</h1>
      <p className="onb-lead">
        On vous montrera d’abord ce qui compte pour vous. Rien n’est effacé ni bloqué : tout reste accessible.
      </p>
      <fieldset className="onb-choices">
        <legend className="onb-sr">Ce que vous voulez suivre</legend>
        {TRACKS.map((t) => (
          <Choice
            key={t.id}
            type="checkbox"
            name="tracks"
            checked={tracks.includes(t.id)}
            onChange={() => onToggle(t.id)}
            label={t.label}
            hint={t.hint}
          />
        ))}
      </fieldset>
    </>
  )
}

function WatchStep({ watch, onWatch }) {
  return (
    <>
      <h1 className="onb-title">Avez-vous une montre ?</h1>
      <p className="onb-lead">Rien n’est demandé à cette étape : vous choisirez ce que l’app peut lire juste après.</p>
      <fieldset className="onb-choices">
        <legend className="onb-sr">Votre montre</legend>
        {WATCHES.map((w) => (
          <Choice
            key={w.id}
            type="radio"
            name="watch"
            checked={watch === w.id}
            onChange={() => onWatch(w.id)}
            label={w.label}
            hint={w.hint}
          />
        ))}
      </fieldset>
    </>
  )
}

function HealthStep({ health, onHealth }) {
  const [disclosure, askConsent] = useDisclosure()
  const [busy, setBusy] = useState(false)
  const connector = getConnector('health_connect')

  useEffect(() => {
    if (health === 'granted' || !connector) return
    let alive = true
    // Déjà autorisé (réinstallation, retour en arrière) : rien à redemander.
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

  const allow = async () => {
    if (!(await askConsent('health_connect'))) {
      onHealth('declined')
      return
    }
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
    <>
      {disclosure}
      <h1 className="onb-title">Vos données Health Connect</h1>
      <p className="onb-lead">
        Sommeil, pas, cœur, VFC et activité de vos 30 derniers jours, lus sur le téléphone. Rien n’est envoyé.
      </p>
      {health === 'granted' && (
        <p className="onb-note onb-note-ok" role="status">
          C’est autorisé. Continuez pour importer vos 30 derniers jours.
        </p>
      )}
      {health === 'declined' && (
        <p className="onb-note" role="status">
          Pas de souci : vous pourrez l’autoriser plus tard depuis l’onglet Sources.
        </p>
      )}
      {health === 'unavailable' && (
        <p className="onb-note" role="status">
          Health Connect n’est pas disponible sur ce téléphone pour l’instant. Vous pourrez le relier plus tard depuis
          l’onglet Sources.
        </p>
      )}
      {health !== 'granted' && health !== 'unavailable' && (
        <button type="button" className="btn btn-secondary onb-action" onClick={allow} disabled={busy || !connector}>
          {busy ? 'Health Connect est ouvert…' : 'Autoriser Health Connect'}
        </button>
      )}
    </>
  )
}

const pct = (p) => (p && p.total ? Math.round((p.done / p.total) * 100) : 0)

/** Un seul import à la fois, même si l'écran est monté deux fois (StrictMode, retour en arrière). */
let importInFlight = null

function startImport(onProgress) {
  importInFlight ||= runFirstImport({ connector: getConnector('health_connect'), onProgress }).finally(() => {
    importInFlight = null
  })
  return importInFlight
}

function AhaStep({ imported, onImported, onReady }) {
  const [progress, setProgress] = useState(null)
  const [slow, setSlow] = useState(false)
  const [facts, setFacts] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    const timer = setTimeout(() => {
      if (!alive) return
      setSlow(true)
      onReady()
    }, IMPORT_PATIENCE_MS)
    const work = imported
      ? Promise.resolve()
      : startImport(setProgress).then((r) => {
        onImported()
        if (r.synced === 0 && r.errors?.length && alive) setError(true)
      })
    work
      .then(async () => {
        const since = new Date(Date.now() - AHA_DAYS * 24 * 3600 * 1000).toISOString()
        const entries = await listEntries({ source: 'health_connect', since, limit: 100000 })
        if (alive) setFacts(summarizeImport(entries))
      })
      .catch(() => alive && setError(true))
      .finally(() => {
        clearTimeout(timer)
        if (alive) onReady()
      })
    return () => {
      alive = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!facts && !error && imported) return <h1 className="onb-title">Vos 30 derniers jours</h1>

  if (!facts && !error) {
    return (
      <>
        <h1 className="onb-title">On importe vos 30 derniers jours</h1>
        <div
          className="onb-import-bar"
          role="progressbar"
          aria-label="Import Health Connect"
          aria-valuemin={0}
          aria-valuemax={progress?.total || 1}
          aria-valuenow={progress?.done || 0}
        >
          <span style={{ width: `${pct(progress)}%` }} />
        </div>
        <p className="onb-import-line">
          {progress ? `${progress.done}/${progress.total}` : '…'}
          {progress?.label ? ` · ${progress.label}` : ''}
        </p>
        {slow && (
          <p className="onb-note" role="status">
            C’est un peu long : vous pouvez continuer, l’import se poursuit en arrière-plan.
          </p>
        )}
      </>
    )
  }

  return (
    <>
      <h1 className="onb-title">Vos 30 derniers jours</h1>
      {facts?.length ? (
        <>
          <ul className="onb-facts">
            {facts.map((f) => (
              <li key={f.key} className="onb-fact">
                <span className="onb-fact-value">{f.value}</span>
                <span className="onb-fact-label">{f.label}</span>
                <span className="onb-fact-source">{f.source}</span>
              </li>
            ))}
          </ul>
          <p className="onb-lead">Ce sont vos chiffres de départ. Les pistes viendront en les croisant avec votre ventre et votre bien-être.</p>
        </>
      ) : (
        <p className="onb-note" role="status">
          {error
            ? 'L’import n’a pas abouti. Il sera retenté tout seul ; vous pourrez aussi le relancer depuis l’onglet Sources.'
            : 'Rien à importer pour l’instant : vos données arriveront au fil des jours.'}
        </p>
      )}
    </>
  )
}

/**
 * Onboarding du premier lancement (jalon 4, journal/IDEES.md I154) : plein écran, sans barre d'onglets, reprend à
 * l'écran où la personne s'était arrêtée. Aucune autorisation ni notification demandée dans ces écrans.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const [state, setState] = useState(() => {
    const s = loadOnboarding()
    return { ...s, step: Math.min(s.step || 0, stepsFor(s).length - 1) }
  })
  const [ahaReady, setAhaReady] = useState(false)
  const STEPS = stepsFor(state)
  const step = STEPS[state.step]
  const tracks = state.tracks || defaultTracks(state.goal)

  const update = (patch) => setState(saveOnboarding(patch))

  const end = (endedBy) => {
    const s = finishOnboarding(endedBy)
    // La montre Huawei s'appaire depuis Sources (long, pas au milieu de l'onboarding).
    const toSources = endedBy === 'completed' && s.watch === 'huawei'
    navigate(toSources ? '/connectors' : '/', { replace: true })
  }

  const canContinue = {
    goal: !!state.goal,
    watch: !!state.watch,
    health: !!state.health,
    aha: ahaReady,
  }[step] ?? true

  const next = () => {
    if (step === 'tracks' && !state.tracks) update({ tracks })
    if (state.step >= STEPS.length - 1) end('completed')
    else update({ step: state.step + 1 })
  }

  const toggleTrack = (id) =>
    update({ tracks: tracks.includes(id) ? tracks.filter((t) => t !== id) : [...tracks, id] })

  return (
    <div className="onboarding">
      <div className="onb-top">
        {state.step > 0 ? (
          <button type="button" className="onb-back" onClick={() => update({ step: state.step - 1 })} aria-label="Retour">
            ←
          </button>
        ) : (
          <span className="onb-back-spacer" />
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
        {state.step > 0 && (
          <button type="button" className="onb-skip" onClick={() => end('skipped')}>
            Passer
          </button>
        )}
      </div>

      <main className="onb-body">
        {step === 'goal' && (
          <GoalStep goal={state.goal} onGoal={(goal) => update({ goal, tracks: state.goal === goal ? state.tracks : null })} />
        )}
        {step === 'tracks' && <TracksStep tracks={tracks} onToggle={toggleTrack} />}
        {step === 'watch' && <WatchStep watch={state.watch} onWatch={(watch) => update({ watch })} />}
        {step === 'health' && <HealthStep health={state.health} onHealth={(health) => update({ health })} />}
        {step === 'aha' && (
          <AhaStep imported={!!state.imported} onImported={() => update({ imported: true })} onReady={() => setAhaReady(true)} />
        )}
      </main>

      <div className="onb-footer">
        <button type="button" className="btn onb-continue" onClick={next} disabled={!canContinue}>
          Continuer
        </button>
      </div>
    </div>
  )
}
