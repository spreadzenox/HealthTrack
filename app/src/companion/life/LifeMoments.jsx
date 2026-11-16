/**
 * Les moments du compagnon hors de Ma journée (lot VIE, étape 12), montés une fois dans Layout :
 * - la rencontre, une seule fois, pour un utilisateur qui met à jour depuis une version d'avant la refonte (son
 *   accueil est fini : il ne le refait pas) ;
 * - `app:opened` sur le bus à l'ouverture (CONTRAT.md § 4 : réveil le matin, salut, « Bon retour »).
 * Jamais pendant l'onboarding ni sur le retour de connexion Withings.
 */
import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { loadOnboarding } from '../../settings/onboarding'
import { needsMeeting } from './companionState'
import { emitAppOpened, wasOpened } from './appOpened'

// Styles chargés d'emblée, comme tout le CSS (bundleGuard) ; le composant arrive à la demande
import './MeetPilou.css'
import './OnboardingPilou.css'

const MeetPilou = lazy(() => import('./MeetPilou'))

export default function LifeMoments() {
  const { pathname } = useLocation()
  const away = pathname.startsWith('/bienvenue') || pathname.startsWith('/connectors/withings')
  // Relu à chaque changement de page : un accueil fini sans rencontre (ancien parcours repris) l'amène à la sortie
  const [closed, setClosed] = useState(false)
  const meet = !closed && !away && needsMeeting(loadOnboarding())
  useEffect(() => {
    if (!wasOpened()) emitAppOpened()
  }, [])
  if (!meet || away) return null
  return (
    <div className="meet-overlay" role="dialog" aria-modal="true" aria-label="La rencontre">
      <Suspense fallback={null}>
        <MeetPilou mode="update" onDone={() => setClosed(true)} />
      </Suspense>
    </div>
  )
}
