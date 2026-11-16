import { describe, it, expect } from 'vitest'
import { homeBubbles, habitQuestion, poppedMessage, bubblesLeftText, orbitLayout } from './bubbles'
import { habitEntry } from '../../services/habits'

const at = (h, m = 0) => new Date(2026, 10, 16, h, m).toISOString()
const NOW = new Date(2026, 10, 16, 14, 0)
const MED = { id: 'meditation', label: 'Méditation' }
const READ = { id: 'reading', label: 'Lecture' }

describe('homeBubbles', () => {
  it('une bulle par chose à noter aujourd’hui, sans le ventre hors objectif digestion', () => {
    const r = homeBubbles([], { now: NOW, habits: [MED] })
    expect(r.bubbles.map((b) => b.id)).toEqual(['meals', 'wellbeing', 'habit:meditation'])
    expect(r.bubbles.find((b) => b.id === 'gut')).toBeUndefined()
    expect(r.total).toBe(5)
    expect(r.done).toBe(0)
  })

  it('le repas se remplit par tiers et la bulle part à 3 sur 3', () => {
    const one = homeBubbles([{ type: 'food', at: at(8) }], { now: NOW })
    const meals = one.bubbles.find((b) => b.id === 'meals')
    expect(meals.label).toBe('Repas 1/3')
    expect(meals.fill).toBe(1)
    const all = homeBubbles([{ type: 'food', at: at(8) }, { type: 'food', at: at(12) }, { type: 'food', at: at(13, 0) },
      { type: 'food', at: at(19) }], { now: new Date(2026, 10, 16, 20) })
    expect(all.bubbles.find((b) => b.id === 'meals')).toBeUndefined()
  })

  it('« Non » fait partir la bulle comme « Oui »', () => {
    const yes = homeBubbles([habitEntry(MED, '2026-11-16', true)], { now: NOW, habits: [MED, READ] })
    const no = homeBubbles([habitEntry(MED, '2026-11-16', false)], { now: NOW, habits: [MED, READ] })
    expect(yes.bubbles.map((b) => b.id)).toEqual(no.bubbles.map((b) => b.id))
    expect(no.bubbles.some((b) => b.id === 'habit:meditation')).toBe(false)
    expect(no.done).toBe(1)
  })

  it('le ventre attend le soir, avec un texte pour le lecteur d’écran', () => {
    const r = homeBubbles([], { now: NOW, askGut: true })
    const gut = r.bubbles.find((b) => b.id === 'gut')
    expect(gut.waiting).toBe(true)
    expect(gut.ariaLabel).toMatch(/à partir de \d+ h/)
    const evening = homeBubbles([], { now: new Date(2026, 10, 16, 20), askGut: true })
    expect(evening.bubbles.find((b) => b.id === 'gut').waiting).toBe(false)
  })

  it('chaque bulle a un mot et un texte d’accessibilité', () => {
    const r = homeBubbles([], { now: NOW, askGut: true, habits: [MED, READ, { id: 'custom:velo', label: 'Vélo' }] })
    for (const b of r.bubbles) {
      expect(b.label).toBeTruthy()
      expect(b.ariaLabel).toContain(b.kind === 'meals' ? 'Repas' : b.label)
    }
  })
})

describe('textes', () => {
  it('questions des habitudes', () => {
    expect(habitQuestion(MED)).toBe('Avez-vous médité aujourd’hui ?')
    expect(habitQuestion({ id: 'custom:velo', label: 'Vélo' })).toBe('Vélo, aujourd’hui ?')
  })
  it('message bref et reste à faire', () => {
    expect(poppedMessage({ kind: 'habit', label: 'Lecture' }, false)).toBe('Lecture : non, c’est noté.')
    expect(bubblesLeftText(3)).toBe('3 bulles à faire')
    expect(bubblesLeftText(1)).toBe('1 bulle à faire')
    expect(bubblesLeftText(0)).toBe('Plus rien à faire aujourd’hui')
  })
})

describe('orbitLayout', () => {
  it('reste dans le cadre et ne superpose pas deux bulles', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
      for (const phase of [0, 0.7, 2, 4.4]) {
        const pts = orbitLayout(n, phase)
        expect(pts).toHaveLength(n)
        for (const p of pts) {
          expect(p.x).toBeGreaterThan(0.08)
          expect(p.x).toBeLessThan(0.92)
          expect(p.y).toBeGreaterThan(0.03)
          expect(p.y).toBeLessThan(0.8)
          expect(p.scale).toBeGreaterThanOrEqual(0.8 * (n > 6 ? 0.85 : 1) - 1e-9)
        }
        if (n <= 6) {
          for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
              // largeur d'une bulle ≈ 0,18 du cadre ; hauteur ×1/0,9
              const dx = pts[i].x - pts[j].x
              const dy = (pts[i].y - pts[j].y) * 0.9
              expect(Math.hypot(dx, dy)).toBeGreaterThan(0.15)
            }
          }
        }
      }
    }
  })

  it('derrière, la bulle est plus petite et au-dessus', () => {
    const [front] = orbitLayout(1, Math.PI / 2)
    const [back] = orbitLayout(1, -Math.PI / 2)
    expect(back.back).toBe(true)
    expect(front.back).toBe(false)
    expect(back.scale).toBeLessThan(front.scale)
    expect(back.y).toBeLessThan(front.y)
  })
})
