// @vitest-environment node
import { describe, it, expect } from 'vitest'
import config from '../vite.config.js'

// DEM-IOS-20 (ancien correctif iPhone 41) : l'app a des pages à deux niveaux (/recommendations/ventre). Avec des
// chemins relatifs (`base: './'`), un rechargement complet sur une telle page (la WebView recharge la page courante
// quand le système a fermé son moteur en arrière-plan) cherche les fichiers sous /recommendations/assets/ : écran
// blanc. Android (https://localhost/) et iPhone (capacitor://localhost/) servent l'app à la racine : chemins absolus.
describe('build : fichiers de l’app servis depuis la racine', () => {
  it('base « / », pour qu’un rechargement sur une page à deux niveaux retrouve les fichiers', () => {
    expect(config.base).toBe('/')
  })
})
