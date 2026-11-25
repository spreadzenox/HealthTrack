import { Link, useLocation } from 'react-router-dom'
import { activeTab } from './tabs'

// `paths` : écrans rangés sous l'onglet (Repas, l'historique complet des repas, s'ouvre depuis Nutrition)
const ITEMS = [
  { to: '/tendances', label: 'Tendances', paths: ['/tendances'] },
  { to: '/nutrition', label: 'Nutrition', paths: ['/nutrition', '/food'] },
]

/**
 * Sous-onglets de « Données » (refonte « Compagnon », étape 7b) : Tendances, l'écran de visualisation, puis Nutrition.
 * Le Journal jour par jour n'a plus d'onglet : le détail d'un jour vit dans Tendances (7a), `/journal` y mène.
 * POLISH-SIM-162 : absents quand la page vient d'un autre onglet (Repas ouverte depuis Ma journée ou l'Accueil).
 */
export default function JournalTabs() {
  const { pathname, state } = useLocation()
  if (activeTab(pathname, state) !== '/tendances') return null
  return (
    <nav className="journal-tabs" aria-label="Données">
      {ITEMS.map((item) => {
        const active = item.paths.some((p) => pathname === p || pathname.startsWith(p + '/'))
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={'journal-tab' + (active ? ' active' : '')}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
