import { describe, expect, it } from 'vitest'
import {
  CHANGE_T, MIN_SIDE_DAYS, crossingChanges, deseasonalize, detectChanges, normStart, periods, sameTime,
} from './changes'
import { changesFromEntries } from './changeSeries'
import { gaussian, rng, simDayKey } from './simulate'

/**
 * Banc de TS-2 (07/11, 200 courbes de 182 jours, écart du jour AR(1) 0,5, rythme de la semaine, tendance qui dérive,
 * 10 % de jours manquants) : seuil t = 4 → 0,26 fausse alerte par courbe et par semestre (0,69 sur des courbes plus
 * lissées et plus dérivantes, AR 0,7) ; saut de 2 variations habituelles retrouvé à ± 5 jours 79 %, de 1,5 : 59 %.
 * Seuil 3,5 : 0,52 et 1,13 (trop). Un saut d'une seule variation habituelle n'est pas distinguable du bruit en
 * 4 semaines de chaque côté : on préfère ne rien dire. Mesures faites avant la confirmation par les médianes des
 * 7 jours de chaque côté, qui ne peut que retirer des alertes (puissance revérifiée par le test : ≥ 70 %).
 */
const DAYS = 182
function series(seed, { jump = 0, at = 91, ar = 0.5, walk = 0.03, missing = 0.1 } = {}) {
  const r = rng(seed)
  const m = new Map()
  let e = 0
  let lvl = 0
  for (let i = 0; i < DAYS; i += 1) {
    e = ar * e + Math.sqrt(1 - ar * ar) * gaussian(r)
    lvl += walk * gaussian(r)
    const v = 10 + lvl + e + (i % 7 >= 5 ? 0.4 : 0) + (i >= at ? jump : 0)
    if (r() > missing) m.set(simDayKey(i), v)
  }
  return m
}
const near = (c, i, tol = 5) => Math.abs((Date.parse(c.date) - Date.parse(simDayKey(i))) / 86_400_000) <= tol

describe('TS-2 : changements durables', () => {
  it('banc : moins d’une fausse alerte par courbe et par semestre', () => {
    let alerts = 0
    let hard = 0
    for (let s = 1; s <= 60; s += 1) {
      alerts += detectChanges(series(s)).length
      hard += detectChanges(series(s, { ar: 0.7, walk: 0.05 })).length
    }
    expect(alerts / 60).toBeLessThan(0.5)
    expect(hard / 60).toBeLessThan(1)
  }, 120_000)

  it('banc : un saut net (2 variations habituelles) est retrouvé, au bon endroit, dans le bon sens', () => {
    let found = 0
    for (let s = 1; s <= 60; s += 1) {
      const c = detectChanges(series(s, { jump: 2 })).find((x) => near(x, 91))
      if (c && c.shift > 0) found += 1
    }
    expect(found / 60).toBeGreaterThanOrEqual(0.7)
  }, 120_000)

  it('décrit le saut : niveaux avant / après, taille, confirmation 7 jours après', () => {
    const m = new Map()
    for (let i = 0; i < 70; i += 1) m.set(simDayKey(i), (i < 35 ? 6 : 8) + (i % 3) * 0.3)
    const [c] = detectChanges(m)
    expect(c.date).toBe(simDayKey(35))
    expect(c.before).toBeCloseTo(6.3, 0)
    expect(c.after).toBeCloseTo(8.3, 0)
    expect(c.shift).toBeGreaterThan(1.5)
    expect(c.confirmedOn).toBe(simDayKey(35 + MIN_SIDE_DAYS - 1))
    expect(Math.abs(c.t)).toBeGreaterThanOrEqual(CHANGE_T)
  })

  it('rien tant que le nouveau niveau n’a pas assez de jours', () => {
    const m = new Map()
    for (let i = 0; i < 40; i += 1) m.set(simDayKey(i), (i < 37 ? 6 : 9) + (i % 3) * 0.3)
    expect(detectChanges(m)).toEqual([])
    expect(detectChanges(new Map())).toEqual([])
  })

  it('retire le rythme de la semaine (un week-end plus haut n’est pas un changement)', () => {
    const m = new Map()
    for (let i = 0; i < 120; i += 1) m.set(simDayKey(i), 5 + (i % 7 >= 5 ? 2 : 0) + (i % 3) * 0.1)
    expect(detectChanges(m)).toEqual([])
    const d = deseasonalize(m)
    const spread = Math.max(...d.map((p) => p.v)) - Math.min(...d.map((p) => p.v))
    expect(spread).toBeLessThan(1)
  })

  it('norme, périodes, essais traversés et « Au même moment »', () => {
    const changes = [{ date: '2026-02-01' }, { date: '2026-03-10' }]
    expect(normStart(changes)).toBe('2026-03-10')
    expect(normStart([])).toBeNull()
    expect(periods(changes)).toEqual([
      { from: null, to: '2026-01-31' }, { from: '2026-02-01', to: '2026-03-09' }, { from: '2026-03-10', to: null },
    ])
    expect(crossingChanges(changes, '2026-03-01', '2026-03-14')).toEqual([{ date: '2026-03-10' }])
    expect(crossingChanges(changes, '2026-03-10', '2026-03-14')).toEqual([])
    const all = { sleepMinutes: [{ date: '2026-03-07' }], steps: [{ date: '2026-03-30' }], wellbeing: [{ date: '2026-03-10' }] }
    expect(sameTime(all, 'wellbeing', '2026-03-10')).toEqual([{ metric: 'sleepMinutes', date: '2026-03-07' }])
  })

  it('depuis les entrées : une courbe par mesure, sommeil compris', () => {
    const entries = []
    for (let i = 0; i < 70; i += 1) {
      const day = simDayKey(i)
      entries.push({ type: 'steps', at: `${day}T12:00:00`, source: 'health_connect', payload: { value: (i < 35 ? 4000 : 9000) + (i % 4) * 200, period: 'day' } })
      entries.push({ type: 'wellbeing', at: `${day}T21:00:00`, payload: { score: 3 + (i % 3) * 0.2 } })
    }
    const res = changesFromEntries(entries, { now: new Date(`${simDayKey(69)}T22:00:00`) })
    expect(Object.keys(res)).toEqual(['wellbeing', 'digestion', 'sleepMinutes', 'hrv_ms', 'restingHR', 'steps', 'screen_minutes'])
    expect(res.steps).toHaveLength(1)
    expect(res.steps[0].date).toBe(simDayKey(35))
    expect(res.wellbeing).toEqual([])
    expect(res.digestion).toEqual([])
  })
})
