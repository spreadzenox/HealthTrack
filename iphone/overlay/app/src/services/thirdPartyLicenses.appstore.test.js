import { describe, it, expect } from 'vitest'
import { featuresFor, storeFor } from '../config/distribution'
import { licenseSections, IOS_LICENSES, LICENSE_URLS } from './thirdPartyLicenses'

// Version iOS (HealthTrack-iOS) : la page « Licences » d'Android (v716, #632 ; v717, #633 : rien d'Android sur l'App
// Store) liste sur iPhone ses bibliothèques natives (correctif 39) et tait les modèles valence / éveil, éteints sur
// iPhone tant que la licence de leurs poids n'est pas tranchée (journal/DEMANDES.md).
const sections = () => licenseSections(featuresFor('appstore'), storeFor('appstore'))
const section = (title) => sections().find((s) => s.title === title).items

describe('page « Licences » sur iPhone (correctif 39)', () => {
  it('bibliothèques natives de l’iPhone, avec leur licence connue de la page', () => {
    expect(IOS_LICENSES.map((l) => [l.name, l.license])).toEqual([
      ['TensorFlow Lite C', 'Apache-2.0'],
      ['Capacitor pour iOS', 'MIT'],
    ])
    for (const lib of IOS_LICENSES) expect(LICENSE_URLS[lib.license]).toMatch(/^https:\/\//)
    const libs = section('Bibliothèques').map((l) => l.name)
    expect(libs).toEqual(expect.arrayContaining(['TensorFlow Lite C', 'Capacitor pour iOS']))
  })

  it('rien d’Android ni de Google Play', () => {
    expect(JSON.stringify(sections())).not.toMatch(/Android|AndroidX|LiteRT|ONNX|Google Play|Play Billing|Play Integrity/)
  })

  it('lecture du visage : la détection seulement, pas les modèles valence / éveil (éteints sur iPhone)', () => {
    const face = section('Lecture du visage')
    expect(face.map((m) => m.name)).toEqual(['Détection du visage (Google)'])
    expect(JSON.stringify(face)).not.toMatch(/Savchenko|HSEmotion|valence/)
  })

  it('Google Play inchangé : les deux modèles du visage restent cités', () => {
    const face = licenseSections(featuresFor('play'), storeFor('play')).find((s) => s.title === 'Lecture du visage').items
    expect(face).toHaveLength(2)
  })
})
