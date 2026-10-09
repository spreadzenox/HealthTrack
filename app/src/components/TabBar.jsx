import { Link, useLocation } from 'react-router-dom'
import { CHANGELOG } from '../data/changelog'
import { getLastSeenId, getUnseenEntries } from '../services/whatsNew'
import './TabBar.css'

/** Pages rangées sous l'onglet « Plus » (il reste actif quand on y est). */
const MORE_PATHS = ['/plus', '/data', '/connectors', '/settings', '/nouveautes']

const ICONS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  meal: (
    <>
      <path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10" />
      <path d="M17 21V3c-2.2 1.2-3.5 3.6-3.5 7v4H17" />
    </>
  ),
  nutrition: (
    <>
      <path d="M12 7c-1.5-2-5-2.2-6.5.3C4 9.8 5 15 7.5 18.5 9 20.6 10.6 21 12 20c1.4 1 3 .6 4.5-1.5C19 15 20 9.8 18.5 7.3 17 4.8 13.5 5 12 7z" />
      <path d="M12 7c0-2 1-3.5 2.5-4" />
    </>
  ),
  analyses: <path d="M3 3v18h18M7 15l4-4 3 3 6-7" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </>
  ),
}

const TABS = [
  { to: '/', label: 'Accueil', icon: 'home', end: true },
  { to: '/food', label: 'Repas', icon: 'meal' },
  { to: '/nutrition', label: 'Nutrition', icon: 'nutrition' },
  { to: '/recommendations', label: 'Analyses', icon: 'analyses' },
  { to: '/plus', label: 'Plus', icon: 'more' },
]

export default function TabBar({ changelog = CHANGELOG }) {
  // Relu à chaque navigation (la page Nouveautés marque tout comme vu).
  const { pathname } = useLocation()
  const hasUnseen = getUnseenEntries(changelog, getLastSeenId()).length > 0
  const isUnder = (p) => pathname === p || pathname.startsWith(p + '/')
  const isActive = (tab) => {
    if (tab.to === '/plus') return MORE_PATHS.some(isUnder)
    return tab.end ? pathname === tab.to : isUnder(tab.to)
  }

  return (
    <nav className="tabbar" aria-label="Principal">
      {TABS.map((tab) => {
        const active = isActive(tab)
        const badge = tab.to === '/plus' && hasUnseen
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-label={badge ? `${tab.label} (nouveautés non lues)` : undefined}
            aria-current={active ? 'page' : undefined}
            className={'tabbar-link' + (active ? ' active' : '')}
          >
            <span className="tabbar-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                {ICONS[tab.icon]}
              </svg>
              {badge && <span className="tabbar-badge" />}
            </span>
            <span className="tabbar-label">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
