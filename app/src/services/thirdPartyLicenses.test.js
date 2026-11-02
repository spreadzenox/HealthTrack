import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { NPM_LICENSES, ANDROID_LICENSES, LICENSE_URLS, licenseSections } from './thirdPartyLicenses.js'
import { featuresFor } from '../config/distribution.js'

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'))

describe('licences des composants de tiers (LICENCES-TIERCES)', () => {
  it('chaque dépendance npm de production est listée avec la licence de son package.json', () => {
    const listed = new Map(NPM_LICENSES.flatMap((e) => e.packages.map((p) => [p, e.license])))
    for (const dep of Object.keys(pkg.dependencies)) {
      expect(listed.has(dep), `${dep} manque dans NPM_LICENSES`).toBe(true)
      const actual = JSON.parse(fs.readFileSync(path.resolve('node_modules', dep, 'package.json'), 'utf8')).license
      expect(actual, dep).toBe(listed.get(dep))
    }
  })

  it('chaque bibliothèque Android de build.gradle (hors tests) est listée', () => {
    const gradle = fs.readFileSync(path.resolve('android/app/build.gradle'), 'utf8')
    const coords = [...gradle.matchAll(/^\s*(?:play|sideload)?[iI]mplementation\s+["']([^"']+)["']/gm)].map((m) => m[1])
    expect(coords.length).toBeGreaterThan(5)
    for (const c of coords) {
      expect(ANDROID_LICENSES.some((a) => a.artifacts.some((p) => c.startsWith(p))), `${c} manque`).toBe(true)
    }
  })

  it('chaque licence affichée a un lien, sauf les conditions d’une source de données', () => {
    for (const s of licenseSections(featuresFor('play'))) {
      for (const item of s.items) {
        if (s.title === 'Données sur les aliments') continue
        expect(LICENSE_URLS[item.license], item.name).toBeTruthy()
      }
    }
  })

  it('version Play : aucun nom de modèle, Play Billing listé', () => {
    const text = JSON.stringify(licenseSections(featuresFor('play')))
    expect(text).not.toMatch(/HSEmotion|EmotiEff|MediaPipe|Gemini/)
    expect(text).toMatch(/Play Billing/)
  })

  it('version sideload : modèles nommés, pas de Play Billing', () => {
    const text = JSON.stringify(licenseSections(featuresFor('sideload')))
    expect(text).toMatch(/HSEmotion/)
    expect(text).not.toMatch(/Play Billing/)
  })

  it('cite Ciqual et chaque mesure FODMAP publiée', () => {
    const food = licenseSections(featuresFor('play')).find((s) => s.title === 'Données sur les aliments').items
    expect(food[0]).toMatchObject({ name: expect.stringMatching(/^Anses\. Ciqual/), license: 'CC BY 4.0' })
    expect(food.map((f) => f.name)).toContain('Ferjančič 2024')
    expect(food.find((f) => f.name === 'Njoumi 2019').license).toBe('CC BY-NC-ND 4.0')
    expect(food.find((f) => f.name === 'Liljebo 2020').license).toBe('CC BY 4.0')
    expect(food.find((f) => f.name === 'MEXT 2020').license).toBe('Conditions MEXT')
  })
})
