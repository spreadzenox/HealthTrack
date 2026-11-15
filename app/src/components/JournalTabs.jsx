import { Link, useLocation } from 'react-router-dom'

const ITEMS = [
  { to: '/tendances', label: 'Tendances' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/food', label: 'Repas' },
  { to: '/journal', label: 'Jours' },
]

/**
 * Sous-onglets de « Données » (refonte « Compagnon », étape 2) : Tendances d'abord, puis la nutrition, les repas et,
 * en dernier, les jours (le Journal jour par jour, supprimé à l'étape 7).
 */
export default function JournalTabs() {
  const { pathname } = useLocation()
  return (
    <nav className="journal-tabs" aria-label="Données">
      {ITEMS.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + '/')
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
