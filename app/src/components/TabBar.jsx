import { Link, useLocation } from 'react-router-dom'
import { goalsOf, wantsGut } from '../settings/onboarding'
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
  // Agir (ORG-1) : une cible
  act: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle className="tabbar-dot" cx="12" cy="12" r="1.2" />
    </>
  ),
}

/**
 * Navigation en 4 onglets : Aujourd'hui, Journal, Analyses, Agir (jalon 2c, ORG-1 du 07/11, puis refonte « Compagnon »
 * étape 1 du 15/11 : Sources quitte la barre et se range dans Réglages). Les réglages (Sources, Données, Paramètres,
 * Nouveautés) passent par le bouton en haut à droite (SettingsButton) : aucun onglet n'y est actif.
 * `paths` : préfixes de pages rangées sous l'onglet (Repas et Nutrition sous Journal, Digestion et Tendances sous
 * Analyses, la réintroduction FODMAP sous Agir, historique du bien-être sous Aujourd'hui — POL-PLAY-82).
 */
const TABS = [
  { to: '/', label: 'Aujourd’hui', icon: 'today', end: true },
  { to: '/journal', label: 'Journal', icon: 'journal', paths: ['/journal', '/food', '/nutrition', '/tendances', '/bien-etre'] },
  { to: '/recommendations', label: 'Analyses', icon: 'pistes', paths: ['/recommendations'] },
  { to: '/agir', label: 'Agir', icon: 'act', paths: ['/agir', '/reintroduction'] },
]

/**
 * Analyses s'ouvre sur Digestion pour qui a l'objectif digestion (POLISH-SIM-33) : l'onglet
 * Bien-être reste à un geste.
 */
function tabTarget(tab) {
  if (tab.to === '/recommendations' && wantsGut(goalsOf())) return '/recommendations/ventre'
  return tab.to
}

export default function TabBar() {
  const { pathname } = useLocation()
  const isUnder = (p) => pathname === p || pathname.startsWith(p + '/')
  const isActive = (tab) =>
    (tab.end && pathname === tab.to) || (tab.paths || (tab.end ? [] : [tab.to])).some(isUnder)

  return (
    <nav className="tabbar" aria-label="Principal">
      {TABS.map((tab) => {
        const active = isActive(tab)
        return (
          <Link
            key={tab.to}
            to={tabTarget(tab)}
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
