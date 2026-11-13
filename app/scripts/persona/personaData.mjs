// Données de démo d'une simulation de personas (décision C du 07/11, PERSONAS-1).
// Part des données de démo synthétiques (scripts/visual/demoData.mjs) et ne garde que ce qu'aurait vraiment
// la persona : selon son matériel (configuration tirée dans journal/PERSONAS.md) et son jour d'usage (1, 14, 45).

/** Ce que la personne saisit ou que le téléphone lit lui-même dans Halcya (rien d'importé). */
const APP_TYPES = new Set(['food', 'gut', 'stool', 'wellbeing', 'face_burst', 'cigarette', 'fodmap_challenge'])

/**
 * Contexte que l'app lit elle-même une fois la source activée (météo : position choisie ; temps d'écran : accès à
 * l'utilisation). Au jour 1 rien n'est activé : aucune tuile « Météo » ni « Écran » (POLISH-SIM-45, artefact du
 * 10/11). Ensuite, on suppose les deux activées à l'accueil (la météo reprend alors 92 jours, `persona-browse` coche
 * le réglage pour que Sources dise la même chose).
 */
export const CONTEXT_TYPES = new Set(['weather', 'phone_usage'])

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

/** Ce qu'une balance connectée envoie : absent sans balance (POLISH-SIM-66 : « Pesée Withings » chez la Galaxy Watch). */
const SCALE_TYPES = new Set(['weight', 'body_composition'])

export function keepForEquipment(entry, equipment) {
  // POLISH-SIM-63 : le compteur de cigarettes est une option que personne n'active par défaut ; aucune persona ne fume.
  if (entry.type === 'cigarette') return false
  if (APP_TYPES.has(entry.type)) return true
  if (equipment !== 'full' && EQUIPMENT.includes(equipment) && SCALE_TYPES.has(entry.type)) return false
  const huawei = entry.source === 'huawei_watch'
  const hrv = entry.payload?.subtype === 'heartRateVariability'
  switch (equipment) {
    case 'phone':
      return entry.type === 'steps' || entry.type === 'calories'
    case 'watch':
      return !huawei && !hrv && entry.payload?.subtype !== 'restingHeartRate'
        && !['body_temperature', 'respiratory_rate'].includes(entry.type)
    case 'watch-hrv':
      return !huawei
    case 'huawei':
      return true
    case 'full':
      return true
    default:
      throw new Error(`Matériel inconnu : ${equipment} (attendu : ${EQUIPMENT.join(', ')})`)
  }
}

/** App qui écrit dans Health Connect selon le matériel (les données de démo disent « Gadgetbridge »). */
const SOURCE_NAME = { phone: 'Samsung Health', watch: 'Samsung Health', 'watch-hrv': 'Fitbit', huawei: 'Samsung Health', full: 'Withings' }

function withSourceName(entry, equipment, sourceName) {
  if (entry.source !== 'health_connect' || !entry.payload?.sourceName) return entry
  return { ...entry, payload: { ...entry.payload, sourceName: sourceName || SOURCE_NAME[equipment] } }
}

/** SpO₂ de la nuit (POLISH-SIM-35) : ✓ pour la Galaxy Watch (config. 4) et le « tout mesurer », ≈ Huawei en direct ;
 * ✗ Fitbit / Pixel Watch (config. 13), rien pour le téléphone seul. Valeurs fixées par le rang de la nuit. */
const SPO2_VALUES = [96, 97, 95, 97, 98, 96, 94]

function spo2Entries({ from, now, equipment, sourceName }) {
  if (!['watch', 'full', 'huawei'].includes(equipment)) return []
  const huawei = equipment === 'huawei'
  const out = []
  for (let n = 0; ; n++) {
    const d = new Date(now); d.setDate(d.getDate() - n); d.setHours(4, 12, 0, 0)
    if (d < from) break
    if (d > now) continue
    const value = SPO2_VALUES[n % SPO2_VALUES.length]
    out.push(huawei
      ? { type: 'heart_rate', source: 'huawei_watch', at: d.toISOString(), payload: { value, unit: '%', subtype: 'oxygenSaturation', during: 'sleep', samples: 1, connector: 'huawei_watch', sourceName: 'Montre Huawei' } }
      : { type: 'heart_rate', source: 'health_connect', at: d.toISOString(), payload: { value, unit: 'percent', subtype: 'oxygenSaturation', connector: 'health_connect', sourceName: sourceName || SOURCE_NAME[equipment] } })
  }
  return out
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
 * `sourceName` (facultatif, `--source=`) : l'app qui écrit dans Health Connect sur le téléphone tiré (Pixel → « Google Fit »,
 * Amazfit → « Zepp », Xiaomi → « Mi Fitness »), sinon celle de `SOURCE_NAME` (POLISH-SIM-35).
 *
 * Jour d'usage : jour 1 = installation du jour (aucune saisie dans l'app, l'onboarding n'est pas fait ; une montre
 * apporte ses 30 derniers jours importés) ; jour N = N jours de données (aujourd'hui compris).
 */
export function personaEntries(entries, { day, equipment, notes = 'full', goals = [], sourceName, now = new Date() }) {
  if (!NOTES.includes(notes)) throw new Error(`Profil de saisie inconnu : ${notes} (attendu : ${NOTES.join(', ')})`)
  const start = (n) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (n - 1)); return d }
  const from = day <= 1 ? start(30) : start(day)
  return entries.filter((e) => {
    const at = new Date(e.at)
    if (at < from || at > now) return false
    if (day <= 1 && (APP_TYPES.has(e.type) || CONTEXT_TYPES.has(e.type))) return false
    return keepForEquipment(e, equipment) && keepForNotes(e, notes)
  }).map((e) => withSourceName(e, equipment, sourceName))
    .concat(spo2Entries({ from, now, equipment, sourceName }))
    .concat(day > 1 && goals.includes('cycle') ? cycleEntries({ from, now }) : [])
    .concat(day > 1 && notes === 'full' && goals.includes('gut') ? gutEntries(entries, { from, now }) : [])
}

const GUT_LEVELS = ['calm', 'calm', 'calm', 'discomfort', 'calm', 'discomfort', 'pain']
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/**
 * POLISH-SIM-32 : la démo n'a des notes digestives que sur ses 10 derniers jours ; une persona « ventre » qui note
 * tout en a une chaque soir (21 h) sur toute la période, les jours déjà notés par la démo gardés tels quels.
 * Niveaux synthétiques, fixés par le rang du jour (aucun hasard : mêmes données d'un passage à l'autre).
 */
function gutEntries(entries, { from, now }) {
  const noted = new Set(entries.filter((e) => e.type === 'gut').map((e) => dayKey(new Date(e.at))))
  const out = []
  for (let n = 0; ; n++) {
    const d = new Date(now); d.setDate(d.getDate() - n); d.setHours(21, 5, 0, 0)
    if (d < from) break
    if (d > now || noted.has(dayKey(d))) continue
    out.push({ type: 'gut', source: 'app_gut', at: d.toISOString(), payload: { level: GUT_LEVELS[n % GUT_LEVELS.length] } })
  }
  return out
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
