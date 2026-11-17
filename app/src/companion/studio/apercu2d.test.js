import { describe, it, expect } from 'vitest'
import { dessinerPilou } from './apercu2d'
import { tirer, COUVRE_CHEFS, SCHEMA, normaliser } from './traits'

/** Contexte 2D factice qui compte les dessins et refuse les nombres invalides. */
function faux() {
  const n = { dessins: 0, invalides: 0 }
  const verifie = (...args) => { for (const a of args) if (typeof a === 'number' && !Number.isFinite(a)) n.invalides++ }
  const grad = { addColorStop: () => {} }
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k in t) return t[k]
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return (...a) => { verifie(...a); return grad }
      if (k === 'fill' || k === 'stroke' || k === 'fillRect') return (...a) => { verifie(...a); n.dessins++ }
      return (...a) => verifie(...a)
    },
    set(t, k, v) { t[k] = v; return true },
  })
  return { ctx, n }
}

describe('aperçu 2D de Pilou', () => {
  it('dessine le Pilou d’origine', () => {
    const { ctx, n } = faux()
    dessinerPilou(ctx, 362, 200, null)
    expect(n.dessins).toBeGreaterThan(10)
    expect(n.invalides).toBe(0)
  })
  it('dessine 200 fiches tirées, toutes les coiffures et tous les couvre-chefs, sans valeur invalide', () => {
    const fiches = [
      ...Array.from({ length: 200 }, (_, i) => tirer(i)),
      ...SCHEMA.cheveux.coiffure.flatMap((c) => SCHEMA.cheveux.texture.map((t) => normaliser({ cheveux: { longueur: 'longs', coiffure: c, texture: t } }).fiche)),
      ...COUVRE_CHEFS.map((c) => normaliser({ couvre_chef: c, lunettes: { type: 'aviateur' }, oreilles: { boucles: 'pendantes' } }).fiche),
    ]
    for (const f of fiches) {
      const { ctx, n } = faux()
      dessinerPilou(ctx, 362, 200, f, { rv: { cheveux: 0.5, couvre: 0.3 } })
      expect(n.invalides).toBe(0)
    }
  })
})
