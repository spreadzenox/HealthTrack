import { describe, it, expect } from 'vitest'
import { describeGate, evaluateGate, faceIndexLoo, gateDays, jackknifeCorrelation, GATE_MIN_DAYS } from './gate'

function rng(seed) {
  let a = seed >>> 0
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return { u, normal: () => Math.sqrt(-2 * Math.log(u() || 1e-12)) * Math.cos(2 * Math.PI * u()) }
}

/** ~80 % des jours notés (1–5) ; `rho(i)` = lien humeur ↔ indice `valence`, les 5 autres indices sont du bruit. */
function simulateDays({ seed, nDays = 120, rho = () => 0 }) {
  const { u, normal } = rng(seed)
  const t0 = Date.parse('2026-01-01T00:00:00Z')
  const days = []
  for (let i = 0; i < nDays; i++) {
    const mood = normal()
    if (u() > 0.8) continue
    const note = Math.min(5, Math.max(1, Math.round(3 + 0.9 * mood + 0.5 * normal())))
    const face = {}
    for (const k of ['smile', 'brow', 'eyes', 'mouth', 'valence', 'arousal']) face[k] = normal()
    const r = rho(i)
    face.valence = r * mood + Math.sqrt(1 - r * r) * normal()
    days.push({ date: new Date(t0 + i * 86400000).toISOString().slice(0, 10), note, face })
  }
  return days
}

const share = (n, pred) => {
  let k = 0
  for (let s = 1; s <= n; s++) if (pred(s)) k++
  return k / n
}

describe('gateDays', () => {
  const at = (d, h) => new Date(2026, 0, d, h).toISOString()
  const burst = (d, h, values, trigger = 'unlock', valid = 2) =>
    ({ type: 'face_burst', at: at(d, h), payload: { v: 1, trigger, frames: 3, valid, values } })
  const note = (d, h, score) => ({ type: 'wellbeing', at: at(d, h), payload: { score } })

  it('apparie la note moyenne du jour et les médianes des rafales du déverrouillage', () => {
    const days = gateDays([
      note(5, 12, 2), note(5, 21, 4),
      burst(5, 9, { smile: 0.1 }), burst(5, 13, { smile: 0.5 }), burst(5, 18, { smile: 0.3, brow: 1 }),
      burst(5, 19, { smile: 9 }, 'manual'), // test : jamais pour l'humeur
      burst(5, 20, { smile: 9 }, 'unlock', 0), // aucun visage lu
      burst(6, 9, { smile: 0.2 }), // jour sans note
      note(7, 21, 3), // jour sans lecture
      { type: 'steps', at: at(5, 10), payload: { count: 9000 } },
    ])
    expect(days).toEqual([{ date: '2026-01-05', note: 3, face: { smile: 0.3, brow: 1 } }])
  })
})

describe('jackknifeCorrelation', () => {
  it('rend r de Pearson et un z positif quand x suit y', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const y = [1.2, 1.9, 3.4, 3.8, 5.1, 6.3, 6.8, 8.1, 9.2, 9.7]
    const { r, z } = jackknifeCorrelation(x, y)
    expect(r).toBeGreaterThan(0.99)
    expect(z).toBeGreaterThan(10)
    expect(jackknifeCorrelation([1, 2], [1, 2])).toEqual({ r: 0, z: 0 })
  })
})

describe('faceIndexLoo', () => {
  it('écarte un indice lu trop rarement ou constant', () => {
    const days = simulateDays({ seed: 3, nDays: 40, rho: () => 0.8 }).map((d, i) => ({
      ...d,
      face: { ...d.face, flat: 1, rare: i < 5 ? 1 : undefined },
    }))
    const fit = faceIndexLoo(days)
    expect(fit.keys).not.toContain('flat')
    expect(fit.keys).not.toContain('rare')
    expect(fit.keys).toContain('valence')
    expect(fit.index).toHaveLength(days.length)
  })
})

describe('evaluateGate', () => {
  it(`reste candidate tant qu'il y a moins de ${GATE_MIN_DAYS} jours comparables, et les compte`, () => {
    const days = simulateDays({ seed: 1, nDays: 30, rho: () => 0.95 })
    const g = evaluateGate(days)
    expect(g.state).toBe('candidate')
    expect(g.nDays).toBe(days.length)
    expect(g.needed).toBe(GATE_MIN_DAYS)
    expect(evaluateGate([]).state).toBe('candidate')
  })

  it('sans aucun lien, ne s’ouvre presque jamais en 120 jours (≤ 3 % sur 200 jeux)', () => {
    const opened = share(200, (s) => evaluateGate(simulateDays({ seed: s * 7 + 1 })).periods.length > 0)
    expect(opened).toBeLessThanOrEqual(0.03)
  })

  it('un lien net s’ouvre en 90 jours dans ≥ 80 % des jeux, quel que soit son sens', () => {
    for (const rho of [0.7, -0.7]) {
      const opened = share(200, (s) => {
        const g = evaluateGate(simulateDays({ seed: s * 7 + 1, rho: () => rho }), { today: '2026-03-31' })
        return g.periods[0]?.from <= '2026-03-31'
      })
      expect(opened).toBeGreaterThanOrEqual(0.8)
    }
  })

  it('un lien net qui dure se referme rarement (≤ 15 %)', () => {
    const closed = share(200, (s) => evaluateGate(simulateDays({ seed: s * 7 + 1, rho: () => 0.7 })).closedAt != null)
    expect(closed).toBeLessThanOrEqual(0.15)
  })

  it('se referme quand le lien disparaît, puis ne compte que les jours suivants', () => {
    let closed = 0
    for (let s = 1; s <= 100; s++) {
      const g = evaluateGate(simulateDays({ seed: s * 13 + 5, nDays: 200, rho: (i) => (i < 90 ? 0.8 : 0) }))
      const c = g.periods.find((p) => p.to && p.to > '2026-03-31')
      if (c) closed++
      if (g.state === 'candidate' && g.closedAt) expect(g.nDays).toBeLessThan(200 - 90)
    }
    expect(closed).toBeGreaterThanOrEqual(90)
  })

  it('l’historique des regards est hebdomadaire et l’ouverture datée', () => {
    const g = evaluateGate(simulateDays({ seed: 8, rho: () => 0.8 }))
    expect(g.looks.length).toBe(17)
    expect(g.looks[0].date).toBe('2026-01-07')
    expect(g.state).toBe('active')
    expect(g.openedAt).toBe(g.periods[0].from)
    expect(g.z).toBeGreaterThan(0)
  })
})

describe('describeGate', () => {
  const base = { needed: 30, openedAt: null, closedAt: null }
  it('compte les jours de la vérification facultative, sans jamais bloquer l’affichage', () => {
    expect(describeGate({ ...base, state: 'candidate', nDays: 1 })).toMatch(/^Vérification facultative : 1 jour sur 30 avec une note/)
    expect(describeGate({ ...base, state: 'candidate', nDays: 45 })).toMatch(/ne suit pas encore nettement vos notes/)
    expect(describeGate({ ...base, state: 'candidate', nDays: 3, closedAt: '2026-12-01' })).toMatch(/^Le lien visage ↔ notes s’est perdu le 1 décembre : on recompte/)
    expect(describeGate({ ...base, state: 'active', nDays: 50, openedAt: '2026-11-20' })).toMatch(/suit vos notes depuis le 20 novembre/)
    expect(describeGate(null)).toMatch(/facultatives/)
    for (const g of [null, { ...base, state: 'candidate', nDays: 1 }, { ...base, state: 'candidate', nDays: 45 }]) {
      expect(describeGate(g)).not.toMatch(/[Rr]ien n’est affiché/)
    }
  })
})
