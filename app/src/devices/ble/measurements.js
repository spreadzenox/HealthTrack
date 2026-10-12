/**
 * Profils Bluetooth standard « appareils de mesure » (Bluetooth SIG, GATT Specification Supplement) :
 * tensiomètre (0x1810 / 0x2A35), balance (0x181D / 0x2A9D), impédancemètre (0x181B / 0x2A9C),
 * thermomètre (0x1809 / 0x2A1C), oxymètre (0x1822 / 0x2A5E ponctuel, 0x2A5F continu).
 * Ces appareils envoient leurs mesures par « indications » juste après la mesure (souvent aussi
 * celles gardées en mémoire), puis se déconnectent. Valeurs au format IEEE-11073 (SFLOAT / FLOAT).
 */

const KPA_TO_MMHG = 7.50062
const LB_TO_KG = 0.45359237
const FUTURE_TOLERANCE_MS = 24 * 3600 * 1000

const round1 = (v) => Math.round(v * 10) / 10
const round2 = (v) => Math.round(v * 100) / 100
const inRange = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max

/** SFLOAT 16 bits : mantisse 12 bits signée, exposant 4 bits signé (base 10). Valeurs spéciales → null. */
export function readSfloat(view, offset) {
  const raw = view.getUint16(offset, true)
  let mantissa = raw & 0x0fff
  if (mantissa >= 0x07fe && mantissa <= 0x0802) return null // NaN, NRes, ±INF, réservé
  if (mantissa >= 0x0800) mantissa -= 0x1000
  let exp = raw >> 12
  if (exp >= 0x8) exp -= 0x10
  return exp < 0 ? mantissa / 10 ** -exp : mantissa * 10 ** exp
}

/** FLOAT 32 bits : mantisse 24 bits signée, exposant 8 bits signé. Valeurs spéciales → null. */
export function readFloat(view, offset) {
  const raw = view.getUint32(offset, true)
  let mantissa = raw & 0xffffff
  if (mantissa >= 0x7ffffe && mantissa <= 0x800002) return null
  if (mantissa >= 0x800000) mantissa -= 0x1000000
  let exp = raw >>> 24
  if (exp >= 0x80) exp -= 0x100
  return exp < 0 ? mantissa / 10 ** -exp : mantissa * 10 ** exp
}

/** Date Time (7 octets, heure locale de l'appareil). Horloge non réglée ou dans le futur → null (heure de réception). */
function readDateTime(view, offset, now) {
  const year = view.getUint16(offset, true)
  const month = view.getUint8(offset + 2)
  const day = view.getUint8(offset + 3)
  if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const at = new Date(year, month - 1, day, view.getUint8(offset + 4), view.getUint8(offset + 5), view.getUint8(offset + 6))
  if (Number.isNaN(at.getTime()) || at.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) return null
  return at
}

const fits = (view, offset, size) => view && view.byteLength >= offset + size

/** Tension artérielle (0x2A35). */
export function parseBloodPressure(view, { now = new Date() } = {}) {
  if (!fits(view, 0, 7)) return null
  const flags = view.getUint8(0)
  const factor = flags & 0x01 ? KPA_TO_MMHG : 1
  const sys = readSfloat(view, 1)
  const dia = readSfloat(view, 3)
  let offset = 7
  let at = null
  if (flags & 0x02) {
    if (!fits(view, offset, 7)) return null
    at = readDateTime(view, offset, now)
    offset += 7
  }
  let pulseBpm = null
  if (flags & 0x04 && fits(view, offset, 2)) {
    const p = readSfloat(view, offset)
    if (inRange(p, 25, 250)) pulseBpm = Math.round(p)
  }
  if (sys == null || dia == null) return null
  const systolic = Math.round(sys * factor)
  const diastolic = Math.round(dia * factor)
  if (!inRange(systolic, 50, 260) || !inRange(diastolic, 30, 160) || diastolic >= systolic) return null
  return { kind: 'blood_pressure', systolic, diastolic, pulseBpm, at }
}

/** Poids (0x2A9D) : résolution 5 g (SI) ou 0,01 lb (impérial) ; 0xFFFF = mesure impossible. */
export function parseWeight(view, { now = new Date() } = {}) {
  if (!fits(view, 0, 3)) return null
  const flags = view.getUint8(0)
  const raw = view.getUint16(1, true)
  if (raw === 0xffff) return null
  const weightKg = round2(flags & 0x01 ? raw * 0.01 * LB_TO_KG : raw * 0.005)
  const at = flags & 0x02 && fits(view, 3, 7) ? readDateTime(view, 3, now) : null
  return inRange(weightKg, 20, 350) ? { kind: 'weight', weightKg, at } : null
}

/** Composition corporelle (0x2A9C) : masse grasse (toujours présente) et poids si fourni. */
export function parseBodyComposition(view, { now = new Date() } = {}) {
  if (!fits(view, 0, 4)) return null
  const flags = view.getUint16(0, true)
  const imperial = flags & 0x0001
  const fatRaw = view.getUint16(2, true)
  let offset = 4
  let at = null
  if (flags & 0x0002) {
    if (!fits(view, offset, 7)) return null
    at = readDateTime(view, offset, now)
    offset += 7
  }
  if (flags & 0x0004) offset += 1 // identifiant utilisateur
  // métabolisme de base, % muscle, masse musculaire, masse maigre, masse molle, eau, impédance : 2 octets chacun
  for (const bit of [0x0008, 0x0010, 0x0020, 0x0040, 0x0080, 0x0100, 0x0200]) if (flags & bit) offset += 2
  let weightKg = null
  if (flags & 0x0400 && fits(view, offset, 2)) {
    const raw = view.getUint16(offset, true)
    const kg = round2(imperial ? raw * 0.01 * LB_TO_KG : raw * 0.005)
    if (raw !== 0xffff && inRange(kg, 20, 350)) weightKg = kg
  }
  const fatRatioPct = fatRaw === 0xffff ? null : round1(fatRaw * 0.1)
  if (!inRange(fatRatioPct, 2, 75) && weightKg == null) return null
  return { kind: 'body_composition', fatRatioPct: inRange(fatRatioPct, 2, 75) ? fatRatioPct : null, weightKg, at }
}

/** Température (0x2A1C) : seules les températures corporelles plausibles sont gardées. */
export function parseTemperature(view, { now = new Date() } = {}) {
  if (!fits(view, 0, 5)) return null
  const flags = view.getUint8(0)
  const v = readFloat(view, 1)
  if (v == null) return null
  const valueC = round1(flags & 0x01 ? ((v - 32) * 5) / 9 : v)
  const at = flags & 0x02 && fits(view, 5, 7) ? readDateTime(view, 5, now) : null
  return inRange(valueC, 30, 45) ? { kind: 'body_temperature', valueC, at } : null
}

function spo2Result(spo2, pulse, at) {
  if (!inRange(spo2, 50, 100)) return null
  return { kind: 'spo2', spo2: Math.round(spo2), pulseBpm: inRange(pulse, 25, 250) ? Math.round(pulse) : null, at }
}

/** Oxymètre, mesure ponctuelle (0x2A5E). */
export function parsePlxSpotCheck(view, { now = new Date() } = {}) {
  if (!fits(view, 0, 5)) return null
  const flags = view.getUint8(0)
  const at = flags & 0x01 && fits(view, 5, 7) ? readDateTime(view, 5, now) : null
  return spo2Result(readSfloat(view, 1), readSfloat(view, 3), at)
}

/** Oxymètre, mesure continue (0x2A5F) : valeurs « normales » seulement. */
export function parsePlxContinuous(view) {
  if (!fits(view, 0, 5)) return null
  return spo2Result(readSfloat(view, 1), readSfloat(view, 3), null)
}

/**
 * Lecteurs par pilote (src/devices/ble/drivers.js) : service GATT et caractéristiques à écouter.
 * `optional` : souvent présente sur l'appareil, mais pas obligatoire (on ignore son absence).
 */
export const READERS = {
  ble_blood_pressure: { service: 0x1810, characteristics: [{ uuid: 0x2a35, parse: parseBloodPressure }] },
  ble_weight_scale: { service: 0x181d, characteristics: [{ uuid: 0x2a9d, parse: parseWeight }] },
  ble_body_composition: {
    service: 0x181b,
    characteristics: [
      { uuid: 0x2a9c, parse: parseBodyComposition },
      { uuid: 0x2a9d, parse: parseWeight, service: 0x181d, optional: true },
    ],
  },
  ble_thermometer: { service: 0x1809, characteristics: [{ uuid: 0x2a1c, parse: parseTemperature }] },
  ble_pulse_oximeter: {
    service: 0x1822,
    characteristics: [
      { uuid: 0x2a5e, parse: parsePlxSpotCheck, optional: true },
      { uuid: 0x2a5f, parse: parsePlxContinuous, optional: true },
    ],
  },
}

/**
 * Entrées HealthTrack, même forme que celles de Health Connect, source « ble ».
 * Sans horodatage de l'appareil, l'heure de réception. Une entrée par type et par instant (la dernière gagne) :
 * un oxymètre continu envoie une valeur par seconde, une balance envoie le poids sur deux caractéristiques.
 */
export function measurementsToEntries(measurements, { deviceName, now = new Date() } = {}) {
  const base = { sourceName: deviceName || 'Appareil Bluetooth', connector: 'ble' }
  const byKey = new Map()
  const add = (type, at, payload) => byKey.set(`${type}|${at}`, { type, source: 'ble', at, payload: { ...payload, ...base } })
  for (const m of measurements || []) {
    if (!m) continue
    const at = (m.at || now).toISOString()
    if (m.kind === 'blood_pressure') {
      add('blood_pressure', at, { systolic: m.systolic, diastolic: m.diastolic, unit: 'mmHg', ...(m.pulseBpm != null && { pulseBpm: m.pulseBpm }) })
    } else if (m.kind === 'weight') {
      add('weight', at, { valueKg: round1(m.weightKg) })
    } else if (m.kind === 'body_composition') {
      if (m.fatRatioPct != null) add('body_composition', at, { fatRatioPct: m.fatRatioPct })
      if (m.weightKg != null) add('weight', at, { valueKg: round1(m.weightKg) })
    } else if (m.kind === 'body_temperature') {
      add('body_temperature', at, { valueC: m.valueC })
    } else if (m.kind === 'spo2') {
      add('heart_rate', at, { value: m.spo2, unit: '%', subtype: 'oxygenSaturation' })
    }
  }
  return [...byKey.values()]
}

/** Libellé court d'une mesure reçue, pour l'affichage (« Tension 128/82 mmHg · pouls 64 »). */
export function describeMeasurement(m) {
  const fmt = (v) => String(v).replace('.', ',')
  switch (m.kind) {
    case 'blood_pressure':
      return `Tension ${m.systolic}/${m.diastolic} mmHg${m.pulseBpm != null ? ` · pouls ${m.pulseBpm}` : ''}`
    case 'weight':
      return `Poids ${fmt(Math.round(m.weightKg * 10) / 10)} kg`
    case 'body_composition':
      return [m.weightKg != null && `Poids ${fmt(Math.round(m.weightKg * 10) / 10)} kg`, m.fatRatioPct != null && `masse grasse ${fmt(m.fatRatioPct)} %`]
        .filter(Boolean)
        .join(' · ')
    case 'body_temperature':
      return `Température ${fmt(m.valueC)} °C`
    case 'spo2':
      return `SpO₂ ${m.spo2} %${m.pulseBpm != null ? ` · pouls ${m.pulseBpm}` : ''}`
    default:
      return 'Mesure'
  }
}
