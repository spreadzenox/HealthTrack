import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import UpdateBanner from './components/UpdateBanner'
import WellbeingPrompt from './components/WellbeingPrompt'
import WhatsNewBanner from './components/WhatsNewBanner'
import TabBar from './components/TabBar'
import { useAutoSync } from './hooks/useAutoSync'
import './App.css'

/** Pendant le chargement d'une page (fichier séparé, quelques ms). */
function PageLoading() {
  return (
    <div className="loading" role="status">
      <div className="spinner" aria-hidden />
    </div>
  )
}

export default function Layout() {
  useAutoSync()
  // Nouvelle page = en haut de la page (sinon on arrive au milieu, à la hauteur de la page précédente)
  const { pathname } = useLocation()
  useEffect(() => {
    document.documentElement.scrollTop = 0
  }, [pathname])
  return (
    <div className="app">
      <WellbeingPrompt />
      <UpdateBanner />
      <header className="header">
        <img className="header-logo" src="/favicon.svg" alt="" width={32} height={32} decoding="async" />
        <h1>HealthTrack</h1>
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
