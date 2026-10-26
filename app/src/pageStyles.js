/**
 * Feuilles de style des pages chargées à la demande (perf D2), importées d'emblée et dans l'ordre
 * d'avant le découpage : des styles partagés (`.page-title`, champs…) vivent dans le CSS d'autres
 * pages, et la cascade dépend de cet ordre. Le CSS ne pèse que 53 ko ; seul le JS est différé.
 * `bundleGuard.test.js` vérifie que tout fichier CSS de `src/` est atteint d'emblée.
 */
// Avant le 21/10 18:30, arrivaient par l'accueil (forme et courbes, désormais dans Journal → Tendances) : même rang
import './components/WellbeingCharts.css'
import './components/HealthRadar.css'
import './components/BaselineCards.css'
import './components/MethodNote.css'
// Avant le 21/10 16:30, arrivait par l'accueil (journal des jours, désormais chargé à la demande) : même rang
import './components/MealEditor.css'
import './Food.css'
import './components/DebugPanel.css'
import './components/WatchGuides.css'
import './components/MyDevices.css'
import './components/BleDevices.css'
import './components/WatchDiagnostic.css'
import './components/WeatherCard.css'
import './components/PhoneUsageCard.css'
import './pages/Connectors.css'
import './pages/Recommendations.css'
import './pages/Nutrition.css'
import './pages/More.css'
import './pages/WatchData.css'
import './pages/Premium.css'
import './pages/Onboarding.css'
// Historique du bien-être (POL-2, 24/10)
import './pages/WellbeingHistory.css'
// Ligne « Bientôt » partagée par Analyses et Tendances (POL-6, 25/10)
import './components/SoonList.css'
// Pistes repas → ventre dans Analyses (jalon 5, 26/10)
import './components/GutLinks.css'
