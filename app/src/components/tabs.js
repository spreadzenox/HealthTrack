import { useLocation } from 'react-router-dom'

/**
 * Les 4 onglets de la refonte « Compagnon » (étape 2 du 15/11) et la règle qui dit lequel est allumé.
 * `exact` : pages de l'onglet à cette adresse précise (« Agir » sous Accueil, mais un essai sous Objectifs) ;
 * `paths` : préfixes de pages rangées sous l'onglet.
 * POLISH-SIM-162 : une page ouverte depuis un onglet avec `state.tab` (la page Repas depuis Ma journée ou l'Accueil)
 * garde cet onglet allumé, au lieu de celui où elle est rangée (Données).
 */
export const TABS = [
  { to: '/', label: 'Accueil', icon: 'home', exact: ['/', '/agir'] },
  { to: '/ma-journee', label: 'Ma journée', icon: 'day', paths: ['/ma-journee'] },
  { to: '/recommendations', label: 'Objectifs', icon: 'goals', paths: ['/recommendations', '/reintroduction', '/agir/essai'] },
  { to: '/tendances', label: 'Données', icon: 'data', paths: ['/tendances', '/nutrition', '/food', '/bien-etre'] },
]

/** Adresse de l'onglet allumé sur `pathname` (null sur une page de réglages). */
export function activeTab(pathname, state) {
  const origin = state?.tab
  if (origin && TABS.some((t) => t.to === origin)) return origin
  const isUnder = (p) => pathname === p || pathname.startsWith(p + '/')
  const tab = TABS.find((t) => (t.exact || []).includes(pathname) || (t.paths || []).some(isUnder))
  return tab ? tab.to : null
}

/** Onglet de la page affichée, à passer en `state.tab` d'un lien vers une page rangée ailleurs. */
export function useCurrentTab() {
  const { pathname, state } = useLocation()
  return activeTab(pathname, state)
}
