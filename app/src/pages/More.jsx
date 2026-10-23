import { Link } from 'react-router-dom'
import { CHANGELOG } from '../data/changelog'
import { getLastSeenId, getUnseenEntries } from '../services/whatsNew'
import { FEATURES } from '../config/distribution'
import './More.css'

const ITEMS = [
  { to: '/data', icon: '🗂️', title: 'Données', desc: 'Sauvegarde et restauration de vos données' },
  { to: '/settings', icon: '⚙️', title: 'Paramètres', desc: FEATURES.cigaretteSetting
    ? 'Apparence, analyse des repas (IA), cigarettes, diagnostic'
    : 'Apparence, analyse des repas (IA), abonnement' },
  { to: '/nouveautes', icon: '✨', title: 'Nouveautés', desc: 'Ce qui a changé dans l’application' },
  // Page statique (app/public), hors du routeur : aussi publiée par GitHub Pages et montrée par Health Connect
  { href: '/privacypolicy.html', icon: '🔒', title: 'Confidentialité', desc: 'Ce qui reste sur le téléphone, ce qui en sort et quand' },
]

export default function More({ changelog = CHANGELOG }) {
  const unseen = getUnseenEntries(changelog, getLastSeenId()).length

  return (
    <section className="food-page">
      <h2 className="page-title">Réglages</h2>
      <ul className="more-list">
        {ITEMS.map((item) => {
          const Item = item.href ? 'a' : Link
          const target = item.href ? { href: item.href } : { to: item.to }
          return (
            <li key={item.to ?? item.href}>
              <Item {...target} className="more-item">
                <span className="more-icon" aria-hidden="true">{item.icon}</span>
                <span className="more-text">
                  <span className="more-title">{item.title}</span>
                  <span className="more-desc">{item.desc}</span>
                </span>
                {item.to === '/nouveautes' && unseen > 0 && (
                  <span className="more-badge">{unseen} non lue{unseen > 1 ? 's' : ''}</span>
                )}
                <span className="more-chevron" aria-hidden="true">›</span>
              </Item>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
