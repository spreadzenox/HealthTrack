import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { DISCLOSURES, disclosureFor } from './permissionDisclosures'
import { APP_NAME } from './brand'

describe('divulgations avant les autorisations sensibles', () => {
  it('chaque divulgation dit ce qui est lu, ce qui sort du téléphone, et demande un accord explicite', () => {
    for (const [key, d] of Object.entries(DISCLOSURES)) {
      expect(d.title, key).toMatch(/^Avant /)
      expect(d.points.length, key).toBeGreaterThanOrEqual(2)
      expect(d.leaves, key).toMatch(/quitte|Envoyé/)
      expect(d.accept, key).toMatch(/^J’accepte/)
      expect(d.decline, key).toBe('Pas maintenant')
    }
  })

  it.each(['camera', 'camera_app_open'])('%s : transparence de l’AI Act (reconnaissance des émotions), estimation, aucune image gardée', (key) => {
    const text = DISCLOSURES[key].points.join(' ')
    expect(text).toMatch(/reconnaissance des émotions/)
    expect(text).toMatch(/pas un diagnostic/)
    expect(text).toMatch(/Aucune image/)
  })

  it('variante play : dit quand la caméra lit (à l’ouverture de l’app, signalée à l’écran, jamais app fermée)', () => {
    const text = DISCLOSURES.camera_app_open.points.join(' ')
    expect(text).toMatch(new RegExp(`ouvrez ${APP_NAME}`))
    expect(text).toMatch(/bandeau/)
    expect(text).toMatch(/app est fermée/)
    expect(text).not.toMatch(/déverrouill|notification reste/)
  })

  it('un accès non décrit est une erreur (on ne demande jamais sans prévenir)', () => {
    expect(() => disclosureFor('micro')).toThrow(/inconnue/)
  })

  // Chaque écran qui déclenche une demande sensible passe par la divulgation.
  const GUARDED = [
    ['src/components/FaceSenseCard.jsx', /startFaceSense\(/, /askConsent\(appOpen \? 'camera_app_open' : 'camera'\)/],
    ['src/components/WeatherCard.jsx', /getCurrentPosition\(/, "askConsent('location')"],
    ['src/components/PhoneUsageCard.jsx', /openSettings\(\)/, "askConsent('usage')"],
    ['src/pages/Food.jsx', /analyzeMealPhoto\(/, "askConsent('ai_meal')"],
    ['src/components/NewMealForm.jsx', /analyzeMealDescription\(/, "askConsent('ai_meal')"],
    ['src/pages/Onboarding.jsx', /requestPermissions\(\)/, "askConsent('health_connect')"],
    ['src/pages/Connectors.jsx', /requestPermissions\(\)/, "askConsent('health_connect')"],
  ]
  it.each(GUARDED)('%s demande l’accord avant la demande à Android', (file, request, consent) => {
    const code = fs.readFileSync(path.resolve(file), 'utf8')
    expect(code).toMatch(request)
    if (consent instanceof RegExp) expect(code).toMatch(consent)
    else expect(code).toContain(consent)
  })

  it('aucun autre écran ne lit la position ni ne démarre la caméra sans divulgation', () => {
    const offenders = []
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
      const p = path.join(dir, d.name)
      if (d.isDirectory()) return walk(p)
      if (!/\.jsx?$/.test(d.name) || /\.test\./.test(d.name)) return
      const code = fs.readFileSync(p, 'utf8')
      if (/getCurrentPosition\(|startFaceSense\(|openPhoneUsageAccessSettings\(/.test(code) && !/askConsent\(/.test(code)
        && !/^src\/services\//.test(path.relative(path.resolve(), p))) offenders.push(path.relative(path.resolve(), p))
    })
    walk(path.resolve('src'))
    expect(offenders).toEqual([])
  })
})
