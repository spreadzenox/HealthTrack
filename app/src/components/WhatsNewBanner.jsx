import { useReducer } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CHANGELOG } from '../data/changelog'
import { getLastSeenId, getUnseenEntries, markAllSeen } from '../services/whatsNew'
import './WhatsNew.css'

export default function WhatsNewBanner({ changelog = CHANGELOG }) {
  // Relu à chaque navigation : la page Nouveautés marque tout comme vu.
  const { pathname } = useLocation()
  const [, rerender] = useReducer((n) => n + 1, 0)
  const unseen = getUnseenEntries(changelog, getLastSeenId())

  if (!unseen.length || pathname === '/nouveautes') return null

  const dismiss = () => {
    markAllSeen(changelog)
    rerender()
  }

  return (
    <div className="whats-new-banner" role="status">
      <p className="whats-new-banner-text">
        <strong>Nouveau :</strong> {unseen[0].title}
        {unseen.length > 1 && ` et ${unseen.length - 1} autre${unseen.length > 2 ? 's' : ''} changement${unseen.length > 2 ? 's' : ''}`}
      </p>
      <div className="whats-new-banner-actions">
        <Link to="/nouveautes" className="whats-new-banner-link">
          Voir
        </Link>
        <button type="button" className="whats-new-banner-close" onClick={dismiss} aria-label="Masquer les nouveautés">
          ×
        </button>
      </div>
    </div>
  )
}
