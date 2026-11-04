import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const SRC = join(process.cwd(), 'src/')
const cssFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return cssFiles(path)
    return name.endsWith('.css') ? [path] : []
  })
const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[2] ?? ''
}
const read = (relative) => readFileSync(join(SRC, relative), 'utf8')

// DESIGN.md : cibles tactiles ≥ 44 px. Le contrôle « CIBLE < 44 px » de `npm run visual` (04/11) a trouvé des volets
// repliés à 32 px (« Comment c'est calculé », « Hypothèse générale à tester »), « Désactiver » à 40 px, « Restaurer un
// achat » du paywall à 36 px et les licences en liens de 15 px.
describe('cibles tactiles de 44 px (accessibilité)', () => {
  it('aucun volet <summary> ni bouton .btn n’a une hauteur minimale sous 44 px', () => {
    const offenders = []
    for (const file of cssFiles(SRC)) {
      const css = readFileSync(file, 'utf8')
      for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^}]*)\}/g)) {
        if (!/summary|\.btn\b/.test(selector) || /::|:disabled|@/.test(selector)) continue
        const px = body.match(/(?:^|;|\s)min-height:\s*(\d+)px/)
        if (px && Number(px[1]) < 44) offenders.push(`${file.slice(SRC.length)} ${selector.trim()} ${px[1]}px`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('« Restaurer un achat » et les liens du paywall gardent 44 px', () => {
    expect(rule(read('pages/Premium.css'), '.paywall-link')).toContain('min-height: var(--tap-min)')
  })

  it('le volet « Attendu d’après vos habitudes » a 44 px', () => {
    expect(rule(read('components/WellbeingCharts.css'), '.wellbeing-pred-details > summary')).toContain('min-height: var(--tap-min)')
  })

  it('les liens de licence sont des cibles de 44 px', () => {
    const body = rule(read('pages/Licences.css'), 'a.licences-tag')
    expect(body).toContain('min-height: var(--tap-min)')
    expect(body).toContain('min-width: var(--tap-min)')
  })
})
