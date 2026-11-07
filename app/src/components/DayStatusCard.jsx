/**
 * Bloc « Bien-être aujourd'hui » en tête de l'Accueil (AUJ-2, revue design du 07/11 : montrer la donnée, pas un
 * verdict). La valeur du jour sur 5, d'où elle vient, et la courbe du jour (points et tendance, sans légende), comme
 * la vue Jour de l'historique. Carte menthe : c'est du bien-être (règle de sens constant). Toucher le bloc ouvre
 * l'historique du bien-être. Sans lecture ni note du jour : une phrase qui renvoie au bandeau d'ajout (AUJ-1).
 */
import { Link } from 'react-router-dom'
import { dayWellbeing } from '../services/today'
import { toDisplay } from '../services/mood/wellbeingScale'
import { StartCalibration, UnlockReminder } from './WellbeingNudges'
import LineIcon from './LineIcon'
import StripPlus from './StripPlus'
import './DayStatusCard.css'

/** Un graphique à partir de 3 points (leçon 17). */
const CURVE_MIN_POINTS = 3
const W = 300
const H = 64
const PAD = 6

/** Heure locale décimale (8 h 30 → 8,5). */
const hourOf = (iso) => { const d = new Date(iso); return d.getHours() + d.getMinutes() / 60 }

/** Courbe du jour : x = l'heure (de 6 h à 23 h au moins), y = 1 à 5 ; ligne du milieu (3) en pointillés. */
function DayCurve({ points, trend }) {
  if (points.length < CURVE_MIN_POINTS) return null
  const hours = points.map((p) => hourOf(p.at))
  const start = Math.min(6, Math.floor(Math.min(...hours)))
  const end = Math.max(23, Math.ceil(Math.max(...hours)))
  const x = (iso) => PAD + ((hourOf(iso) - start) / (end - start)) * (W - 2 * PAD)
  const y = (note) => PAD + ((5 - toDisplay(note)) / 4) * (H - 2 * PAD)
  const line = trend.length >= 2 ? trend.map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(1)},${y(p.note).toFixed(1)}`).join(' ') : null
  return (
    <svg className="day-curve" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <line className="day-curve-mid" x1={PAD} x2={W - PAD} y1={H / 2} y2={H / 2} />
      {line && <path className="day-curve-trend" d={line} />}
      {points.map((p) => (
        <circle key={p.at} className="day-curve-dot" cx={x(p.at)} cy={y(p.note)} r="3.5" />
      ))}
    </svg>
  )
}

/**
 * @param {{ data: undefined | null | { est: object | null, today?: object }, entries?: object[],
 *   onAddManual?: () => void, onReminder?: () => void, unlockReminder?: boolean, onDismissReminder?: () => void, now?: Date }} props
 *   `data` : undefined pendant la lecture du visage, null sans aucune lecture.
 */
export default function DayStatusCard({
  data, entries = [], onAddManual, onReminder, unlockReminder = false, onDismissReminder, now,
}) {
  if (data === undefined) return null
  const est = data?.est ?? null
  const w = dayWellbeing(data, entries, now ?? new Date())
  const reminder = unlockReminder && <UnlockReminder onDismiss={onDismissReminder} />
  const heading = <h2 id="day-status-title" className="day-status-label">Bien-être aujourd’hui</h2>

  if (!w.source) {
    return (
      <section className="today-card mood-estimate day-status is-empty" aria-labelledby="day-status-title">
        {heading}
        {reminder || (
          <p className="day-status-from">
            {est
              ? 'Pas encore de lecture du visage aujourd’hui. Notez votre bien-être en haut.'
              : <>Notez votre bien-être en haut, ou laissez la caméra lire votre visage :{' '}
                <Link to="/connectors">à activer dans Sources</Link>.</>}
          </p>
        )}
        {est?.startCalibration && <StartCalibration cal={est.startCalibration} onAddManual={onAddManual} onReminder={onReminder} />}
      </section>
    )
  }

  return (
    <section className={`today-card mood-estimate day-status is-${w.source}`} aria-labelledby="day-status-title">
      <Link to="/tendances?mesure=wellbeing" className="day-status-main" aria-labelledby="day-status-title"
        aria-describedby="day-status-value day-status-from">
        <div className="day-status-top">
          {heading}
          <LineIcon name="chevron" size={20} className="day-status-chevron" />
        </div>
        <div className="day-status-body">
          <p id="day-status-value" className="day-status-value">
            <span className="mono day-status-number">{w.value}</span>
            <span className="mono day-status-max">/5</span>
          </p>
          <p id="day-status-from" className="day-status-from">{w.from}</p>
        </div>
        <DayCurve points={w.points} trend={w.trend} />
      </Link>
      {est?.startCalibration && <StartCalibration cal={est.startCalibration} onAddManual={onAddManual} onReminder={onReminder} />}
      {reminder}
      {!(est?.startCalibration && !est.startCalibration.notedToday) && <StripPlus label="Ajouter une note de bien-être" />}
    </section>
  )
}
