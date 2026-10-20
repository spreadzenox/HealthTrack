/**
 * « Lecture du visage » (D4, journal/IDEES.md I88) : interrupteur et diagnostic du service natif FaceSenseService.
 * Au déverrouillage, la caméra frontale prend 3 images en basse résolution, analysées sur le téléphone (modèle
 * MediaPipe embarqué) puis effacées ; seuls une dizaine d'indices d'expression sont gardés (côté natif, en
 * attendant leur import dans l'historique, I90). Ces indices sont des entrées de l'humeur estimée (Y, voir
 * mood/estimatorInputs.js) ; l'humeur estimée qui en sort s'affiche dès la première lecture (mood/faceMood.js,
 * consigne du 19/10/2026 au soir). Le diagnostic, lui, ne contient que des compteurs et des raisons, jamais une
 * valeur d'humeur.
 *
 * L'état « activée » est gardé côté natif ; ce module en garde un miroir (localStorage) pour classer la carte
 * dans Connecteurs dès l'ouverture, sans attendre le plugin.
 */
import { registerPlugin } from '@capacitor/core'
import { eveningNoteDiagnostic } from './eveningNote'

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

/**
 * Active (demande l'accès à la caméra si besoin). Rend { started, permission, error? }. `restart` : arrête puis
 * redémarre le service app ouverte, pour qu'Android lui rende l'accès caméra en arrière-plan.
 */
export async function startFaceSense(plugin = faceSensePlugin(), { restart = false } = {}) {
  if (!plugin?.start) return { started: false, permission: false, error: 'unavailable' }
  try {
    const res = (await (restart ? plugin.start({ restart: true }) : plugin.start())) || {}
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

/**
 * Télécharge le modèle valence / éveil s'il manque (FaceAffectModel : 16 Mo une fois, depuis le dépôt de ses auteurs,
 * empreinte SHA-256 vérifiée ; rien n'est envoyé). Rend { ready, downloading } ; ne lève jamais.
 */
export async function prepareFaceAffect(plugin = faceSensePlugin()) {
  if (!plugin?.prepareAffect) return { ready: false, downloading: false }
  try {
    const res = (await plugin.prepareAffect()) || {}
    return { ready: !!res.ready, downloading: !!res.downloading }
  } catch {
    return { ready: false, downloading: false }
  }
}

/** 'ready' | 'downloading' | 'error' | 'missing', ou null si le natif ne connaît pas encore ce modèle. */
export function faceAffectState(status) {
  if (!status || typeof status.affectModel !== 'boolean') return null
  if (status.affectModel) return 'ready'
  if (status.affectDownloading) return 'downloading'
  return status.affectState === 'error' ? 'error' : 'missing'
}

/**
 * Second modèle du duo (MobileFaceNet, 8 Mo, I126) : 'ready' | 'downloading' | 'error' | 'missing', ou null si le
 * natif ne le connaît pas encore. Même téléchargement que le premier (prepareAffect les prend tous les deux).
 */
export function faceAffectDuoState(status) {
  if (!status || typeof status.affectModel2 !== 'boolean') return null
  if (status.affectModel2) return 'ready'
  if (status.affectDownloading) return 'downloading'
  return status.affectState === 'error' ? 'error' : 'missing'
}

export async function requestFaceBatteryExemption(plugin = faceSensePlugin()) {
  try {
    await plugin?.requestBatteryExemption?.()
  } catch {
    /* réglage introuvable sur ce téléphone */
  }
}

/** Téléphone Samsung (One UI) : sa propre mise en veille des applis s'ajoute à celle d'Android. */
export function isSamsungDevice(status) {
  return /samsung/i.test(status?.manufacturer || '')
}

/**
 * Ouvre « Applis jamais en veille » de One UI (repli : la page de l'app dans les réglages Android). Rend 'samsung',
 * 'app_details' ou null (réglage introuvable, ancienne version native).
 */
export async function openFaceNeverSleep(plugin = faceSensePlugin()) {
  if (!plugin?.openNeverSleep) return null
  try {
    const res = (await plugin.openNeverSleep()) || {}
    return res.opened || null
  } catch {
    return null
  }
}

/**
 * Pourquoi le service activé ne tourne plus (point c du signalement du 19/10 15:05) : 'update' (mise à jour de l'app
 * après son dernier démarrage), 'reboot' (téléphone redémarré depuis), 'system' (ni l'un ni l'autre : arrêté par le
 * téléphone, typiquement la mise en veille de One UI), ou null (actif, éteint par vous, ou version native sans ces
 * repères).
 */
export function faceStopCause(status) {
  const s = status || {}
  if (!s.enabled || s.running || !s.startedAt) return null
  if (typeof s.lastUpdateAt !== 'number' || typeof s.bootAt !== 'number') return null
  if (s.lastUpdateAt > s.startedAt) return 'update'
  if (s.bootAt > s.startedAt) return 'reboot'
  return 'system'
}

const STOP_CAUSES = {
  update: 'mise à jour de l’app',
  reboot: 'redémarrage du téléphone',
  system: 'arrêtée par le téléphone sans mise à jour ni redémarrage (mise en veille des applis ?)',
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

/** Journal natif des dernières tentatives (JSON), de la plus ancienne à la plus récente ; [] si illisible. */
function parseAttempts(json) {
  if (!json) return []
  try {
    const list = JSON.parse(json)
    return Array.isArray(list) ? list.filter((a) => a && typeof a === 'object') : []
  } catch {
    return []
  }
}

/** Erreurs de la caméra qu'Android renvoie quand il refuse l'accès hors de l'app à l'écran. */
const BACKGROUND_DENIALS = new Set(['camera:camera_disabled', 'camera:camera_denied', 'camera:camera_error'])

/**
 * Accès caméra du service (signalement du 19/10 15:05). `op` : mode Android brut (`foreground` = « seulement
 * quand l'app est utilisée », `allow` = accordé en permanence via Shizuku / ADB). `blocked` : Android refuse la
 * caméra en arrière-plan — service démarré hors de l'app ouverte, ou dernière lecture du déverrouillage refusée —
 * et l'accès n'est pas permanent.
 */
export function faceCameraAccess(status) {
  const s = status || {}
  const op = s.cameraOp ?? null
  const permanent = op === 'allow'
  const lastUnlock = parseAttempts(s.attempts).filter((a) => a.trigger === 'unlock').pop()
  const refused = !!lastUnlock && BACKGROUND_DENIALS.has(lastUnlock.outcome)
  const blocked = !permanent && (s.startOrigin === 'background' || refused)
  return { op, permanent, blocked, startOrigin: s.startOrigin ?? null }
}

const SOURCES = { user_present: 'écran de verrouillage', keyguard: 'verrou interrogé', screen_on: 'écran déjà ouvert' }
const CAMERA_OPS = {
  allow: 'accordé en permanence (Shizuku / ADB)',
  foreground: 'seulement quand l’app est utilisée (réglage Android)',
  ignore: 'refusé en silence',
  deny: 'refusé',
  default: 'réglage par défaut',
}
const ORIGINS = { app: 'depuis l’app ouverte', background: 'relancé en arrière-plan (caméra refusée par Android)' }

function hhmm(ms) {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const iso = (ms) => (ms ? new Date(ms).toISOString() : null)

/**
 * Ce que dit la carte. Rend { state, badge, lines } ; state ∈ unavailable | no_models | off | denied | stopped |
 * active. Aucune valeur d'indice : seulement des comptes (porte I110).
 */
export function describeFaceSense(status) {
  if (!status) return { state: 'unavailable', badge: null, lines: [] }
  if (status.models === false) return { state: 'no_models', badge: null, lines: [] }
  if (!status.enabled) return { state: 'off', badge: null, lines: [] }
  if (!status.permission) return { state: 'denied', badge: 'À autoriser', lines: [] }
  if (!status.running) return { state: 'stopped', badge: 'Arrêtée', lines: [], cause: faceStopCause(status) }
  const lines = []
  const unlocks = status.dayUnlocks ?? 0
  const bursts = status.dayBursts ?? 0
  const faces = status.dayFaces ?? 0
  const screenOns = status.dayScreenOns ?? 0
  if (unlocks === 0 && screenOns > 0) {
    lines.push(`Écran allumé ${screenOns} fois aujourd’hui, mais aucun déverrouillage repéré : ouvrez le Diagnostic et envoyez-le.`)
  } else if (unlocks === 0) lines.push('Aucun déverrouillage depuis minuit : la première lecture viendra au prochain.')
  else lines.push(`Aujourd’hui : ${plural(unlocks, 'déverrouillage')}, ${plural(bursts, 'lecture')}, visage lu ${faces} fois.`)
  if (faceCameraAccess(status).blocked) return { state: 'blocked', badge: 'À relancer', lines }
  return { state: 'active', badge: 'Active', lines }
}

/**
 * Diagnostic exportable (JSON) : appareil, état du service, compteurs, temps moyens, raisons des sauts et des
 * rejets. Jamais d'image, de point ni de score d'expression.
 */
export function faceDiagnosticReport(status, { appVersion, now = new Date(), history = null, lastImport = null, eveningNote = null } = {}) {
  const s = status || {}
  const timed = s.timed || 0
  return {
    kind: 'healthtrack-face-diagnostic',
    version: 4,
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
      // v4 : cause de l'arrêt (mise à jour, redémarrage ou téléphone), repères bruts pour la vérifier.
      stopCause: faceStopCause(s),
      lastUpdateAt: iso(s.lastUpdateAt),
      bootAt: iso(s.bootAt),
      lastError: s.lastError ?? null,
    },
    today: { unlocks: s.dayUnlocks ?? 0, bursts: s.dayBursts ?? 0, faces: s.dayFaces ?? 0 },
    // Repérage du déverrouillage (signalement du 19/10 15:05) : ce qu'Android a signalé aujourd'hui, et par où.
    detection: {
      screenOns: s.dayScreenOns ?? 0,
      userPresents: s.dayPresents ?? 0,
      unlocks: s.dayUnlocks ?? 0,
      bySource: {
        user_present: s.dayUnlock_user_present ?? 0,
        keyguard: s.dayUnlock_keyguard ?? 0,
        screen_on: s.dayUnlock_screen_on ?? 0,
      },
      lastUnlockAt: iso(s.lastUnlockAt),
      lastUnlockSource: s.lastUnlockSource ?? null,
      lastScreenOnAt: iso(s.lastScreenOnAt),
    },
    // Accès caméra : mode Android (appops) et façon dont le service a démarré.
    camera: { op: s.cameraOp ?? null, startOrigin: s.startOrigin ?? null, startAction: s.startAction ?? null, starts: s.starts ?? 0 },
    // Dernières tentatives : heure, déclencheur, source, résultat ou erreur exacte d'Android.
    attempts: parseAttempts(s.attempts).map((a) => ({
      at: iso(a.at),
      trigger: a.trigger ?? null,
      source: a.source ?? null,
      outcome: a.outcome ?? null,
      detail: a.detail ?? null,
      retry: a.retry === true,
    })),
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
    // Notification « Reprendre » quand Android a arrêté le service (I88 ②).
    resume: {
      notices: s.resumeNotices ?? 0,
      lastNoticeAt: s.resumeNoticeAt ? new Date(s.resumeNoticeAt).toISOString() : null,
      taps: s.resumeTaps ?? 0,
      lastCheck: s.resumeCheck ?? null,
      lastCheckAt: s.resumeCheckAt ? new Date(s.resumeCheckAt).toISOString() : null,
      lastCheckTrigger: s.resumeCheckTrigger ?? null,
    },
    // Rangées dans l'historique (I90) : des comptes seulement.
    history: {
      stored: history?.stored ?? null,
      forMood: history?.forMood ?? null,
      firstAt: history?.firstAt ?? null,
      lastImportAt: lastImport?.at ?? null,
      lastImport: lastImport ? { imported: lastImport.imported ?? 0, dropped: lastImport.dropped ?? 0, kept: lastImport.kept ?? 0 } : null,
    },
    // Assez de lectures par jour ? (I118) : médianes sur 7 jours, des comptes seulement.
    perDay: history?.perDay ?? null,
    // 2e essai 2 s après une lecture du déverrouillage sans visage (I118).
    retries: { tried: s.retries ?? 0, faces: s.retryFaces ?? 0 },
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
        // Dérives lentes (I121) : autocorrélation retenue, dérive du visage, visage comparé à ses 14 jours précédents.
        a: history.gate.a == null ? null : Math.round(history.gate.a * 100) / 100,
        drift: history.gate.drift == null ? null : Math.round(history.gate.drift * 100) / 100,
        detrended: !!history.gate.detrended,
      }
      : null,
    // Humeur estimée (consigne du 19/10 au soir) : quel modèle et quelle confiance, jamais la valeur estimée.
    estimate: history?.estimate
      ? {
        model: history.estimate.model,
        confidence: history.estimate.confidence,
        readingsToday: history.estimate.day?.readings ?? 0,
        baselineDays: history.estimate.baselineDays,
        calibrationDays: history.estimate.calibrationDays,
        // Accord des deux modèles du visage (I126) : un mot, jamais l'écart ni la valeur.
        agreement: history.estimate.duo?.agreement ?? null,
      }
      : null,
    // Note du soir d'un geste (I113), vérité terrain de la porte : réglages et compteurs, jamais une note.
    eveningNote: eveningNoteDiagnostic(eveningNote),
    // Modèle valence / éveil (étape 2) : état, temps, lectures qui en ont profité, erreur exacte ; jamais une valeur.
    affect: faceAffectState(s)
      ? {
        model: 'enet_b0_8_va_mtl',
        state: faceAffectState(s),
        bursts: s.affectBursts ?? 0,
        loadMs: s.affectLoadMs ?? null,
        downloadMs: s.affectDownloadMs ?? null,
        downloadErrors: s.affectDownloadErrors ?? 0,
        error: s.affectError ?? null,
        lastError: s.lastAffectError ?? null,
        duo: faceAffectDuoState(s)
          ? { model: 'mbf_va_mtl', state: faceAffectDuoState(s), bursts: s.affectDuoBursts ?? 0, loadMs: s.affect2LoadMs ?? null }
          : null,
      }
      : null,
  }
}

const EVENING_CHECKS = {
  asked: 'note demandée',
  disabled: 'éteinte',
  noted_today: 'déjà notée ce jour-là',
  asked_today: 'déjà demandée ce soir-là',
  late: 'alarme trop retardée par Android',
  notifications_off: 'notifications de l’app désactivées',
}

const RESUME_CHECKS = {
  notified: 'notification postée',
  running: 'service actif',
  disabled: 'lecture arrêtée par vous',
  app_open: 'app ouverte',
  no_permission: 'caméra non autorisée',
  recent: 'déjà prévenu il y a peu',
  notifications_off: 'notifications de l’app désactivées',
}
const RESUME_TRIGGERS = { periodic: 'vérification horaire', boot: 'après un redémarrage', update: 'après une mise à jour' }

const s0 = (status) => status || {}
const MOOD_MODELS = { personal: 'personnel (vos notes)', va: 'valence / éveil (HSEmotion)', prior: 'général des expressions' }

/** Lignes lisibles du diagnostic (carte). */
export function faceDiagnosticLines(status, { history = null, lastImport = null, eveningNote = null } = {}) {
  const r = faceDiagnosticReport(status, { history, lastImport, eveningNote })
  const lines = []
  lines.push(`Service : ${r.service.running ? 'actif' : 'arrêté'} · caméra ${r.service.cameraPermission ? 'autorisée' : 'non autorisée'} · batterie ${r.service.batteryExempt ? 'sans restriction' : 'optimisée par Android'}`)
  if (r.service.stopCause) {
    const since = s0(status).startedAt ? ` (démarré le ${new Date(s0(status).startedAt).toLocaleDateString('fr-FR')} à ${hhmm(s0(status).startedAt)})` : ''
    lines.push(`Arrêt : ${STOP_CAUSES[r.service.stopCause]}${since}`)
  }
  const det = r.detection
  if (det.screenOns || det.unlocks) {
    const by = Object.entries(det.bySource).filter(([, n]) => n).map(([k, n]) => `${SOURCES[k] || k} ${n}`).join(', ')
    const last = s0(status).lastUnlockAt ? `, le dernier à ${hhmm(s0(status).lastUnlockAt)}` : ''
    lines.push(`Aujourd’hui : écran allumé ${det.screenOns} fois, ${plural(det.unlocks, 'déverrouillage repéré', 'déverrouillages repérés')}${by ? ` (${by})` : ''}${last}`)
  }
  if (r.camera.op || r.camera.startOrigin) {
    const parts = []
    if (r.camera.op) parts.push(`Accès caméra : ${CAMERA_OPS[r.camera.op] || r.camera.op}`)
    if (r.camera.startOrigin) parts.push(`service démarré ${ORIGINS[r.camera.startOrigin] || r.camera.startOrigin}`)
    lines.push(parts.join(' · '))
  }
  const tries = parseAttempts(s0(status).attempts).slice(-5).reverse()
  if (tries.length) {
    lines.push(`Dernières tentatives : ${tries.map((a) => {
      const who = a.trigger === 'manual' ? 'test' : `déverrouillage${a.source && SOURCES[a.source] ? ` (${SOURCES[a.source]})` : ''}${a.retry ? ', 2e essai' : ''}`
      return `${a.at ? hhmm(a.at) : '—'} ${who} → ${outcomeLabel(a.outcome)}${a.detail ? ` [${a.detail}]` : ''}`
    }).join(' ; ')}`)
  }
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
  if (r.perDay) {
    const d = r.perDay
    const unlocks = d.unlocksPerDay == null ? '' : `${plural(d.unlocksPerDay, 'déverrouillage')}, `
    const verdict = d.enough
      ? `objectif de ${d.target} atteint`
      : `en dessous des ${d.target} visés : l’estimation restera plus incertaine`
    lines.push(`Par jour (médiane sur ${plural(d.days, 'jour')}) : ${unlocks}${plural(d.burstsPerDay, 'lecture')}, ${d.validBurstsPerDay} avec un visage — ${verdict}`)
  }
  if (r.retries.tried) lines.push(`2e essais (2 s après une lecture sans visage) : ${r.retries.tried}, visage lu ${r.retries.faces} fois`)
  if (r.estimate) {
    const e = r.estimate
    lines.push(`Humeur estimée : modèle ${MOOD_MODELS[e.model] || e.model}, confiance ${e.confidence}, ${plural(e.readingsToday, 'lecture')} aujourd’hui, visage habituel sur ${plural(e.baselineDays, 'jour')}${e.agreement ? `, deux modèles : ${e.agreement}` : ''}`)
  }
  if (r.affect) {
    const a = r.affect
    if (a.state === 'ready') {
      lines.push(`Modèle valence / éveil : prêt (HSEmotion, sur le téléphone) · ${plural(a.bursts, 'lecture')} avec valence${a.loadMs != null ? ` · chargé en ${a.loadMs} ms` : ''}`)
    } else if (a.state === 'downloading') {
      lines.push('Modèle valence / éveil : téléchargement en cours (16 Mo, une seule fois)')
    } else if (a.state === 'error') {
      lines.push(`Modèle valence / éveil : échec du téléchargement${a.error ? ` [${a.error}]` : ''} — nouvel essai à la prochaine ouverture`)
    } else {
      lines.push('Modèle valence / éveil : pas encore téléchargé (16 Mo, demandé à chaque ouverture de cette carte, lecture active)')
    }
    if (a.duo) {
      const d = a.duo
      lines.push(d.state === 'ready'
        ? `Second modèle (MobileFaceNet) : prêt · ${plural(d.bursts, 'lecture')} ${d.bursts > 1 ? 'lues' : 'lue'} par les deux modèles${d.loadMs != null ? ` · chargé en ${d.loadMs} ms` : ''}`
        : d.state === 'downloading'
          ? 'Second modèle (MobileFaceNet) : téléchargement en cours (8 Mo, une seule fois)'
          : d.state === 'error'
            ? 'Second modèle (MobileFaceNet) : échec du téléchargement — nouvel essai à la prochaine ouverture'
            : 'Second modèle (MobileFaceNet) : pas encore téléchargé (8 Mo, demandé à l’ouverture de cette carte, lecture active)')
    }
    if (a.lastError) lines.push(`Dernière erreur du modèle valence / éveil : ${a.lastError}`)
  }
  if (r.gate) {
    const g = r.gate
    lines.push(g.state === 'active'
      ? `Vérification visage ↔ notes (facultative) : réussie le ${g.openedAt} (z = ${g.z ?? '—'})`
      : `Vérification visage ↔ notes (facultative) : ${g.days} / ${g.needed} jours comparables${g.z == null ? '' : `, accord z = ${g.z} (réussie à 3,29 deux semaines de suite)`}`)
    if (g.drift != null) {
      lines.push(`Dérives lentes : visage ${g.drift} d’un jour à l’autre${g.detrended ? ' (comparé à ses 14 jours précédents)' : ''}, z corrigé pour a = ${g.a ?? 0}`)
    }
  }
  if (r.pendingBursts) lines.push(`En attente d’être rangées : ${r.pendingBursts}`)
  if (r.history.lastImport?.dropped) lines.push(`Lectures illisibles écartées au dernier rangement : ${r.history.lastImport.dropped}`)
  if (r.resume.notices || r.resume.taps) {
    const c = r.resume.lastCheck
    const check = c ? ` ; dernière vérification : ${RESUME_CHECKS[c] || c}${r.resume.lastCheckTrigger ? ` (${RESUME_TRIGGERS[r.resume.lastCheckTrigger] || r.resume.lastCheckTrigger})` : ''}` : ''
    lines.push(`Notifications « Reprendre » : ${r.resume.notices}, reprise d’un geste ${r.resume.taps} fois${check}`)
  }
  if (r.eveningNote?.enabled) {
    const e = r.eveningNote
    const check = e.lastCheck ? ` ; dernier soir : ${EVENING_CHECKS[e.lastCheck] || e.lastCheck}` : ''
    lines.push(`Note du soir : vers ${e.time}, demandée ${e.asked} fois, donnée d’un geste ${e.answers} fois${check}`)
  }
  if (r.service.lastError) lines.push(`Dernière erreur : ${r.service.lastError}`)
  return lines
}
