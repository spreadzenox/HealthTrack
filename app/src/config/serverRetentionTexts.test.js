import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// POL-PLAY-30 : depuis P24, le relais garde dans Firestore un compteur d'analyses par empreinte d'installation,
// effacé 13 mois après la dernière analyse (relay/src/credits.js, expiryOf). Aucun texte public ne doit plus dire
// que le serveur « ne garde rien » ni que ces compteurs vivent « en mémoire ».
const read = (rel) => fs.readFileSync(path.resolve(rel), 'utf8')
const FILES = [
  'src/config/permissionDisclosures.js',
  'src/pages/Settings.jsx',
  'src/pages/Data.jsx',
  'public/privacypolicy.html',
]

describe('ce que garde le serveur d’analyse IA (POL-PLAY-30)', () => {
  it.each(FILES)('%s ne dit plus « ne garde rien »', (file) => {
    expect(read(file)).not.toMatch(/ne garden?t? rien/)
  })

  it.each(FILES)('%s annonce l’effacement du compteur au bout de 13 mois', (file) => {
    expect(read(file)).toMatch(/13 mois/)
  })

  it('la politique de confidentialité ne place plus les compteurs « en mémoire »', () => {
    expect(read('public/privacypolicy.html')).not.toMatch(/compteurs, en mémoire/)
  })
})
