import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listEntries } from '../storage/localHealthStorage'
import { computeHeartBaselines, RECENT_DAYS, BASELINE_DAYS } from '../services/baselines'
import './BaselineCards.css'

// 7 jours récents + 60 jours de norme, avec un peu de marge
const HISTORY_DAYS = RECENT_DAYS + BASELINE_DAYS + 2

const STATUS_LABELS = {
  within: 'Dans votre norme',
  above: 'Plus haute que d’habitude',
  below: 'Plus basse que d’habitude',
}

const fmt = (v) => Math.round(v).toLocaleString('fr-FR')

function statusClass(b) {
  if (b.status === 'within') return 'is-within'
  return b.favourable ? 'is-favourable' : 'is-unfavourable'
}

function RangeBar({ b }) {
  const min = Math.min(b.low, b.recentMean)
  const max = Math.max(b.high, b.recentMean)
  const pad = (max - min) * 0.25 || 1
  const lo = min - pad
  const span = max + pad - lo
  const pct = (v) => `${(((v - lo) / span) * 100).toFixed(1)}%`
  return (
    <div className="baseline-range" aria-hidden>
      <div
        className="baseline-range-band"
        style={{ left: pct(b.low), width: `${(((b.high - b.low) / span) * 100).toFixed(1)}%` }}
      />
      <div className={`baseline-range-marker ${statusClass(b)}`} style={{ left: pct(b.recentMean) }} />
    </div>
  )
}

function BaselineCard({ b }) {
  const { metric } = b
  if (b.status === 'insufficient') {
    return (
      <div className="baseline-card is-insufficient">
        <div className="baseline-card-header">
          <span className="baseline-card-title">{metric.label}</span>
        </div>
        <p className="baseline-card-note">
          {b.missingDays > 0
            ? `Encore ${b.missingDays} jour${b.missingDays > 1 ? 's' : ''} de mesures pour établir votre norme.`
            : `Pas assez de mesures ces ${RECENT_DAYS} derniers jours (au moins 3 nécessaires).`}
        </p>
      </div>
    )
  }
  const label = `${metric.label} : ${fmt(b.recentMean)} ${metric.unit} en moyenne sur ${RECENT_DAYS} jours, ` +
    `${STATUS_LABELS[b.status].toLowerCase()} (norme ${fmt(b.low)}–${fmt(b.high)} ${metric.unit})`
  return (
    <div className={`baseline-card ${statusClass(b)}`} role="group" aria-label={label}>
      <div className="baseline-card-header">
        <span className="baseline-card-title">{metric.label}</span>
        <span className={`baseline-badge ${statusClass(b)}`}>{STATUS_LABELS[b.status]}</span>
      </div>
      <p className="baseline-card-value">
        <strong>{fmt(b.recentMean)}</strong> {metric.unit}
        <span className="baseline-card-sub"> moy. {RECENT_DAYS} j</span>
      </p>
      <RangeBar b={b} />
      <p className="baseline-card-note">
        Votre norme : {fmt(b.low)}–{fmt(b.high)} {metric.unit} ({b.baselineDays} j)
      </p>
    </div>
  )
}

export default function BaselineCards() {
  const [baselines, setBaselines] = useState(null)

  const load = useCallback(async () => {
    try {
      const since = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString()
      const entries = await listEntries({ type: 'heart_rate', since, limit: Infinity })
      setBaselines(computeHeartBaselines(entries))
    } catch {
      setBaselines([])
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement asynchrone depuis IndexedDB
    load()
    window.addEventListener('health-entries-updated', load)
    return () => window.removeEventListener('health-entries-updated', load)
  }, [load])

  if (!baselines) return null

  const hasAnyData = baselines.some((b) => b.recentDays + b.baselineDays > 0)
  const unfavourable = baselines.some((b) => b.favourable === false)

  return (
    <section className="baselines" aria-labelledby="baselines-title">
      <h3 id="baselines-title" className="section-title">Votre cœur vs votre norme</h3>
      {!hasAnyData ? (
        <p className="empty-hint">
          Connectez une montre via <Link to="/connectors">Health Connect</Link> : après 3 semaines de mesures,
          HealthTrack compare votre FC au repos et votre VFC à <em>vos</em> valeurs habituelles.
        </p>
      ) : (
        <>
          <div className="baseline-cards">
            {baselines.map((b) => <BaselineCard key={b.metric.key} b={b} />)}
          </div>
          {unfavourable && (
            <p className="baseline-hint" role="note">
              Un écart de quelques jours est fréquent après une nuit courte, du stress, de l’alcool, un entraînement
              intense ou au début d’une infection. Ménagez-vous ; si cela dure ou s’accompagne de symptômes,
              parlez-en à un professionnel de santé.
            </p>
          )}
          <p className="baseline-footnote">
            Moyenne des {RECENT_DAYS} derniers jours comparée à votre norme personnelle (moyenne ± 1 écart-type
            des {BASELINE_DAYS} jours précédents). Une observation, pas un diagnostic.
          </p>
        </>
      )}
    </section>
  )
}
