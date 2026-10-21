import { Link, useLocation } from 'react-router-dom'
import './TabBar.css'

const ICONS = {
  today: (
    <>
      <circle className="tabbar-dot" cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  journal: (
    <>
      <path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z" />
      <path d="M6 3v18M10 8h5M10 12h5" />
    </>
  ),
  pistes: <path d="M3 3v18h18M7 15l4-4 3 3 6-7" />,
  sources: (
    <>
      <rect x="7" y="6" width="10" height="12" rx="3" />
      <path d="M9 6V3h6v3M9 18v3h6v-3M12 10v2l1.5 1" />
    </>
  ),
}

/**
 * Navigation en 4 onglets de la maquette validée (jalon 2c). Les réglages (Données, Paramètres,
 * Nouveautés) passent par le bouton en haut à droite (SettingsButton) : aucun onglet n'y est actif.
 * `paths` : préfixes de pages rangées sous l'onglet (Repas et Nutrition sous Journal, retour Withings sous Sources).
 */
const TABS = [
  { to: '/', label: 'Aujourd’hui', icon: 'today', end: true },
  { to: '/journal', label: 'Journal', icon: 'journal', paths: ['/journal', '/food', '/nutrition'] },
  { to: '/recommendations', label: 'Pistes', icon: 'pistes' },
  { to: '/connectors', label: 'Sources', icon: 'sources' },
]

export default function TabBar() {
  const { pathname } = useLocation()
  const isUnder = (p) => pathname === p || pathname.startsWith(p + '/')
  const isActive = (tab) => (tab.end ? pathname === tab.to : (tab.paths || [tab.to]).some(isUnder))

  return (
    <nav className="tabbar" aria-label="Principal">
      {TABS.map((tab) => {
        const active = isActive(tab)
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            className={'tabbar-link' + (active ? ' active' : '')}
          >
            <span className="tabbar-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                {ICONS[tab.icon]}
              </svg>
            </span>
            <span className="tabbar-label">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
