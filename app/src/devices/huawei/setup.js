/**
 * Assistant « Libérer et appairer la montre » (chantier D3, étape b) : à partir du dernier
 * diagnostic, des apps installées et de l'état d'appairage Android, dit quelle est la prochaine
 * étape et quel geste la débloque.
 *
 * Une montre Huawei n'accepte qu'une app liée à la fois (protocoles/huawei.md §8). Deux chemins :
 * - « free » : libérer la montre (désinstaller l'app qui la tient ou lui retirer le Bluetooth),
 *   la réinitialiser depuis la montre, puis l'appairer à Android pour HealthTrack seule ;
 * - « keep » (plan B) : garder Huawei Santé ; HealthTrack s'authentifiera avec l'identifiant de
 *   compte Huawei (étape c), sans réinitialiser la montre.
 * Jamais « dissocier dans Huawei Santé » : ça invalide la clé sans libérer la montre.
 *
 * Android interdit de désinstaller une app en silence et de réinitialiser une montre à distance :
 * chaque étape se termine par un geste de l'utilisateur. Rien ici ne parle à la montre.
 */

/** Apps qui peuvent lier la montre (Health Sync lit Huawei Santé mais ne tient pas la montre). */
export const HOLDER_APP_IDS = ['huawei_health', 'honor_health', 'gadgetbridge']

const STORAGE_KEY = 'healthtrack_watch_setup'

/** Verdicts du diagnostic qui trahissent une montre liée à une autre app. */
const HELD_VERDICTS = ['no_answer', 'connect_failed', 'refused']

/** Montre / bracelet Huawei ou Honor d'après son nom (appareils appairés, découverte classique). */
export const isHuaweiWatchName = (name) => /^(huawei|honor)\b.*\b(watch|band)\b/i.test(String(name || '').trim())

/**
 * Réinitialisation depuis la montre (page d'assistance Huawei fr-fr00737169 : « Paramètres > Système
 * et mises à jour > Réinitialiser », « Système > Réinitialiser » sur certains modèles).
 */
export const RESET_STEPS = [
  'Sur la montre, appuyez sur le bouton du haut pour ouvrir la liste des applis.',
  'Ouvrez Paramètres → Système et mises à jour (« Système » sur certains modèles).',
  'Touchez Réinitialiser, puis confirmez. Avec une eSIM, laissez « Supprimer la configuration eSIM » décoché.',
  'La montre redémarre sur un écran d’appairage avec un QR code : ne le scannez pas avec Huawei Santé, revenez ici.',
]

export const RESET_WARNINGS = [
  'Les mesures pas encore synchronisées (dernières heures) seront perdues ; celles déjà dans Huawei Santé y restent.',
  'Ne dissociez pas la montre dans Huawei Santé : cela invalide sa clé sans la libérer.',
]

/** Plan B : garder Huawei Santé et donner à HealthTrack l'identifiant de compte Huawei (gadgetbridge.org, « Huawei Account »). */
export const KEEP_STEPS = [
  'Gardez Huawei Santé et la montre liée comme aujourd’hui : rien à réinitialiser.',
  'HealthTrack se présentera à la montre avec votre identifiant de compte Huawei (15 à 20 chiffres), gardé seulement sur ce téléphone.',
  'Pour le trouver : connectez-vous sur cloud.huawei.com depuis un ordinateur, ouvrez les outils de développement (F12) → Stockage → Cookies : valeur de « userId ».',
  'Limite : Huawei Santé et HealthTrack ne peuvent pas être connectées à la montre en même temps ; retirez à Huawei Santé « Appareils à proximité » pendant que HealthTrack synchronise.',
]

/** Identifiant de compte Huawei : uniquement des chiffres (on tolère espaces et tirets à la saisie). */
export function normalizeAccountId(raw) {
  const digits = String(raw || '').replace(/[\s-]/g, '')
  return /^\d{15,20}$/.test(digits) ? digits : null
}

export function loadSetup(storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

export function saveSetup(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* stockage plein : l'assistant repartira de l'état observé */
  }
}

/**
 * Prochaines étapes de l'assistant.
 * @param {{
 *   installed: Array<{id:string,name:string,package?:string}>|null,  // apps santé installées (null = inconnu)
 *   bonded: boolean|null,          // montre Huawei appairée à Android (null = inconnu)
 *   verdict: string|null,          // code du dernier diagnostic
 *   state: { choice?: 'free'|'keep', resetAt?: string, pairedAt?: string, accountId?: string, neverLinked?: boolean },
 * }} input
 * @returns {{ path: 'free'|'keep', holders: object[], steps: Array<{id:string,status:'done'|'todo'|'current'|'skip'}>, current: string|null }}
 */
export function setupPlan({ installed, bonded, verdict, state = {} }) {
  const holders = (installed || []).filter((a) => HOLDER_APP_IDS.includes(a.id))
  const path = state.choice === 'keep' ? 'keep' : 'free'
  const resetAt = state.resetAt ? Date.parse(state.resetAt) : null
  const pairedAt = state.pairedAt ? Date.parse(state.pairedAt) : null
  // Un appairage Android antérieur à la réinitialisation ne vaut plus : la montre a oublié ses clés.
  const pairedAfterReset = bonded === true && (!resetAt || (pairedAt && pairedAt >= resetAt))
  const linked = verdict === 'link_ok'

  let steps
  if (path === 'keep') {
    steps = [
      { id: 'account', done: Boolean(normalizeAccountId(state.accountId)) },
      { id: 'pair', done: bonded === true },
      { id: 'test', done: linked },
    ]
  } else {
    // La montre a pu être liée même si l'app a déjà été désinstallée : le diagnostic le trahit.
    const wasHeld = holders.length > 0 || HELD_VERDICTS.includes(verdict)
    // Tant que la montre reste liée à une autre app, l'appairage actuel ne servira pas : il faudra le refaire.
    // « Jamais liée à une autre app » (déclaré par l'utilisateur) : pas de réinitialisation.
    const freed = !wasHeld || Boolean(resetAt) || (state.neverLinked && holders.length === 0)
    steps = [
      { id: 'release', done: holders.length === 0 },
      { id: 'reset', done: Boolean(resetAt), skip: !resetAt && (!wasHeld || (state.neverLinked && holders.length === 0)) },
      { id: 'pair', done: freed && pairedAfterReset },
      { id: 'test', done: freed && linked && pairedAfterReset },
    ]
  }
  let current = null
  const out = steps.map((s) => {
    if (s.skip) return { id: s.id, status: 'skip' }
    if (s.done) return { id: s.id, status: 'done' }
    if (!current) {
      current = s.id
      return { id: s.id, status: 'current' }
    }
    return { id: s.id, status: 'todo' }
  })
  return { path, holders, steps: out, current, stalePairing: path === 'free' && bonded === true && Boolean(resetAt) && !pairedAfterReset }
}

/**
 * Appairage Android de la montre via le plugin natif BtClassic :
 * 1. si une montre Huawei est déjà appairée → rien à faire ;
 * 2. sinon recherche Bluetooth classique (≈ 12 s), puis demande de liaison (`createBond`) sur la
 *    première montre Huawei / Honor trouvée ; Android affiche sa boîte de confirmation.
 * @returns {Promise<{ status: 'bonded'|'already'|'not_found'|'refused'|'unavailable', name?: string }>}
 */
export async function pairWatch(classic, { discoverMs = 12_000, onProgress } = {}) {
  if (!classic?.pair) return { status: 'unavailable' }
  const bonded = ((await classic.listBonded().catch(() => null))?.devices || []).filter((d) => isHuaweiWatchName(d.name))
  if (bonded.length) return { status: 'already', name: bonded[0].name }
  onProgress?.('search')
  const found = ((await classic.discover({ timeoutMs: discoverMs }))?.devices || []).filter((d) => isHuaweiWatchName(d.name))
  if (!found.length) return { status: 'not_found' }
  const watch = found.sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999))[0]
  onProgress?.('pair', watch.name)
  const res = await classic.pair({ deviceId: watch.deviceId, timeoutMs: 60_000 })
  return res?.state === 'bonded' ? { status: 'bonded', name: watch.name } : { status: 'refused', name: watch.name }
}

/** Montre Huawei appairée à Android ? null si on ne peut pas le savoir (navigateur, plugin absent). */
export async function isWatchBonded(classic) {
  if (!classic?.listBonded) return null
  try {
    const devices = (await classic.listBonded())?.devices || []
    return devices.some((d) => isHuaweiWatchName(d.name))
  } catch {
    return null
  }
}

/**
 * Tient compte d'un appairage refait à la main dans les réglages Android : après la
 * réinitialisation, si l'on a vu la montre désappairée puis de nouveau appairée, elle l'a été
 * avec la montre réinitialisée. Renvoie le nouvel état (ou le même objet si rien ne change).
 */
export function observeBond(state, bonded, nowIso = new Date().toISOString()) {
  if (!state.resetAt || bonded === null) return state
  const pairedAfter = state.pairedAt && Date.parse(state.pairedAt) >= Date.parse(state.resetAt)
  if (bonded === false && !state.unbondedSinceReset) return { ...state, unbondedSinceReset: true }
  if (bonded === true && state.unbondedSinceReset && !pairedAfter) return { ...state, pairedAt: nowIso }
  return state
}
