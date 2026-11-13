// @vitest-environment node
import { describe, it, expect } from 'vitest'
import config from '../../vite.config.js'

// Version iOS (HealthTrack-iOS), correctif 41 : depuis Android v786, Analyses a une page à deux niveaux
// (/recommendations/ventre). Avec des chemins relatifs (`base: './'`), un rechargement complet sur cette page — celui
// que fait Capacitor quand iOS a fermé le moteur de la page en arrière-plan, ou le mode captures — cherche les
// fichiers de l'app sous /recommendations/assets/ : écran blanc (capture « recommendations-ventre » jamais prise sur
// #295). Sur iPhone, l'app est servie à la racine de capacitor://localhost : chemins absolus.
describe('build de l’iPhone : fichiers de l’app servis depuis la racine', () => {
  it('base « / », pour qu’un rechargement sur une page à deux niveaux retrouve les fichiers', () => {
    expect(config.base).toBe('/')
  })
})
