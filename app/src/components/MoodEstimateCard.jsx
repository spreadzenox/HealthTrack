/**
 * Carte menthe « Bien-être estimé » de l'accueil « Aujourd'hui » (maquette du 20/10/2026, journal/DESIGN.md §7) :
 * le bien-être du jour estimé par la Lecture du visage dès la première lecture (mood/faceMood.js), en grand chiffre
 * sur 5, l'écart à la moyenne des 14 derniers jours, la courbe de ces jours et une phrase simple. Le chevron ouvre des
 * détails visuels (POL-3) : la fourchette sur l'échelle, un badge de confiance, le nombre de lectures et la moyenne,
 * puis le modèle en petit. « Historique » ouvre la courbe jour / semaine / mois et le détail des modèles (POL-2).
 * Toujours « une estimation, pas un diagnostic ». « Noter moi-même » ouvre la note manuelle,
 * discrètement, dans la carte. Sans aucune lecture avec un visage : une invitation à activer la lecture.
 */
import { Link } from 'react-router-dom'
import { MODEL_LABELS, formatDelta, frDecimal, wellbeingTrend } from '../services/today'
import DetailsToggle from './DetailsToggle'
import LineIcon from './LineIcon'
import './MoodEstimateCard.css'
import { appLocale } from '../i18n/locale.js'

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

const CONFIDENCE_DOTS = { faible: 1, moyenne: 2, bonne: 3 }

/** Badge de confiance : trois points, autant de pleins que le niveau (faible 1, moyenne 2, bonne 3). */
export function ConfidenceBadge({ level }) {
  const filled = CONFIDENCE_DOTS[level] ?? 1
  return (
    <span className={`mood-chip mood-confidence is-${level}`}>
      <span className="mood-confidence-dots" aria-hidden="true">
        {[1, 2, 3].map((i) => <span key={i} className={i <= filled ? 'is-on' : ''} />)}
      </span>
      confiance {level}
    </span>
  )
}

function ManualNoteButton({ onClick }) {
  if (!onClick) return null
  return (
    <button type="button" className="mood-manual" onClick={onClick}>
      <LineIcon name="plus" size={16} />
      Noter moi-même
    </button>
  )
}

/** Lien vers l'« Historique du bien-être » (POL-2) : courbe jour / semaine / mois et détail des modèles. */
function HistoryLink() {
  return (
    <Link to="/bien-etre" className="mood-history-link">
      Historique
      <LineIcon name="chevron" size={16} />
    </Link>
  )
}

/**
 * Rappel discret, une seule fois (POL-PLAY-84) : pour qui a répondu « Plus tard » à la lecture au déverrouillage
 * dans l'onboarding. Le lien mène à Sources, où l'activation reste derrière sa divulgation ; la croix le ferme pour
 * de bon. Aucun chiffre de précision.
 */
function UnlockReminder({ onDismiss }) {
  return (
    <div className="mood-unlock-reminder" role="note">
      <p>
        À chaque déverrouillage, bien plus de lectures : une estimation plus solide.{' '}
        <Link to="/connectors" onClick={onDismiss}>Voir dans Sources</Link>
      </p>
      <button type="button" className="mood-unlock-close" onClick={onDismiss} aria-label="Ne plus afficher ce rappel">
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

function hourOf(iso) {
  return new Date(iso).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })
}

/**
 * @param {{ data: undefined | null | { est: object | null, days: object[] }, details?: boolean,
 *   onToggleDetails?: () => void, onAddManual?: () => void, unlockReminder?: boolean,
 *   onDismissReminder?: () => void, now?: Date }} props
 *   `data` : undefined pendant la lecture, null sans lecture.
 */
export default function MoodEstimateCard({
  data, details = false, onToggleDetails, onAddManual, unlockReminder = false, onDismissReminder, now,
}) {
  const reminder = unlockReminder && <UnlockReminder onDismiss={onDismissReminder} />
  if (data === undefined) return null
  if (!data?.est) {
    return (
      <section className="today-card mood-estimate is-empty" aria-labelledby="mood-estimate-title">
        <h3 id="mood-estimate-title" className="today-card-title">Bien-être estimé</h3>
        {reminder || (
          <p className="today-card-text">
            Votre bien-être peut s’estimer tout seul, sur le téléphone, avec la lecture du visage.{' '}
            <Link to="/connectors">L’activer dans Sources</Link>
          </p>
        )}
        <ManualNoteButton onClick={onAddManual} />
      </section>
    )
  }
  const { est, days } = data
  const shown = est.day || est.moment
  const trend = wellbeingTrend(days, est.day?.note ?? null, now ?? new Date())
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
      {!est.day && <p className="mood-estimate-when mono">dernière lecture · {new Date(est.moment.at).toLocaleDateString(appLocale(), { day: 'numeric', month: 'short' })} {hourOf(est.moment.at)}</p>}
      <Sparkline series={trend.series} mean={trend.mean} />
      {details && (
        <div className="mood-details">
          <MoodRange low={shown.low} high={shown.high} note={shown.note} />
          <p className="mood-details-range mono">entre {frDecimal(shown.low)} et {frDecimal(shown.high)}</p>
          <div className="mood-chips">
            <ConfidenceBadge level={est.confidence} />
            <span className="mood-chip mono">{est.day ? `${est.day.readings} ${est.day.readings > 1 ? 'lectures' : 'lecture'} auj.` : '1 lecture'}</span>
            {trend.mean != null && <span className="mood-chip mono">moy. {frDecimal(trend.mean)} · {trend.pastDays} j</span>}
          </div>
          <p className="mood-details-model mono">{MODEL_LABELS[est.model] || est.model}</p>
        </div>
      )}
      <p className="today-card-text">
        {est.day ? trend.phrase : 'Pas encore de lecture aujourd’hui.'}
      </p>
      {reminder}
      <div className="mood-actions">
        <ManualNoteButton onClick={onAddManual} />
        <HistoryLink />
      </div>
    </section>
  )
}
