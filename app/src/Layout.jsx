import { Outlet } from 'react-router-dom'
import UpdateBanner from './components/UpdateBanner'
import WellbeingPrompt from './components/WellbeingPrompt'
import WhatsNewBanner from './components/WhatsNewBanner'
import TabBar from './components/TabBar'
import { useAutoSync } from './hooks/useAutoSync'
import './App.css'

export default function Layout() {
  useAutoSync()
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
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
