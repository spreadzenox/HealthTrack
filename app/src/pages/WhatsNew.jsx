import { useEffect, useState } from 'react'
import { CHANGELOG } from '../data/changelog'
import { getLastSeenId, getUnseenEntries, markAllSeen } from '../services/whatsNew'
import { CURRENT_VERSION } from '../services/updateCheck'
import '../Food.css'
import '../components/WhatsNew.css'

const KIND_LABELS = {
  nouveau: 'Nouveau',
  'amélioration': 'Amélioration',
  correctif: 'Correctif',
}

function formatDate(iso) {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function WhatsNew({ changelog = CHANGELOG }) {
  // Capturé à l'ouverture : les entrées restent marquées « nouveau » pendant la lecture.
  const [unseenIds] = useState(() => new Set(getUnseenEntries(changelog, getLastSeenId()).map((e) => e.id)))

  useEffect(() => {
    markAllSeen(changelog)
  }, [changelog])

  return (
    <section className="food-page whats-new-page">
      <h2 className="page-title">Nouveautés</h2>
      <p className="page-intro">Ce qui a changé dans HealthTrack, de la plus récente à la plus ancienne. Version installée : {CURRENT_VERSION}.</p>
      {changelog.length === 0 ? (
        <p className="hint">Aucune nouveauté pour le moment.</p>
      ) : (
        <ol className="whats-new-list">
          {changelog.map((entry) => (
            <li key={entry.id} className={`whats-new-entry${unseenIds.has(entry.id) ? ' is-unseen' : ''}`}>
              <div className="whats-new-entry-meta">
                <span className={`whats-new-kind kind-${entry.kind}`}>{KIND_LABELS[entry.kind] ?? entry.kind}</span>
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                {unseenIds.has(entry.id) && <span className="whats-new-dot" aria-label="non lu" />}
              </div>
              <h3 className="whats-new-entry-title">{entry.title}</h3>
              {entry.items?.length > 0 && (
                <ul className="whats-new-items">
                  {entry.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
