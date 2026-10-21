/**
 * Nom affiché (décision du propriétaire du 21/10/2026 : « Halcya ») : une seule source, APP_NAME. Aucun texte
 * visible ne doit encore dire « HealthTrack » ; seuls restent les identifiants techniques, qui ne changent pas
 * (base IndexedDB, dépôt GitHub, applicationId…). Le lanceur Android et Capacitor affichent le même nom.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { APP_NAME } from './brand'

const OLD_NAME = 'HealthTrack'

/** Identifiants techniques gardés exprès (jamais affichés tels quels). */
const ALLOWED = [
  /const DB_NAME = 'HealthTrack'/,
  /const REPO_NAME = 'HealthTrack'/,
  /github\.com\/spreadzenox\/HealthTrack/,
  /api\.github\.com\/repos\/spreadzenox\/HealthTrack/,
]

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) return sourceFiles(p)
    return /\.(jsx?|tsx?)$/.test(d.name) && !/\.test\./.test(d.name) && d.name !== 'brand.js' ? [p] : []
  })
}

/** Retire les commentaires (blocs, JSX et lignes) en gardant les numéros de ligne. */
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((l) => l.replace(/(^|\s)\/\/.*$/, '$1'))
}

describe('nom affiché de l’app', () => {
  it('APP_NAME vaut « Halcya »', () => {
    expect(APP_NAME).toBe('Halcya')
  })

  it('aucun texte visible du code ne dit encore « HealthTrack » (hors identifiants techniques)', () => {
    const found = []
    for (const file of sourceFiles(path.resolve('src'))) {
      stripComments(fs.readFileSync(file, 'utf8')).forEach((line, i) => {
        if (line.includes(OLD_NAME) && !ALLOWED.some((re) => re.test(line))) {
          found.push(`${path.relative(path.resolve(), file)}:${i + 1} ${line.trim()}`)
        }
      })
    }
    expect(found).toEqual([])
  })

  it('le lanceur Android (app_name, les deux variantes) affiche APP_NAME', () => {
    const xml = fs.readFileSync(path.resolve('android/app/src/main/res/values/strings.xml'), 'utf8')
    expect(xml).toMatch(new RegExp(`<string name="app_name">${APP_NAME}</string>`))
    expect(xml).toMatch(new RegExp(`<string name="title_activity_main">${APP_NAME}</string>`))
    for (const flavor of ['play', 'sideload']) {
      const dir = path.resolve(`android/app/src/${flavor}/res/values`)
      const file = path.join(dir, 'strings.xml')
      const own = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').match(/name="app_name">([^<]*)</) : null
      if (own) expect(own[1]).toBe(APP_NAME)
    }
  })

  it('Capacitor et le titre de la page affichent APP_NAME, sans toucher aux identifiants', () => {
    const cap = JSON.parse(fs.readFileSync(path.resolve('capacitor.config.json'), 'utf8'))
    expect(cap.appName).toBe(APP_NAME)
    expect(cap.appId).toBe('com.healthtrack.app')
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8')
    expect(html).toMatch(new RegExp(`<title>${APP_NAME}\\b`))
  })
})
