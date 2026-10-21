import { Link, useLocation } from 'react-router-dom'

const ITEMS = [
  { to: '/journal', label: 'Jours' },
  { to: '/food', label: 'Repas' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/tendances', label: 'Tendances' },
]

/** Sous-onglets de « Journal » (jalons 2c, 2c-2 et 2b) : vos jours, vos repas, la nutrition, vos tendances. */
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
