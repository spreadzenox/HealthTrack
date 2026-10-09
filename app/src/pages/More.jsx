import { Link } from 'react-router-dom'
import { CHANGELOG } from '../data/changelog'
import { getLastSeenId, getUnseenEntries } from '../services/whatsNew'
import './More.css'

const ITEMS = [
  { to: '/data', icon: '🗂️', title: 'Données', desc: 'Sauvegarde, import et historique de vos saisies' },
  { to: '/connectors', icon: '⌚', title: 'Connecteurs', desc: 'Montre, balance, Health Connect, Withings' },
  { to: '/settings', icon: '⚙️', title: 'Paramètres', desc: 'Clé Gemini, modèle d’analyse photo' },
  { to: '/nouveautes', icon: '✨', title: 'Nouveautés', desc: 'Ce qui a changé dans l’application' },
]

export default function More({ changelog = CHANGELOG }) {
  const unseen = getUnseenEntries(changelog, getLastSeenId()).length

  return (
    <section className="food-page">
      <h2 className="page-title">Plus</h2>
      <ul className="more-list">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="more-item">
              <span className="more-icon" aria-hidden="true">{item.icon}</span>
              <span className="more-text">
                <span className="more-title">{item.title}</span>
                <span className="more-desc">{item.desc}</span>
              </span>
              {item.to === '/nouveautes' && unseen > 0 && (
                <span className="more-badge">{unseen} non lue{unseen > 1 ? 's' : ''}</span>
              )}
              <span className="more-chevron" aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
