/**
 * Formatage des dates pour l'affichage (entrées, repas).
 * @param {string} at - Date ISO ou valeur affichable
 * @returns {string}
 */
export function formatAt(at) {
  if (!at) return ''
  try {
    const d = new Date(at)
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return at
  }
}

/**
 * Durée lisible : 390 → « 6 h 30 », 480 → « 8 h », 45 → « 45 min ».
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0) return ''
  const total = Math.round(minutes)
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

const SLEEP_STATE_LABELS = {
  asleep: 'endormi',
  awake: 'éveillé',
  inBed: 'au lit',
  light: 'sommeil léger',
  deep: 'sommeil profond',
  rem: 'sommeil paradoxal',
}

/** État de sommeil Health Connect → libellé français. */
export function sleepStateLabel(state) {
  if (!state) return ''
  return SLEEP_STATE_LABELS[state] ?? state
}

const PERIOD_LABELS = {
  day: 'sur la journée',
  hour: "sur l'heure",
}

/** Période d'agrégation (« day ») → libellé français. */
export function periodLabel(period) {
  if (!period) return ''
  return PERIOD_LABELS[period] ?? period
}

/**
 * Indices des étiquettes d'axe à afficher pour éviter qu'elles se chevauchent :
 * au plus `max`, régulièrement espacées, en gardant toujours la dernière (la plus récente).
 * @param {number} n - nombre de points
 * @param {number} max - nombre maximal d'étiquettes
 * @returns {number[]}
 */
export function pickLabelIndices(n, max) {
  if (n <= 0) return []
  if (n <= max) return Array.from({ length: n }, (_, i) => i)
  if (max <= 1) return [n - 1]
  const step = Math.ceil((n - 1) / (max - 1))
  const indices = []
  for (let i = n - 1; i >= 0; i -= step) indices.unshift(i)
  return indices
}
