import { Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import UpdateBanner from './components/UpdateBanner'
import WhatsNewBanner from './components/WhatsNewBanner'
import FaceReadIndicator from './components/FaceReadIndicator'
import TabBar from './components/TabBar'
import SettingsButton from './components/SettingsButton'
import { APP_NAME } from './config/brand'
import { useAutoSync } from './hooks/useAutoSync'
import TourHost from './components/TourHost'
import { FEATURES } from './config/distribution'
import { loadOnboarding, needsOnboarding } from './settings/onboarding'
import { takePortionOpen } from './services/fodmapReminder'
import './App.css'

/** Pendant le chargement d'une page (fichier séparé, quelques ms). */
function PageLoading() {
  return (
    <div className="loading" role="status">
      <div className="spinner" aria-hidden />
    </div>
  )
}

/** Variante play : suit les achats Google Play (jalon 6c-3c) et le rappel de fin d'essai pendant toute la vie de l'app. */
function usePurchaseWatch() {
  useEffect(() => {
    if (!FEATURES.billing) return undefined
    let stop = null
    let alive = true
    Promise.all([
      import('./services/playBilling').then(({ startPurchaseWatch }) => startPurchaseWatch()),
      // rappel local 2 jours avant la fin de l'essai (VC-18b)
      import('./services/trialReminder').then(({ startTrialReminderWatch }) => startTrialReminderWatch()),
    ])
      .then((fns) => {
        const fn = () => fns.forEach((f) => f())
        if (alive) stop = fn
        else fn()
      })
      .catch(() => {})
    return () => {
      alive = false
      stop?.()
    }
  }, [])
}

/**
 * Premier lancement sur une base vide : ouvre l'onboarding (jalon 4). Jamais après une mise à jour chez quelqu'un
 * qui a déjà des données (settings/onboarding.js), ni sur le retour de connexion Withings.
 * Rend `true` tant que la réponse n'est pas connue : la page (l'Accueil et ses calculs) attend alors, au lieu de se
 * monter pour rien et de s'afficher un instant avant « Bienvenue » (C4, premier lancement). Onboarding déjà fait :
 * aucune attente.
 */
function useOnboardingRedirect() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [pending, setPending] = useState(() => !pathname.startsWith('/connectors/withings') && !loadOnboarding().done)
  useEffect(() => {
    if (!pending) return undefined
    let alive = true
    // l'écran d'accueil de l'onboarding se télécharge pendant qu'on compte les entrées
    import('./pages/Onboarding').catch(() => {})
    needsOnboarding()
      .catch(() => false)
      .then((needed) => {
        if (!alive) return
        if (needed) navigate('/bienvenue', { replace: true })
        else setPending(false)
      })
    return () => {
      alive = false
    }
    // Une seule fois, à l'ouverture de l'app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return pending
}

/** Rappel « Votre portion du jour » touché (réintroduction guidée, 7b-2) : on ouvre la réintroduction. */
function usePortionOpen() {
  const navigate = useNavigate()
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return
      takePortionOpen().then((open) => open && navigate('/reintroduction'))
    }
    check()
    document.addEventListener('visibilitychange', check)
    return () => document.removeEventListener('visibilitychange', check)
  }, [navigate])
}

export default function Layout() {
  const onboardingPending = useOnboardingRedirect()
  usePortionOpen()
  useAutoSync()
  usePurchaseWatch()
  // Nouvelle page = en haut de la page (sinon on arrive au milieu, à la hauteur de la page précédente).
  // useLayoutEffect : appliqué au même rendu que la nouvelle page (avec useEffect, elle s'affichait
  // un instant à l'ancienne hauteur — et le test App échouait au hasard en CI).
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0
  }, [pathname])
  return (
    <div className="app">
      <UpdateBanner />
      <FaceReadIndicator />
      <header className="header">
        <img className="header-logo" src="/favicon.svg" alt="" width={32} height={32} decoding="async" />
        <h1>{APP_NAME}</h1>
        <SettingsButton />
      </header>
      <main className="main">
        <WhatsNewBanner />
        {onboardingPending ? (
          <PageLoading />
        ) : (
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        )}
      </main>
      <TabBar />
      {!onboardingPending && !pathname.startsWith('/bienvenue') && <TourHost />}
    </div>
  )
}
