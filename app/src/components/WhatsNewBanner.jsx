import { useReducer } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useChangelog } from '../hooks/useChangelog'
import { bannerHeadline, getLastSeenId, getUnseenEntries, markAllSeen } from '../services/whatsNew'
import './WhatsNew.css'

// Au-delà de 3, un compte (« et 98 autres changements ») fait peur après une absence (POLISH-SIM-135).
function othersLabel(others) {
  if (others < 1) return ''
  if (others > 3) return ' et d’autres nouveautés'
  return others === 1 ? ' et 1 autre changement' : ` et ${others} autres changements`
}

export default function WhatsNewBanner({ changelog: given }) {
  const changelog = useChangelog(given)
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
        <strong>Nouveau :</strong> {bannerHeadline(unseen).title}
        {othersLabel(unseen.length - 1)}
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
