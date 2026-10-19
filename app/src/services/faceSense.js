/**
 * « Lecture du visage » (D4, journal/IDEES.md I88) : interrupteur et diagnostic du service natif FaceSenseService.
 * Au déverrouillage, la caméra frontale prend 3 images en basse résolution, analysées sur le téléphone (modèle
 * MediaPipe embarqué) puis effacées ; seuls une dizaine d'indices d'expression sont gardés (côté natif, en
 * attendant leur import dans l'historique, I90). Ces indices sont des entrées de l'humeur estimée (Y, voir
 * mood/estimatorInputs.js) et ne sont **jamais affichés** avant la porte de calibration (I110 / I112) : ici,
 * seulement des compteurs et des raisons.
 *
 * L'état « activée » est gardé côté natif ; ce module en garde un miroir (localStorage) pour classer la carte
 * dans Connecteurs dès l'ouverture, sans attendre le plugin.
 */
import { registerPlugin } from '@capacitor/core'

const KEY = 'healthtrack_face_sense'
const NativeFaceSense = registerPlugin('FaceSense')

const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

/** Plugin natif dans l'app, faux plugin des captures / tests, sinon aucun. */
export function faceSensePlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeFaceSense) return window.__healthtrackFakeFaceSense
  return isNative() ? NativeFaceSense : null
}

export function isFaceSenseAvailable() {
  return faceSensePlugin() != null
}

/** Miroir local de l'interrupteur (le natif fait foi). */
export function isFaceSenseEnabled(storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage?.getItem(KEY) || '{}')?.enabled === true
  } catch {
    return false
  }
}

function mirror(enabled, storage = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, JSON.stringify({ enabled }))
  } catch {
    /* stockage indisponible : seul le classement de la carte en pâtit */
  }
}

/** État du service, ou null hors de l'app Android. Ne lève jamais. */
export async function getFaceSenseStatus(plugin = faceSensePlugin()) {
  if (!plugin?.status) return null
  try {
    const status = await plugin.status()
    if (status && typeof status.enabled === 'boolean') mirror(status.enabled)
    return status
  } catch {
    return null
  }
}

/** Active (demande l'accès à la caméra si besoin). Rend { started, permission, error? }. */
export async function startFaceSense(plugin = faceSensePlugin()) {
  if (!plugin?.start) return { started: false, permission: false, error: 'unavailable' }
  try {
    const res = (await plugin.start()) || {}
    if (res.started) mirror(true)
    return { started: !!res.started, permission: res.permission !== false, error: res.error }
  } catch (e) {
    return { started: false, permission: true, error: String(e?.message || e) }
  }
}

export async function stopFaceSense(plugin = faceSensePlugin()) {
  mirror(false)
  try {
    await plugin?.stop?.()
  } catch {
    /* service déjà arrêté */
  }
}

/** Une rafale tout de suite (diagnostic seulement, jamais comptée pour l'humeur). */
export async function testFaceSense(plugin = faceSensePlugin()) {
  try {
    await plugin?.test?.()
    return true
  } catch {
    return false
  }
}

export async function requestFaceBatteryExemption(plugin = faceSensePlugin()) {
  try {
    await plugin?.requestBatteryExemption?.()
  } catch {
    /* réglage introuvable sur ce téléphone */
  }
}

/** Libellés des résultats d'une rafale et des sauts (diagnostic). */
const OUTCOMES = {
  face: 'visage lu',
  no_valid_frame: 'aucune image exploitable',
  'skip:too_soon': 'sautée (déverrouillage trop rapproché)',
  'skip:daily_cap': 'sautée (plafond du jour)',
  'skip:screen_off': 'sautée (écran éteint)',
  'skip:in_call': 'sautée (appel en cours)',
  'skip:hot': 'sautée (téléphone chaud)',
  'skip:no_permission': 'sautée (caméra non autorisée)',
  'skip:no_models': 'sautée (modèle absent)',
  'camera:camera_busy': 'caméra occupée par une autre app',
  'camera:camera_disabled': 'caméra coupée (accès caméra désactivé dans Android ?)',
  'camera:camera_denied': 'caméra refusée par Android en arrière-plan',
  'camera:camera_timeout': 'caméra trop lente à répondre',
  'camera:camera_error': 'erreur de la caméra',
  'camera:no_front_camera': 'pas de caméra frontale',
  inference_error: 'erreur du modèle',
  store_error: 'enregistrement impossible',
}

const REJECTIONS = {
  no_face: 'pas de visage',
  low_presence: 'visage incertain',
  too_small: 'visage trop loin',
  turned: 'tête tournée',
  too_dark: 'trop sombre',
  too_bright: 'trop clair',
  talking: 'bouche ouverte (parole)',
}

export function outcomeLabel(outcome) {
  return OUTCOMES[outcome] || outcome || '—'
}

function plural(n, one, many = `${one}s`) {
  return `${n} ${n > 1 ? many : one}`
}

/**
 * Ce que dit la carte. Rend { state, badge, lines } ; state ∈ unavailable | no_models | off | denied | stopped |
 * active. Aucune valeur d'indice : seulement des comptes (porte I110).
 */
export function describeFaceSense(status) {
  if (!status) return { state: 'unavailable', badge: null, lines: [] }
  if (status.models === false) return { state: 'no_models', badge: null, lines: [] }
  if (!status.enabled) return { state: 'off', badge: null, lines: [] }
  if (!status.permission) return { state: 'denied', badge: 'À autoriser', lines: [] }
  if (!status.running) return { state: 'stopped', badge: 'Arrêtée', lines: [] }
  const lines = []
  const unlocks = status.dayUnlocks ?? 0
  const bursts = status.dayBursts ?? 0
  const faces = status.dayFaces ?? 0
  if (unlocks === 0) lines.push('Aucun déverrouillage depuis minuit : la première lecture viendra au prochain.')
  else lines.push(`Aujourd’hui : ${plural(unlocks, 'déverrouillage')}, ${plural(bursts, 'lecture')}, visage lu ${faces} fois.`)
  return { state: 'active', badge: 'Active', lines }
}

/**
 * Diagnostic exportable (JSON) : appareil, état du service, compteurs, temps moyens, raisons des sauts et des
 * rejets. Jamais d'image, de point ni de score d'expression.
 */
export function faceDiagnosticReport(status, { appVersion, now = new Date(), history = null, lastImport = null } = {}) {
  const s = status || {}
  const timed = s.timed || 0
  return {
    kind: 'healthtrack-face-diagnostic',
    version: 1,
    at: now.toISOString(),
    appVersion: appVersion ?? null,
    device: { manufacturer: s.manufacturer ?? null, model: s.model ?? null, android: s.release ?? null, sdk: s.sdk ?? null },
    service: {
      enabled: !!s.enabled,
      running: !!s.running,
      cameraPermission: !!s.permission,
      batteryExempt: !!s.batteryExempt,
      models: s.models !== false,
      startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : null,
      stoppedAt: s.stoppedAt ? new Date(s.stoppedAt).toISOString() : null,
      lastError: s.lastError ?? null,
    },
    today: { unlocks: s.dayUnlocks ?? 0, bursts: s.dayBursts ?? 0, faces: s.dayFaces ?? 0 },
    last: {
      outcome: s.lastOutcome ?? null,
      trigger: s.lastTrigger ?? null,
      at: s.lastOutcomeAt ? new Date(s.lastOutcomeAt).toISOString() : null,
    },
    outcomes: s.outcomes || {},
    rejected: s.rejected || {},
    timing: {
      modelLoadMs: s.modelLoadMs ?? null,
      cameraMsAvg: timed ? Math.round(s.sumCameraMs / timed) : null,
      inferenceMsAvg: timed ? Math.round(s.sumInferenceMs / timed) : null,
      bursts: timed,
    },
    battery: { atStart: s.startBattery ?? null, now: s.battery ?? null },
    pendingBursts: s.pending ?? 0,
    // Rangées dans l'historique (I90) : des comptes seulement.
    history: {
      stored: history?.stored ?? null,
      forMood: history?.forMood ?? null,
      firstAt: history?.firstAt ?? null,
      lastImportAt: lastImport?.at ?? null,
      lastImport: lastImport ? { imported: lastImport.imported ?? 0, dropped: lastImport.dropped ?? 0, kept: lastImport.kept ?? 0 } : null,
    },
    // Porte de calibration (I112) : accord visage ↔ notes, jamais une humeur.
    gate: history?.gate
      ? {
        state: history.gate.state,
        days: history.gate.nDays,
        needed: history.gate.needed,
        z: history.gate.z == null ? null : Math.round(history.gate.z * 100) / 100,
        openedAt: history.gate.openedAt,
        closedAt: history.gate.closedAt,
        looks: history.gate.looks.length,
      }
      : null,
  }
}

/** Lignes lisibles du diagnostic (carte). */
export function faceDiagnosticLines(status, { history = null, lastImport = null } = {}) {
  const r = faceDiagnosticReport(status, { history, lastImport })
  const lines = []
  lines.push(`Service : ${r.service.running ? 'actif' : 'arrêté'} · caméra ${r.service.cameraPermission ? 'autorisée' : 'non autorisée'} · batterie ${r.service.batteryExempt ? 'sans restriction' : 'optimisée par Android'}`)
  if (r.last.outcome) lines.push(`Dernière lecture : ${outcomeLabel(r.last.outcome)}${r.last.trigger === 'manual' ? ' (test)' : ''}`)
  if (r.timing.bursts) lines.push(`Temps moyen : caméra ${r.timing.cameraMsAvg} ms, analyse ${r.timing.inferenceMsAvg} ms (${plural(r.timing.bursts, 'lecture')})`)
  const rej = Object.entries(r.rejected).sort((a, b) => b[1] - a[1])
  if (rej.length) lines.push(`Images écartées : ${rej.map(([k, n]) => `${REJECTIONS[k] || k} ${n}`).join(', ')}`)
  const skips = Object.entries(r.outcomes).filter(([k]) => k !== 'face').sort((a, b) => b[1] - a[1])
  if (skips.length) lines.push(`Autres résultats : ${skips.map(([k, n]) => `${outcomeLabel(k)} ${n}`).join(', ')}`)
  if (r.battery.atStart != null && r.battery.now != null && r.battery.atStart >= 0) {
    lines.push(`Batterie : ${r.battery.atStart} % au démarrage, ${r.battery.now} % maintenant (tout le téléphone)`)
  }
  if (r.history.stored != null) {
    lines.push(`Historique : ${plural(r.history.stored, 'lecture rangée', 'lectures rangées')}, dont ${r.history.forMood} au déverrouillage avec un visage (comptent pour l’humeur)`)
  }
  if (r.gate) {
    const g = r.gate
    lines.push(g.state === 'active'
      ? `Calibration : ouverte le ${g.openedAt} (accord visage ↔ notes z = ${g.z ?? '—'})`
      : `Calibration : ${g.days} / ${g.needed} jours comparables${g.z == null ? '' : `, accord z = ${g.z} (ouverture à 3,29 deux semaines de suite)`}`)
  }
  if (r.pendingBursts) lines.push(`En attente d’être rangées : ${r.pendingBursts}`)
  if (r.history.lastImport?.dropped) lines.push(`Lectures illisibles écartées au dernier rangement : ${r.history.lastImport.dropped}`)
  if (r.service.lastError) lines.push(`Dernière erreur : ${r.service.lastError}`)
  return lines
}
