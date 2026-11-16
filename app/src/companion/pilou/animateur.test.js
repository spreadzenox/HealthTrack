import { describe, it, expect } from 'vitest'
import { createAnimateur, EXPRESSIONS, DOUZE, texteHumeur, poseHumeur } from './animateur.js'
import { EXPR, preset } from './anim.js'
import { createGestes } from './gestes.js'

const FPS = 1000 / 30
// rejoue une plage de temps image par image, comme l'app (τ croissants)
function film(a, t0, t1, fn) {
  const out = []
  for (let τ = t0; τ <= t1; τ += FPS) out.push(fn ? fn(a, τ) : a.poseAt(τ))
  return out
}
const maxStep = (poses, get) => {
  let m = 0
  for (let i = 1; i < poses.length; i++) m = Math.max(m, Math.abs(get(poses[i]) - get(poses[i - 1])))
  return m
}

describe('Pilou — les 12 expressions', () => {
  it('a les 12 expressions de la planche, chacune avec son texte', () => {
    expect(DOUZE).toHaveLength(12)
    for (const e of DOUZE) {
      expect(EXPR[e], e).toBeTruthy()
      expect(EXPRESSIONS[e].texte('Pilou')).toMatch(/\S/)
    }
    expect(EXPRESSIONS.rassasie.texte('Bulle')).toBe('Bravo, Bulle est rassasié')
  })

  it('aucune n\'est triste : jamais de sourcils relevés au centre, la bouche ne descend jamais', () => {
    for (const e of DOUZE) {
      const P = preset(e)
      expect(P.f.browA, e).toBeGreaterThanOrEqual(0)
      expect(P.f.mU, e).toBeGreaterThanOrEqual(-0.06) // « o » de surprise au pire, jamais une moue
      expect(P.f.lidTilt, e).toBe(0)
    }
  })

  it('passe d\'une expression à l\'autre sans saut (fondu de 400 ms)', () => {
    const a = createAnimateur({ seed: 3 })
    a.poseAt(0)
    const poses = []
    for (let τ = 0; τ < 4000; τ += FPS) {
      if (Math.abs(τ - 1000) < FPS / 2) a.setExpression('rayonnant', τ)
      if (Math.abs(τ - 2000) < FPS / 2) a.setExpression('endormi', τ)
      if (Math.abs(τ - 2100) < FPS / 2) a.setExpression('curieux', τ) // enchaîné en plein fondu
      poses.push(a.poseAt(τ))
    }
    expect(maxStep(poses, (P) => P.f.mL)).toBeLessThan(0.03)
    expect(maxStep(poses, (P) => P.aL)).toBeLessThan(0.35)
    expect(maxStep(poses, (P) => P.glow)).toBeLessThan(0.2)
  })

  it('une séquence se joue une fois puis rend la main à l\'état de fond', () => {
    const a = createAnimateur()
    a.setExpression('absorbe', 0)
    a.setExpression('surpris', 500)
    expect(a.etat(800).cle).toBe('surpris')
    expect(a.etat(2500).cle).toBe('absorbe')
    a.setExpression('mange', 3000)
    expect(a.etat(3500).texte).toBe('Bravo, Pilou est rassasié')
    expect(a.etat(5000).cle).toBe('rassasie')
  })

  it('le nom choisi par l\'utilisateur passe dans tous les textes', () => {
    const a = createAnimateur({ nom: 'Mochi' })
    expect(a.etat(0).texte).toBe('Mochi est tranquille')
    a.setExpression('reconfortant', 10)
    expect(a.etat(20).texte).toBe('Journée difficile ? Mochi est là.')
  })
})

describe('Pilou — humeur du jour', () => {
  it('les mots suivent les seuils de la SPEC', () => {
    expect(texteHumeur(0)).toBe('Pilou est tranquille')
    expect(texteHumeur(0.5)).toBe('Pilou est content')
    expect(texteHumeur(0.95)).toBe('Pilou est rayonnant')
  })
  it('ne redescend jamais dans la journée, glisse en 1,2 s', () => {
    const a = createAnimateur()
    a.setHumeur(0.6, 0)
    expect(a.humeur(600)).toBeGreaterThan(0.1)
    expect(a.humeur(600)).toBeLessThan(0.6)
    expect(a.humeur(1300)).toBeCloseTo(0.6)
    a.setHumeur(0.2, 2000)
    expect(a.humeur(5000)).toBeCloseTo(0.6)
    a.nouvelleJournee(6000)
    expect(a.humeur(6001)).toBe(0)
  })
  it('Tranquille → Content → Rayonnant sans palier', () => {
    let prev = null
    for (let m = 0; m <= 1.0001; m += 0.02) {
      const P = poseHumeur(m, 0)
      if (prev) expect(Math.abs(P.f.mL - prev.f.mL)).toBeLessThan(0.01)
      prev = P
    }
  })
})

describe('Pilou — réactions', () => {
  it('répond au toucher dès l\'image suivante (< 100 ms)', () => {
    const a = createAnimateur({ seed: 5 })
    const ref = createAnimateur({ seed: 5 })
    a.poseAt(1000); ref.poseAt(1000)
    a.react('toucher', 1010)
    const P = a.poseAt(1043)
    const Q = ref.poseAt(1043)
    expect(P.sq).toBeLessThan(Q.sq - 0.03)
    expect(P.f.lidBot).toBeGreaterThan(Q.f.lidBot)
  })
  it('empile au plus deux réactions et ne coupe pas celle en cours', () => {
    const a = createAnimateur()
    expect(a.react('toucher', 0)).toBe(true)
    expect(a.react('saut', 10)).toBe(true)
    expect(a.react('glisser', 20)).toBe(false)
    expect(a.react('toucher', 5000)).toBe(true)
  })
  it('l\'antenne vit sur son ressort après un saut, puis revient au repos', () => {
    const a = createAnimateur({ seed: 11 })
    const calme = film(a, 0, 1000).at(-1).antZ
    a.react('saut', 1000)
    const poses = film(a, 1000 + FPS, 4500)
    const ecart = Math.max(...poses.map((P) => Math.abs(P.antZ - calme)))
    expect(ecart).toBeGreaterThan(0.05)
    expect(Math.abs(poses.at(-1).antZ - calme)).toBeLessThan(0.08)
    expect(maxStep(poses, (P) => P.antZ)).toBeLessThan(0.2)
  })
  it('est déterministe : même graine, mêmes gestes, même image', () => {
    const run = () => { const a = createAnimateur({ seed: 9 }); a.react('chatouille', 200); a.setExpression('fier', 300); return film(a, 0, 2000).at(-1) }
    expect(run()).toEqual(run())
  })
  it('deux Pilou de graines différentes ne clignent pas ensemble', () => {
    const a = createAnimateur({ seed: 1 })
    const b = createAnimateur({ seed: 2 })
    const pa = film(a, 0, 20000).map((P) => P.f.lidTop > 0.8)
    const pb = film(b, 0, 20000).map((P) => P.f.lidTop > 0.8)
    expect(pa.some(Boolean)).toBe(true)
    expect(pa.some((v, i) => v !== pb[i])).toBe(true)
  })
})

describe('Pilou — mouvements réduits', () => {
  it('rien ne saute ni ne tourne, mais les yeux restent vivants', () => {
    const a = createAnimateur({ seed: 4, reduit: true })
    a.react('saut', 500)
    a.setExpression('rayonnant', 600)
    const poses = film(a, 0, 15000)
    for (const P of poses) {
      expect(P.lift).toBe(0)
      expect(Math.abs(P.sq)).toBeLessThanOrEqual(0.002)
      expect(P.leanX).toBe(0)
      expect(P.twist).toBe(0)
      expect(P.antZ).toBe(0)
      expect(P.yaw).toBe(0)
    }
    // clignements et regard (sur des yeux ouverts : pas de clignement sur des yeux en arc)
    const calme = film(createAnimateur({ seed: 4, reduit: true }), 0, 15000)
    expect(calme.some((P) => P.f.lidTop > 0.8)).toBe(true)
    expect(new Set(calme.map((P) => P.f.lookX.toFixed(2))).size).toBeGreaterThan(3)
    // le visage, lui, change d'expression
    expect(poses.at(-1).f.lidBot).toBeGreaterThan(0.9)
  })
})

describe('Pilou — gestes', () => {
  it('toucher, puis double toucher = saut', () => {
    const g = createGestes()
    g.down(100, 100, 0)
    expect(g.up(101, 100, 120)).toEqual([{ geste: 'toucher', t: 120 }])
    g.down(102, 101, 250)
    expect(g.up(102, 101, 330)).toEqual([{ geste: 'saut', t: 330 }])
  })
  it('appui long à 350 ms, puis sa fin', () => {
    const g = createGestes()
    g.down(50, 50, 0)
    expect(g.tick(300)).toEqual([])
    expect(g.tick(360)).toEqual([{ geste: 'appui', t: 360 }])
    expect(g.up(50, 50, 900)).toEqual([{ geste: 'fin-appui', t: 900 }])
  })
  it('glisser horizontal de plus de 60 px, avec son sens', () => {
    const g = createGestes()
    g.down(100, 100, 0)
    expect(g.move(130, 102, 50)).toEqual([])
    expect(g.move(30, 104, 120)).toEqual([{ geste: 'glisser', t: 120, dir: -1 }])
    expect(g.up(30, 104, 200)).toEqual([])
  })
  it('chatouiller : 3 changements de sens en moins de 900 ms sur le ventre, puis 2 s de pause', () => {
    const g = createGestes()
    g.down(100, 200, 0, true)
    const xs = [120, 100, 120, 100, 120]
    const got = xs.flatMap((x, i) => g.move(x, 200, 100 + i * 100))
    expect(got).toEqual([{ geste: 'chatouille', t: 400 }])
    expect(g.up(120, 200, 600)).toEqual([{ geste: 'fin-chatouille', t: 600 }])
    g.down(100, 200, 1000, true)
    expect(xs.flatMap((x, i) => g.move(x, 200, 1100 + i * 100))).toEqual([])
  })
})
