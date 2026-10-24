import { Suspense, useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import UpdateBanner from './components/UpdateBanner'
import WhatsNewBanner from './components/WhatsNewBanner'
import FaceReadIndicator from './components/FaceReadIndicator'
import TabBar from './components/TabBar'
import SettingsButton from './components/SettingsButton'
import { APP_NAME } from './config/brand'
import { useAutoSync } from './hooks/useAutoSync'
import { FEATURES } from './config/distribution'
import { needsOnboarding } from './settings/onboarding'
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
 */
function useOnboardingRedirect() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname.startsWith('/connectors/withings')) return undefined
    let alive = true
    needsOnboarding().then((needed) => {
      if (alive && needed) navigate('/bienvenue', { replace: true })
    })
    return () => {
      alive = false
    }
    // Une seule fois, à l'ouverture de l'app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export default function Layout() {
  useOnboardingRedirect()
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
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
    </div>
  )
}
