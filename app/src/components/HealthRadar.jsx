import { useState, useEffect, useCallback } from 'react'
import { listEntries } from '../storage/localHealthStorage'
import { computeRadar, explainRadar, RADAR_DAYS, RADAR_BASELINE_DAYS } from '../services/radar'
import { BASELINE_METRICS } from '../services/baselines'
import { localDateKey } from '../services/wellbeingSeries'
import { formatDuration } from '../utils/format'
import './HealthRadar.css'

const HISTORY_DAYS = RADAR_DAYS + RADAR_BASELINE_DAYS + 2

const BADGES = {
  calm: 'Rien d’inhabituel',
  watch: 'Inhabituel chez vous',
}

const fmt = (v) => Math.round(v).toLocaleString('fr-FR')

function formatValue(metric, v) {
  return metric.key === 'sleepMinutes' ? formatDuration(v) : `${fmt(v)} ${metric.unit}`
}

function dayLabel(dateKey) {
  const today = new Date()
  if (dateKey === localDateKey(today.toISOString())) return 'Aujourd’hui'
  const y = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12)
  if (dateKey === localDateKey(y.toISOString())) return 'Hier'
  const [yy, mm, dd] = dateKey.split('-').map(Number)
  const d = new Date(yy, mm - 1, dd)
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** « l’alcool (hier), le voyage (aujourd’hui) » */
function causeList(causes) {
  const parts = causes.map((c) => `${c.tag.emoji} ${c.tag.label} (${dayLabel(c.dateKey).toLowerCase()})`)
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0]
}

// FC et VFC sont féminines, le sommeil masculin
function directionLabel(s) {
  const e = s.metric.key === 'sleepMinutes' ? '' : 'e'
  return s.direction === 'above' ? `plus haut${e} que d’habitude` : `plus bas${e} que d’habitude`
}

function checkedList(metrics) {
  const names = metrics.map((m) => (m.key === 'sleepMinutes' ? 'sommeil' : m.label))
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}` : names[0]
}

export default function HealthRadar() {
  const [state, setState] = useState(null)

  const load = useCallback(async () => {
    try {
      const since = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString()
      const [heart, sleep, wellbeing, workouts, meals] = await Promise.all([
        // FC repos et VFC seulement (une valeur par jour), pas les tranches de FC / SpO₂ (perf D2)
        listEntries({ type: 'heart_rate', subtypes: Object.keys(BASELINE_METRICS), since, limit: Infinity }),
        listEntries({ type: 'sleep', since, limit: Infinity }),
        listEntries({ type: 'wellbeing', since, limit: Infinity }),
        // Séances du soir et repas tardifs comptent comme causes sans être cochés
        listEntries({ type: 'activity', since, limit: Infinity }),
        listEntries({ type: 'food', since, limit: Infinity }),
      ])
      const entries = [...heart, ...sleep]
      const hasData = entries.some((e) => e.type === 'sleep' || ['restingHeartRate', 'heartRateVariability'].includes(e.payload?.subtype))
      const radar = computeRadar(entries)
      setState({ hasData, radar, why: explainRadar(radar, [...wellbeing, ...workouts, ...meals]) })
    } catch {
      setState({ hasData: false })
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement asynchrone depuis IndexedDB
    load()
    window.addEventListener('health-entries-updated', load)
    return () => window.removeEventListener('health-entries-updated', load)
  }, [load])

  if (!state?.hasData) return null
  const { radar, why } = state
  const flagged = radar.level === 'watch' || radar.level === 'alert'
  const explained = flagged && why?.explained && !why.sick
  // D6 : un écart qui ne va pas dans le sens « fatigue » de l'hypothèse générale n'est ni coloré en alerte ni commenté
  const neutral = flagged && !radar.generalFatigue

  return (
    <section
      className={`radar is-${radar.level}${explained ? ' is-explained' : ''}${neutral ? ' is-neutral' : ''}`}
      aria-labelledby="radar-title"
    >
      <div className="radar-header">
        <h3 id="radar-title" className="radar-title">Radar forme</h3>
        {(radar.level === 'calm' || flagged) && (
          <span className="radar-badge">
            {explained ? 'Explicable' : radar.level === 'alert' ? `Depuis ${radar.streak} jours` : BADGES[radar.level]}
          </span>
        )}
      </div>

      {radar.level === 'insufficient' && (
        <p className="radar-text">
          Le radar s’active après 2 semaines de mesures d’au moins deux signaux parmi FC au repos, VFC et sommeil :
          il signalera les jours où plusieurs s’écartent en même temps de votre norme.
        </p>
      )}

      {radar.level === 'stale' && (
        <p className="radar-text">
          Aucune mesure ces {RADAR_DAYS} derniers jours : synchronisez votre montre pour que le radar reste à jour.
        </p>
      )}

      {radar.level === 'calm' && (
        <p className="radar-text">
          {checkedList(radar.metricsChecked)} : pas d’écart simultané avec votre norme ces derniers jours.
        </p>
      )}

      {flagged && (
        <>
          <p className="radar-text">
            {dayLabel(radar.dateKey)}, {radar.signals.length} signaux s’écartent en même temps de votre norme :
          </p>
          <ul className="radar-signals">
            {radar.signals.map((s) => (
              <li key={s.metric.key}>
                <span className="radar-signal-name">{s.metric.key === 'sleepMinutes' ? 'Sommeil' : s.metric.label}</span>
                {' '}<strong>{formatValue(s.metric, s.value)}</strong>
                {' '}<span className="radar-signal-dir" role="img" aria-label={directionLabel(s)}>
                  {s.direction === 'above' ? '↑' : '↓'}
                </span>
                <span className="radar-signal-usual"> (habituellement {formatValue(s.metric, s.typical)})</span>
              </li>
            ))}
          </ul>
          {why?.sick ? (
            <p className="radar-advice" role="note">
              Vous avez noté « Malade » : reposez-vous, hydratez-vous et allégez l’entraînement. Si la fièvre ou les
              symptômes persistent ou s’aggravent, consultez un professionnel de santé.
            </p>
          ) : explained ? (
            <p className="radar-advice">
              Probablement lié à {causeList(why.causes)}, noté dans vos check-ins : ce genre d’écart passe en général en
              une à deux nuits. S’il continue sans raison, le radar vous le dira.
              {radar.level === 'alert' && radar.generalFatigue && ' En cas de fièvre ou de symptômes, consultez un professionnel de santé.'}
            </p>
          ) : neutral ? (
            <p className="radar-advice">
              Ces écarts ne vont pas dans le sens généralement associé à la fatigue. Ce qui va avec votre forme, ce sont
              vos notes de bien-être qui le diront au fil du temps.
            </p>
          ) : radar.level === 'watch' ? (
            <p className="radar-advice">
              Un jour isolé est fréquent : nuit courte, alcool, stress, entraînement intense… Voyez si cela se confirme
              demain.
            </p>
          ) : (
            <p className="radar-advice" role="note">
              Hypothèse générale : ce type d’écart prolongé accompagne souvent la fatigue, le surmenage ou le début
              d’une infection. En cas de fièvre ou de symptômes qui persistent, consultez un professionnel de santé.
            </p>
          )}
          {!explained && !why?.sick && why?.causes.length > 0 && (
            <p className="radar-advice">
              À noter : {causeList(why.causes)} peut en expliquer une partie, pas tout.
            </p>
          )}
        </>
      )}

    </section>
  )
}
