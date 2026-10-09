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

/**
 * Nombre signé à la française : 0.364 → « +0,36 », -0.28 → « −0,28 ».
 * Une valeur qui s'arrondit à zéro s'affiche « 0,00 » (jamais « −0,00 »).
 * @param {number} value
 * @param {number} digits - décimales
 * @returns {string}
 */
export function formatSigned(value, digits) {
  const text = Math.abs(value).toFixed(digits)
  const abs = text.replace('.', ',')
  if (Number(text) === 0) return abs
  return (value > 0 ? '+' : '−') + abs
}

const WORKOUT_TYPE_LABELS = {
  walking: 'Marche',
  running: 'Course à pied',
  runningTreadmill: 'Course sur tapis',
  cycling: 'Vélo',
  biking: 'Vélo',
  bikingStationary: "Vélo d'appartement",
  hiking: 'Randonnée',
  swimming: 'Natation',
  swimmingPool: 'Natation en piscine',
  swimmingOpenWater: 'Natation en eau libre',
  strengthTraining: 'Renforcement musculaire',
  traditionalStrengthTraining: 'Musculation',
  functionalStrengthTraining: 'Renforcement fonctionnel',
  weightlifting: 'Haltérophilie',
  highIntensityIntervalTraining: 'HIIT',
  crossTraining: 'Cross-training',
  elliptical: 'Vélo elliptique',
  rowing: 'Aviron',
  rowingMachine: 'Rameur',
  yoga: 'Yoga',
  pilates: 'Pilates',
  stretching: 'Étirements',
  dance: 'Danse',
  dancing: 'Danse',
  soccer: 'Football',
  basketball: 'Basket',
  tennis: 'Tennis',
  tableTennis: 'Tennis de table',
  badminton: 'Badminton',
  volleyball: 'Volley',
  handball: 'Handball',
  rugby: 'Rugby',
  boxing: 'Boxe',
  martialArts: 'Arts martiaux',
  climbing: 'Escalade',
  rockClimbing: 'Escalade',
  skiing: 'Ski',
  downhillSkiing: 'Ski alpin',
  crossCountrySkiing: 'Ski de fond',
  snowboarding: 'Snowboard',
  golf: 'Golf',
  stairClimbing: 'Montée d’escaliers',
  meditation: 'Méditation',
  guidedBreathing: 'Respiration guidée',
  other: 'Autre activité',
}

/** Type d'activité Health Connect (« cycling ») → libellé français (« Vélo »). */
export function workoutTypeLabel(type) {
  if (!type) return ''
  if (WORKOUT_TYPE_LABELS[type]) return WORKOUT_TYPE_LABELS[type]
  // Type non traduit : « dumbbellLateralRaise » → « Dumbbell lateral raise » plutôt que brut.
  const words = String(type).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const EVIDENCE_LABELS = {
  solide: 'Hypothèse solide',
  'à confirmer': 'Hypothèse à confirmer',
  incertain: 'Hypothèse incertaine',
}

/** Niveau de confiance statistique → libellé accordé (« Hypothèse incertaine »). */
export function evidenceLabel(evidence) {
  return EVIDENCE_LABELS[evidence] ?? `Hypothèse ${evidence}`
}
