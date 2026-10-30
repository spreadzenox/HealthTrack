import { appLocale, decimalMark } from '../i18n/locale.js'

/**
 * Formatage des dates pour l'affichage (entrées, repas).
 * @param {string} at - Date ISO ou valeur affichable
 * @returns {string}
 */
export function formatAt(at) {
  if (!at) return ''
  try {
    const d = new Date(at)
    return d.toLocaleDateString(appLocale(), {
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

/** Minutes après minuit → « 23 h 25 » (arrondi à 5 min). */
export function formatClock(minutes) {
  const m = (Math.round(minutes / 5) * 5) % 1440
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm === 0 ? `${h} h` : `${h} h ${String(mm).padStart(2, '0')}`
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
  const abs = text.replace('.', decimalMark())
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
  jumpRope: 'Corde à sauter',
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

/** Secondes par km → « 5:24 /km ». */
export function formatPace(secondsPerKm) {
  const s = Math.round(secondsPerKm)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} /km`
}

/** Détails d'une séance lus par la montre (M7) : « FC moy. 135 bpm », allure moyenne des kilomètres complets. */
export function workoutDetailParts(payload) {
  const out = []
  if (payload?.avgHeartRate) out.push(`FC moy. ${payload.avgHeartRate} bpm`)
  const splits = payload?.paceSplitsSecPerKm
  if (Array.isArray(splits) && splits.length) out.push(formatPace(splits.reduce((a, x) => a + x, 0) / splits.length))
  return out
}

/** VC-23 : l'échelle unique de DESIGN.md (« piste solide » menthe, « à confirmer » pêche, « trop tôt pour dire » gris). */
const EVIDENCE_LABELS = {
  solide: 'Piste solide',
  'à confirmer': 'À confirmer',
  incertain: 'Trop tôt pour dire',
}

/** Niveau de confiance statistique (q) → libellé de l'échelle unique. */
export function evidenceLabel(evidence) {
  return EVIDENCE_LABELS[evidence] ?? evidence
}

/**
 * Mots qui décrivent la préparation plutôt que l'aliment (« cuit à la vapeur », « aliment moyen »), ou la partie
 * mangée (« chair sans peau », « pelée ») et la forme du café (« non instantané ») : rien qui change d'aliment.
 */
const FOOD_PREPARATION_WORDS = [
  'cuit', 'bouilli', 'vapeur', 'cru', 'frit', 'rôti', 'grill', 'poêl', 'brais', 'sauté',
  'préemballé', 'prêt à', 'surgelé', 'appertisé', 'égoutté', 'aliment moyen',
  'chair', 'pulpe', 'pelé', 'instantané',
]

/**
 * Ligature « œ » que la table Ciqual écrit « oe » : « Oeuf » → « Œuf », « boeuf », « coeur », « oeil », « noeud »,
 * « soeur », « voeu ». Seulement devant « u » ou « il » en début de mot (« moelleux », « phoenix », « Potatoes »
 * restent tels quels). Affichage seulement : le nom enregistré ne change pas.
 */
export function frenchLigatures(text) {
  return String(text ?? '').replace(/(^|[^\p{L}])([bcnsvBCNSV]?)(o|O)e(?=u|il)/gu,
    (_, before, prefix, o) => `${before}${prefix}${o === 'O' ? 'Œ' : 'œ'}`)
}

/**
 * Nom d'aliment court pour les listes : « Poulet, cuisse, viande bouillie/cuite à l'eau » → « Poulet, cuisse ».
 * Garde la première partie, plus la deuxième si la première n'est qu'un mot et que la deuxième précise
 * l'aliment (« Fromage, emmental ») plutôt que sa cuisson (« Saumon, cuit à la vapeur » → « Saumon »).
 */
export function shortFoodName(name) {
  const parts = frenchLigatures(name)
    .replace(/\s*\([^)]*\)/g, '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return ''
  const [first, second] = parts
  const describesFood = second && !FOOD_PREPARATION_WORDS.some((w) => second.toLowerCase().includes(w))
  return !first.includes(' ') && describesFood ? `${first}, ${second}` : first
}
