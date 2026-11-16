import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Dashboard from './pages/Dashboard'
import './pageStyles'
import { DebugProvider } from './contexts/DebugContext'
import { loadNutritionTable } from './data/nutritionTable'
import { ensureGoalsMigrated } from './settings/onboarding'
import { PILOU_PHOTO } from './companion/photo/flag'

// Perf D2 : seul l'Accueil est dans le fichier principal ; les autres pages arrivent à la demande
// (fichiers séparés, chargés en quelques ms depuis l'APK). Celles qui calculent des nutriments
// attendent aussi la table Ciqual, pour ne jamais s'afficher sans elle.
const withNutrition = (load) => lazy(() => Promise.all([load(), loadNutritionTable()]).then(([mod]) => mod))
const Food = withNutrition(() => import('./pages/Food'))
const Nutrition = withNutrition(() => import('./pages/Nutrition'))
const Recommendations = withNutrition(() => import('./pages/Recommendations'))
const Objectives = lazy(() => import('./pages/Objectives'))
const Trends = lazy(() => import('./pages/Trends'))
const Data = lazy(() => import('./pages/Data'))
const Connectors = lazy(() => import('./pages/Connectors'))
const Settings = lazy(() => import('./pages/Settings'))
const WithingsCallback = lazy(() => import('./pages/WithingsCallback'))
const WhatsNew = lazy(() => import('./pages/WhatsNew'))
const More = lazy(() => import('./pages/More'))
const WatchData = lazy(() => import('./pages/WatchData'))
const Premium = lazy(() => import('./pages/Premium'))
const Reintroduction = lazy(() => import('./pages/Reintroduction'))
const Act = lazy(() => import('./pages/Act'))
const Trial = lazy(() => import('./pages/Trial'))
const Licences = lazy(() => import('./pages/Licences'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
// Double numérique par photo (étape 15) : route absente tant que l'interrupteur de build est éteint (défaut)
const PilouPhotoPage = lazy(() => import('./companion/photo/PilouPhotoPage'))

export default function App() {
  // Refonte étape 5a : objectifs d'avant la refonte convertis une fois (bien-être toujours, confort digestif facultatif)
  useEffect(() => {
    ensureGoalsMigrated().catch(() => {})
  }, [])
  return (
    <DebugProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="bienvenue"
            element={
              <Suspense fallback={null}>
                <Onboarding />
              </Suspense>
            }
          />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard key="home" />} />
            {/* Refonte « Compagnon », étape 2 : Ma journée, ce qui se note à la main (même module que l'Accueil) */}
            <Route path="ma-journee" element={<Dashboard key="day" view="day" />} />
            <Route path="tendances" element={<Trends />} />
            <Route path="food" element={<Food />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route path="data" element={<Data />} />
            <Route path="connectors" element={<Connectors />} />
            <Route path="settings" element={<Settings />} />
            {/* REFONTE-6a : Objectifs s'ouvre sur les cartes des objectifs ; chaque carte mène à son détail */}
            <Route path="recommendations" element={<Objectives />} />
            <Route path="recommendations/bien-etre" element={<Recommendations />} />
            <Route path="recommendations/bien-etre/famille/:family" element={<Recommendations />} />
            <Route path="recommendations/ventre" element={<Recommendations key="gut" view="gut" />} />
            <Route path="recommendations/ventre/famille/:family" element={<Recommendations key="gut" view="gut" />} />
            <Route path="plus" element={<More />} />
            <Route path="nouveautes" element={<WhatsNew />} />
            <Route path="montre" element={<WatchData />} />
            <Route path="premium" element={<Premium />} />
            {/* ORG-3b : l'historique du bien-être est la vue Jour de Données › Tendances */}
            <Route path="bien-etre" element={<Navigate to="/tendances?vue=jour" replace />} />
            {/* REFONTE-7b : le Journal jour par jour rejoint Tendances (détail du jour, « Vos saisies ») */}
            <Route path="journal" element={<Navigate to="/tendances?vue=jour" replace />} />
            <Route path="reintroduction" element={<Reintroduction />} />
            <Route path="agir" element={<Act />} />
            <Route path="agir/essai/:id" element={<Trial />} />
            <Route path="licences" element={<Licences />} />
            {PILOU_PHOTO && <Route path="pilou/photo" element={<PilouPhotoPage />} />}
            <Route path="connectors/withings/callback" element={<WithingsCallback />} />
            {/* Adresse inconnue (ancienne notification, lien périmé) : l'Accueil plutôt qu'une page blanche. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DebugProvider>
  )
}
