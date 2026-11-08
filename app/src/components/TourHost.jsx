/**
 * Hôte de la visite guidée (ACC-8) dans Layout : la visite (et ses données fictives) ne se charge que quand elle
 * s'ouvre, à la fin de l'accueil (`tour: 'pending'`) ou sur « Voir un exemple ».
 */
import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { loadOnboarding } from '../settings/onboarding'
import { TOUR_START_EVENT } from '../services/tour'

const GuidedTour = lazy(() => import('./GuidedTour'))

export default function TourHost() {
  const [run, setRun] = useState(() => (loadOnboarding().tour === 'pending' ? 1 : 0))
  useEffect(() => {
    const start = () => setRun((r) => r + 1)
    window.addEventListener(TOUR_START_EVENT, start)
    return () => window.removeEventListener(TOUR_START_EVENT, start)
  }, [])
  const close = useCallback(() => setRun(0), [])
  if (!run) return null
  return (
    <Suspense fallback={null}>
      <GuidedTour key={run} onClose={close} />
    </Suspense>
  )
}
