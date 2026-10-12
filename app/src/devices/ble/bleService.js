/**
 * Accès au Bluetooth du téléphone (`@capacitor-community/bluetooth-le`) pour la couche générique :
 * recherche des appareils (annonces BLE + appareils déjà appairés), mesure cardio en direct,
 * réception des mesures des appareils standard (tensiomètre, balance, thermomètre, oxymètre),
 * mémoire locale des appareils inconnus (empreinte sans adresse MAC, pour ajouter un pilote plus tard).
 */
import { buildFingerprint, fingerprintKey, identifyDevice, uuid16 } from './drivers'
import { parseHeartRateMeasurement } from './heartRate'
import { READERS } from './measurements'

const HR_SERVICE = uuid16(0x180d)
const HR_MEASUREMENT = uuid16(0x2a37)
const UNKNOWN_KEY = 'healthtrack_ble_unknown_devices'
const UNKNOWN_MAX = 50

let clientPromise = null
let initialized = false

export function isBleAvailable() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeBle) return true
  return typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true
}

async function getClient() {
  // Outil de captures (`npm run visual -- --ble`) : faux Bluetooth dans le navigateur.
  if (typeof window !== 'undefined' && window.__healthtrackFakeBle) return window.__healthtrackFakeBle
  if (!clientPromise) clientPromise = import('@capacitor-community/bluetooth-le').then((m) => m.BleClient)
  return clientPromise
}

async function ready(client) {
  if (!initialized) {
    // neverForLocation : HealthTrack ne déduit jamais de position des appareils vus (pas de localisation demandée sur Android 12+).
    await client.initialize({ androidNeverForLocation: true })
    initialized = true
  }
  if (typeof client.isEnabled === 'function' && !(await client.isEnabled())) {
    if (typeof client.requestEnable === 'function') await client.requestEnable()
  }
}

function describe(scan, { bonded = false } = {}) {
  const fingerprint = buildFingerprint(scan)
  const { driver, vendor } = identifyDevice(fingerprint)
  return {
    deviceId: scan.device.deviceId,
    name: fingerprint.name,
    rssi: scan.rssi ?? null,
    bonded,
    fingerprint,
    driver,
    vendor,
  }
}

/** Tri : appareils lisibles d'abord, puis reconnus, puis inconnus ; à égalité, le plus proche. */
export function sortDevices(list) {
  const rank = (d) => (d.driver.supported ? 0 : d.driver.id !== 'unknown' ? 1 : 2)
  return [...list].sort((a, b) => rank(a) - rank(b) || (b.rssi ?? -999) - (a.rssi ?? -999))
}

/**
 * Cherche pendant `durationMs` et renvoie les appareils identifiés (déjà appairés compris).
 * `onUpdate(list)` est appelé à chaque nouvel appareil.
 */
export async function scanDevices({ durationMs = 8000, onUpdate, client } = {}) {
  const ble = client || (await getClient())
  await ready(ble)
  const found = new Map()
  const push = (d) => {
    const prev = found.get(d.deviceId)
    // une annonce complète remplace l'entrée « appairé » (nom seul) en gardant l'info d'appairage
    found.set(d.deviceId, prev ? { ...d, bonded: prev.bonded || d.bonded } : d)
    onUpdate?.(sortDevices([...found.values()]))
  }
  if (typeof ble.getBondedDevices === 'function') {
    try {
      // appairés : seulement ceux qu'on reconnaît (pas les écouteurs ou la voiture)
      for (const device of await ble.getBondedDevices()) {
        const d = describe({ device }, { bonded: true })
        if (d.driver.id !== 'unknown') push(d)
      }
    } catch {
      /* liste des appareils appairés indisponible : on continue avec le scan */
    }
  }
  await ble.requestLEScan({ allowDuplicates: false }, (scan) => {
    if (scan?.device?.deviceId) push(describe(scan))
  })
  await new Promise((resolve) => setTimeout(resolve, ble.scanMs ?? durationMs))
  await ble.stopLEScan().catch(() => {})
  const list = sortDevices([...found.values()])
  rememberUnknownDevices(list)
  return list
}

/**
 * Mesure cardio en direct sur un appareil au profil 0x180D.
 * `onSample({ at, bpm, rrMs, contact })` à chaque trame ; renvoie `stop()`.
 */
export async function startHeartRateSession(deviceId, { onSample, onDisconnect, client } = {}) {
  const ble = client || (await getClient())
  await ready(ble)
  await ble.connect(deviceId, () => onDisconnect?.())
  await ble.startNotifications(deviceId, HR_SERVICE, HR_MEASUREMENT, (view) => {
    const m = parseHeartRateMeasurement(view)
    if (m) onSample?.({ at: Date.now(), ...m })
  })
  return async function stop() {
    await ble.stopNotifications(deviceId, HR_SERVICE, HR_MEASUREMENT).catch(() => {})
    await ble.disconnect(deviceId).catch(() => {})
  }
}

/**
 * Réception des mesures d'un appareil standard (pilote de `READERS`) : connexion, abonnement aux
 * indications, puis attente. Fin quand l'appareil se déconnecte (il le fait après avoir tout envoyé),
 * après `idleMs` sans nouvelle mesure, `settleMs` après la première (oxymètre continu) ou `timeoutMs`.
 * @returns {Promise<{ done: Promise<object[]>, cancel: () => Promise<void> }>}
 */
export async function receiveMeasurements(
  deviceId,
  driverId,
  { onMeasurement, client, timeoutMs = 60_000, idleMs = 5000, settleMs = 15_000 } = {},
) {
  const reader = READERS[driverId]
  if (!reader) throw new Error(`Pas de lecteur pour ${driverId}`)
  const ble = client || (await getClient())
  await ready(ble)
  const measurements = []
  const subscribed = []
  let finish = () => {}
  const ended = new Promise((resolve) => {
    finish = resolve
  })
  let idleTimer = null
  let settleTimer = null
  const timeout = setTimeout(() => finish(), timeoutMs)

  await ble.connect(deviceId, () => finish())
  for (const c of reader.characteristics) {
    const service = uuid16(c.service ?? reader.service)
    const characteristic = uuid16(c.uuid)
    try {
      await ble.startNotifications(deviceId, service, characteristic, (view) => {
        const m = c.parse(view)
        if (!m) return
        measurements.push(m)
        onMeasurement?.(m)
        clearTimeout(idleTimer)
        idleTimer = setTimeout(() => finish(), idleMs)
        if (!settleTimer) settleTimer = setTimeout(() => finish(), settleMs)
      })
      subscribed.push([service, characteristic])
    } catch (e) {
      if (!c.optional) {
        clearTimeout(timeout)
        await ble.disconnect(deviceId).catch(() => {})
        throw e
      }
    }
  }
  if (subscribed.length === 0) {
    clearTimeout(timeout)
    await ble.disconnect(deviceId).catch(() => {})
    throw new Error('Aucune mesure disponible sur cet appareil')
  }

  const done = ended.then(async () => {
    clearTimeout(timeout)
    clearTimeout(idleTimer)
    clearTimeout(settleTimer)
    for (const [service, characteristic] of subscribed) await ble.stopNotifications(deviceId, service, characteristic).catch(() => {})
    await ble.disconnect(deviceId).catch(() => {})
    return measurements
  })
  return {
    done,
    cancel: async () => {
      finish()
      await done
    },
  }
}

function readUnknown() {
  try {
    const v = JSON.parse(localStorage.getItem(UNKNOWN_KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/** Empreintes des appareils non reconnus (sans adresse MAC), gardées sur le téléphone. */
export function listUnknownDevices() {
  return readUnknown()
}

export function rememberUnknownDevices(list, now = new Date()) {
  const unknown = list.filter((d) => d.driver.id === 'unknown' && !d.bonded && (d.fingerprint.name || d.fingerprint.services.length || d.fingerprint.companyIds.length))
  if (unknown.length === 0) return
  const stored = readUnknown()
  for (const d of unknown) {
    const key = fingerprintKey(d.fingerprint)
    const existing = stored.find((s) => s.key === key)
    if (existing) {
      existing.lastSeen = now.toISOString()
      existing.count = (existing.count || 1) + 1
    } else {
      stored.push({ key, ...d.fingerprint, firstSeen: now.toISOString(), lastSeen: now.toISOString(), count: 1 })
    }
  }
  stored.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
  try {
    localStorage.setItem(UNKNOWN_KEY, JSON.stringify(stored.slice(0, UNKNOWN_MAX)))
  } catch {
    /* stockage plein ou indisponible : sans conséquence */
  }
}
