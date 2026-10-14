/**
 * Garde-fou perf D2 (découpage) : le fichier principal de l'app ne doit contenir que l'Accueil et ce
 * qu'il lui faut. La table Ciqual (1,3 Mo) n'est importée qu'à la demande par `data/nutritionTable`,
 * et `App.jsx` ne charge statiquement aucune autre page que l'Accueil.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function sourceFiles(dir, pattern = /\.(js|jsx)$/) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name)
    if (d.isDirectory()) return sourceFiles(p, pattern)
    return pattern.test(d.name) && !/\.test\./.test(d.name) ? [p] : []
  })
}

/** Fichiers CSS atteints par les imports statiques depuis `main.jsx`, dans l'ordre d'évaluation. */
function eagerCss() {
  const seen = new Set()
  const css = []
  const visit = (file) => {
    if (seen.has(file)) return
    seen.add(file)
    if (file.endsWith('.css')) return void css.push(relative(SRC, file))
    if (!/\.jsx?$/.test(file)) return
    for (const m of readFileSync(file, 'utf8').matchAll(/^\s*(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"](\.[^'"]+)['"]/gm)) {
      const base = resolve(dirname(file), m[1])
      const hit = [base, `${base}.js`, `${base}.jsx`].find((c) => existsSync(c) && statSync(c).isFile())
      if (hit) visit(hit)
    }
  }
  visit(join(SRC, 'main.jsx'))
  return css
}

describe("découpage du fichier principal", () => {
  it("tout le CSS reste chargé d'emblée (la cascade ne dépend pas des pages visitées)", () => {
    const all = sourceFiles(SRC, /\.css$/).map((f) => relative(SRC, f)).sort()
    expect([...eagerCss()].sort()).toEqual(all)
  })

  it("la table Ciqual n'est importée statiquement nulle part", () => {
    const offenders = sourceFiles(SRC).filter((file) =>
      /import\s[^;]*?from\s*['"][^'"]*ingredientsNutrition\.json['"]/.test(readFileSync(file, 'utf8')))
    expect(offenders.map((f) => f.replace(SRC, 'src'))).toEqual([])
  })

  it("App.jsx ne charge statiquement que l'Accueil parmi les pages", () => {
    const app = readFileSync(join(SRC, 'App.jsx'), 'utf8')
    const staticPages = [...app.matchAll(/^import\s+\w+\s+from\s+'\.\/pages\/(\w+)'/gm)].map((m) => m[1])
    expect(staticPages).toEqual(['Dashboard'])
  })
})
