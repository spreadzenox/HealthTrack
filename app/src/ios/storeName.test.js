import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { iosWorkflow } from './iphonePaths.js'

// Version iOS (HealthTrack-iOS), étape I6 : le nom du magasin des textes vient de VITE_STORE au build (distribution.js
// d'Android, I6-RELAIS-6) ; sans lui, l'app iPhone dirait « Google Play » sur l'écran d'abonnement. Toute build de la
// variante iPhone le fixe donc à `appstore`. Workflows lus à la racine du dépôt.
const workflow = (name) => readFileSync(iosWorkflow(name), 'utf8')

describe('les builds de l’app iPhone nomment l’App Store', () => {
  it.each(['ios-build.yml', 'ios-testflight.yml'])('%s : VITE_STORE=appstore partout où VITE_DISTRIBUTION=appstore', (name) => {
    const text = workflow(name)
    const builds = text.match(/VITE_DISTRIBUTION: appstore/g) ?? []
    expect(builds.length).toBeGreaterThan(0)
    expect(text.match(/VITE_STORE: appstore/g) ?? []).toHaveLength(builds.length)
  })
})
