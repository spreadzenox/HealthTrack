/**
 * Les moments du compagnon hors de Ma journée (lot VIE, étape 12), montés une fois dans Layout :
 * - la rencontre, une seule fois, pour un utilisateur qui met à jour depuis une version d'avant la refonte (son
 *   accueil est fini : il ne le refait pas) ;
 * - `app:opened` sur le bus à l'ouverture (CONTRAT.md § 4 : réveil le matin, salut, « Bon retour ») ;
 * - la cérémonie du jour 7, une seule fois, sur l'Accueil ou dans Objectifs (useCeremony7).
 * Jamais pendant l'onboarding ni sur le retour de connexion Withings.
 */
import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadOnboarding } from '../../settings/onboarding'
import { needsMeeting } from './companionState'
import { emitAppOpened, wasOpened } from './appOpened'
import { watchReducedMotion } from './reducedMotionRoot'
import { useCeremony7 } from './useCeremony7'
import { useCompanionName } from './useCompanionName'
import Ceremony7 from './Ceremony7'
import './Guide.css'

// Styles chargés d'emblée, comme tout le CSS (bundleGuard) ; le composant arrive à la demande
import './MeetPilou.css'
import './OnboardingPilou.css'

const MeetPilou = lazy(() => import('./MeetPilou'))

export default function LifeMoments({ read, now } = {}) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const name = useCompanionName()
  const away = pathname.startsWith('/bienvenue') || pathname.startsWith('/connectors/withings')
  // Relu à chaque changement de page : un accueil fini sans rencontre (ancien parcours repris) l'amène à la sortie
  const [closed, setClosed] = useState(false)
  const meet = !closed && !away && needsMeeting(loadOnboarding())
  useEffect(() => {
    if (!wasOpened()) emitAppOpened()
  }, [])
  // Le réglage « Mouvements réduits » de l'app coupe aussi les animations CSS de Pilou
  useEffect(() => watchReducedMotion(), [])
  const [ceremony, ceremonyDone] = useCeremony7(pathname, !away && !meet, { read, now })
  if (away) return null
  if (!meet) {
    if (!ceremony) return null
    return (
      <Ceremony7 name={name} gutDaysLeft={ceremony.gutDaysLeft}
        onSee={() => { ceremonyDone(); navigate('/recommendations') }} onClose={ceremonyDone} />
    )
  }
  return (
    <div className="meet-overlay" role="dialog" aria-modal="true" aria-label="La rencontre">
      <Suspense fallback={null}>
        <MeetPilou mode="update" onDone={() => setClosed(true)} />
      </Suspense>
    </div>
  )
}
