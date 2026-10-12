import { useState, useEffect, useCallback } from 'react'
import { listEntries } from '../storage/localHealthStorage'
import { computeMoodEstimate, MOOD_SIGNALS, MOOD_NORM_DAYS, MIN_CALIBRATION_DAYS, CALIBRATION_WINDOW_DAYS } from '../services/moodEstimate'
import { localDateKey } from '../services/wellbeingSeries'
import { formatDuration } from '../utils/format'
import './BaselineCards.css'
import './MoodEstimateCard.css'

// Fenêtre de calibration + la norme de son premier jour + marge
const HISTORY_DAYS = CALIBRATION_WINDOW_DAYS + MOOD_NORM_DAYS + 2
const TYPES = ['heart_rate', 'sleep', 'steps', 'wellbeing', 'phone_usage']

const BANDS = {
  within: { label: 'Dans votre plage habituelle', className: 'is-within' },
  above: { label: 'Au-dessus de votre habitude', className: 'is-favourable' },
  below: { label: 'En dessous de votre habitude', className: 'is-unfavourable' },
}

const SIGNAL_NAMES = {
  sleepMinutes: 'sommeil',
  heartRateVariability: 'VFC',
  restingHeartRate: 'FC au repos',
  steps: 'pas de la veille',
  screenLateMinutes: 'écran tard',
}

const fr1 = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function formatSignal(s) {
  if (s.unit === 'min') return formatDuration(s.value) || '0 min'
  return `${Math.round(s.value).toLocaleString('fr-FR')} ${s.unit}`
}

function formatTypical(s) {
  return s.unit === 'min' ? formatDuration(s.typical) || '0 min' : `${Math.round(s.typical).toLocaleString('fr-FR')} ${s.unit}`
}

function list(names) {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}` : names[0]
}

function dayLabel(dateKey) {
  return dateKey === localDateKey(new Date().toISOString()) ? 'Aujourd’hui' : 'Hier'
}

export default function MoodEstimateCard() {
  const [result, setResult] = useState(null)

  const load = useCallback(async () => {
    try {
      const since = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString()
      const lists = await Promise.all(TYPES.map((type) => listEntries({ type, since, limit: Infinity })))
      setResult(computeMoodEstimate(lists.flat()))
    } catch {
      setResult(null)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement asynchrone depuis IndexedDB
    load()
    window.addEventListener('health-entries-updated', load)
    return () => window.removeEventListener('health-entries-updated', load)
  }, [load])

  if (!result || result.status === 'empty') return null

  if (result.status !== 'ok') {
    const missing = Math.max(1, (result.neededDays ?? 0) - (result.measuredDays ?? 0))
    return (
      <section className="baselines" aria-labelledby="mood-title">
        <h3 id="mood-title" className="section-title">Humeur estimée</h3>
        <div className="baseline-card is-insufficient">
          <p className="baseline-card-note">
            {result.status === 'stale'
              ? 'Pas de mesure depuis deux jours : synchronisez votre montre ou votre téléphone pour mettre l’estimation à jour.'
              : `Encore ${missing} jour${missing > 1 ? 's' : ''} de mesures (sommeil, cœur, pas ou temps d’écran) pour estimer votre humeur sans rien saisir.`}
          </p>
        </div>
      </section>
    )
  }

  const band = BANDS[result.band]
  const order = MOOD_SIGNALS.map((s) => s.key)
  const signals = [...result.signals].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))

  return (
    <section className="baselines" aria-labelledby="mood-title">
      <h3 id="mood-title" className="section-title">Humeur estimée</h3>
      <div className={`baseline-card ${band.className}`}>
        <div className="baseline-card-header">
          <span className="baseline-card-title">{dayLabel(result.dateKey)}</span>
          <span className={`baseline-badge ${band.className}`}>{band.label}</span>
        </div>
        {result.calibrated && (
          <p className="baseline-card-value">
            Estimation : <strong>{fr1(result.estimate)}</strong> / 5
            <span className="baseline-card-sub"> · entre {fr1(result.low)} et {fr1(result.high)}</span>
          </p>
        )}
        <ul className="mood-signals">
          {signals.map((s) => {
            const tone = s.score >= 0.75 ? 'is-favourable' : s.score <= -0.75 ? 'is-unfavourable' : 'is-within'
            return (
              <li key={s.key} className={tone}>
                <span className="mood-signal-name">{s.label}</span>{' '}
                <strong>{formatSignal(s)}</strong>
                <span className="mood-signal-usual"> · habituellement {formatTypical(s)}</span>
              </li>
            )
          })}
        </ul>
        {result.calibrated && result.topSignals.length > 0 && (
          <p className="baseline-card-note mood-note">
            Ce qui suit le plus vos notes : {list(result.topSignals.map((k) => SIGNAL_NAMES[k]))}.
          </p>
        )}
      </div>
      {result.persistentLow && (
        <p className="baseline-hint" role="note">
          Votre estimation est en dessous de votre habitude depuis environ deux semaines. Si vous vous sentez
          durablement moins bien, en parler à un proche ou à votre médecin peut aider. En cas de détresse : 3114
          (prévention du suicide, gratuit, 24 h/24).
        </p>
      )}
      <p className="baseline-footnote">
        Écart de vos signaux (sommeil, VFC, FC au repos, pas de la veille, écran tard) à vos {MOOD_NORM_DAYS} jours
        précédents, sans rien saisir.{' '}
        {result.calibrated
          ? `Calibrée sur vos ${result.checkInDays} notes de bien-être. `
          : result.checkInDays >= MIN_CALIBRATION_DAYS
            ? 'Vos notes de bien-être ne suivent pas encore assez ces signaux pour donner une note sur 5. '
            : `Notez votre bien-être : dès ${MIN_CALIBRATION_DAYS} jours, l’estimation apprend ce qui compte pour vous (${result.checkInDays}/${MIN_CALIBRATION_DAYS} notes de bien-être). `}
        Une estimation, pas un diagnostic.
      </p>
    </section>
  )
}
