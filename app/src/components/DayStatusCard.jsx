/**
 * Statut du jour en tête de l'Accueil (TESTEUR-1c, retours du testeur iPhone du 06/11, maquette
 * journal/maquettes/aujourdhui) : « Votre journée » et un titre en deux mots, la place du jour sur l'échelle 1 à 5,
 * d'où il vient en une phrase et des étiquettes. Carte menthe : c'est du bien-être (règle de sens constant).
 * Toucher le haut de la carte ouvre l'historique du bien-être. Sans lecture ni note du jour : « Pas encore d'avis »
 * et un seul bouton pour noter.
 */
import { Link } from 'react-router-dom'
import { dayStatus } from '../services/today'
import { NOTE_CHOICES } from '../services/mood/wellbeingScale'
import { StartCalibration, UnlockReminder, ManualNoteButton } from './MoodEstimateCard'
import LineIcon from './LineIcon'
import './MoodEstimateCard.css'
import './DayStatusCard.css'

function Scale({ segment }) {
  return (
    <div className="day-status-scale" aria-hidden="true">
      <div className="day-status-segments">
        {NOTE_CHOICES.map((n) => <span key={n} className={n === segment ? 'is-on' : ''} />)}
      </div>
      <div className="day-status-legend mono"><span>1 très bas</span><span>3</span><span>5 très bien</span></div>
    </div>
  )
}

/**
 * @param {{ data: undefined | null | { est: object | null }, entries?: object[], onAddManual?: () => void,
 *   unlockReminder?: boolean, onDismissReminder?: () => void, now?: Date }} props
 *   `data` : undefined pendant la lecture du visage, null sans aucune lecture.
 */
export default function DayStatusCard({
  data, entries = [], onAddManual, unlockReminder = false, onDismissReminder, now,
}) {
  if (data === undefined) return null
  const est = data?.est ?? null
  const status = dayStatus(est, entries, now ?? new Date())
  const reminder = unlockReminder && <UnlockReminder onDismiss={onDismissReminder} />
  const heading = (
    <h2 id="day-status-title" className="day-status-heading">
      <span className="day-status-label">Votre journée</span>
      <span className="day-status-title">{status.title}</span>
    </h2>
  )

  if (!status.level) {
    return (
      <section className="today-card mood-estimate day-status is-empty" aria-labelledby="day-status-title">
        {heading}
        {reminder || (
          <p className="day-status-from">
            {est
              ? 'Pas encore de lecture du visage aujourd’hui. Dites comment vous vous sentez.'
              : <>Dites comment vous vous sentez, ou laissez la caméra lire votre visage :{' '}
                <Link to="/connectors">à activer dans Sources</Link>.</>}
          </p>
        )}
        {onAddManual && (
          <button type="button" className="btn btn-secondary day-status-note" onClick={onAddManual}>
            Noter comment je me sens
          </button>
        )}
      </section>
    )
  }

  const asking = Boolean(est?.startCalibration && !est.startCalibration.notedToday && onAddManual)
  return (
    <section className={`today-card mood-estimate day-status is-${status.level}`} aria-labelledby="day-status-title">
      <Link to="/bien-etre" className="day-status-main" aria-describedby="day-status-from">
        <div className="day-status-top">
          {heading}
          <LineIcon name="chevron" size={20} className="day-status-chevron" />
        </div>
        <Scale segment={status.segment} />
      </Link>
      <p id="day-status-from" className="day-status-from">{status.from}</p>
      {status.chips.length > 0 && (
        <div className="mood-chips">
          {status.chips.map((c) => <span key={c} className="mood-chip">{c}</span>)}
        </div>
      )}
      {est?.startCalibration && <StartCalibration cal={est.startCalibration} onAddManual={onAddManual} />}
      {reminder}
      <ManualNoteButton onClick={asking ? null : onAddManual} />
    </section>
  )
}
