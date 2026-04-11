import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listEntries } from '../storage/localHealthStorage'
import NutritionKPIs from '../components/NutritionKPIs'
import WellbeingCharts from '../components/WellbeingCharts'
import { formatAt } from '../utils/format'

const SOURCE_LABELS = {
  app_food: 'Alimentation (app)',
  app_wellbeing: 'Bien-être (app)',
  samsung_watch: 'Montre Samsung',
  health_connect: 'Health Connect',
  scale: 'Balance connectée',
}

const TYPE_LABELS = {
  food: 'Repas',
  activity: 'Activité',
  weight: 'Poids',
  sleep: 'Sommeil',
  wellbeing: 'Bien-être',
  steps: 'Pas',
  heart_rate: 'Fréquence cardiaque',
  calories: 'Calories',
}

export default function Dashboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await listEntries({ limit: 30 })
        if (!cancelled) setEntries(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <section className="dashboard">
      <h2 className="page-title">Tableau de bord</h2>
      <p className="dashboard-intro">
        HealthTrack centralise vos données santé: <strong>alimentation</strong> (photo → ingrédients),{' '}
        <strong>montre Samsung Fit 3</strong> (pas, sommeil, fréquence cardiaque) via Health Connect,{' '}
        et bien plus. Configurez les sources dans{' '}
        <a href="/connectors" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Connecteurs</a>.
      </p>

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Chargement des données…</p>
        </div>
      )}
      {error && <div className="error-msg" role="alert">{error}</div>}

      {!loading && !error && (
        <>
          <NutritionKPIs />
          <WellbeingCharts />
          <h3 className="section-title">Dernières entrées</h3>
          {entries.length === 0 ? (
            <p className="empty-hint">
              Aucune donnée pour l’instant. <Link to="/food">Enregistrez un repas</Link> pour commencer.
            </p>
          ) : (
            <ul className="entries-list">
              {entries.map((e) => (
                <li key={e.id} className="entry-card" data-type={e.type}>
                  <div className="entry-card-header">
                    <span className="entry-type">{TYPE_LABELS[e.type] || e.type}</span>
                    <span className="entry-source">{SOURCE_LABELS[e.source] || e.source}</span>
                    <time className="entry-at">{formatAt(e.at)}</time>
                  </div>
                  <div className="entry-card-body">
                    {e.type === 'food' && e.payload?.items?.length > 0 && (
                      <ul className="entry-items">
                        {e.payload.items.slice(0, 5).map((item, i) => (
                          <li key={i}>{item.ingredient}: {item.quantity}</li>
                        ))}
                        {e.payload.items.length > 5 && (
                          <li className="entry-more">+{e.payload.items.length - 5} autres</li>
                        )}
                      </ul>
                    )}
                    {e.type === 'wellbeing' && typeof e.payload?.score === 'number' && (
                      <p className="entry-wellbeing-score">
                        Note : <strong>{e.payload.score}</strong> / 5
                      </p>
                    )}
                    {e.type === 'steps' && typeof e.payload?.value === 'number' && (
                      <p className="entry-wellbeing-score">
                        <strong>{e.payload.value.toLocaleString('fr-FR')}</strong> pas
                        {e.payload.period && ` (${e.payload.period})`}
                      </p>
                    )}
                    {e.type === 'heart_rate' && typeof e.payload?.bpm === 'number' && (
                      <p className="entry-wellbeing-score">
                        <strong>{e.payload.bpm}</strong> bpm
                        {e.payload.subtype === 'restingHeartRate' && ' (repos)'}
                        {e.payload.subtype === 'oxygenSaturation' && ' SpO₂ %'}
                        {e.payload.subtype === 'heartRateVariability' && ' HRV ms'}
                      </p>
                    )}
                    {e.type === 'heart_rate' && typeof e.payload?.value === 'number' && typeof e.payload?.bpm === 'undefined' && (
                      <p className="entry-wellbeing-score">
                        <strong>{e.payload.value}</strong> {e.payload.unit}
                        {e.payload.subtype === 'oxygenSaturation' && ' (SpO₂)'}
                        {e.payload.subtype === 'heartRateVariability' && ' (HRV)'}
                      </p>
                    )}
                    {e.type === 'calories' && typeof e.payload?.value === 'number' && (
                      <p className="entry-wellbeing-score">
                        <strong>{Math.round(e.payload.value).toLocaleString('fr-FR')}</strong> kcal
                        {e.payload.period && ` (${e.payload.period})`}
                      </p>
                    )}
                    {e.type === 'sleep' && typeof e.payload?.durationMinutes === 'number' && (
                      <p className="entry-wellbeing-score">
                        <strong>{Math.round(e.payload.durationMinutes)}</strong> min
                        {e.payload.sleepState && ` — ${e.payload.sleepState}`}
                      </p>
                    )}
                    {e.type === 'activity' && e.payload?.workoutType && (
                      <p className="entry-wellbeing-score">
                        {e.payload.workoutType}
                        {e.payload.durationSeconds && ` — ${Math.round(e.payload.durationSeconds / 60)} min`}
                        {e.payload.totalCalories && ` — ${Math.round(e.payload.totalCalories)} kcal`}
                      </p>
                    )}
                    {!['food', 'wellbeing', 'steps', 'heart_rate', 'calories', 'sleep', 'activity'].includes(e.type) && (
                      <pre className="entry-payload">{JSON.stringify(e.payload, null, 0)}</pre>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
