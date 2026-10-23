import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listEntries } from '../storage/localHealthStorage'
import { computeHeartBaselines, BASELINE_METRICS, RECENT_DAYS, BASELINE_DAYS } from '../services/baselines'
import { APP_NAME } from '../config/brand'
import './BaselineCards.css'

// 7 jours récents + 60 jours de norme, avec un peu de marge
const HISTORY_DAYS = RECENT_DAYS + BASELINE_DAYS + 2

const STATUS_LABELS = {
  within: 'Dans votre norme',
  above: 'Plus haute que d’habitude',
  below: 'Plus basse que d’habitude',
}

const fmtWith = (digits) => (v) =>
  v.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

// Entiers par défaut ; une décimale quand l'arrondi contredirait le statut
// (ex. moyenne 60,6 sous une norme 61,4–65 → « 61 » dans « 61–65 » mais « plus basse »).
function formatterFor(b) {
  const r = Math.round
  const looksWithin = r(b.recentMean) >= r(b.low) && r(b.recentMean) <= r(b.high)
  return fmtWith(looksWithin === (b.status === 'within') ? 0 : 1)
}

// D6 : hors norme dans un sens ou dans l'autre, même style — aucun sens n'est « bon » par principe
function statusClass(b) {
  return b.status === 'within' ? 'is-within' : 'is-outside'
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
  const fmt = formatterFor(b)
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
      // FC repos et VFC seulement, pas les tranches de FC / SpO₂ (perf D2)
      const entries = await listEntries({ type: 'heart_rate', subtypes: Object.keys(BASELINE_METRICS), since, limit: Infinity })
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
  const generalFatigue = baselines.some((b) => b.generalFatigue)

  return (
    <div className="baselines">
      {!hasAnyData ? (
        <p className="empty-hint">
          Connectez une montre via <Link to="/connectors">Health Connect</Link> : après 3 semaines de mesures,{' '}
          {APP_NAME} compare votre FC au repos et votre VFC à <em>vos</em> valeurs habituelles.
        </p>
      ) : (
        <>
          <div className="baseline-cards">
            {baselines.map((b) => <BaselineCard key={b.metric.key} b={b} />)}
          </div>
          {generalFatigue && (
            <p className="baseline-hint" role="note">
              Hypothèse générale : une FC au repos plus haute ou une VFC plus basse suit souvent une nuit courte, du
              stress, de l’alcool, un entraînement intense ou le début d’une infection. Si cela dure ou s’accompagne de
              symptômes, parlez-en à un professionnel de santé.
            </p>
          )}
        </>
      )}
    </div>
  )
}
