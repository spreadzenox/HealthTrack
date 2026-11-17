/**
 * Profil du corps de Pilou et outils de dessin, repris du kit (`double/pilou.js`, planche du chapitre 1) : le galet
 * (H = 1,38 ; largeur 0,62), la palette et les paramètres du visage peint. Les traits (peinture et pièces 3D) ne
 * connaissent du corps que ce profil : ils se rebranchent ainsi sur le rendu figurine (brief § 9, étape 14).
 */
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a, b, p) => a + (b - a) * p
export const seg = (t, a, b) => clamp((t - a) / (b - a))
export const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/* proportions (unités du modèle : le corps fait 1,38 de haut) */
export const H = 1.38
export const W = 0.62
export const BY = 0.06
export const bodyR = (t) => Math.sin(t) * W * (1 + 0.12 * Math.cos(t))
export const rAtY = (y) => bodyR(Math.acos(clamp(1 - (2 * y) / H, -1, 1)))

export const PAL = {
  menthe: '#78D8B4', creme: '#FFF1DC', pieds: '#4FC097', antenne: '#33B989', ambre: '#FFB84D', ambreLueur: '#FF9F2E',
  contour: '#4A332B', oeil: '#2B2320', bouche: '#552822', boucheInt: '#6E2A26', langue: '#FF8C8C', joue: '#FF8D80',
  montre: '#5B5F9E',
}

/* visage : la texture couvre x ∈ [-0,52 ; 0,52], y ∈ [0,32 ; 1,36] */
export const FS = 0.52
export const FY = 0.84
export const FACE0 = {
  lookX: 0, lookY: 0, es: 1, esx: 1, esy: 1,
  lidTop: 0.12, lidBot: 0.1, lidTilt: 0, lidTopL: 0, lidTopR: 0, lidBotL: 0, lidBotR: 0,
  brow: 0, browY: 0, browA: 0, browYL: 0, browYR: 0,
  mw: 0.08, mU: 0.03, mL: 0.03, mA: 0.12, mx: 0, my: 0, mSkew: 0, tongue: 0,
  blush: 0.45, hatch: 0, sparkle: 0, shine: 1, fx: 0, fy: 0,
}

/* montures : formes 2D de l'œil droit (x vers la tempe), centrées sur l'œil */
export function superellipse(a, b, n, N = 44, f) {
  const pts = []
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t)
    let x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
    if (f) [x, y] = f(x, y, t)
    pts.push([x, y])
  }
  return pts
}
export const MONTURES = {
  rondes: { pts: () => superellipse(.126, .126, 2), r: .0115, dy: -.004 },
  rectangulaires: { pts: () => superellipse(.15, .112, 4.2), r: .011, dy: -.004 },
  carrees_epaisses: { pts: () => superellipse(.152, .128, 5), r: .021, dy: 0 },
  papillon: { pts: () => superellipse(.15, .114, 3, 44, (x, y) => [x + .012 * Math.max(0, y / .114) * Math.max(0, x / .15), y + .045 * Math.pow(Math.max(0, x / .15), 2) * Math.max(0, y / .114 + .2)]), r: .016, dy: .004 },
  aviateur: { pts: () => superellipse(.148, .118, 2.3, 44, (x, y, t) => [x - .035 * Math.max(0, -Math.sin(t)) * (1 - x / .148) * .6, y > 0 ? y * .82 + .012 : y * 1.12]), r: .0085, dy: .006 },
  sans_monture: { pts: () => superellipse(.142, .11, 3.6), r: .0045, dy: 0 },
};
