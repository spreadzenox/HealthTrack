/**
 * Aucun prix en dur hors de Play Billing (IDEES.md I160) : les prix affichés viennent toujours des formules lues
 * dans Google Play. Si la fiche du Store, une page publique ou un texte de l'app citait « 29,99 €/an », un
 * changement de prix la rendrait trompeuse. Le script qui crée les abonnements (scripts/play) n'est pas concerné.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { stripComments } from './wordingRules.js'

export const PRICE_RE = /\d+[,.]\d{2}\s?(€|eur\b|euros?\b)|€\s?\d+([,.]\d{2})?/i

const TEXT_ROOTS = ['store/listing', 'public']
const CODE_ROOTS = ['src/components', 'src/pages', 'src/services', 'src/hooks', 'src/config', 'src/data/changelog']

function files(dir, re) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) return files(p, re)
    return re.test(d.name) && !/\.test\./.test(d.name) ? [p] : []
  })
}

function offences(paths, strip) {
  const found = []
  for (const file of paths) {
    const text = fs.readFileSync(file, 'utf8')
    const lines = strip ? stripComments(text) : text.split('\n')
    lines.forEach((line, i) => {
      if (PRICE_RE.test(line)) found.push(`${path.relative(path.resolve(), file)}:${i + 1} ${line.trim()}`)
    })
  }
  return found
}

describe('prix en dur (I160)', () => {
  it('reconnaît un prix écrit à la main', () => {
    for (const s of ['29,99 €/an', '4,99€', '2.50 EUR', '€29.99', '29,99 euros']) expect(PRICE_RE.test(s)).toBe(true)
    for (const s of ['0 Mo envoyé', '2–48 h', '10 analyses', 'v1.25']) expect(PRICE_RE.test(s)).toBe(false)
  })

  it('la fiche Play et les pages publiques ne citent aucun prix', () => {
    const paths = TEXT_ROOTS.flatMap((r) => files(path.resolve(r), /\.(txt|html?)$/))
    expect(paths.length).toBeGreaterThan(3)
    expect(offences(paths, false)).toEqual([])
  })

  it("les textes de l'app et les Nouveautés ne citent aucun prix", () => {
    const paths = CODE_ROOTS.flatMap((r) => files(path.resolve(r), /\.(jsx?|json)$/))
    expect(offences(paths, true)).toEqual([])
  })
})
