import { useState, useEffect, useCallback } from 'react'
import { listEntries } from '../storage/localHealthStorage'
import { computeSleepRegularity, REGULARITY_DAYS, MIN_NIGHTS } from '../services/sleepRegularity'
import { formatDuration, formatClock } from '../utils/format'
import './BaselineCards.css'
import MethodNote from './MethodNote'

// 14 jours + la veille du premier (coucher avant minuit) + marge pour la comparaison à 24 h
const HISTORY_DAYS = REGULARITY_DAYS + 2

const LEVELS = {
  regular: { label: 'Horaires réguliers', className: 'is-favourable' },
  fairly: { label: 'Assez réguliers', className: 'is-within' },
  variable: { label: 'Horaires variables', className: 'is-unfavourable' },
}

function Spread({ sd }) {
  const rounded = Math.round(sd / 5) * 5
  if (rounded === 0) return <span className="baseline-card-sub"> à 5 min près</span>
  return <span className="baseline-card-sub"> ± {formatDuration(rounded)}</span>
}

export default function SleepRegularityCard() {
  const [result, setResult] = useState(undefined)

  const load = useCallback(async () => {
    try {
      const since = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString()
      const entries = await listEntries({ type: 'sleep', since, limit: Infinity })
      setResult(computeSleepRegularity(entries))
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

  if (!result) return null

  if (result.status === 'insufficient') {
    return (
      <section className="baselines" aria-labelledby="sleep-regularity-title">
        <h3 id="sleep-regularity-title" className="section-title">Régularité du sommeil</h3>
        <div className="baseline-card is-insufficient">
          <p className="baseline-card-note">
            Encore {result.missingNights} nuit{result.missingNights > 1 ? 's' : ''} enregistrée
            {result.missingNights > 1 ? 's' : ''} pour mesurer la régularité de vos horaires
            ({MIN_NIGHTS} nuits sur les {REGULARITY_DAYS} derniers jours).
          </p>
        </div>
      </section>
    )
  }

  const level = LEVELS[result.level]
  const shift = result.weekendShift
  const showShift = shift != null && Math.abs(shift) >= 30
  const showTip = result.level === 'variable' || (shift != null && Math.abs(shift) >= 60)

  return (
    <section className="baselines" aria-labelledby="sleep-regularity-title">
      <h3 id="sleep-regularity-title" className="section-title">Régularité du sommeil</h3>
      <div className={`baseline-card ${level.className}`}>
        <div className="baseline-card-header">
          <span className="baseline-card-title">Vos horaires</span>
          <span className={`baseline-badge ${level.className}`}>{level.label}</span>
        </div>
        <div className="sleep-reg-times">
          <p className="baseline-card-value">
            Coucher vers <strong>{formatClock(result.bedtime.mean)}</strong>
            <Spread sd={result.bedtime.sd} />
          </p>
          <p className="baseline-card-value">
            Lever vers <strong>{formatClock(result.wake.mean)}</strong>
            <Spread sd={result.wake.sd} />
          </p>
        </div>
        {result.sri != null && (
          <p className="baseline-card-value">
            Indice de régularité : <strong>{result.sri}</strong> / 100
          </p>
        )}
        {showShift && (
          <p className="baseline-card-note">
            Le week-end, vos nuits sont décalées de {formatDuration(Math.abs(Math.round(shift / 5) * 5))}{' '}
            {shift > 0 ? 'plus tard' : 'plus tôt'}.
          </p>
        )}
      </div>
      {showTip && (
        <p className="baseline-hint" role="note">
          Hypothèse générale (études) : des horaires proches chaque jour, week-end compris, iraient avec un meilleur
          sommeil et un meilleur bien-être le lendemain. Vos Analyses diront si c’est vrai chez vous.
        </p>
      )}
      <MethodNote>
        {result.nights} nuits sur les {REGULARITY_DAYS} derniers jours. L’indice (0 à 100) mesure la chance d’être
        dans le même état — endormi ou éveillé — à la même heure d’un jour au suivant.
      </MethodNote>
    </section>
  )
}
