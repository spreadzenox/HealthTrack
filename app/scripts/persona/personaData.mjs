// Données de démo d'une simulation de personas (décision C du 07/11, PERSONAS-1).
// Part des données de démo synthétiques (scripts/visual/demoData.mjs) et ne garde que ce qu'aurait vraiment
// la persona : selon son matériel (configuration tirée dans journal/PERSONAS.md) et son jour d'usage (1, 14, 45).

/** Ce que la personne saisit ou que le téléphone lit lui-même dans Halcya (rien d'importé). */
const APP_TYPES = new Set(['food', 'gut', 'stool', 'wellbeing', 'face_burst', 'cigarette', 'fodmap_challenge'])

/**
 * Matériel simplifié, d'après les colonnes « données reçues » de PERSONAS.md :
 * - phone : téléphone seul (pas et calories du téléphone ; ni sommeil, ni cœur, ni poids) ;
 * - watch : Galaxy Watch par Health Connect (pas, sommeil, FC, SpO₂ ; ni VFC, ni FC au repos, ni température, ni
 *   respiration : Samsung ne les y écrit pas, PERSONAS.md config. 4 ; Garmin et Xiaomi ressemblent) ;
 * - watch-hrv : montre qui envoie aussi la VFC (Fitbit, Pixel Watch, Oura…) ;
 * - huawei : montre Huawei en direct (tout, dont VFC de jour, température, stress) ;
 * - full : montre + balance connectée (tout).
 */
export const EQUIPMENT = ['phone', 'watch', 'watch-hrv', 'huawei', 'full']

export function keepForEquipment(entry, equipment) {
  if (APP_TYPES.has(entry.type)) return true
  const huawei = entry.source === 'huawei_watch'
  const hrv = entry.payload?.subtype === 'heartRateVariability'
  switch (equipment) {
    case 'phone':
      return entry.type === 'steps' || entry.type === 'calories'
    case 'watch':
      return !huawei && !hrv && entry.payload?.subtype !== 'restingHeartRate'
        && !['weight', 'body_temperature', 'respiratory_rate'].includes(entry.type)
    case 'watch-hrv':
      return !huawei && entry.type !== 'weight'
    case 'huawei':
      return entry.type !== 'weight'
    case 'full':
      return true
    default:
      throw new Error(`Matériel inconnu : ${equipment} (attendu : ${EQUIPMENT.join(', ')})`)
  }
}

/** App qui écrit dans Health Connect selon le matériel (les données de démo disent « Gadgetbridge »). */
const SOURCE_NAME = { phone: 'Samsung Health', watch: 'Samsung Health', 'watch-hrv': 'Fitbit', huawei: 'Samsung Health', full: 'Withings' }

function withSourceName(entry, equipment) {
  if (entry.source !== 'health_connect' || !entry.payload?.sourceName) return entry
  return { ...entry, payload: { ...entry.payload, sourceName: SOURCE_NAME[equipment] } }
}

/**
 * Profil de saisie (POLISH-SIM-9, 09/11) : `full` = la personne note repas, ventre et bien-être comme dans la démo ;
 * `few` = persona pressée (« ne notera presque rien ») : aucun repas, ventre, selles ni cigarette, une note de
 * bien-être un jour sur trois ; ce que le téléphone lit seul (visage) et les imports restent.
 */
export const NOTES = ['full', 'few']
const LOGGED = new Set(['food', 'gut', 'stool', 'cigarette', 'fodmap_challenge'])

function keepForNotes(entry, notes) {
  if (notes === 'full') return true
  if (LOGGED.has(entry.type)) return false
  if (entry.type !== 'wellbeing') return true
  const d = new Date(entry.at)
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) % 3 === 0
}

/**
 * Jour d'usage : jour 1 = installation du jour (aucune saisie dans l'app, l'onboarding n'est pas fait ; une montre
 * apporte ses 30 derniers jours importés) ; jour N = N jours de données (aujourd'hui compris).
 */
export function personaEntries(entries, { day, equipment, notes = 'full', goals = [], now = new Date() }) {
  if (!NOTES.includes(notes)) throw new Error(`Profil de saisie inconnu : ${notes} (attendu : ${NOTES.join(', ')})`)
  const start = (n) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (n - 1)); return d }
  const from = day <= 1 ? start(30) : start(day)
  return entries.filter((e) => {
    const at = new Date(e.at)
    if (at < from || at > now) return false
    if (day <= 1 && APP_TYPES.has(e.type)) return false
    return keepForEquipment(e, equipment) && keepForNotes(e, notes)
  }).map((e) => withSourceName(e, equipment))
    .concat(day > 1 && goals.includes('cycle') ? cycleEntries({ from, now }) : [])
}

const CYCLE_SYMPTOMS = [['cramps', 'pelvic_pain', 'fatigue'], ['cramps', 'bloating'], ['bloating'], [], []]
const CYCLE_FLOWS = ['medium', 'heavy', 'medium', 'light', 'light']

/**
 * Règles notées à la main (objectif « Mon cycle », CYCLE-2) : 5 jours tous les 28 jours, les dernières il y a 3 jours
 * (le jour 1 tombe donc le 4e jour avant aujourd'hui), avec crampes, douleur et ballonnements les premiers jours.
 * Synthétique : même format que la saisie de l'app (`src/services/cycle.js`), midi heure locale.
 */
function cycleEntries({ from, now }) {
  const out = []
  const noon = (n, minute = 0) => { const d = new Date(now); d.setDate(d.getDate() - n); d.setHours(12, minute, 0, 0); return d }
  for (let first = 7; noon(first) >= from; first += 28) {
    for (let k = 0; k < 5; k++) {
      const n = first - k
      if (n < 0 || noon(n) < from) continue
      out.push({ type: 'cycle', source: 'app_cycle', at: noon(n).toISOString(), payload: { subtype: 'period', flow: CYCLE_FLOWS[k] } })
      CYCLE_SYMPTOMS[k].forEach((symptom, i) => out.push({ type: 'cycle', source: 'app_cycle', at: noon(n, 1 + i).toISOString(), payload: { subtype: 'symptom', symptom } }))
    }
  }
  return out.filter((e) => new Date(e.at) <= now)
}
