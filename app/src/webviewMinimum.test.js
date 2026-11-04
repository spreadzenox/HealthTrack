/**
 * WebView trop ancienne (WEBVIEW-MIN, 04/11) : l'app vise Android 8+ (minSdk 26), où la WebView se met à jour par le
 * Play Store mais peut être restée ancienne (mises à jour coupées). Capacitor n'exige par défaut que la WebView 60 et,
 * sans page d'erreur, charge l'app quand même : sur une WebView 60 à 92, `Object.hasOwn` (stockage) manque et l'app
 * reste blanche. On déclare donc la version réellement nécessaire et une page qui dit quoi faire.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { stripComments } from './data/wordingRules.js'
import { slopOffences } from './data/wording.test.js'

const config = JSON.parse(fs.readFileSync(path.resolve('capacitor.config.json'), 'utf8'))
const ERROR_PAGE = path.resolve('public', config.server?.errorPath ?? 'absente.html')

// Fonctions récentes que Vite ne transpile pas (syntaxe compilée pour Chrome 87, fonctions laissées telles quelles) :
// version de Chrome / WebView qui les apporte.
const RUNTIME_APIS = [
  { re: /\bObject\.hasOwn\(/, chrome: 93 },
  { re: /\.at\(-?\d/, chrome: 92 },
  { re: /\bstructuredClone\(/, chrome: 98 },
  { re: /\.findLast(Index)?\(/, chrome: 97 },
  { re: /\.(toSorted|toReversed|toSpliced)\(/, chrome: 110 },
  { re: /\bObject\.groupBy\(/, chrome: 117 },
  { re: /\bPromise\.withResolvers\(/, chrome: 119 },
  { re: /\bArray\.fromAsync\(/, chrome: 121 },
  { re: /\bAbortSignal\.timeout\(/, chrome: 103 },
]

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) return sourceFiles(p)
    return /\.(jsx?|tsx?)$/.test(d.name) && !/\.test\./.test(d.name) ? [p] : []
  })
}

describe('WebView minimale (WEBVIEW-MIN)', () => {
  it('déclare une WebView minimale au moins égale à ce que le code utilise', () => {
    const min = config.android?.minWebViewVersion
    expect(min).toBeGreaterThanOrEqual(93)
    for (const file of sourceFiles(path.resolve('src'))) {
      const code = stripComments(fs.readFileSync(file, 'utf8'))
      for (const { re, chrome } of RUNTIME_APIS) {
        if (re.test(code)) expect(chrome, `${path.relative('.', file)} : ${re}`).toBeLessThanOrEqual(min)
      }
    }
  })

  it('montre une page embarquée plutôt qu’un écran blanc', () => {
    expect(config.server?.errorPath).toBe('webview-ancienne.html')
    expect(fs.existsSync(ERROR_PAGE)).toBe(true)
  })

  describe('la page', () => {
    const html = fs.existsSync(ERROR_PAGE) ? fs.readFileSync(ERROR_PAGE, 'utf8') : ''
    const script = (html.match(/<script>([\s\S]*?)<\/script>/) ?? [])[1] ?? ''

    it('reste en JavaScript ancien (lisible par une WebView 60)', () => {
      expect(script).not.toBe('')
      expect(script).not.toMatch(/=>|\b(let|const|class|async|await)\b|`|\?\.|\?\?/)
    })

    it('ne charge rien de l’extérieur (police, script, style)', () => {
      expect(html).not.toMatch(/<(script|link)[^>]+(src|href)=/)
      expect(html).not.toMatch(/@import|url\(/)
    })

    it('dit quoi faire : mettre à jour la WebView depuis le Play Store', () => {
      expect(html).toContain('Android System WebView')
      expect(html).toContain('https://play.google.com/store/apps/details?id=com.google.android.webview')
      expect(html).toMatch(/lang="fr"/)
    })

    it('distingue une WebView récente (autre erreur de chargement) et propose de réessayer', () => {
      expect(script).toMatch(/Object\.hasOwn/)
      expect(html).toMatch(/Réessayer/)
    })

    it('textes sans formule « slop IA » ni nom technique de l’app', () => {
      const text = html.replace(/<script>[\s\S]*?<\/script>|<style>[\s\S]*?<\/style>|<[^>]+>/g, ' ')
      expect(slopOffences(text)).toEqual([])
      expect(text).not.toMatch(/HealthTrack/)
    })
  })
})
