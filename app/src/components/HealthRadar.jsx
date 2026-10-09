import { useState, useEffect, useCallback } from 'react'
import { listEntries } from '../storage/localHealthStorage'
import { computeRadar, RADAR_DAYS, RADAR_BASELINE_DAYS } from '../services/radar'
import { localDateKey } from '../services/wellbeingSeries'
import { formatDuration } from '../utils/format'
import './HealthRadar.css'

const HISTORY_DAYS = RADAR_DAYS + RADAR_BASELINE_DAYS + 2

const BADGES = {
  calm: 'Rien d’inhabituel',
  watch: 'À surveiller',
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

function checkedList(metrics) {
  const names = metrics.map((m) => (m.key === 'sleepMinutes' ? 'sommeil' : m.label))
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}` : names[0]
}

export default function HealthRadar() {
  const [state, setState] = useState(null)

  const load = useCallback(async () => {
    try {
      const since = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString()
      const [heart, sleep] = await Promise.all([
        listEntries({ type: 'heart_rate', since, limit: Infinity }),
        listEntries({ type: 'sleep', since, limit: Infinity }),
      ])
      const entries = [...heart, ...sleep]
      const hasData = entries.some((e) => e.type === 'sleep' || ['restingHeartRate', 'heartRateVariability'].includes(e.payload?.subtype))
      setState({ hasData, radar: computeRadar(entries) })
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
  const { radar } = state
  const flagged = radar.level === 'watch' || radar.level === 'alert'

  return (
    <section className={`radar is-${radar.level}`} aria-labelledby="radar-title">
      <div className="radar-header">
        <h3 id="radar-title" className="radar-title">Radar forme</h3>
        {(radar.level === 'calm' || flagged) && (
          <span className="radar-badge">
            {radar.level === 'alert' ? `Depuis ${radar.streak} jours` : BADGES[radar.level]}
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
                <span className="radar-signal-usual"> (habituellement {formatValue(s.metric, s.typical)})</span>
              </li>
            ))}
          </ul>
          {radar.level === 'watch' ? (
            <p className="radar-advice">
              Un jour isolé est fréquent : nuit courte, alcool, stress, entraînement intense… Ménagez-vous et voyez
              si cela se confirme demain.
            </p>
          ) : (
            <p className="radar-advice" role="note">
              Ce type d’écart prolongé accompagne souvent la fatigue, le surmenage ou le début d’une infection.
              Priorisez le repos et le sommeil, hydratez-vous et allégez l’entraînement. En cas de fièvre ou de
              symptômes qui persistent, consultez un professionnel de santé.
            </p>
          )}
        </>
      )}

      {radar.level !== 'insufficient' && (
        <p className="radar-footnote">
          Chaque jour est comparé à votre norme des {RADAR_BASELINE_DAYS} jours précédents. Alerte seulement si au moins
          deux signaux s’écartent ensemble. Une observation, pas un diagnostic.
        </p>
      )}
    </section>
  )
}
