import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { stripComments } from '../data/wordingRules.js'

// Version iOS (HealthTrack-iOS, Android v765, WEBVIEW-MIN) : le code partagé utilise des fonctions récentes que Vite
// ne transpile pas (`Object.hasOwn`, `.at()`…). Android déclare la WebView qui les porte (`minWebViewVersion`) ; sur
// iPhone, c'est la version d'iOS minimale de l'app (`IPHONEOS_DEPLOYMENT_TARGET`), sans quoi l'app resterait blanche
// sur un iPhone plus ancien. Même liste qu'Android, avec la version d'iOS (Safari) qui apporte chaque fonction.
// Vitest tourne depuis upstream/app, où scripts/upstream.sh a copié ios/
const RUNTIME_APIS = [
  { re: /\bObject\.hasOwn\(/, ios: [15, 4] },
  { re: /\.at\(-?\d/, ios: [15, 4] },
  { re: /\bstructuredClone\(/, ios: [15, 4] },
  { re: /\.findLast(Index)?\(/, ios: [15, 4] },
  { re: /\.(toSorted|toReversed|toSpliced)\(/, ios: [16, 0] },
  { re: /\bObject\.groupBy\(/, ios: [17, 4] },
  { re: /\bPromise\.withResolvers\(/, ios: [17, 4] },
  { re: /\bArray\.fromAsync\(/, ios: [16, 4] },
  { re: /\bAbortSignal\.timeout\(/, ios: [16, 0] },
]
const ge = ([a, b], [c, d]) => a > c || (a === c && b >= d)

const pbxproj = readFileSync(join(process.cwd(), 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8')
const targets = [...pbxproj.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = (\d+)\.(\d+);/g)].map((m) => [Number(m[1]), Number(m[2])])

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name)
    if (d.isDirectory()) return sourceFiles(p)
    return /\.(jsx?|tsx?)$/.test(d.name) && !/\.test\./.test(d.name) ? [p] : []
  })
}

describe('version d’iOS minimale de l’app (iPhone)', () => {
  it('au moins celle qu’exigent les fonctions récentes du code (sinon écran blanc)', () => {
    expect(targets.length).toBeGreaterThan(0)
    const used = []
    for (const file of sourceFiles(join(process.cwd(), 'src'))) {
      const code = stripComments(readFileSync(file, 'utf8'))
      for (const { re, ios } of RUNTIME_APIS) if (re.test(code)) used.push({ file: relative(process.cwd(), file), re, ios })
    }
    expect(used.length, 'le code partagé utilise Object.hasOwn depuis octobre').toBeGreaterThan(0)
    for (const t of targets) {
      for (const u of used) expect(ge(t, u.ios), `iOS ${t.join('.')} < ${u.ios.join('.')} : ${u.file} ${u.re}`).toBe(true)
    }
  })

  it('page d’erreur d’Android sur iPhone : à cette version, seulement « Halcya ne s’est pas ouverte », jamais le Play Store', () => {
    const config = JSON.parse(readFileSync(join(process.cwd(), 'capacitor.config.json'), 'utf8'))
    const page = config.server?.errorPath
    if (!page) return
    const html = readFileSync(join(process.cwd(), 'public', page), 'utf8')
    expect(existsSync(join(process.cwd(), 'public', page))).toBe(true)
    // Le texte Android (WebView, Play Store) ne s'affiche que si `Object.hasOwn` ou `[].at` manquent : présents dès
    // iOS 15.4, donc sur tout iPhone où l'app s'installe
    const script = (html.match(/<script>([\s\S]*?)<\/script>/) ?? [])[1] ?? ''
    expect(script).toMatch(/typeof Object\.hasOwn === 'function' && typeof \[\]\.at === 'function'/)
    for (const t of targets) expect(ge(t, [15, 4]), `iOS ${t.join('.')}`).toBe(true)
    const autre = html.match(/<main id="autre"[\s\S]*?<\/main>/)?.[0] ?? ''
    expect(autre).toMatch(/Halcya ne s.est pas ouverte/)
    expect(autre).not.toMatch(/Android|Play Store|play\.google/)
  })
})
