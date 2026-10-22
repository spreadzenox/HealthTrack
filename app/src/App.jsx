import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import Dashboard from './pages/Dashboard'
import './pageStyles'
import { DebugProvider } from './contexts/DebugContext'
import { loadNutritionTable } from './data/nutritionTable'

// Perf D2 : seul l'Accueil est dans le fichier principal ; les autres pages arrivent à la demande
// (fichiers séparés, chargés en quelques ms depuis l'APK). Celles qui calculent des nutriments
// attendent aussi la table Ciqual, pour ne jamais s'afficher sans elle.
const withNutrition = (load) => lazy(() => Promise.all([load(), loadNutritionTable()]).then(([mod]) => mod))
const Food = withNutrition(() => import('./pages/Food'))
const Nutrition = withNutrition(() => import('./pages/Nutrition'))
const Recommendations = withNutrition(() => import('./pages/Recommendations'))
const Journal = lazy(() => import('./pages/Journal'))
const Trends = lazy(() => import('./pages/Trends'))
const Data = lazy(() => import('./pages/Data'))
const Connectors = lazy(() => import('./pages/Connectors'))
const Settings = lazy(() => import('./pages/Settings'))
const WithingsCallback = lazy(() => import('./pages/WithingsCallback'))
const WhatsNew = lazy(() => import('./pages/WhatsNew'))
const More = lazy(() => import('./pages/More'))
const WatchData = lazy(() => import('./pages/WatchData'))

export default function App() {
  return (
    <DebugProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="journal" element={<Journal />} />
            <Route path="tendances" element={<Trends />} />
            <Route path="food" element={<Food />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route path="data" element={<Data />} />
            <Route path="connectors" element={<Connectors />} />
            <Route path="settings" element={<Settings />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="plus" element={<More />} />
            <Route path="nouveautes" element={<WhatsNew />} />
            <Route path="montre" element={<WatchData />} />
            <Route path="connectors/withings/callback" element={<WithingsCallback />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DebugProvider>
  )
}
