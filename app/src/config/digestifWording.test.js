import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * AUJ-7 (revue design du 07/11) : « ventre » devient « digestif » / « digestion » dans tous les textes visibles (app,
 * notification du soir, pages légales, fiche du Store). Données et identifiants inchangés : la route
 * `/recommendations/ventre`, la clé interne `signals: ['visage', 'ventre']` et le lexique des phrases libres (« mal au
 * ventre » reste reconnu) ne sont pas des textes affichés.
 */
const APP = join(import.meta.dirname, '..', '..')
// « Et votre ventre ? » (première note de l'accueil, ACC-7) : texte exact validé par le propriétaire le 08/11
const ALLOWED = [/recommendations\/ventre/, /mal au ventre/, /signals:/, /Et votre ventre ?/]

function files(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) files(p, out)
    else if (/\.(jsx?|html|txt|java)$/.test(p) && !/\.test\./.test(p)) out.push(p)
  }
  return out
}

const isComment = (line) => /^\s*(\/\/|\*|\/\*|\{\/\*|<!--)/.test(line)

describe('libellés « digestif » (AUJ-7)', () => {
  it('aucun texte visible ne dit plus « ventre »', () => {
    const roots = ['src', 'public', 'store/listing', 'android/app/src/main/java/com/healthtrack/app/GutEveningNotice.java']
    const hits = []
    for (const r of roots) {
      const p = join(APP, r)
      const list = statSync(p).isDirectory() ? files(p) : [p]
      for (const f of list) {
        readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
          if (!/ventre/i.test(line) || isComment(line) || ALLOWED.some((re) => re.test(line))) return
          hits.push(`${relative(APP, f)}:${i + 1}`)
        })
      }
    }
    expect(hits).toEqual([])
  })
})
