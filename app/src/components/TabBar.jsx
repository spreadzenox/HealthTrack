import { Link, useLocation } from 'react-router-dom'
import './TabBar.css'

const ICONS = {
  home: (
    <>
      <path d="M3.5 11 12 3.5 20.5 11" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
      <path d="M10 21v-6h4v6" />
    </>
  ),
  // Ma journée : une liste à cocher
  day: (
    <>
      <path d="m3.5 6.5 1.8 1.8 3-3.3M3.5 13l1.8 1.8 3-3.3" />
      <path d="M12 7h8.5M12 13.5h8.5M12 19.5h8.5" />
      <circle className="tabbar-dot" cx="5.5" cy="19.5" r="1.3" />
    </>
  ),
  // Objectifs : une cible
  goals: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle className="tabbar-dot" cx="12" cy="12" r="1.2" />
    </>
  ),
  data: <path d="M3 3v18h18M7 15l4-4 3 3 6-7" />,
}

/**
 * Navigation en 4 onglets : Accueil, Ma journée, Objectifs, Données (refonte « Compagnon », étape 2 du 15/11 ; avant :
 * Aujourd'hui, Journal, Analyses, Agir). Le contenu existant est rangé dans les nouveaux onglets, aucune adresse ne
 * change. Les réglages passent par le bouton en haut à droite (SettingsButton) : aucun onglet n'y est actif.
 * `exact` : pages de l'onglet à cette adresse précise (« Agir » sous Accueil, mais un essai sous Objectifs) ;
 * `paths` : préfixes de pages rangées sous l'onglet.
 */
const TABS = [
  { to: '/', label: 'Accueil', icon: 'home', exact: ['/', '/agir'] },
  { to: '/ma-journee', label: 'Ma journée', icon: 'day', paths: ['/ma-journee'] },
  { to: '/recommendations', label: 'Objectifs', icon: 'goals', paths: ['/recommendations', '/reintroduction', '/agir/essai'] },
  { to: '/tendances', label: 'Données', icon: 'data', paths: ['/tendances', '/nutrition', '/food', '/bien-etre'] },
]

export default function TabBar() {
  const { pathname } = useLocation()
  const isUnder = (p) => pathname === p || pathname.startsWith(p + '/')
  const isActive = (tab) => (tab.exact || []).includes(pathname) || (tab.paths || []).some(isUnder)

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
