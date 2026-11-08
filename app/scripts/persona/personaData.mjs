// Données de démo d'une simulation de personas (décision C du 07/11, PERSONAS-1).
// Part des données de démo synthétiques (scripts/visual/demoData.mjs) et ne garde que ce qu'aurait vraiment
// la persona : selon son matériel (configuration tirée dans journal/PERSONAS.md) et son jour d'usage (1, 14, 45).

/** Ce que la personne saisit ou que le téléphone lit lui-même dans Halcya (rien d'importé). */
const APP_TYPES = new Set(['food', 'gut', 'stool', 'wellbeing', 'face_burst', 'cigarette', 'fodmap_challenge'])

/**
 * Matériel simplifié, d'après les colonnes « données reçues » de PERSONAS.md :
 * - phone : téléphone seul (pas et calories du téléphone ; ni sommeil, ni cœur, ni poids) ;
 * - watch : montre qui écrit dans Health Connect sans VFC (Samsung, Garmin, Xiaomi) ;
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
      return !huawei && !hrv && entry.type !== 'weight'
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

/**
 * Jour d'usage : jour 1 = installation du jour (aucune saisie dans l'app, l'onboarding n'est pas fait ; une montre
 * apporte ses 30 derniers jours importés) ; jour N = N jours de données (aujourd'hui compris).
 */
export function personaEntries(entries, { day, equipment, now = new Date() }) {
  const start = (n) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (n - 1)); return d }
  const from = day <= 1 ? start(30) : start(day)
  return entries.filter((e) => {
    const at = new Date(e.at)
    if (at < from || at > now) return false
    if (day <= 1 && APP_TYPES.has(e.type)) return false
    return keepForEquipment(e, equipment)
  })
}
