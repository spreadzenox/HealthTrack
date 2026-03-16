import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listEntries } from '../storage/localHealthStorage'
import NutritionKPIs from '../components/NutritionKPIs'

const SOURCE_LABELS = {
  app_food: 'Alimentation (app)',
  samsung_watch: 'Montre Samsung',
  scale: 'Balance connectée',
}

const TYPE_LABELS = {
  food: 'Repas',
  activity: 'Activité',
  weight: 'Poids',
  sleep: 'Sommeil',
}

function formatAt(at) {
  if (!at) return ''
  try {
    const d = new Date(at)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return at
  }
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
        HealthTrack centralise vos données santé. Aujourd’hui : <strong>alimentation</strong> (photo → ingrédients et quantités).
        Bientôt : <strong>montre Samsung</strong> (activité, sommeil) et <strong>balance connectée</strong> (poids).
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
                    {e.type !== 'food' && (
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
