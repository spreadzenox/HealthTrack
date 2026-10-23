import { Suspense, useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import UpdateBanner from './components/UpdateBanner'
import WellbeingPrompt from './components/WellbeingPrompt'
import WhatsNewBanner from './components/WhatsNewBanner'
import FaceReadIndicator from './components/FaceReadIndicator'
import TabBar from './components/TabBar'
import SettingsButton from './components/SettingsButton'
import { APP_NAME } from './config/brand'
import { useAutoSync } from './hooks/useAutoSync'
import { FEATURES } from './config/distribution'
import './App.css'

/** Pendant le chargement d'une page (fichier séparé, quelques ms). */
function PageLoading() {
  return (
    <div className="loading" role="status">
      <div className="spinner" aria-hidden />
    </div>
  )
}

/** Variante play : suit les achats Google Play pendant toute la vie de l'app (jalon 6c-3c). */
function usePurchaseWatch() {
  useEffect(() => {
    if (!FEATURES.billing) return undefined
    let stop = null
    let alive = true
    import('./services/playBilling')
      .then(({ startPurchaseWatch }) => startPurchaseWatch())
      .then((fn) => {
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

export default function Layout() {
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
      <WellbeingPrompt />
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
