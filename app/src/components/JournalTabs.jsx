import { Link, useLocation } from 'react-router-dom'

const ITEMS = [
  { to: '/journal', label: 'Jours' },
  { to: '/food', label: 'Repas' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/tendances', label: 'Tendances' },
]

/** Sous-onglets de « Journal » : vos jours, vos repas, la nutrition et les tendances (de retour ici, ORG-3 du 07/11). */
export default function JournalTabs() {
  const { pathname } = useLocation()
  return (
    <nav className="journal-tabs" aria-label="Journal">
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
