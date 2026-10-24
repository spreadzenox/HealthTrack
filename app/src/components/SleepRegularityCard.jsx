import { useState, useEffect, useCallback } from 'react'
import { listEntries } from '../storage/localHealthStorage'
import { computeSleepRegularity, REGULARITY_DAYS } from '../services/sleepRegularity'
import { formatDuration, formatClock } from '../utils/format'
import './BaselineCards.css'

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

export default function SleepRegularityCard({ onStatus }) {
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

  const missing = result?.status === 'insufficient' ? result.missingNights : null
  useEffect(() => {
    if (!onStatus || result === undefined) return
    // POL-6 : pas encore assez de nuits → une ligne « Bientôt » du bloc Forme, pas une carte
    onStatus('sleep', missing != null
      ? { soon: [{ id: 'sleep', label: 'Horaires de sommeil', progress: `encore ${missing} nuit${missing > 1 ? 's' : ''}` }] }
      : { active: !!result })
  }, [onStatus, result, missing])

  if (!result || missing != null) return null

  const level = LEVELS[result.level]
  const shift = result.weekendShift
  const showShift = shift != null && Math.abs(shift) >= 30
  const showTip = result.level === 'variable' || (shift != null && Math.abs(shift) >= 60)

  return (
    <div className="baselines">
      <div className={`baseline-card ${level.className}`}>
        <div className="baseline-card-header">
          <span className="baseline-card-title">Horaires de sommeil</span>
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
            <span className="baseline-card-sub"> · {result.nights} nuits</span>
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
        // La donnée d'abord (I87) : l'hypothèse générale tient en une ligne, dépliable
        <details className="baseline-hint-fold">
          <summary>Hypothèse générale à tester chez vous</summary>
          <p className="baseline-hint" role="note">
            Hypothèse générale (études) : des horaires proches chaque jour, week-end compris, iraient avec un meilleur
            sommeil et un meilleur bien-être le lendemain. Vos Analyses diront si c’est vrai chez vous.
          </p>
        </details>
      )}
    </div>
  )
}
