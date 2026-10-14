/**
 * Couche Bluetooth générique : empreinte d'un appareil à partir de son annonce BLE et choix du « pilote ».
 * On raisonne par capacités (services GATT standard du Bluetooth SIG) puis par famille de fabricant
 * (identifiant d'entreprise, nom annoncé), jamais par liste de modèles.
 *
 * Registre ordonné : le pilote au meilleur score gagne. Pour ajouter un appareil : ajouter un pilote ici.
 * Trois sortes de pilotes : `standard` (profil GATT du Bluetooth SIG), `family` (protocole propriétaire partagé
 * par toute une gamme, que HealthTrack parle lui-même : connexion directe), `vendor` (montre reconnue dont les
 * données passent encore par son app officielle).
 */

const BASE_UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb'

/** 0x180d → '0000180d-0000-1000-8000-00805f9b34fb' */
export function uuid16(n) {
  return `0000${n.toString(16).padStart(4, '0')}${BASE_UUID_SUFFIX}`
}

/** UUID 128 bits de la base Bluetooth → nombre 16 bits ; autre UUID (propriétaire) → null. */
export function shortUuid(uuid) {
  const u = String(uuid || '').toLowerCase()
  if (/^[0-9a-f]{4}$/.test(u)) return parseInt(u, 16)
  const m = u.match(/^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/)
  return m ? parseInt(m[1], 16) : null
}

function uuidLabel(uuid) {
  const n = shortUuid(uuid)
  return n === null ? String(uuid).toLowerCase() : n.toString(16).padStart(4, '0')
}

/**
 * Empreinte d'un résultat de scan (`@capacitor-community/bluetooth-le`). Aucune adresse MAC n'est gardée.
 * @returns {{ name: string, services: string[], companyIds: number[], serviceData: string[] }}
 */
export function buildFingerprint(scan) {
  const name = (scan?.localName || scan?.device?.name || '').trim()
  const services = [...new Set([...(scan?.uuids || []), ...(scan?.device?.uuids || [])].map(uuidLabel))].sort()
  const companyIds = Object.keys(scan?.manufacturerData || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b)
  const serviceData = Object.keys(scan?.serviceData || {}).map(uuidLabel).sort()
  return { name, services, companyIds, serviceData }
}

/** Clé stable d'une famille d'appareils : nom sans numéro de série + services + fabricants. */
export function fingerprintKey(fp) {
  const family = fp.name.replace(/[\s_-]*[(]?[0-9A-F]{3,}[)]?$/i, '').trim()
  return [family, fp.services.join(','), fp.companyIds.join(',')].join('|')
}

/**
 * Familles de fabricants. `companyIds` : identifiants Bluetooth SIG (assigned numbers).
 * `wearableOnly` : la marque ne fait (presque) que des objets santé / sport, son identifiant suffit ;
 * sinon (Samsung, Huawei, Xiaomi, Google : téléphones, TV, écouteurs…) il faut un nom de montre ou de bracelet.
 * `guideId` : guide de « Votre montre n'apparaît pas ? » (src/data/watchGuides.jsx).
 */
export const VENDORS = [
  { id: 'huawei', name: 'Huawei / Honor', companyIds: [0x027d], namePattern: /^(huawei|honor) (watch|band)/i, guideId: 'huawei' },
  { id: 'samsung', name: 'Samsung', companyIds: [0x0075], namePattern: /^galaxy (watch|fit|ring)|^gear (s|fit|sport)/i, guideId: 'samsung' },
  { id: 'xiaomi', name: 'Xiaomi', companyIds: [0x038f], namePattern: /^(xiaomi (smart band|watch)|mi smart band|mi band|redmi (smart band|watch|band))/i, guideId: 'xiaomi' },
  { id: 'zepp', name: 'Amazfit / Zepp', companyIds: [0x0157], wearableOnly: true, namePattern: /^amazfit/i, guideId: 'xiaomi' },
  { id: 'garmin', name: 'Garmin', companyIds: [0x0087], wearableOnly: true, namePattern: /^(forerunner|f[eē]nix|venu|vivoactive|vivosmart|instinct|epix|enduro|hrm[- ]|garmin)/i, guideId: 'garmin' },
  { id: 'polar', name: 'Polar', companyIds: [0x006b], wearableOnly: true, namePattern: /^polar\b/i, guideId: 'other' },
  { id: 'google', name: 'Google / Fitbit', companyIds: [0x00e0], namePattern: /^(fitbit|pixel watch|charge \d|inspire \d|versa \d|sense \d)/i, guideId: 'other' },
  { id: 'oura', name: 'Oura', companyIds: [], namePattern: /^oura/i, guideId: 'other' },
  { id: 'whoop', name: 'WHOOP', companyIds: [], namePattern: /^whoop/i, guideId: 'other' },
  { id: 'withings', name: 'Withings', companyIds: [], namePattern: /^(withings|scanwatch)/i, guideId: 'other' },
  { id: 'coros', name: 'COROS', companyIds: [], namePattern: /^coros/i, guideId: 'other' },
  { id: 'suunto', name: 'Suunto', companyIds: [], namePattern: /^suunto/i, guideId: 'other' },
  { id: 'wahoo', name: 'Wahoo', companyIds: [], namePattern: /^(wahoo|tickr)/i, guideId: 'other' },
]

const byCompany = (fp) => VENDORS.find((v) => fp.companyIds.some((id) => v.companyIds.includes(id))) || null

/** Marque de l'appareil (pour l'affichage), d'après son nom ou son identifiant fabricant. */
export function findVendor(fp) {
  return VENDORS.find((v) => v.namePattern.test(fp.name)) || byCompany(fp)
}

/** Famille de montre / bracelet / bague, seulement si l'indice est sûr (pas une TV ou un téléphone de la même marque). */
export function findWearableVendor(fp) {
  const named = VENDORS.find((v) => v.namePattern.test(fp.name))
  if (named) return named
  const company = byCompany(fp)
  return company?.wearableOnly ? company : null
}

const HUAWEI_COMPANY_ID = 0x027d

/**
 * Montre ou bracelet Huawei / Honor (famille « Huawei Link », spec journal/protocoles/huawei.md) : nom de montre,
 * service propriétaire FE86 (BLE), ou identifiant Huawei avec « watch » / « band » dans le nom.
 * Jamais un téléphone ou des écouteurs de la marque.
 */
export function isHuaweiLinkDevice(fp) {
  return (
    findWearableVendor(fp)?.id === 'huawei' ||
    fp.services.includes('fe86') ||
    (fp.companyIds.includes(HUAWEI_COMPANY_ID) && /watch|band/i.test(fp.name))
  )
}

const hasService = (fp, n) => fp.services.includes(n.toString(16).padStart(4, '0'))

/** Pilote d'un profil standard : reconnu par son service GATT, quel que soit le fabricant. */
function standardDriver(id, service, label, measures, { mode = null, howTo = null } = {}) {
  return { id, kind: 'standard', service, label, measures, supported: mode !== null, mode, howTo, match: (fp) => (hasService(fp, service) ? 80 : 0) }
}

/**
 * `supported` : HealthTrack sait déjà lire ses mesures. Les autres sont reconnus et annoncés (étape suivante).
 * `mode` : `live` = mesure en direct (cardio), `receive` = l'appareil envoie ses mesures une fois prises
 * (lecteurs dans ./measurements.js) ; `howTo` : le geste à faire pendant l'attente.
 * `mode: 'direct'` (famille de protocole) : HealthTrack parle lui-même à la montre ; `transports` = liaisons
 * possibles (RFCOMM = Bluetooth classique, ble = GATT), `cardId` = carte de connexion dans Connecteurs.
 * Les autres montres propriétaires restent appairées à leur app officielle (une seule app à la fois) : leurs
 * données passent par cette app → Health Connect.
 */
export const DRIVERS = [
  standardDriver('ble_heart_rate', 0x180d, 'Capteur cardio', 'fréquence cardiaque et VFC', { mode: 'live' }),
  standardDriver('ble_blood_pressure', 0x1810, 'Tensiomètre', 'tension artérielle et pouls', { mode: 'receive', howTo: 'Lancez une mesure sur le tensiomètre' }),
  standardDriver('ble_weight_scale', 0x181d, 'Balance', 'poids', { mode: 'receive', howTo: 'Montez sur la balance' }),
  standardDriver('ble_body_composition', 0x181b, 'Balance impédancemètre', 'poids et masse grasse', { mode: 'receive', howTo: 'Montez pieds nus sur la balance' }),
  standardDriver('ble_thermometer', 0x1809, 'Thermomètre', 'température', { mode: 'receive', howTo: 'Prenez votre température' }),
  standardDriver('ble_pulse_oximeter', 0x1822, 'Oxymètre', 'SpO₂', { mode: 'receive', howTo: 'Placez votre doigt dans l’oxymètre' }),
  standardDriver('ble_glucose', 0x1808, 'Lecteur de glycémie', 'glycémie'),
  standardDriver('ble_cycling_power', 0x1818, 'Capteur de puissance vélo', 'puissance'),
  standardDriver('ble_cycling_speed', 0x1816, 'Capteur vitesse / cadence vélo', 'vitesse et cadence'),
  standardDriver('ble_running_speed', 0x1814, 'Capteur de foulée', 'vitesse et cadence de course'),
  standardDriver('ble_fitness_machine', 0x1826, 'Appareil de fitness', 'séances (tapis, vélo, rameur)'),
  {
    id: 'huawei_link',
    kind: 'family',
    label: 'Montre Huawei / Honor',
    measures: 'pas, cœur, SpO₂, sommeil et séances',
    supported: true,
    mode: 'direct',
    transports: ['rfcomm', 'ble'],
    cardId: 'watch-diag-title',
    // sous un profil standard (une montre qui diffuse sa FC reste d'abord un capteur cardio), au-dessus de « via son app »
    match: (fp) => (isHuaweiLinkDevice(fp) ? 60 : 0),
  },
  {
    id: 'vendor_watch',
    kind: 'vendor',
    label: 'Montre ou bracelet',
    measures: 'via son app officielle',
    supported: false,
    match: (fp) => (findWearableVendor(fp) ? 50 : 0),
  },
]

const UNKNOWN = { id: 'unknown', kind: 'unknown', label: 'Appareil non reconnu', measures: null, supported: false }

/**
 * `driver` : le pilote au meilleur score ; `direct` : la famille de protocole qui sait aussi s'y connecter
 * en direct (même quand un profil standard l'emporte), sinon null.
 * @returns {{ driver: object, vendor: object|null, score: number, direct: object|null }}
 */
export function identifyDevice(fp) {
  const vendor = findVendor(fp)
  let best = null
  let bestScore = 0
  for (const d of DRIVERS) {
    const score = d.match(fp)
    if (score > bestScore) {
      best = d
      bestScore = score
    }
  }
  const direct = DRIVERS.find((d) => d.mode === 'direct' && d.match(fp) > 0) || null
  return { driver: best || UNKNOWN, vendor, score: bestScore, direct }
}
