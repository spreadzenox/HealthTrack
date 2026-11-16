/** Mot et expression d'état de l'humeur du jour (SPEC personnage § 9) : jamais triste, plancher « tranquille ». */
export function moodWord(m = 0) {
  if (m < 0.2) return 'tranquille'
  if (m < 0.9) return 'content'
  return 'rayonnant'
}

export function moodExpression(m = 0) {
  return moodWord(m)
}

/** WebGL disponible (faux sous jsdom : les tests rendent le palier bas). */
export function webglAvailable() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  if (/jsdom/i.test(navigator.userAgent || '')) return false
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
