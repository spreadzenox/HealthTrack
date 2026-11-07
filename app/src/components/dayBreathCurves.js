/** Formes de l'horizon qui respire (TESTEUR-1e), à part pour le rechargement à chaud. */
/** Courbes de Bézier (viewBox 0 0 80 60), y plus petit = plus haut. */
export const BREATH_CURVES = {
  good: 'M4 44 C 28 44, 52 18, 76 16',
  medium: 'M4 32 C 26 27, 54 37, 76 32',
  hard: 'M4 16 C 28 18, 52 44, 76 44',
}

/** Ordonnée de la courbe au milieu (t = 0,5), où se pose le point ambre. */
export const BREATH_DOT_Y = { good: 30.75, medium: 32, hard: 30.75 }
