/**
 * Carte menthe « Bien-être estimé » de l'accueil « Aujourd'hui » (maquette du 20/10/2026, journal/DESIGN.md §7) :
 * le bien-être du jour estimé par la Lecture du visage dès la première lecture (mood/faceMood.js), en grand chiffre
 * sur 5, l'écart à la moyenne des 14 derniers jours, la courbe de ces jours et une phrase simple. « détails »
 * remplace la phrase par la fourchette, le nombre de lectures, la moyenne et le modèle. Toujours « une estimation,
 * pas un diagnostic ». Sans aucune lecture avec un visage : une invitation discrète à activer la lecture.
 */
import { Link } from 'react-router-dom'
import { describeFaceMood } from '../services/mood/faceMood'
import { MODEL_LABELS, formatDelta, frDecimal, wellbeingTrend } from '../services/today'
import DetailsToggle from './DetailsToggle'
import './MoodEstimateCard.css'

const pct = (v) => `${(v / 5) * 100}%`

/** Fourchette sur l'échelle 0–5 : bande = fourchette, trait = estimation. */
export function MoodRange({ low, high, note }) {
  return (
    <div className="mood-range" aria-hidden="true">
      <div className="mood-range-track">
        <div className="mood-range-band" style={{ left: pct(low), width: pct(high - low) }} />
        <div className="mood-range-mark" style={{ left: pct(note) }} />
      </div>
      <div className="mood-range-scale"><span>0</span><span>2,5</span><span>5</span></div>
    </div>
  )
}

const W = 280
const H = 56
const PAD = 6

/** Courbe des jours estimés (0–5) et ligne de la moyenne ; le dernier point (aujourd'hui) en ambre. */
export function Sparkline({ series, mean }) {
  if (series.length < 2) return null
  const x = (i) => PAD + (i * (W - 2 * PAD)) / (series.length - 1)
  const y = (note) => H - PAD - (note / 5) * (H - 2 * PAD)
  const points = series.map((d, i) => `${x(i).toFixed(1)},${y(d.note).toFixed(1)}`).join(' ')
  const last = series.length - 1
  return (
    <svg className="mood-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
      aria-label={`Bien-être estimé des ${series.length} derniers jours estimés`}>
      {mean != null && <line className="mood-spark-mean" x1={PAD} x2={W - PAD} y1={y(mean)} y2={y(mean)} />}
      <polyline className="mood-spark-line" points={points} />
      <circle className="mood-spark-dot" cx={x(last)} cy={y(series[last].note)} r="4" />
    </svg>
  )
}

function hourOf(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * @param {{ data: undefined | null | { est: object | null, days: object[] }, details?: boolean,
 *   onToggleDetails?: () => void, now?: Date }} props  `data` : undefined pendant la lecture, null sans lecture.
 */
export default function MoodEstimateCard({ data, details = false, onToggleDetails, now }) {
  if (data === undefined) return null
  if (!data?.est) {
    return (
      <section className="today-card mood-estimate is-empty" aria-labelledby="mood-estimate-title">
        <h3 id="mood-estimate-title" className="today-card-title">Bien-être estimé</h3>
        <p className="today-card-text">
          Votre bien-être peut s’estimer tout seul, sur le téléphone, avec la lecture du visage.{' '}
          <Link to="/connectors">L’activer dans Sources</Link>
        </p>
      </section>
    )
  }
  const { est, days } = data
  const shown = est.day || est.moment
  const trend = wellbeingTrend(days, est.day?.note ?? null, now ?? new Date())
  const lines = describeFaceMood(est)
  return (
    <section className="today-card mood-estimate" aria-labelledby="mood-estimate-title">
      <div className="today-card-head">
        <h3 id="mood-estimate-title" className="today-card-title">Bien-être estimé</h3>
        <DetailsToggle on={details} onToggle={onToggleDetails} />
      </div>
      <p className="mood-estimate-figure">
        <span className="mood-estimate-note">{frDecimal(shown.note)}</span>
        <span className="mood-estimate-scale"> / 5</span>
        {trend.delta != null && (
          <span className="mood-estimate-delta mono" aria-label={`Écart à votre moyenne : ${formatDelta(trend.delta)}`}>
            {formatDelta(trend.delta)} vs moy.
          </span>
        )}
      </p>
      {!est.day && <p className="mood-estimate-when mono">dernière lecture · {new Date(est.moment.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} {hourOf(est.moment.at)}</p>}
      <Sparkline series={trend.series} mean={trend.mean} />
      {details ? (
        <>
          <dl className="today-details mono">
            <div><dt>Fourchette</dt><dd>{frDecimal(shown.low)} – {frDecimal(shown.high)}</dd></div>
            <div><dt>Lectures</dt><dd>n = {est.day ? est.day.readings : 1}{est.day ? ' aujourd’hui' : ''}</dd></div>
            <div><dt>Moyenne 14 j</dt><dd>{trend.mean != null ? `${frDecimal(trend.mean)} (${trend.pastDays} j)` : '—'}</dd></div>
            <div><dt>Confiance</dt><dd>{est.confidence}</dd></div>
            <div><dt>Modèle</dt><dd>{MODEL_LABELS[est.model] || est.model}</dd></div>
          </dl>
          {lines.slice(1).map((line) => <p key={line} className="today-card-text today-card-small">{line}</p>)}
        </>
      ) : (
        <p className="today-card-text">
          {est.day ? trend.phrase : 'Pas encore de lecture aujourd’hui.'} Une estimation, pas un diagnostic.
        </p>
      )}
    </section>
  )
}
