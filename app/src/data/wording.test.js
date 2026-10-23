/**
 * Vocabulaire des textes visibles (décisions produit du propriétaire du 20/10/2026, journal/PRODUIT.md) :
 * on parle de « bien-être », pas d'« humeur » ; jamais « 100 % privé » (l'analyse IA envoie des données) ;
 * jamais « diagnostiquer », « prédire une crise » ni « traiter ». Les commentaires du code ne comptent pas.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { FORBIDDEN_WORDING } from './wordingRules.js'

const ROOTS = ['src/components', 'src/pages', 'src/services', 'src/hooks', 'src/config']

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) return sourceFiles(p)
    return /\.(jsx?|tsx?)$/.test(d.name) && !/\.test\./.test(d.name) ? [p] : []
  })
}

/** Retire les commentaires (blocs, JSX et lignes) en gardant les numéros de ligne. */
export function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((l) => l.replace(/(^|\s)\/\/.*$/, '$1'))
}

const FORBIDDEN = FORBIDDEN_WORDING

function offences() {
  const found = []
  for (const root of ROOTS) {
    for (const file of sourceFiles(path.resolve(root))) {
      stripComments(fs.readFileSync(file, 'utf8')).forEach((line, i) => {
        for (const { re, why } of FORBIDDEN) {
          if (re.test(line)) found.push(`${path.relative(path.resolve(), file)}:${i + 1} (${why}) ${line.trim()}`)
        }
      })
    }
  }
  return found
}

describe('vocabulaire des textes visibles', () => {
  it('retire les commentaires mais garde le texte', () => {
    expect(stripComments("a // l'humeur\n/* humeur */ b\n'https://x'").map((l) => l.trim())).toEqual(['a', 'b', "'https://x'"])
  })

  it('aucun « humeur », « 100 % privé » ni terme médical interdit dans le code de l’app', () => {
    expect(offences()).toEqual([])
  })
})

/**
 * VC-1 : en JSX, un retour à la ligne entre deux morceaux de texte disparaît. « mesures,⏎{APP_NAME} » s'affiche
 * « mesures,Halcya ». Un nom en début (ou fin) de ligne doit donc suivre (ou précéder) une balise, ou `{' '}`.
 */
export function gluedNames(lines) {
  const found = []
  lines.forEach((line, i) => {
    const t = line.trim()
    const prev = (lines[i - 1] || '').trim()
    const next = (lines[i + 1] || '').trim()
    if (t.startsWith('{APP_NAME}') && prev && !/[>}]$/.test(prev)) found.push(i + 1)
    if (t.endsWith('{APP_NAME}') && t !== '{APP_NAME}' && next && !/^[<{]/.test(next)) found.push(i + 1)
  })
  return found
}

describe('nom de l’app dans les textes JSX (VC-1)', () => {
  it('repère un nom collé au mot de la ligne précédente', () => {
    expect(gluedNames(['  après 3 semaines,', '  {APP_NAME} compare'])).toEqual([2])
    expect(gluedNames(['  <p>', '  {APP_NAME} lit'])).toEqual([])
    expect(gluedNames(["  : {APP_NAME}{' '}", '  vous aide'])).toEqual([])
    expect(gluedNames(['  : {APP_NAME}', '  vous aide'])).toEqual([1])
  })

  it('aucun « Halcyavous » ni « mesures,Halcya » dans les composants et les pages', () => {
    const found = []
    for (const root of ['src/components', 'src/pages']) {
      for (const file of sourceFiles(path.resolve(root)).filter((f) => f.endsWith('.jsx'))) {
        const lines = stripComments(fs.readFileSync(file, 'utf8'))
        for (const n of gluedNames(lines)) found.push(`${path.relative(path.resolve(), file)}:${n}`)
      }
    }
    expect(found).toEqual([])
  })
})
