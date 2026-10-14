/**
 * Fin d'association côté montre (chantier D3, étape c ter) : après l'authentification, la montre
 * attend que l'app compagnon accepte les accords, se déclare appareil principal, envoie le compte
 * (vide), le profil, les seuils, le fuseau et la langue — sinon elle reste sur son écran
 * « Association… » et n'enregistre rien. Écrit d'après journal/protocoles/huawei.md §6.12.
 *
 * Chaque message est facultatif : un refus ou un silence est consigné, jamais bloquant. Le journal
 * ne garde que le nom de l'étape, son état et le code 0x7F : ni nom de compte, ni profil.
 */
import { encodeTlvs, resultCode, RESULT_SUCCESS } from './protocol'
import { hasExpand } from './sync'
import { utf8 } from './crypto'

export const DEVICE_CONFIG = 1
export const FITNESS = 7
export const ACCOUNT = 0x1a
export const LOCALE = 0x0c
export const ASSOC = {
  PRODUCT_INFO: 0x07,
  DATE_FORMAT: 0x04,
  PHONE_INFO: 0x10,
  AGREEMENT: 0x30,
  TIMEZONE: 0x32,
  CONNECT_STATUS: 0x35,
  PERMISSION_CHECK: 0x38,
  WEAR_STATUS: 0x3d,
  SETUP_STATUS: 0x3e,
  PHONE_CAPS: 0x3f,
}
export const FIT_ASSOC = { USER_INFO: 0x02, THRESHOLD: 0x0e, AUTO_HR: 0x17, AUTO_SPO2: 0x24 }
export const ACCOUNT_CMD = { EXTENDED: 0x05, EXTENDED_2: 0x06 }
/** Capacités étendues (1/0x37) utiles ici. */
export const EXPAND_ASSOC = { UNKNOWN_GENDER: 87, MULTI_DEVICE: 109, OTHER_ACCOUNT: 172, PHONE_CAPS: 182 }

/** Commandes demandées en 1/0x03 en plus de celles de la synchro (§6.12). */
export const ASSOCIATION_QUERY = [
  [DEVICE_CONFIG, [ASSOC.AGREEMENT, ASSOC.CONNECT_STATUS, ASSOC.WEAR_STATUS, ASSOC.SETUP_STATUS]],
  [FITNESS, [FIT_ASSOC.USER_INFO, FIT_ASSOC.THRESHOLD, FIT_ASSOC.AUTO_HR, FIT_ASSOC.AUTO_SPO2]],
  [ACCOUNT, [ACCOUNT_CMD.EXTENDED, ACCOUNT_CMD.EXTENDED_2]],
  [LOCALE, [0x01]],
]

const AGREEMENTS = ['software_update_service_statement', 'device_information_management', 'user_license_agreement']
const AGREEMENT_VERSION = '20230508-20230508-0-0'
const PHONE_CAPS = [0xfd, 0xf7, 0x33, 0xfa, 0x29, 0x37]
/** Version d'app annoncée en 1/0x10, étiquette 0x11 (16.1.3.320, §6.12). */
const PHONE_APP_VERSION = 1600103320

const int = (n, size) => {
  const out = []
  for (let i = size - 1; i >= 0; i--) out.push(Math.floor(n / 2 ** (8 * i)) & 0xff)
  return out
}
const text = (s) => Array.from(utf8(String(s)))
const byte = (n) => [Math.max(0, Math.min(255, Math.round(n)))]

// ── Messages (§6.12) ───────────────────────────────────────────────────────────

/** 0x1A/0x05 : identifiant de compte en ASCII, ou un seul octet 0 sans compte ; 3 = 1 si capacité 172. */
export function extendedAccountTlvs(accountId, { otherAccount = false } = {}) {
  const tlvs = [{ tag: 1, value: accountId ? text(accountId) : [0] }]
  if (otherAccount) tlvs.push({ tag: 3, value: [1] })
  return tlvs
}

/** 1/0x30 : les trois accords acceptés, horodatés (ms en chiffres ASCII). */
export function agreementTlvs(nowMs) {
  const items = AGREEMENTS.map((name) => ({
    tag: 0x82,
    value: encodeTlvs([
      { tag: 3, value: text(name) },
      { tag: 4, value: [1] },
      { tag: 5, value: text(AGREEMENT_VERSION) },
      { tag: 6, value: text(Math.floor(nowMs)) },
    ]),
  }))
  return [{ tag: 0x81, value: encodeTlvs(items) }]
}

/** 1/0x3E : HealthTrack se déclare appareil principal de la montre (nom Bluetooth de la montre). */
export const setupStatusTlvs = (watchName) => [
  { tag: 1, value: [1] },
  { tag: 2, value: text(watchName || 'HUAWEI WATCH') },
  { tag: 3, value: [0] },
]

/**
 * 7/0x02 : profil. `profile` : { heightCm, weightKg, age?, birthYear?, sex? 'M'|'F' }.
 * Sexe inconnu (3) seulement si la montre l'accepte (capacité 87), sinon omis.
 */
export function userInfoTlvs({ heightCm = 170, weightKg = 70, age = null, birthYear = null, sex = null } = {}, { unknownGender = false } = {}) {
  const tlvs = [
    { tag: 1, value: byte(heightCm) },
    { tag: 2, value: byte(weightKg) },
  ]
  if (age) tlvs.push({ tag: 3, value: byte(age) })
  // date exacte inconnue : 1er juillet de l'année de naissance (§6.12)
  if (birthYear) tlvs.push({ tag: 4, value: int(birthYear * 65536 + 7 * 256 + 1, 4) })
  const gender = sex === 'M' ? 1 : sex === 'F' ? 2 : unknownGender ? 3 : null
  if (gender) tlvs.push({ tag: 5, value: [gender] })
  tlvs.push({ tag: 6, value: byte(0.42 * heightCm) }, { tag: 7, value: byte(0.83 * heightCm) })
  return tlvs
}

/** 7/0x0E : seuils de remontée des données (le 3e dépend de l'heure locale). */
export function thresholdTlvs(localHour) {
  const entry = (type, value) => ({ tag: 2, value: [type, 3, ...int(value, 2), 2] })
  return [{ tag: 0x81, value: encodeTlvs([entry(1, 500), entry(3, 100), entry(4, localHour < 6 ? 21600 : 3600)]) }]
}

/** 1/0x32 : heure, décalage (comme 1/0x05) et nom du fuseau. */
export function timezoneTlvs(nowMs, offsetMinutes, zone) {
  const abs = Math.abs(offsetMinutes)
  return [
    { tag: 1, value: int(Math.floor(nowMs / 1000), 4) },
    { tag: 2, value: [Math.floor(abs / 60) + (offsetMinutes < 0 ? 128 : 0), abs % 60] },
    { tag: 3, value: text(zone || 'UTC') },
  ]
}

export const languageTlvs = (locale = 'fr-FR') => [
  { tag: 1, value: text(locale) },
  { tag: 2, value: [0] },
]
/** 1/0x04 : jour d'abord (3), 24 h (2). */
export const dateFormatTlvs = () => [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: [3] }, { tag: 3, value: [2] }]) }]

/**
 * Réponse à 1/0x10 (la montre demande les infos du téléphone) : une étiquette par étiquette demandée.
 * Rend null si le message n'est qu'un accusé (0x7F = succès seul) : on ne répond pas.
 */
export function phoneInfoReply(tlvs) {
  const asked = tlvs.map((t) => t.tag).filter((tag) => tag !== 0x7f)
  if (!asked.length) return null
  const out = []
  for (const tag of asked) {
    if (tag === 0 || tag === 0x0f) continue
    if (tag === 2 || tag === 4 || tag === 0x15) out.push({ tag })
    else if (tag === 8) out.push({ tag, value: text('14') })
    else if (tag === 0x11) out.push({ tag, value: int(PHONE_APP_VERSION, 4) })
    else out.push({ tag, value: [0] })
  }
  return out
}

/** Répond aux demandes de la montre pendant la session ; rend le compteur (journal). */
export function servePhoneInfo(session, log = () => {}) {
  const stats = { phoneInfo: 0, permissionCheck: 0 }
  const offs = [
    session.listen(DEVICE_CONFIG, ASSOC.PHONE_INFO, (m) => {
      const reply = phoneInfoReply(m.tlvs || [])
      if (!reply) return
      stats.phoneInfo++
      log(`la montre demande les infos du téléphone (${reply.length} champs) : réponse envoyée`)
      session.send(DEVICE_CONFIG, ASSOC.PHONE_INFO, reply).catch(() => {})
    }),
    session.listen(DEVICE_CONFIG, ASSOC.PERMISSION_CHECK, (m) => {
      stats.permissionCheck++
      log(`la montre vérifie des permissions (1/0x38, ${(m.tlvs || []).length} champs) : pas de réponse connue`, 'warn')
    }),
  ]
  return { stats, stop: () => offs.forEach((off) => off()) }
}

// ── Déroulé ────────────────────────────────────────────────────────────────────

const canAsk = (caps, service, command) => {
  if (caps?.services?.get?.(service) === false) return false
  return caps?.commands?.get?.(`${service}/${command}`) !== false
}
/** Capacité étendue : true / false si la montre l'a dit, null si inconnue. */
const expandFlag = (caps, n) => (caps?.expand ? hasExpand(caps.expand, n) : null)

/**
 * Joue la fin d'association (§6.12) sur une session authentifiée. Ne lève jamais.
 * @param opts.caps capacités lues (sync.readCapabilities, avec ASSOCIATION_QUERY), ou null
 * @param opts.firstTime true → active aussi FC et SpO₂ automatiques (une seule fois par montre)
 * @returns {{ steps: {id,label,status,code?}[], sentSetupStatus: boolean, accepted: number, refused: number }}
 */
export async function runAssociation(
  session,
  { caps = null, watchName = '', accountId = null, profile = {}, firstTime = false, now = Date.now(), tzOffsetMinutes = 0, zone = 'UTC', locale = 'fr-FR', timeout = 1500, log = () => {} } = {},
) {
  const steps = []
  const ask = async (id, label, service, command, tlvs, { waitReply = true } = {}) => {
    const step = { id, label, status: 'pending' }
    steps.push(step)
    try {
      if (!waitReply) {
        await session.send(service, command, tlvs)
        step.status = 'sent'
      } else {
        const code = resultCode((await session.request(service, command, tlvs, { timeout })).tlvs)
        step.code = code
        step.status = code === null || code === RESULT_SUCCESS ? 'accepted' : 'refused'
      }
    } catch (e) {
      step.status = /Pas de réponse/.test(e?.message || '') ? 'silent' : 'error'
    }
    log(`association : ${label} → ${step.status}${step.code != null ? ` (${step.code})` : ''}`, step.status === 'refused' || step.status === 'error' ? 'warn' : 'info')
    return step
  }
  const skip = (id, label, why) => {
    steps.push({ id, label, status: 'skip', detail: why })
  }

  await ask('product', 'infos produit', DEVICE_CONFIG, ASSOC.PRODUCT_INFO, Array.from({ length: 10 }, (_, i) => ({ tag: i + 1 })))

  if (canAsk(caps, ACCOUNT, ACCOUNT_CMD.EXTENDED) && canAsk(caps, ACCOUNT, ACCOUNT_CMD.EXTENDED_2)) {
    const tlvs = extendedAccountTlvs(accountId, { otherAccount: expandFlag(caps, EXPAND_ASSOC.OTHER_ACCOUNT) === true })
    await ask('account', accountId ? 'compte Huawei' : 'compte (aucun)', ACCOUNT, ACCOUNT_CMD.EXTENDED, tlvs)
  } else skip('account', 'compte', 'non pris en charge')

  if (canAsk(caps, DEVICE_CONFIG, ASSOC.AGREEMENT)) await ask('agreement', 'accords acceptés', DEVICE_CONFIG, ASSOC.AGREEMENT, agreementTlvs(now))
  else skip('agreement', 'accords acceptés', 'non pris en charge')

  if (expandFlag(caps, EXPAND_ASSOC.PHONE_CAPS) === true) await ask('phone_caps', 'capacités du téléphone', DEVICE_CONFIG, ASSOC.PHONE_CAPS, [{ tag: 1, value: PHONE_CAPS }])

  // 1/0x3E n'a jamais de réponse : envoyé sans attendre (capacité 109 inconnue → envoyé quand même)
  const multi = expandFlag(caps, EXPAND_ASSOC.MULTI_DEVICE)
  let sentSetupStatus = false
  if (multi !== false && canAsk(caps, DEVICE_CONFIG, ASSOC.SETUP_STATUS)) {
    sentSetupStatus = (await ask('setup_status', 'appareil principal déclaré', DEVICE_CONFIG, ASSOC.SETUP_STATUS, setupStatusTlvs(watchName), { waitReply: false })).status === 'sent'
    await ask('wear_status', 'état de port', DEVICE_CONFIG, ASSOC.WEAR_STATUS, [{ tag: 1 }])
  } else skip('setup_status', 'appareil principal déclaré', 'non pris en charge')

  if (canAsk(caps, DEVICE_CONFIG, ASSOC.CONNECT_STATUS)) await ask('connect_status', 'état de connexion', DEVICE_CONFIG, ASSOC.CONNECT_STATUS, [{ tag: 1, value: [1] }])

  await ask('user_info', 'profil (taille, poids)', FITNESS, FIT_ASSOC.USER_INFO, userInfoTlvs(profile, { unknownGender: expandFlag(caps, EXPAND_ASSOC.UNKNOWN_GENDER) === true }))
  if (canAsk(caps, FITNESS, FIT_ASSOC.THRESHOLD)) {
    const localHour = new Date(now + tzOffsetMinutes * 60_000).getUTCHours()
    await ask('threshold', 'seuils de remontée', FITNESS, FIT_ASSOC.THRESHOLD, thresholdTlvs(localHour))
  }
  await ask('timezone', 'fuseau horaire', DEVICE_CONFIG, ASSOC.TIMEZONE, timezoneTlvs(now, tzOffsetMinutes, zone))
  if (canAsk(caps, LOCALE, 0x01)) await ask('language', 'langue', LOCALE, 0x01, languageTlvs(locale))
  await ask('date_format', 'format de date', DEVICE_CONFIG, ASSOC.DATE_FORMAT, dateFormatTlvs())

  if (firstTime) {
    if (canAsk(caps, FITNESS, FIT_ASSOC.AUTO_HR)) await ask('auto_hr', 'FC automatique activée', FITNESS, FIT_ASSOC.AUTO_HR, [{ tag: 1, value: [1] }])
    if (canAsk(caps, FITNESS, FIT_ASSOC.AUTO_SPO2)) await ask('auto_spo2', 'SpO₂ automatique activée', FITNESS, FIT_ASSOC.AUTO_SPO2, [{ tag: 1, value: [1] }])
  }

  return {
    steps,
    sentSetupStatus,
    accepted: steps.filter((s) => s.status === 'accepted').length,
    refused: steps.filter((s) => s.status === 'refused').length,
  }
}

/**
 * État d'association présenté à l'écran : `confirmed` (le propriétaire l'a vu, ou des mesures
 * récentes sont arrivées), `likely` (file jouée), `pending` (pas encore jouée), `not_associated`
 * (le propriétaire a vu l'écran d'association / l'échec).
 */
export function associationState(report) {
  const a = report?.association
  if (!a) return { code: 'pending', title: 'Association côté montre : pas encore vérifiée' }
  if (a.userSaw === 'watchface' || a.freshData) return { code: 'confirmed', title: 'La montre se considère associée à HealthTrack' }
  if (a.userSaw === 'pairing_screen') return { code: 'not_associated', title: 'La montre affiche encore son écran d’association' }
  if (a.sentSetupStatus || a.accepted > 0) return { code: 'likely', title: 'Fin d’association envoyée à la montre' }
  return { code: 'pending', title: 'La montre n’a accepté aucun message d’association' }
}

