import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GOALS, TRACKS, defaultTracks, loadOnboarding, saveOnboarding, finishOnboarding } from '../settings/onboarding'
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

/** Écrans dans l'ordre (jalon 4a : 1 à 3 ; Health Connect, « aha », visage, premier geste et paywall viendront). */
const STEPS = ['goal', 'tracks', 'watch']

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

/**
 * Onboarding du premier lancement (jalon 4, journal/IDEES.md I154) : plein écran, sans barre d'onglets, reprend à
 * l'écran où la personne s'était arrêtée. Aucune autorisation ni notification demandée dans ces écrans.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const [state, setState] = useState(() => {
    const s = loadOnboarding()
    return { ...s, step: Math.min(s.step || 0, STEPS.length - 1) }
  })
  const step = STEPS[state.step]
  const tracks = state.tracks || defaultTracks(state.goal)

  const update = (patch) => setState(saveOnboarding(patch))

  const end = (endedBy) => {
    const s = finishOnboarding(endedBy)
    // La montre Huawei s'appaire depuis Sources (long, pas au milieu de l'onboarding) ; Health Connect aussi
    // en attendant son écran dans l'onboarding (jalon 4b).
    const toSources = endedBy === 'completed' && (s.watch === 'huawei' || s.watch === 'health_connect')
    navigate(toSources ? '/connectors' : '/', { replace: true })
  }

  const canContinue = step === 'goal' ? !!state.goal : step === 'watch' ? !!state.watch : true

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
      </main>

      <div className="onb-footer">
        <button type="button" className="btn onb-continue" onClick={next} disabled={!canContinue}>
          Continuer
        </button>
      </div>
    </div>
  )
}
