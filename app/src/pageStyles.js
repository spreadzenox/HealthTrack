/**
 * Feuilles de style des pages chargées à la demande (perf D2), importées d'emblée et dans l'ordre
 * d'avant le découpage : des styles partagés (`.page-title`, champs…) vivent dans le CSS d'autres
 * pages, et la cascade dépend de cet ordre. Le CSS ne pèse que 53 ko ; seul le JS est différé.
 * `bundleGuard.test.js` vérifie que tout fichier CSS de `src/` est atteint d'emblée.
 */
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
