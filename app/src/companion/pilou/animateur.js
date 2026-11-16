// animateur.js — l'état vivant de Pilou, sans three.js : quelle expression, quelles réactions en cours, où il
// regarde, l'humeur du jour et les ressorts (antenne, bras). poseAt(τ) rend la pose complète d'une image.
// Les courbes, durées et valeurs viennent de anim.js (référence du chapitre 1) et de specs/personnage.SPEC.md.
import { clamp, lerp, seg, sstep } from './forme.js'
import {
  E, EXPR, SPRINGS, ANT_GAIN, basePose, mixPose, preset, applyIdle, blinkAt, gazeAt, breathWave,
  tapReact, holdReact, jumpReact, swipeReact, tickleReact, reduce, hop,
} from './anim.js'
import { H, BY } from './forme.js'

/* ---------- les 12 expressions de la planche, et ce que l'app en dit ---------- */
// type « état » : dure tant que son déclencheur dure ; « séquence » : jouée une fois, puis retour à l'état de fond.
// Le texte est toujours affiché ou lu (brief § 8 : aucune information ne passe seulement par Pilou).
export const EXPRESSIONS = {
  tranquille: { nom: 'Tranquille', type: 'etat', texte: (n) => `${n} est tranquille` },
  content: { nom: 'Content', type: 'etat', texte: (n) => `${n} est content` },
  rayonnant: { nom: 'Rayonnant', type: 'etat', texte: (n) => `${n} est rayonnant` },
  curieux: { nom: 'Curieux', type: 'etat', texte: (n) => `${n} découvre…` },
  surpris: { nom: 'Surpris', type: 'sequence', duree: 1000, texte: (n) => `Un cadeau pour ${n} !` },
  concentre: { nom: 'Concentré', type: 'etat', texte: (n) => `${n} médite avec vous` },
  absorbe: { nom: 'Absorbé', type: 'etat', texte: (n) => `${n} lit` },
  rassasie: { nom: 'Rassasié', type: 'etat', texte: (n) => `Bravo, ${n} est rassasié` },
  endormi: { nom: 'Endormi', type: 'etat', texte: (n) => `${n} dort. À demain !` },
  fier: { nom: 'Fier', type: 'sequence', duree: 1000, texte: (n) => `${n} est fier de vous` },
  reconfortant: { nom: 'Réconfortant', type: 'sequence', duree: 4200, texte: (n) => `Journée difficile ? ${n} est là.` },
  salut: { nom: 'Salut', type: 'etat', texte: () => 'Bonjour !' },
  // en plus des 12 : le réveil du matin et le repas (mâchouille puis rassasié)
  reveil: { nom: 'Réveil', type: 'sequence', duree: 2400, texte: () => 'Bonjour !' },
  mange: { nom: 'Repas', type: 'sequence', duree: 1500, suite: 'rassasie', texte: (n) => `Bravo, ${n} est rassasié` },
}
export const DOUZE = ['tranquille', 'content', 'rayonnant', 'curieux', 'surpris', 'concentre', 'absorbe', 'rassasie', 'endormi', 'fier', 'reconfortant', 'salut']

// la bouche « Mâchouille » (SPEC § 2) : l'assiette arrive, il mâche 1,5 s
const MANGE = {
  p: { aL: 0.3, aR: 0.3, aLx: -0.4, aRx: -0.4, glow: 0.6, f: { lidTop: 0.1, lidBot: 0.5, mw: 0.07, mU: 0.015, mL: 0.03, mA: 0.2, blush: 0.7 } },
  anim(P, u, w) {
    P.f.mL += w * 0.018 * Math.sin(u / 85)
    P.f.mw += w * 0.008 * Math.sin(u / 85 + 1)
    P.sq += w * 0.01 * Math.sin(u / 85)
  },
}
function presetOf(e) {
  if (e === 'mange') {
    const P = basePose()
    for (const k in MANGE.p) if (k !== 'f') P[k] = MANGE.p[k]
    Object.assign(P.f, MANGE.p.f)
    return P
  }
  return preset(e)
}
function animOf(e) {
  return e === 'mange' ? MANGE.anim : EXPR[e]?.anim
}

/* ---------- humeur du jour (SPEC § 9) ---------- */
export function texteHumeur(m, nom = 'Pilou') {
  if (m < 0.2) return `${nom} est tranquille`
  if (m < 0.9) return `${nom} est content`
  return `${nom} est rayonnant`
}
// pose de l'humeur m ∈ [0 ; 1] : Tranquille → Content → Rayonnant, sans saut
export function poseHumeur(m, u) {
  m = clamp(m)
  let P
  if (m <= 0.5) P = mixPose(preset('tranquille'), preset('content'), 2 * m)
  else P = mixPose(preset('content'), preset('rayonnant'), 2 * m - 1)
  const wc = m <= 0.5 ? 2 * m : 2 - 2 * m
  if (wc > 0) EXPR.content.anim?.(P, u, wc)
  const wr = sstep(0.6, 1, m) * 0.7
  if (wr > 0) EXPR.rayonnant.anim(P, u, wr)
  return P
}

/* ---------- réactions (SPEC § 7) ---------- */
export const REACTIONS = ['toucher', 'appui', 'saut', 'glisser', 'chatouille', 'sautille']
const REACT_DUREE = { toucher: 1100, appui: 1400, saut: 1700, glisser: 2300, chatouille: 1700, sautille: 1100 }

/**
 * Crée l'animateur de Pilou.
 * @param {{ seed?: number, reduit?: boolean, nom?: string }} o
 */
export function createAnimateur({ seed = 7, reduit = false, nom = 'Pilou' } = {}) {
  let reduced = !!reduit
  let name = nom
  // couches d'expression : chacune se fond dans la précédente (jamais de saut, même si on enchaîne vite)
  let layers = [{ t: -1e9, d: 0, kind: 'humeur' }]
  let fond = { kind: 'humeur' } // l'état vers lequel revient une séquence
  // humeur : glisse en 1 200 ms (courbe douce) vers sa nouvelle valeur ; ne redescend jamais dans la journée
  let mood = { from: 0, to: 0, t: -1e9 }
  const reactions = [] // { kind, t, dur, dir, amt }
  let gaze = { on: false, t: -1e9, pts: [{ t: -1e9, x: 0, y: 0 }] }
  let cam = { on: false, t: -1e9 }
  const glowBumps = []
  // ressorts intégrés pas à pas (sous-pas de 1/120 s), état gardé entre deux images
  const sp = { tz: 0, vz: 0, tx: 0, vx: 0, al: 0, va: 0, last: null, hist: [] }

  const moodAt = (τ) => lerp(mood.from, mood.to, E.douce(seg(τ, mood.t, mood.t + 1200)))

  function layerPose(L, τ) {
    const u = τ - L.t
    if (L.kind === 'humeur') return poseHumeur(moodAt(τ), u)
    const P = presetOf(L.e)
    const a = animOf(L.e)
    if (a) a(P, u, 1)
    return P
  }
  function composed(τ, i = layers.length - 1) {
    const L = layers[i]
    const P = layerPose(L, τ)
    if (i === 0) return P
    const w = E[L.c || 'douce'](seg(τ, L.t, L.t + L.d))
    if (w >= 1) return P
    return mixPose(composed(τ, i - 1), P, w)
  }
  function push(L) {
    layers.push(L)
    if (layers.length > 6) layers = layers.slice(-6)
  }
  function settle(τ) {
    // une séquence finie rend la main à son état de fond (fondu 400 ms)
    const top = layers[layers.length - 1]
    if (top.seq && τ >= top.t + top.seq.duree && !top.done) {
      top.done = true
      const back = top.seq.suite ? { kind: 'etat', e: top.seq.suite } : top.retour === 'humeur' ? { kind: 'humeur' } : fond
      if (top.seq.suite || top.retour === 'humeur') fond = back
      push({ ...back, t: top.t + top.seq.duree, d: reduced ? 200 : 400 })
    }
    // une couche entièrement fondue cache tout ce qui est dessous
    const L = layers[layers.length - 1]
    if (layers.length > 1 && L.t + L.d <= τ && !L.seq) layers = [{ ...L, d: 0 }]
  }

  const api = {
    get nom() { return name },
    setNom(n) { name = n || 'Pilou' },
    get reduit() { return reduced },
    setReduit(v) { reduced = !!v },

    /** Expression : un état (dure) ou une séquence (jouée une fois). */
    setExpression(e, τ, { fondu, retour } = {}) {
      const meta = EXPRESSIONS[e]
      if (!meta) throw new Error(`Expression inconnue : ${e}`)
      const d = reduced ? 200 : (fondu ?? 400)
      if (meta.type === 'sequence') push({ kind: 'etat', e, t: τ, d, seq: meta, retour })
      else {
        fond = { kind: 'etat', e }
        push({ kind: 'etat', e, t: τ, d })
      }
    },
    /** Revient à l'humeur du jour (état de fond par défaut). */
    suivreHumeur(τ, fondu = 400) {
      fond = { kind: 'humeur' }
      push({ kind: 'humeur', t: τ, d: reduced ? 200 : fondu })
    },
    /** Humeur m ∈ [0 ; 1] : elle ne redescend jamais dans la journée (nouvelleJournee la remet à zéro). */
    setHumeur(m, τ) {
      const cur = moodAt(τ)
      const to = Math.max(clamp(m), mood.to)
      if (to === mood.to) return
      mood = { from: cur, to, t: τ }
    },
    nouvelleJournee(τ) { mood = { from: 0, to: 0, t: τ } },
    humeur(τ) { return moodAt(τ) },

    /** Réaction à un geste (toucher, appui, saut, glisser, chatouille, sautille). */
    react(kind, τ, { dur = 0, dir = 1, amt = 1, haut, cote } = {}) {
      if (!REACT_DUREE[kind]) throw new Error(`Réaction inconnue : ${kind}`)
      for (let i = reactions.length - 1; i >= 0; i--) if (τ - reactions[i].t > reactions[i].dur + REACT_DUREE[reactions[i].kind]) reactions.splice(i, 1)
      // une réaction en cours n'est pas coupée ; on en empile au plus deux
      if (reactions.length >= 2) return false
      reactions.push({ kind, t: τ, dur, dir, amt, haut, cote })
      return true
    },
    /** Fin d'un appui long (le doigt se lève) ou d'un chatouillis. */
    relacher(τ) {
      for (const r of reactions) if ((r.kind === 'appui' || r.kind === 'chatouille') && r.open) { r.dur = τ - r.t; r.open = false }
    },
    tenir(kind, τ) {
      const ok = api.react(kind, τ, { dur: 1e9 })
      if (ok) reactions[reactions.length - 1].open = true
      return ok
    },
    /** Regard dirigé : cible en unités du modèle depuis le visage (dx vers sa gauche à l'écran, dy vers le haut), ou null. */
    regarder(cible, τ) {
      if (!cible) { if (gaze.on) gaze = { ...gaze, on: false, t: τ }; return }
      if (!gaze.on) gaze = { on: true, t: τ, pts: [{ t: τ - 1, x: 0, y: 0 }] }
      gaze.pts.push({ t: τ, x: clamp(cible.dx / 0.4, -1, 1), y: clamp(cible.dy / 0.32, -1, 1) })
      if (gaze.pts.length > 8) gaze.pts.splice(0, gaze.pts.length - 8)
    },
    /** « Il vous regarde » : yeux vers la caméra, pupille qui se dilate (+ 18 % en 550 ms). */
    regarderCamera(on, τ) { if (cam.on !== !!on) cam = { on: !!on, t: τ } },
    /** La lueur du point ambre monte d'un cran (une bulle éclate). */
    lueur(τ) { glowBumps.push(τ); if (glowBumps.length > 4) glowBumps.shift() },

    /** L'état affiché et lu (texte toujours présent). */
    etat(τ) {
      settle(τ)
      const top = layers[layers.length - 1]
      if (top.kind === 'humeur') return { cle: 'humeur', texte: texteHumeur(moodAt(τ), name) }
      return { cle: top.e, texte: EXPRESSIONS[top.e].texte(name) }
    },

    /** Pose cinématique (sans visage) : sert aux ressorts. */
    kin(τ) { return body(τ, false) },
    /** Pose complète de l'image τ (ms). Appeler avec des τ croissants : les ressorts gardent leur état. */
    poseAt(τ) {
      settle(τ)
      const P = body(τ, true)
      stepSprings(τ)
      if (!reduced) {
        const lim = (v, m) => m * Math.tanh(v / m)
        P.antZ += lim(sp.tz, 0.75)
        P.antX += lim(sp.tx, 0.6)
        P.armLag = lim(sp.al, 0.6)
      } else P.armLag = 0
      return P
    },
    /**
     * Les petits effets dessinés des expressions (SPEC § 8) : { etincelles, anneaux, z, coeurs, traits } → poids
     * 0…1 et âge u (ms). Supprimés en mouvements réduits (rien ne monte ni ne tourne), sauf un cœur fixe pendant
     * un câlin.
     */
    effets(τ) {
      settle(τ)
      const out = {}
      const top = layers[layers.length - 1]
      const w = E.douce(seg(τ, top.t, top.t + Math.max(1, top.d)))
      const u = τ - top.t
      const e = top.kind === 'humeur' ? null : top.e
      if (e === 'rayonnant') out.etincelles = { w, u }
      else if (top.kind === 'humeur') {
        const m = moodAt(τ)
        if (m > 0.6) out.etincelles = { w: sstep(0.6, 1, m) * 0.7, u: τ }
      }
      if (e === 'concentre') out.anneaux = { w, u }
      if (e === 'endormi') out.z = { w, u }
      if (e === 'reconfortant') out.coeurs = { w: sstep(1200, 1500, u) * (1 - sstep(3400, 3800, u)), u: u - 1200 }
      if (e === 'surpris') out.traits = { w: 1 - sstep(400, 600, u), u }
      for (const r of reactions) {
        const ur = τ - r.t
        if (r.kind === 'appui' && ur > 350) {
          const fin = r.open ? 1 : 1 - sstep(r.dur, r.dur + 520, ur)
          if (fin > 0) out.coeurs = { w: Math.max(out.coeurs?.w ?? 0, sstep(350, 600, ur) * fin), u: ur - 350 }
        }
      }
      if (reduced) {
        const c = out.coeurs
        return c && c.w > 0 ? { coeurs: { w: c.w, u: 0, fixe: true } } : {}
      }
      for (const k of Object.keys(out)) if (!(out[k].w > 0.001)) delete out[k]
      return out
    },
    _layers: () => layers.length,
  }

  function gazeVal(τ, delay, dur, curve) {
    const pts = gaze.pts
    const tt = τ - delay
    let i = 0
    while (i + 1 < pts.length && pts[i + 1].t <= tt) i++
    const a = pts[Math.max(0, i - 1)]
    const b = pts[i]
    const p = E[curve](seg(tt, b.t, b.t + dur))
    return [lerp(a.x, b.x, p), lerp(a.y, b.y, p)]
  }

  function body(τ, withFace) {
    const P = composed(τ)
    // regard dirigé : il remplace le regard qui se promène (gazeW → 0 en 300 ms ; retour en 400 ms)
    const dw = gaze.on ? E.douce(seg(τ, gaze.t, gaze.t + 300)) : 1 - E.douce(seg(τ, gaze.t, gaze.t + 400))
    const free = P.gazeW
    P.gazeW = free * (1 - dw)
    applyIdle(P, τ, seed, reduced ? 0 : 1, !withFace)
    if (reduced && withFace) {
      // les yeux restent vivants : le regard libre (yeux seulement) et une respiration très atténuée
      const [gx, gy] = gazeAt(seed, τ, 90, 'sortie')
      P.f.lookX += free * (1 - dw) * gx
      P.f.lookY += free * (1 - dw) * gy
    }
    if (dw > 0) {
      const [ex, ey] = gazeVal(τ, 60, 90, 'sortie')
      const [hx, hy] = gazeVal(τ, 250, 450, 'douce')
      const [bx, by] = gazeVal(τ, 400, 450, 'douce')
      if (withFace) { P.f.lookX += dw * ex; P.f.lookY += dw * ey; P.f.fx += dw * 0.05 * hx; P.f.fy += dw * 0.03 * hy }
      P.twist += dw * 0.14 * hx
      P.leanZ += dw * 0.06 * bx
      P.leanX += dw * -0.03 * by
    }
    // réactions en cours (additives)
    for (const r of reactions) {
      const u = τ - r.t
      if (u < 0) continue
      const dur = r.open ? Math.max(u, 0) + 1 : r.dur
      if (r.kind === 'toucher') tapReact(P, u, r.amt, reduced)
      else if (r.kind === 'appui') holdReact(P, u, dur, r.amt, reduced)
      else if (r.kind === 'saut') jumpReact(P, u, r.amt, reduced, 0.5)
      else if (r.kind === 'sautille') {
        jumpReact(P, u, r.amt * 0.7, reduced, r.haut ?? 0.2)
        // le bras du côté de la bulle se lève (SPEC île § 3)
        const up = 1.6 * hop(seg(u, 0, 700))
        if (r.cote === 'left') P.aL += up
        else if (r.cote === 'right') P.aR += up
      }
      else if (r.kind === 'chatouille') tickleReact(P, u, dur, r.amt, reduced)
      else if (r.kind === 'glisser') {
        swipeReact(P, u, r.amt * r.dir, reduced)
        // les yeux suivent le doigt avant la pirouette (et c'est tout en mouvements réduits)
        const follow = sstep(0, 60, u) * (1 - sstep(500, 700, u))
        P.f.lookX += follow * 0.8 * r.dir
        if (!reduced) P.twist += follow * 0.3 * r.dir
      }
    }
    // la lueur monte d'un cran quand une bulle éclate
    for (const g of glowBumps) P.glow += 0.35 * hop(seg(τ, g, g + 900))
    // « il vous regarde » et la pupille
    const cw = cam.on ? E.douce(seg(τ, cam.t, cam.t + 450)) : 1 - E.douce(seg(τ, cam.t, cam.t + 450))
    P.camW = cw * (1 - dw) * free // pas vers vous quand il lit, médite ou dort
    const dil = cam.on ? E.douce(seg(τ, cam.t, cam.t + 550)) : 1 - E.douce(seg(τ, cam.t, cam.t + 550))
    P.pupil = 0.4 * (1 + 0.18 * dil) * (1 + 0.02 * breathWave(τ, 3600))
    if (!withFace) return P
    // clignement (pas sur des yeux en arc)
    const b = blinkAt(seed, τ)
    P.f.lidTop = Math.max(P.f.lidTop, b * (1 - sstep(0.6, 0.9, P.f.lidBot)))
    if (reduced) {
      reduce(P)
      P.sq = 0.002 * breathWave(τ, P.breathT || 3600)
    }
    return P
  }

  // le sommet de la tête (même calcul que springs() de anim.js), pour piloter antenne et bras
  function top(q) {
    const h = (H + BY) * (1 + q.sq) * (q.scale || 1)
    const lx = q.leanX - 0.2 * (q.sit || 0)
    const lz = q.leanZ
    const x = h * Math.cos(lx) * Math.sin(lz)
    const y = h * Math.cos(lx) * Math.cos(lz) + q.lift * (q.scale || 1)
    const z = h * Math.sin(lx)
    const c = Math.cos(q.yaw)
    const s = Math.sin(q.yaw)
    return [q.x + x * c + z * s, y, q.z - x * s + z * c, q.yaw + q.twist, lz, lx]
  }
  function stepSprings(τ) {
    const dt = 1000 / 120
    if (sp.last === null || τ < sp.last || τ - sp.last > 1500) {
      // premier appel, retour en arrière ou longue pause : on repart au repos, sans à-coup
      Object.assign(sp, { tz: 0, vz: 0, tx: 0, vx: 0, al: 0, va: 0, last: τ - 2 * dt, hist: [] })
      sp.hist = [top(body(τ - 2 * dt, false)), top(body(τ - dt, false))]
      sp.last = τ - dt
    }
    const sA = SPRINGS.antenne
    const sB = SPRINGS.bras
    const dts = dt / 1000
    while (sp.last + dt <= τ + 1e-6) {
      const t = sp.last + dt
      const a = top(body(t, false))
      const [c, b2] = sp.hist
      const acc = [0, 1, 2].map((j) => (a[j] - 2 * b2[j] + c[j]) / (dts * dts))
      const ang = [3, 4, 5].map((j) => (a[j] - 2 * b2[j] + c[j]) / (dts * dts))
      const cy = Math.cos(a[3])
      const sy = Math.sin(a[3])
      const lxA = acc[0] * cy - acc[2] * sy
      const lzA = acc[0] * sy + acc[2] * cy
      const lyA = acc[1]
      const fz = -sA.k * sp.tz - sA.c * sp.vz + ANT_GAIN.lat * lxA - ANT_GAIN.vert * lyA + ANT_GAIN.rot * ang[1]
      const fx = -sA.k * sp.tx - sA.c * sp.vx - ANT_GAIN.avant * lzA - ANT_GAIN.rot * ang[2] + ANT_GAIN.lacet * ang[0]
      sp.vz += fz * dts; sp.tz += sp.vz * dts; sp.vx += fx * dts; sp.tx += sp.vx * dts
      const fa = -sB.k * sp.al - sB.c * sp.va - 0.9 * lyA
      sp.va += fa * dts; sp.al += sp.va * dts
      sp.hist = [b2, a]
      sp.last = t
    }
  }

  return api
}
