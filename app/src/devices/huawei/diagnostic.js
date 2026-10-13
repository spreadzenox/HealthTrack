/**
 * Diagnostic de la montre Huawei / Honor (chantier D3, étape a) : déroule chaque étape de la
 * connexion directe (Bluetooth, apps concurrentes, recherche, connexion, services GATT, Device
 * Information Service, abonnement, paramètres du lien) et produit un rapport exportable.
 *
 * Rien n'est écrit sur la montre au-delà de la demande des paramètres du lien (lecture seule,
 * sans appairage ni authentification) : le diagnostic ne peut pas casser la liaison existante.
 * Le rapport ne contient jamais l'adresse MAC complète (seulement ses 2 derniers octets).
 */
import { buildFingerprint, findWearableVendor, uuid16 } from '../ble/drivers'
import { bleTransport, classicTransport, HUAWEI_RFCOMM_UUID, HONOR_RFCOMM_UUID } from './transports'
import {
  HUAWEI_SERVICE,
  DEVICE_CONFIG,
  LINK_PARAMS,
  RESULT_SUCCESS,
  createReassembler,
  linkParamsRequest,
  parseLinkParams,
  authModeLabel,
  toHex,
} from './protocol'

/** Apps qui peuvent tenir la montre (une montre Huawei n'accepte qu'une app liée à la fois). */
export const COMPETING_APP_IDS = ['huawei_health', 'honor_health', 'gadgetbridge', 'health_sync']

export const STEPS = [
  { id: 'bluetooth', label: 'Bluetooth du téléphone' },
  { id: 'apps', label: 'Apps qui peuvent tenir la montre' },
  { id: 'find', label: 'Recherche de la montre' },
  { id: 'connect', label: 'Connexion directe' },
  { id: 'services', label: 'Services Bluetooth de la montre' },
  { id: 'subscribe', label: 'Canal Huawei ouvert' },
  { id: 'link', label: 'Paramètres du lien (1re trame)' },
]

const DIS = [
  [0x2a29, 'fabricant'],
  [0x2a24, 'modèle'],
  [0x2a26, 'micrologiciel'],
  [0x2a27, 'matériel'],
  [0x2a28, 'logiciel'],
]

/** « AA:BB:CC:DD:EE:FF » → « …:EE:FF » ; autre identifiant → ses 4 derniers caractères. */
export function redactDeviceId(id) {
  const s = String(id || '')
  const mac = s.match(/^(?:[0-9a-f]{2}:){4}([0-9a-f]{2}):([0-9a-f]{2})$/i)
  if (mac) return `…:${mac[1]}:${mac[2]}`.toUpperCase()
  return s.length > 4 ? `…${s.slice(-4)}` : s
}

const isHuaweiService = (fp) => fp.services.includes('fe86')

/** Une annonce ou un appareil appairé ressemble-t-il à une montre / un bracelet Huawei ou Honor ? */
export function isHuaweiWearable(fp) {
  return findWearableVendor(fp)?.id === 'huawei' || isHuaweiService(fp) || (fp.companyIds.includes(0x027d) && /watch|band/i.test(fp.name))
}

/** Choix de la montre : vue en annonce d'abord (elle accepte une connexion), puis la plus proche, puis appairée. */
export function pickWatch(candidates) {
  return [...candidates].sort((a, b) => Number(b.advertising) - Number(a.advertising) || (b.rssi ?? -999) - (a.rssi ?? -999))[0] || null
}

const toBytes = (view) => (view instanceof DataView ? new Uint8Array(view.buffer, view.byteOffset, view.byteLength) : Uint8Array.from(view || []))
const decodeText = (bytes) => new TextDecoder().decode(bytes).replace(/\0+$/, '').trim()
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Conclusion lisible du diagnostic : `code` stable (pour le run suivant), titre et conseils.
 * Ne propose jamais de dissocier la montre dans Huawei Santé (ça invalide la clé de la liaison).
 */
export function verdictFor(report) {
  const step = (id) => report.steps.find((s) => s.id === id)
  const competing = report.apps?.installed || []
  const holder = competing.find((a) => a.id === 'huawei_health' || a.id === 'honor_health')
  const appsLine = competing.length
    ? `Sur ce téléphone : ${competing.map((a) => a.name).join(', ')}. Une montre Huawei n'accepte qu'une app liée à la fois.`
    : null
  const keep = 'Ne dissociez pas la montre dans Huawei Santé : cela invalide sa clé et ne la libère pas pour autant.'
  const lp = report.watch?.linkParams
  const classicFail = (report.watch?.attempts || []).find((a) => a.transport === 'classic' && /^connect:fail/.test(a.steps[0] || ''))
  const classicLine = classicFail
    ? /non appairée/.test(classicFail.steps[0])
      ? "Bluetooth classique (celui des GT 3 à GT 7) : la montre n'est pas appairée à Android. Suivez « Libérer et appairer la montre » ci-dessous."
      : `Bluetooth classique (celui des GT 3 à GT 7) refusé : ${classicFail.steps[0].replace(/^connect:fail \((Bluetooth classique : )?|\)$/g, '')}.`
    : null
  if (step('bluetooth')?.status === 'fail') {
    return { code: 'no_bluetooth', title: 'Bluetooth indisponible', advice: ['Activez le Bluetooth et autorisez « Appareils à proximité » pour HealthTrack, puis relancez.'] }
  }
  if (step('find')?.status === 'fail') {
    return {
      code: 'not_found',
      title: 'Montre introuvable',
      advice: [
        'Gardez la montre allumée près du téléphone, écran actif, puis relancez.',
        holder ? `${holder.name} est installée : si elle est connectée à la montre en ce moment, la montre ne s'annonce plus aux autres apps.` : null,
        appsLine,
      ].filter(Boolean),
    }
  }
  if (step('connect')?.status === 'fail') {
    return {
      code: 'connect_failed',
      title: 'La montre refuse une deuxième connexion',
      advice: [
        holder
          ? `Elle est très probablement occupée par ${holder.name}. Pour ce test seulement : coupez le Bluetooth de ${holder.name} (Réglages Android → Applis → ${holder.name} → Autorisations → Appareils à proximité → Refuser), puis relancez.`
          : 'Une autre app la tient peut-être connectée : fermez-la, puis relancez.',
        classicLine,
        keep,
      ].filter(Boolean),
    }
  }
  if (step('services')?.status === 'fail') {
    return {
      code: 'no_huawei_service',
      title: 'Canal Huawei absent',
      advice: [classicLine, 'En BLE, la montre ne présente pas le service Huawei (FE86). Exportez le journal : il dit quels services elle propose.'].filter(Boolean),
    }
  }
  if (step('subscribe')?.status === 'fail' || step('link')?.status === 'fail') {
    return {
      code: 'no_answer',
      title: 'La montre ne répond pas',
      advice: [
        holder ? `Elle est probablement liée à ${holder.name} et ignore les autres apps.` : 'Elle attend peut-être un appairage Android.',
        'Suivez « Libérer et appairer la montre » ci-dessous, puis relancez le test et exportez le journal.',
        classicLine,
        keep,
      ].filter(Boolean),
    }
  }
  if (lp && lp.result !== null && lp.result !== RESULT_SUCCESS) {
    return { code: 'refused', title: `La montre a répondu par une erreur (${lp.result})`, advice: ['Exportez le journal et transmettez-le.', keep] }
  }
  if (lp) {
    return {
      code: 'link_ok',
      title: 'La montre répond à HealthTrack',
      advice: [
        `Protocole v${lp.protocolVersion ?? '?'}, méthode attendue : ${authModeLabel(lp)} (version ${lp.authVersion ?? '?'}${lp.encryptMethod === 1 ? ', chiffrement GCM' : ''}).`,
        "Étape suivante : « Connexion à la montre » plus bas (authentification puis lecture des mesures). Le journal exporté dit quelle méthode la montre attend.",
        appsLine,
      ].filter(Boolean),
    }
  }
  return { code: 'incomplete', title: 'Diagnostic incomplet', advice: ['Exportez le journal et transmettez-le.'] }
}

/**
 * Déroule le diagnostic. `client` : client BLE (`@capacitor-community/bluetooth-le` ou faux client) ;
 * `classic` : plugin natif BtClassic (RFCOMM), ou null s'il est absent.
 * `detectApps()` → apps santé installées (ou null). `onUpdate(report)` à chaque étape / ligne de journal.
 */
export async function runHuaweiDiagnostic({ client, classic = null, ready = async () => {}, detectApps = async () => null, onUpdate, scanMs = 10_000, responseMs = 6000, now = () => Date.now(), appVersion = 'dev' } = {}) {
  const t0 = now()
  const report = {
    format: 'healthtrack-watch-diagnostic',
    version: 1,
    appVersion,
    startedAt: new Date(t0).toISOString(),
    steps: STEPS.map((s) => ({ ...s, status: 'pending', detail: null })),
    apps: null,
    watch: null,
    log: [],
    verdict: null,
  }
  const emit = () => onUpdate?.(structuredCloneSafe(report))
  const log = (msg, level = 'info') => {
    report.log.push({ t: now() - t0, level, msg })
    emit()
  }
  const set = (id, status, detail = null) => {
    Object.assign(report.steps.find((s) => s.id === id), { status, detail })
    if (status !== 'running') log(`${id} → ${status}${detail ? ` : ${detail}` : ''}`, status === 'fail' ? 'error' : status === 'warn' ? 'warn' : 'info')
  }
  const finish = () => {
    for (const s of report.steps) if (s.status === 'pending' || s.status === 'running') s.status = 'skip'
    report.verdict = verdictFor(report)
    report.finishedAt = new Date(now()).toISOString()
    log(`verdict : ${report.verdict.code}`)
    return report
  }

  // 1. Bluetooth
  set('bluetooth', 'running')
  try {
    await ready(client)
    set('bluetooth', 'ok')
  } catch (e) {
    set('bluetooth', 'fail', e?.message || String(e))
    return finish()
  }

  // 2. Apps concurrentes
  set('apps', 'running')
  try {
    const installed = await detectApps()
    if (installed === null) {
      report.apps = { detectable: false, installed: [] }
      set('apps', 'skip', 'détection impossible ici')
    } else {
      const competing = installed.filter((a) => COMPETING_APP_IDS.includes(a.id)).map((a) => ({ id: a.id, name: a.name, package: a.package }))
      report.apps = { detectable: true, installed: competing }
      set('apps', competing.length ? 'warn' : 'ok', competing.length ? competing.map((a) => a.name).join(', ') : 'aucune')
    }
  } catch (e) {
    report.apps = { detectable: false, installed: [] }
    set('apps', 'skip', e?.message || String(e))
  }

  // 3. Recherche : appareils appairés + annonces
  set('find', 'running')
  const candidates = new Map()
  const consider = (scan, { bonded = false, advertising = false } = {}) => {
    const fp = buildFingerprint(scan)
    if (!isHuaweiWearable(fp)) return
    const id = scan.device.deviceId
    const prev = candidates.get(id)
    candidates.set(id, {
      deviceId: id,
      name: fp.name || prev?.name || '',
      fingerprint: advertising || !prev ? fp : prev.fingerprint,
      rssi: scan.rssi ?? prev?.rssi ?? null,
      bonded: bonded || prev?.bonded || false,
      advertising: advertising || prev?.advertising || false,
    })
  }
  try {
    if (typeof client.getBondedDevices === 'function') {
      const bonded = await client.getBondedDevices().catch(() => [])
      for (const device of bonded) consider({ device }, { bonded: true })
      log(`appareils appairés au téléphone : ${bonded.length} (dont Huawei : ${candidates.size})`)
    }
    await client.requestLEScan({ allowDuplicates: false }, (scan) => {
      if (scan?.device?.deviceId) consider(scan, { advertising: true })
    })
    await wait(client.scanMs ?? scanMs)
    await client.stopLEScan?.().catch(() => {})
  } catch (e) {
    log(`recherche interrompue : ${e?.message || e}`, 'warn')
  }
  const watch = pickWatch([...candidates.values()])
  if (!watch) {
    set('find', 'fail', 'aucune montre Huawei / Honor vue ni appairée')
    return finish()
  }
  report.watch = {
    name: watch.name,
    id: redactDeviceId(watch.deviceId),
    bonded: watch.bonded,
    advertising: watch.advertising,
    rssi: watch.rssi,
    fingerprint: watch.fingerprint,
    services: [],
    deviceInfo: {},
    linkParams: null,
    frames: [],
  }
  set('find', 'ok', `${watch.name || 'sans nom'}${watch.bonded ? ' · appairée' : ''}${watch.advertising ? ` · s'annonce (${watch.rssi ?? '?'} dBm)` : ' · ne s’annonce pas'}`)

  // 4 → 7 : connexion, services, canal, paramètres du lien — Bluetooth classique d'abord (GT 3 → GT 7),
  // puis BLE GATT (bracelets, anciens modèles). On garde la tentative allée le plus loin.
  const attempts = []
  const kinds = classic ? ['classic', 'ble'] : ['ble']
  for (const kind of kinds) {
    for (const id of LINK_STEPS) Object.assign(report.steps.find((s) => s.id === id), { status: 'pending', detail: null })
    const result = await attemptLink(kind, { client, classic, watch, report, set, log, now, t0, responseMs })
    attempts.push({ kind, ...result, steps: LINK_STEPS.map((id) => ({ ...report.steps.find((s) => s.id === id) })) })
    if (result.linkParams) break
  }
  const progress = (a) => a.steps.filter((s) => s.status === 'ok' || s.status === 'warn').length
  const best = attempts.find((a) => a.linkParams) || attempts.reduce((x, y) => (progress(y) > progress(x) ? y : x))
  for (const st of best.steps) Object.assign(report.steps.find((s) => s.id === st.id), st)
  report.watch.transport = best.kind
  report.watch.linkParams = best.linkParams || null
  report.watch.attempts = attempts.map((a) => ({ transport: a.kind, steps: a.steps.map((s) => `${s.id}:${s.status}${s.detail ? ` (${s.detail})` : ''}`) }))
  return finish()
}

const LINK_STEPS = ['connect', 'services', 'subscribe', 'link']
const TRANSPORT_LABEL = { classic: 'Bluetooth classique', ble: 'BLE' }

/** Une tentative complète sur un transport ; met à jour les étapes 4 → 7 au fil de l'eau. */
async function attemptLink(kind, { client, classic, watch, report, set, log, now, t0, responseMs }) {
  const label = TRANSPORT_LABEL[kind]
  let transport
  let sdpUuids = null
  if (kind === 'classic') {
    let bonded = []
    try {
      bonded = (await classic.listBonded())?.devices || []
    } catch (e) {
      log(`[classique] appareils appairés illisibles : ${e?.message || e}`, 'warn')
    }
    const match = bonded.find((d) => d.deviceId === watch.deviceId) || bonded.find((d) => d.name && d.name === watch.name)
    if (!match) {
      set('connect', 'fail', `${label} : montre non appairée à Android`)
      return {}
    }
    sdpUuids = (match.uuids || []).map((u) => String(u).toLowerCase())
    report.watch.classic = { type: match.type ?? null, sdpUuids }
    const uuid = /honor/i.test(match.name || watch.name) && sdpUuids.includes(HONOR_RFCOMM_UUID) ? HONOR_RFCOMM_UUID : HUAWEI_RFCOMM_UUID
    transport = classicTransport(classic, match.deviceId, uuid)
  } else {
    transport = bleTransport(client, watch.deviceId)
  }

  const reassembler = createReassembler()
  let answer = null
  let closed = false
  const onData = (bytes) => {
    report.watch.frames.push({ dir: 'in', via: kind, t: now() - t0, hex: toHex(bytes) })
    try {
      for (const m of reassembler.push(bytes)) {
        log(`[${label}] reçu : service ${m.serviceId}, commande ${m.commandId}, ${m.tlvs.length} TLV`)
        if (m.serviceId === DEVICE_CONFIG && m.commandId === LINK_PARAMS) answer = m
      }
    } catch (e) {
      log(`[${label}] trame illisible : ${e?.message || e}`, 'warn')
    }
  }
  const onClose = () => {
    closed = true
    log(`[${label}] la montre a coupé la connexion`, 'warn')
  }

  set('connect', 'running')
  try {
    await transport.open(onData, onClose)
    set('connect', 'ok', label)
  } catch (e) {
    set('connect', 'fail', `${label} : ${e?.message || e}`)
    return {}
  }

  try {
    set('services', 'running')
    if (kind === 'classic') {
      const known = sdpUuids.some((u) => u === HUAWEI_RFCOMM_UUID || u === HONOR_RFCOMM_UUID)
      set('services', known ? 'ok' : 'warn', known ? 'service Huawei présent' : `${sdpUuids.length} services connus, Huawei non listé`)
    } else {
      let services = []
      try {
        services = (await client.getServices?.(watch.deviceId)) || []
      } catch (e) {
        log(`liste des services impossible : ${e?.message || e}`, 'warn')
      }
      report.watch.services = services.map((s) => ({ uuid: s.uuid, characteristics: (s.characteristics || []).map((c) => c.uuid) }))
      if (services.some((s) => s.uuid?.toLowerCase() === uuid16(0x180a))) {
        for (const [uuid, field] of DIS) {
          try {
            const v = await client.read(watch.deviceId, uuid16(0x180a), uuid16(uuid))
            report.watch.deviceInfo[field] = decodeText(toBytes(v))
          } catch {
            /* caractéristique absente ou protégée */
          }
        }
      }
      const hasHuawei = services.length === 0 || services.some((s) => s.uuid?.toLowerCase() === HUAWEI_SERVICE)
      if (!hasHuawei) {
        set('services', 'fail', `${services.length} services BLE, pas de FE86`)
        return {}
      }
      const info = Object.values(report.watch.deviceInfo).filter(Boolean).join(' / ')
      set('services', 'ok', `${services.length || '?'} services${info ? ` · ${info}` : ''}`)
    }

    set('subscribe', 'running')
    try {
      await transport.subscribe?.(onData)
      set('subscribe', 'ok')
    } catch (e) {
      set('subscribe', 'fail', e?.message || String(e))
      return {}
    }

    set('link', 'running')
    const request = linkParamsRequest()
    report.watch.frames.push({ dir: 'out', via: kind, t: now() - t0, hex: toHex(request) })
    try {
      await transport.send(request)
    } catch (e) {
      set('link', 'fail', `écriture impossible : ${e?.message || e}`)
      return {}
    }
    const deadline = now() + responseMs
    while (!answer && !closed && now() < deadline) await wait(100)
    if (!answer) {
      set('link', 'fail', closed ? 'connexion coupée par la montre' : `aucune réponse en ${Math.round(responseMs / 1000)} s`)
      return {}
    }
    const lp = parseLinkParams(answer.tlvs)
    const ok = lp.result === null || lp.result === RESULT_SUCCESS
    set('link', ok ? 'ok' : 'warn', ok ? `protocole v${lp.protocolVersion ?? '?'} · ${authModeLabel(lp)}` : `code ${lp.result}`)
    return { linkParams: lp }
  } finally {
    await transport.close().catch(() => {})
  }
}

function structuredCloneSafe(v) {
  return JSON.parse(JSON.stringify(v))
}
