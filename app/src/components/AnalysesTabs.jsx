import { Link, useLocation } from 'react-router-dom'
import { gutCardMode } from '../settings/onboarding'

const ITEMS = [
  { to: '/recommendations', label: 'Bien-être', exact: true },
  { to: '/recommendations/ventre', label: 'Ventre', gut: true },
  { to: '/reintroduction', label: 'FODMAP', gut: true },
  { to: '/tendances', label: 'Tendances' },
]

/**
 * Sous-onglets de « Analyses » (retours du propriétaire du 04/11, point 4) : ce qui porte sur le bien-être, ce qui
 * porte sur le ventre, la réintroduction FODMAP et les tendances (sorties du Journal). Ventre et FODMAP seulement
 * pour qui suit son ventre, comme la carte de l'Accueil (POL-4) : rien n'est effacé.
 */
export default function AnalysesTabs() {
  const { pathname } = useLocation()
  const showGut = gutCardMode() !== 'hide'
  return (
    <nav className="journal-tabs" aria-label="Analyses">
      {ITEMS.filter((item) => showGut || !item.gut).map((item) => {
        const active = pathname === item.to || (!item.exact && pathname.startsWith(item.to + '/'))
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
