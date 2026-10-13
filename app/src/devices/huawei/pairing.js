/**
 * Connexion authentifiée à une montre Huawei (chantier D3, étape c) : paramètres du lien, état,
 * négociation, puis HiChain — PIN + liaison au premier appairage, authentification ensuite — et
 * chiffrement des trames. Écrit d'après journal/protocoles/huawei.md §5–6.
 *
 * Clés : identifiant du téléphone et clé longue durée gardés sur le téléphone seulement
 * (localStorage, hors export JSON). Le journal produit ne contient ni clé, ni PIN, ni contenu des
 * échanges d'authentification : seulement l'en-tête et la taille de chaque trame.
 */
import { DEVICE_CONFIG, LINK_PARAMS, parseLinkParams, decodeFrame, authModeLabel, resultCode, RESULT_SUCCESS } from './protocol'
import { createSession } from './session'
import { bytesOfHex, hexOf, randomBytes } from './crypto'
import {
  CMD,
  OP_AUTH,
  OP_BIND,
  createCipher,
  decryptPin,
  frameKey,
  newAuthId,
  parseHichainReply,
  parseSecurityNegotiation,
  pinBaseKey,
  runHichain,
  hichainTlvs,
  securityNegotiationTlvs,
} from './hichain'
import { redactDeviceId } from './diagnostic'
import { isHuaweiWatchName } from './setup'

/** Demande des paramètres du lien : étiquettes 1 à 4 vides (comme linkParamsRequest). */
const LINK_PARAMS_TLVS = [{ tag: 1 }, { tag: 2 }, { tag: 3 }, { tag: 4 }]

const KEYS_STORAGE = 'healthtrack_watch_keys'
const SECRETS_STORAGE = 'healthtrack_huawei_secrets'

/** Source publique des constantes du PIN (MIT) : téléchargée sur le téléphone, jamais dans le dépôt. */
export const SECRETS_SOURCE_URL = 'https://raw.githubusercontent.com/zyv/huawei-lpv2/master/huawei/protocol.py'

export const CONNECT_STEPS = [
  { id: 'connect', label: 'Connexion à la montre' },
  { id: 'link', label: 'Paramètres du lien' },
  { id: 'negotiate', label: 'Négociation de sécurité' },
  { id: 'bind', label: 'Premier appairage (PIN et clé)' },
  { id: 'auth', label: 'Authentification' },
  { id: 'check', label: 'Échange chiffré (batterie)' },
]

const readJson = (storage, key) => {
  try {
    const v = JSON.parse(storage?.getItem(key) || 'null')
    return v && typeof v === 'object' ? v : null
  } catch {
    return null
  }
}
const writeJson = (storage, key, value) => {
  try {
    storage?.setItem(key, JSON.stringify(value))
  } catch {
    /* stockage plein : la clé sera renégociée au prochain appairage */
  }
}

/** Clés d'une montre : { authId, authToken? (hex), boundAt? }. */
export function createKeyStore(storage = globalThis.localStorage) {
  return {
    get: (watchKey) => readJson(storage, KEYS_STORAGE)?.[watchKey] || null,
    set(watchKey, value) {
      const all = readJson(storage, KEYS_STORAGE) || {}
      all[watchKey] = value
      writeJson(storage, KEYS_STORAGE, all)
    },
    forget(watchKey) {
      const all = readJson(storage, KEYS_STORAGE) || {}
      if (all[watchKey]) {
        // l'identifiant du téléphone est gardé : seule la clé longue durée est oubliée
        all[watchKey] = { authId: all[watchKey].authId }
        writeJson(storage, KEYS_STORAGE, all)
      }
    },
  }
}

export const loadSecrets = (storage = globalThis.localStorage) => readJson(storage, SECRETS_STORAGE)
export const saveSecrets = (secrets, storage = globalThis.localStorage) => writeJson(storage, SECRETS_STORAGE, secrets)

/** Montre Huawei / Honor appairée à Android (Bluetooth classique), ou null. */
export async function findBondedWatch(classic) {
  const devices = (await classic.listBonded())?.devices || []
  return devices.find((d) => isHuaweiWatchName(d.name)) || null
}

/** Résumé d'une trame pour le journal : sens, taille, service / commande, jamais le contenu. */
function frameSummary(dir, bytes) {
  try {
    const { slice, body } = decodeFrame(bytes)
    const head = slice <= 1 && body.length >= 2 ? `${body[0]}/0x${body[1].toString(16)}` : `tranche ${slice}`
    return { dir, size: bytes.length, head }
  } catch {
    return { dir, size: bytes.length, head: '?' }
  }
}

/**
 * Se connecte et s'authentifie. `transport` : voir transports.js ; `watchKey` : identifiant de la
 * montre (adresse) pour retrouver ses clés. `secrets` : constantes du PIN (premier appairage seulement).
 * `rebind` : force PIN + liaison même si une clé est gardée. Rend le rapport (jamais d'exception).
 */
export async function connectAndAuthenticate({
  transport,
  watchKey,
  watchName = '',
  keyStore = createKeyStore(),
  secrets = null,
  rebind = false,
  accountId = null,
  model = 'Android',
  onUpdate = () => {},
  timeoutMs = 8000,
  bindTimeoutMs = 30_000,
  now = () => Date.now(),
  rand = randomBytes,
  appVersion = 'dev',
} = {}) {
  const t0 = now()
  const report = {
    format: 'healthtrack-watch-connect',
    version: 1,
    appVersion,
    startedAt: new Date(t0).toISOString(),
    watch: { name: watchName, id: redactDeviceId(watchKey) },
    steps: CONNECT_STEPS.map((s) => ({ ...s, status: 'pending', detail: null })),
    linkParams: null,
    scheme: null,
    firstPairing: false,
    battery: null,
    outcome: null,
    log: [],
    frames: [],
  }
  const emit = () => onUpdate(JSON.parse(JSON.stringify(report)))
  const log = (msg, level = 'info') => {
    report.log.push({ t: now() - t0, level, msg })
    emit()
  }
  const set = (id, status, detail = null) => {
    Object.assign(report.steps.find((s) => s.id === id), { status, detail })
    if (status !== 'running') log(`${id} → ${status}${detail ? ` : ${detail}` : ''}`, status === 'fail' ? 'error' : 'info')
    else emit()
  }
  const finish = (code, title) => {
    for (const s of report.steps) if (s.status === 'pending' || s.status === 'running') s.status = 'skip'
    report.outcome = { code, title }
    report.finishedAt = new Date(now()).toISOString()
    log(`résultat : ${code}`)
    return report
  }

  const session = createSession(transport, {
    timeoutMs,
    onFrame: (dir, bytes) => report.frames.push({ t: now() - t0, ...frameSummary(dir, bytes) }),
    onMessage: (m) => log(m.error ? `message ignoré : ${m.error}` : `message spontané ${m.serviceId}/0x${(m.commandId ?? 0).toString(16)}`),
  })
  let current = 'connect'
  try {
    set('connect', 'running')
    await session.open()
    set('connect', 'ok', transport.label || null)

    current = 'link'
    set('link', 'running')
    const lpMsg = await session.request(DEVICE_CONFIG, LINK_PARAMS, LINK_PARAMS_TLVS, { plain: true })
    const lp = parseLinkParams(lpMsg.tlvs)
    report.linkParams = lp
    if (lp.maxFrameSize) session.setMaxFrameSize(lp.maxFrameSize)
    set('link', 'ok', `${authModeLabel(lp)} · version ${lp.authVersion ?? '?'}${lp.encryptMethod === 1 ? ' · GCM' : ''}`)
    if (lp.authMode === 'legacy' || lp.authMode === 'unknown') {
      set('negotiate', 'fail', `mode « ${authModeLabel(lp)} » pas encore pris en charge`)
      return finish('unsupported', 'Méthode de la montre pas encore prise en charge')
    }

    current = 'negotiate'
    set('negotiate', 'running')
    const status = await session.request(DEVICE_CONFIG, CMD.DEVICE_STATUS, [{ tag: 1 }], { plain: true })
    const st = status.tlvs.find((t) => t.tag === 1)?.value
    log(`état de la montre : ${st?.length ? st[0] : 'non précisé'}`)
    const keys = keyStore.get(watchKey) || {}
    if (!keys.authId) {
      keys.authId = newAuthId(rand)
      keyStore.set(watchKey, keys)
    }
    const neg = parseSecurityNegotiation(
      (await session.request(DEVICE_CONFIG, CMD.SECURITY_NEGOTIATION, securityNegotiationTlvs({ ...lp, authId: keys.authId, model }), { plain: true })).tlvs,
    )
    report.scheme = neg.scheme
    if (neg.scheme !== 'hichain') {
      set('negotiate', 'fail', `${neg.scheme === 'hichain_lite' ? 'HiChain Lite' : `type ${neg.authType}`} : pas encore pris en charge`)
      return finish('unsupported', 'Méthode de la montre pas encore prise en charge')
    }
    set('negotiate', 'ok', 'HiChain')

    let requestId = now()
    const exchange = (timeout) => async (json, op) => {
      const reply = await session.request(DEVICE_CONFIG, CMD.HICHAIN, hichainTlvs(json, op, requestId), { plain: true, timeout })
      return parseHichainReply(reply.tlvs)
    }

    // Premier appairage : PIN puis liaison → clé longue durée
    current = 'bind'
    if (!keys.authToken || rebind) {
      report.firstPairing = true
      set('bind', 'running')
      if (!secrets) {
        set('bind', 'fail', 'paramètres Huawei du premier appairage absents')
        return finish('need_secrets', 'Importez les paramètres Huawei pour le premier appairage')
      }
      const pinMsg = await session.request(DEVICE_CONFIG, CMD.PIN_CODE, [{ tag: 1 }], { plain: true })
      const pin = await decryptPin(pinMsg.tlvs, { ...lp, secrets })
      log(`PIN reçu (${pin.length} octets)`)
      const bound = await runHichain({ operation: OP_BIND, baseKey: await pinBaseKey(pin), authId: keys.authId, requestId, exchange: stepTimeouts(exchange, bindTimeoutMs, timeoutMs), rand })
      Object.assign(keys, { authToken: hexOf(bound.authToken), boundAt: new Date(now()).toISOString() })
      keyStore.set(watchKey, keys)
      set('bind', 'ok', 'clé gardée sur ce téléphone')
    } else {
      set('bind', 'skip', `déjà appairée le ${String(keys.boundAt || '').slice(0, 10) || '?'}`)
    }

    current = 'auth'
    set('auth', 'running')
    requestId = now() + 1
    let auth
    try {
      auth = await runHichain({ operation: OP_AUTH, baseKey: bytesOfHex(keys.authToken), authId: keys.authId, requestId, exchange: exchange(timeoutMs), rand })
    } catch (e) {
      if ((e?.code === 'token_mismatch' || e?.code === 'watch_error') && !report.firstPairing) {
        set('auth', 'fail', e.message)
        return finish('key_rejected', 'La montre ne reconnaît plus la clé de HealthTrack')
      }
      throw e
    }
    const key = await frameKey(auth.sessionKey, auth)
    const lpType = lp.deviceSupportType
    session.setCipher(createCipher({ key, gcm: lp.encryptMethod === 1 || lpType === 4, randomIv: lpType === 4, rand }))
    set('auth', 'ok', `trames chiffrées (${lp.encryptMethod === 1 || lpType === 4 ? 'AES-GCM' : 'AES-CBC'})`)

    current = 'check'
    set('check', 'running')
    const battery = await session.request(DEVICE_CONFIG, 0x08, [{ tag: 1 }])
    const level = battery.tlvs.find((t) => t.tag === 1)?.value
    const code = resultCode(battery.tlvs)
    if (code !== null && code !== RESULT_SUCCESS) {
      set('check', 'warn', `réponse chiffrée reçue, code ${code}`)
    } else {
      report.battery = level?.length === 1 ? level[0] : null
      set('check', 'ok', report.battery !== null ? `batterie ${report.battery} %` : 'réponse chiffrée reçue')
    }
    if (accountId) {
      await session.send(0x1a, 0x05, [{ tag: 1, value: Array.from(new TextEncoder().encode(accountId)) }]).catch(() => {})
      log('identifiant de compte Huawei transmis')
    }
    return finish('connected', report.firstPairing ? 'Montre appairée à HealthTrack' : 'Montre connectée à HealthTrack')
  } catch (e) {
    const msg = e?.message || String(e)
    set(current, 'fail', msg)
    if (current === 'connect') return finish('connect_failed', 'Connexion à la montre impossible')
    if (current === 'bind' && /PIN refusé|Déchiffrement/.test(msg)) return finish('pin_failed', 'Premier appairage refusé')
    return finish('failed', 'La connexion s’est arrêtée en route')
  } finally {
    await session.close().catch(() => {})
  }
}

/** 1re étape de la liaison : délai long (la montre peut demander une confirmation), puis délai normal. */
function stepTimeouts(exchange, first, rest) {
  let n = 0
  return (json, op) => exchange(n++ === 0 ? first : rest)(json, op)
}

/** Conseils selon le résultat (jamais « dissocier dans Huawei Santé »). */
export function connectAdvice(report) {
  switch (report?.outcome?.code) {
    case 'connected':
      return ['La montre parle maintenant à HealthTrack, avec une clé gardée sur ce téléphone. La lecture des données arrive à la prochaine étape.']
    case 'need_secrets':
      return ['Le premier appairage a besoin de 3 constantes publiques (projet huawei-lpv2, licence MIT). Touchez « Télécharger les paramètres » : elles restent sur ce téléphone.']
    case 'key_rejected':
      return [
        'Si la montre vient de s’éloigner ou de redémarrer, réessayez dans quelques secondes.',
        'Sinon une autre app (Huawei Santé, Gadgetbridge) l’a liée depuis : suivez « Libérer et appairer la montre », puis « Refaire l’appairage ».',
      ]
    case 'pin_failed':
      return ['La montre a refusé le PIN : elle est probablement liée à une autre app. Suivez « Libérer et appairer la montre » (réinitialisation), puis réessayez.']
    case 'unsupported':
      return ['Exportez le journal et transmettez-le : il dit quelle méthode la montre attend.']
    case 'connect_failed':
      return ['Vérifiez que la montre est appairée à Android (« Libérer et appairer la montre ») et proche du téléphone, puis réessayez.']
    default:
      return ['Exportez le journal et transmettez-le pour la suite.']
  }
}
