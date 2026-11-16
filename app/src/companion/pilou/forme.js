// forme.js — l'identité de Pilou : proportions, palette, visage par défaut, petites fonctions de calcul.
// Repris de la planche du chapitre 1 (journal/maquettes/compagnon/personnage/pilou.js), sans three.js :
// tout ici est pur et testable sans navigateur.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a, b, p) => a + (b - a) * p
export const seg = (t, a, b) => clamp((t - a) / (b - a))
export const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/* ---------- proportions (unités du modèle : le corps fait 1,38 de haut) ---------- */
export const H = 1.38
export const W = 0.62
export const BY = 0.06
// galet de révolution : plus large en bas qu'en haut
export const bodyR = (t) => Math.sin(t) * W * (1 + 0.12 * Math.cos(t))
export const rAtY = (y) => bodyR(Math.acos(clamp(1 - (2 * y) / H, -1, 1)))
// hauteur totale de Pilou, antenne et point ambre compris (pour cadrer une caméra)
export const HAUTEUR_TOTALE = H + BY + 0.29 + 0.078

/* ---------- palette (planche du chapitre 1, brief § 7.2) ---------- */
export const PAL = {
  menthe: '#78D8B4',
  belly: '#FFF1DC',
  pieds: '#4FC097',
  antenne: '#33B989',
  ambre: '#FFB84D',
  ambreLueur: '#FF9F2E',
  bouche: '#552822',
  boucheInt: '#6E2A26',
  langue: '#FF8C8C',
  joue: '#FF8A8A',
  bracelet: '#5B5F9E',
}

/* ---------- visage : projection de face (la toile couvre x ∈ [−0,52 ; 0,52], y ∈ [0,32 ; 1,36]) ---------- */
export const FS = 0.52
export const FY = 0.84
export const FACE0 = {
  lookX: 0, lookY: 0, es: 1, esx: 1, esy: 1,
  lidTop: 0.12, lidBot: 0.1, lidTilt: 0, lidTopL: 0, lidTopR: 0, lidBotL: 0, lidBotR: 0,
  brow: 0, browY: 0, browA: 0, browYL: 0, browYR: 0,
  mw: 0.08, mU: 0.03, mL: 0.03, mA: 0.12, mx: 0, my: 0, mSkew: 0, tongue: 0,
  blush: 0.45, hatch: 0, sparkle: 0, shine: 1, fx: 0, fy: 0,
}

// tracé de la bouche (deux courbes de Bézier), partagé par la peinture du visage
export function mouthPath(ctx, X, Y, F) {
  const w = F.mw
  const yc = 0.745 + F.my
  const mx = F.mx
  const a = F.mA
  const dU = F.mU
  const dL = Math.max(F.mL, F.mU)
  const Ly = yc + F.mSkew * 0.02
  const Ry = yc - F.mSkew * 0.02
  const L = [mx - w, Ly]
  const R = [mx + w, Ry]
  return {
    L, R, dU, dL, yc, w, mx,
    upper() {
      ctx.moveTo(X(L[0]), Y(L[1]))
      ctx.bezierCurveTo(X(L[0] + w * a), Y(L[1] - (4 / 3) * dU), X(R[0] - w * a), Y(R[1] - (4 / 3) * dU), X(R[0]), Y(R[1]))
    },
    lower() {
      ctx.bezierCurveTo(X(R[0] - w * a), Y(R[1] - (4 / 3) * dL), X(L[0] + w * a), Y(L[1] - (4 / 3) * dL), X(L[0]), Y(L[1]))
    },
  }
}
