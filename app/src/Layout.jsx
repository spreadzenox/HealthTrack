import { Outlet, NavLink } from 'react-router-dom'
import UpdateBanner from './components/UpdateBanner'
import WellbeingPrompt from './components/WellbeingPrompt'
import './App.css'

export default function Layout() {
  return (
    <div className="app">
      <WellbeingPrompt />
      <UpdateBanner />
      <header className="header">
        <div className="header-brand">
          <img className="header-logo" src="/favicon.svg" alt="" width={48} height={48} decoding="async" />
          <h1>HealthTrack</h1>
        </div>
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
          <NavLink to="/settings" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Paramètres
          </NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
