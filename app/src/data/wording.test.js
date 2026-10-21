/**
 * Vocabulaire des textes visibles (décisions produit du propriétaire du 20/10/2026, journal/PRODUIT.md) :
 * on parle de « bien-être », pas d'« humeur » ; jamais « 100 % privé » (l'analyse IA envoie des données) ;
 * jamais « diagnostiquer », « prédire une crise » ni « traiter ». Les commentaires du code ne comptent pas.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

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

const FORBIDDEN = [
  { re: /humeur/i, why: 'dire « bien-être »' },
  { re: /100\s*%\s*(privé|priv[ée]e|confidentiel|local)/i, why: '« local par défaut, IA optionnelle »' },
  { re: /diagnostiqu|prédi(re|t|sons) (une|vos|la) crise|trait(er|ement) (votre|vos|le) (SII|syndrome|maladie)/i, why: 'jamais d’affirmation médicale' },
]

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
