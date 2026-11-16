import { describe, it, expect, vi } from 'vitest'
import { initialTier, createFrameMeter, lowerTier, pixelRatioFor, TIER_SETTINGS } from './quality'
import { createLoop } from './loop'
import { EASE, spring, cubicBezier } from './curves'
import { flowerPose, flowerPosition, FLOWER_MS } from './flowerGrowth'
import { createGestureRecognizer } from './gestures'
import { projectPoint, CAMERA } from './camera'
import { GOLDEN, normalizeLight, directionOf } from './light'

describe('paliers de qualité (brief § 7.9)', () => {
  it('choisit un premier palier d’après l’appareil', () => {
    expect(initialTier({ webgl: false })).toBe('bas')
    expect(initialTier({ saveData: true })).toBe('bas')
    expect(initialTier({ deviceMemory: 2 })).toBe('moyen')
    expect(initialTier({ cores: 4 })).toBe('moyen')
    expect(initialTier({ deviceMemory: 8, cores: 8 })).toBe('haut')
    expect(initialTier({ forced: 'moyen' })).toBe('moyen')
  })

  it('descend d’un palier si la moyenne des 2 premières secondes dépasse 33 ms', () => {
    const m = createFrameMeter()
    let d = null
    for (let i = 0; i < 50 && !d; i++) d = m.push(45, 'haut')
    // 45 ms > 40 ms : la règle des 30 images lentes passe en bas avant la fin de la fenêtre
    expect(d.tier).toBe('bas')
    const m2 = createFrameMeter()
    let d2 = null
    for (let i = 0; i < 80 && !d2; i++) d2 = m2.push(36, 'haut')
    expect(d2).toEqual({ tier: 'moyen', reason: 'mesure', frameMs: 36 })
  })

  it('ne bouge pas quand le temps d’image tient le budget, et ne mesure qu’une fois', () => {
    const m = createFrameMeter()
    for (let i = 0; i < 200; i++) expect(m.push(12, 'haut')).toBeNull()
    expect(m.average).toBeCloseTo(12)
  })

  it('palier inférieur et densité de pixels plafonnée', () => {
    expect(lowerTier('haut')).toBe('moyen')
    expect(lowerTier('moyen')).toBe('bas')
    expect(lowerTier('bas')).toBe('bas')
    expect(pixelRatioFor('haut', 3)).toBe(2)
    expect(pixelRatioFor('moyen', 3)).toBe(1.5)
    expect(pixelRatioFor('haut', 1)).toBe(1)
    expect(TIER_SETTINGS.haut.tufts).toBeLessThanOrEqual(600)
    expect(TIER_SETTINGS.moyen.tufts).toBeLessThanOrEqual(300)
  })
})

describe('boucle de rendu', () => {
  function fakeRaf() {
    let q = []
    let now = 0
    return {
      raf: (fn) => { q.push(fn); return q.length },
      caf: () => { q = [] },
      now: () => now,
      step(ms) { now += ms; const run = q; q = []; run.forEach((f) => f()) },
      get pending() { return q.length },
    }
  }

  it('plafonne à 30 images par seconde et compte le temps de la scène', () => {
    const r = fakeRaf()
    const render = vi.fn()
    const loop = createLoop({ render, ...r })
    loop.start()
    for (let i = 0; i < 60; i++) r.step(1000 / 60)
    expect(render.mock.calls.length).toBeGreaterThanOrEqual(29)
    expect(render.mock.calls.length).toBeLessThanOrEqual(31)
    expect(loop.time).toBeGreaterThan(950)
  })

  it('ne rend rien en pause et reprend là où il s’était arrêté', () => {
    const r = fakeRaf()
    const render = vi.fn()
    const loop = createLoop({ render, ...r })
    loop.start()
    r.step(16); r.step(40)
    const t = loop.time
    loop.pause('hors-ecran')
    expect(loop.paused).toBe(true)
    expect(r.pending).toBe(0)
    r.step(5000)
    expect(loop.time).toBe(t)
    loop.pause('arriere-plan')
    loop.resume('hors-ecran')
    expect(loop.paused).toBe(true)
    loop.resume('arriere-plan')
    r.step(16); r.step(40)
    expect(loop.time - t).toBeLessThan(100)
  })

  it('20 images par seconde au repos', () => {
    const r = fakeRaf()
    const render = vi.fn()
    const loop = createLoop({ render, ...r })
    loop.setFps(20)
    loop.start()
    for (let i = 0; i < 60; i++) r.step(1000 / 60)
    expect(render.mock.calls.length).toBeLessThanOrEqual(21)
  })
})

describe('courbes et ressorts (SPEC île § 2)', () => {
  it('les courbes partent de 0 et arrivent à 1 ; « back » dépasse', () => {
    for (const f of Object.values(EASE)) {
      expect(f(0)).toBe(0)
      expect(f(1)).toBe(1)
    }
    const max = Math.max(...Array.from({ length: 50 }, (_, i) => EASE.back(i / 50)))
    expect(max).toBeGreaterThan(1)
    expect(cubicBezier(0, 0, 1, 1)(0.3)).toBeCloseTo(0.3, 3)
  })

  it('un ressort tend vers 1 et ne dépend que du temps', () => {
    expect(spring(0, 260, 9)).toBe(0)
    expect(spring(3000, 260, 9)).toBeCloseTo(1, 2)
    expect(spring(120, 260, 9)).toBe(spring(120, 260, 9))
  })
})

describe('une fleur par geste (SPEC île § 4)', () => {
  it('pousse en 1 400 ms : tige, bourgeon, éclosion, rebond', () => {
    expect(flowerPose(0).stem).toBe(0)
    const mid = flowerPose(FLOWER_MS * 0.5)
    expect(mid.stem).toBeGreaterThan(0.9)
    expect(mid.bloom).toBe(0)
    const end = flowerPose(FLOWER_MS * 3)
    expect(end).toMatchObject({ sprout: 1, stem: 1, bud: 1, bloom: 1, bounce: 1, done: true })
    expect(Number.isFinite(flowerPose(Infinity).bounce)).toBe(true)
  })

  it('en mouvements réduits, apparaît entière en fondu de 200 ms', () => {
    const p = flowerPose(100, { reducedMotion: true })
    expect(p.bloom).toBe(1)
    expect(p.opacity).toBeCloseTo(0.5)
    expect(flowerPose(250, { reducedMotion: true }).done).toBe(true)
  })

  it('place 0° devant Pilou et les angles négatifs à gauche', () => {
    const [x, z] = flowerPosition(0, 1, 1.3)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(1.3)
    expect(flowerPosition(-74, 0.9, 1.3)[0]).toBeLessThan(0)
  })
})

describe('gestes sur Pilou (SPEC personnage § 7)', () => {
  it('toucher, puis double toucher', () => {
    const g = createGestureRecognizer()
    g.down({ x: 10, y: 10, t: 0 })
    expect(g.up({ x: 11, y: 10, t: 100 })).toEqual([expect.objectContaining({ gesture: 'tap', x: 11, y: 10 })])
    g.down({ x: 12, y: 10, t: 200 })
    expect(g.up({ x: 12, y: 11, t: 280 })[0].gesture).toBe('doubletap')
  })

  it('appui long à 350 ms, puis relâchement', () => {
    const g = createGestureRecognizer()
    g.down({ x: 10, y: 10, t: 0 })
    expect(g.hold(200)).toEqual([])
    expect(g.hold(360)[0].gesture).toBe('longpress-start')
    expect(g.hold(400)).toEqual([])
    expect(g.up({ x: 10, y: 10, t: 900 }).map((e) => e.gesture)).toEqual(['longpress-end'])
  })

  it('glisser et chatouiller', () => {
    const g = createGestureRecognizer()
    g.down({ x: 0, y: 0, t: 0 })
    const s = [...g.move({ x: 40, y: 0, t: 50 }), ...g.move({ x: 80, y: 0, t: 100 })]
    expect(s[0]).toMatchObject({ gesture: 'swipe', dir: 'right' })
    g.up({ x: 80, y: 0, t: 120 })
    const h = createGestureRecognizer()
    h.down({ x: 0, y: 0, t: 0 })
    const out = []
    let x = 0
    for (let i = 1; i <= 8; i++) { x += i % 2 ? 20 : -20; out.push(...h.move({ x, y: 0, t: i * 80 })) }
    expect(out.map((e) => e.gesture)).toContain('tickle')
  })
})

describe('caméra et lumière', () => {
  it('Pilou est au centre horizontal, la pointe de l’île plus bas que lui', () => {
    const p = projectPoint([0, 0.6, 0], 360, 320)
    expect(p.x).toBeCloseTo(180)
    const tip = projectPoint([0, -1.38, 0], 360, 320)
    expect(tip.y).toBeGreaterThan(p.y)
    expect(tip.y).toBeLessThan(320)
    expect(projectPoint([0, 0, -1], 360, 320).behind).toBe(true)
    expect(CAMERA.fov).toBeGreaterThan(0)
  })

  it('heure dorée en contre-jour par défaut, et lumière partielle complétée', () => {
    expect(GOLDEN.sun.elevationDeg).toBe(15)
    expect(GOLDEN.sun.color).toBe('#FFCFA0')
    expect(directionOf(15, -150)[2]).toBeLessThan(0) // derrière Pilou
    const l = normalizeLight({ phase: 'soir', sun: { color: '#FF9F72' } })
    expect(l.sun.elevationDeg).toBe(15)
    expect(l.sun.color).toBe('#FF9F72')
    expect(normalizeLight(null)).toBe(GOLDEN)
  })
})
