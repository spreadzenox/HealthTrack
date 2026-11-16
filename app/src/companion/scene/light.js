/**
 * La lumière de la scène (brief § 7.5) : heure dorée en contre-jour. `GOLDEN` est la valeur par défaut, au format de
 * `lightAt()` du lot MONDE (CONTRAT.md § 5) ; quand ce module est là, la scène suit l'heure du téléphone.
 */
export const GOLDEN = Object.freeze({
  phase: 'midi',
  sky: { top: '#FFD7BA', bottom: '#FFF3E6' },
  sun: { color: '#FFCFA0', intensity: 2.6, elevationDeg: 15, azimuthDeg: -150 },
  fill: { color: '#FFE4D2', intensity: 1.35 },
  hemi: { sky: '#FFF1E4', ground: '#9DB87A', intensity: 0.8 },
  haze: '#FFC9A6',
  ambreGlow: 0.55,
  stars: 0,
})

/** Direction (x, y, z normalisés) d'une lumière donnée par son élévation et son azimut, en degrés. */
export function directionOf(elevationDeg, azimuthDeg) {
  const el = (elevationDeg * Math.PI) / 180
  const az = (azimuthDeg * Math.PI) / 180
  return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]
}

/** Complète une sortie partielle de `lightAt` avec `GOLDEN` (un champ manquant ne casse jamais la scène). */
export function normalizeLight(light) {
  if (!light || typeof light !== 'object') return GOLDEN
  return {
    ...GOLDEN,
    ...light,
    sky: { ...GOLDEN.sky, ...(light.sky || {}) },
    sun: { ...GOLDEN.sun, ...(light.sun || {}) },
    fill: { ...GOLDEN.fill, ...(light.fill || {}) },
    hemi: { ...GOLDEN.hemi, ...(light.hemi || {}) },
  }
}
