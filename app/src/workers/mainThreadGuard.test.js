/**
 * Garde-fou perf D2 : les calculs lourds d'analyse (≈ 0,5–0,9 s chacun sur un téléphone milieu de
 * gamme) ne doivent plus être appelés depuis un écran : ils passent par `getAnalysis()` (Web Worker +
 * cache). Ce test échoue si une page ou un composant les importe à nouveau directement.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HEAVY = ['computeTodayPrediction', 'computeBasicCorrelations', 'computeAdvancedAnalysis', 'computeLaggedEffects', 'computeTagEffects']
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function uiFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name)
    if (d.isDirectory()) return uiFiles(p)
    return /\.jsx$/.test(d.name) && !/\.test\./.test(d.name) ? [p] : []
  })
}

describe('calculs lourds hors du fil principal', () => {
  it("aucun écran n'importe directement un calcul d'analyse lourd", () => {
    const offenders = []
    for (const file of uiFiles(SRC)) {
      const imports = readFileSync(file, 'utf8').match(/import\s*\{[^}]*\}\s*from[^\n]+/g) || []
      for (const fn of HEAVY) {
        if (imports.some((line) => new RegExp(`\\b${fn}\\b`).test(line))) offenders.push(`${file.replace(SRC, 'src')} → ${fn}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
