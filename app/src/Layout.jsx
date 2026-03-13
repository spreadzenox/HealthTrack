import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || ''
const BUILD_VERSION = import.meta.env.VITE_APP_VERSION || 'dev'
const IS_DEV = BUILD_VERSION === 'dev' || !BUILD_VERSION
const CHECK_VERSION_INTERVAL_MS = 2 * 60 * 1000
const AUTO_RELOAD_DELAY_MS = 5000

export default function Layout() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [reloadCountdown, setReloadCountdown] = useState(null)
  const checkVersion = useRef(async () => {
    if (IS_DEV) return
    try {
      const res = await fetch(`${API_BASE}/api/version`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (data.version && data.version !== BUILD_VERSION) setUpdateAvailable(true)
    } catch {}
  })

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkVersion.current()
    }
    document.addEventListener('visibilitychange', onVisibility)
    const interval = setInterval(() => checkVersion.current(), CHECK_VERSION_INTERVAL_MS)
    checkVersion.current()
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!updateAvailable) return
    const t = setTimeout(() => window.location.reload(), AUTO_RELOAD_DELAY_MS)
    setReloadCountdown(Math.ceil(AUTO_RELOAD_DELAY_MS / 1000))
    const countdown = setInterval(() => {
      setReloadCountdown((n) => (n != null && n > 1 ? n - 1 : null))
    }, 1000)
    return () => {
      clearTimeout(t)
      clearInterval(countdown)
    }
  }, [updateAvailable])

  return (
    <div className="app">
      {updateAvailable && (
        <div className="update-banner" role="alert">
          <p className="update-banner-text">
            Une nouvelle version est disponible. Rechargement automatique{reloadCountdown != null ? ` dans ${reloadCountdown} s` : ''}…
          </p>
          <button type="button" className="btn update-banner-btn" onClick={() => window.location.reload()}>
            Recharger maintenant
          </button>
        </div>
      )}
      <header className="header">
        <h1>HealthTrack</h1>
        <p className="header-sub">Hub de suivi santé</p>
        <nav className="nav" aria-label="Principal">
          <NavLink to="/" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} end>
            Tableau de bord
          </NavLink>
          <NavLink to="/food" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Alimentation
          </NavLink>
          <NavLink to="/data" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Données
          </NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
