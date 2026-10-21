import { Link, useLocation } from 'react-router-dom'

const ITEMS = [
  { to: '/food', label: 'Repas' },
  { to: '/nutrition', label: 'Nutrition' },
]

/** Sous-onglets de « Journal » (jalon 2c) : Nutrition n'a plus son propre onglet. */
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
