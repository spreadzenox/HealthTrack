import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Polices embarquées (SIL OFL 1.1), jamais chargées depuis Internet : journal/DESIGN.md § 4.
import '@fontsource-variable/figtree/wght.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import './theme/tokens.css'
import './index.css'
import { initTheme } from './theme/theme'
import App from './App.jsx'
import { checkRestore } from './services/restoreGuard'

initTheme()

// Avant tout le reste : après une restauration de la sauvegarde Android, retire les secrets de l'ancien téléphone.
checkRestore().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
