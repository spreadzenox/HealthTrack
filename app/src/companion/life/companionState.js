/**
 * État local du compagnon (lot VIE, étapes 11 et 12 du brief « Compagnon ») : son nom, choisi par l'utilisateur
 * (« Pilou » par défaut, brief § 8), la rencontre (une seule fois dans la vie de l'app), la montre enfilée à
 * l'onboarding, la cérémonie du jour 7 (une seule fois) et le dernier jour d'ouverture de Ma journée (« Bon
 * retour »). Rangé dans localStorage comme les autres réglages ; aucune donnée de santé, rien ne sort du téléphone.
 *
 * Rétrocompatibilité (demande du propriétaire du 15/11) : un utilisateur d'avant la refonte n'a pas cette clé. Il a
 * fini son accueil : il rencontre Pilou une fois, sur l'Accueil, sans refaire l'onboarding (needsMeeting). Une
 * sauvegarde d'avant la refonte n'a pas de bloc `companion` : l'import ne touche alors à rien ici.
 */

export const COMPANION_KEY = 'halcya_companion'
export const DEFAULT_NAME = 'Pilou'
export const MAX_NAME = 20

const EMPTY = Object.freeze({
  name: null,
  metAt: null,
  metBy: null,
  watch: null,
  ceremony7At: null,
  ceremony7By: null,
  lastDay: null,
  lastAppDay: null,
})

export function loadCompanion() {
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(COMPANION_KEY) || 'null')
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...EMPTY, ...raw } : { ...EMPTY }
  } catch {
    return { ...EMPTY }
  }
}

export function saveCompanion(patch) {
  const next = { ...loadCompanion(), ...patch }
  try {
    globalThis.localStorage?.setItem(COMPANION_KEY, JSON.stringify(next))
  } catch {
    // stockage plein ou indisponible : l'app continue avec l'état en mémoire
  }
  return next
}

/**
 * Nom saisi → nom gardé : espaces resserrés, 20 caractères au plus, sans caractère de contrôle. Vide → null (le
 * bouton « Valider » reste grisé ; jamais de moquerie ni de refus d'un prénom : SPEC comprendre § 12).
 */
export function cleanName(raw) {
  if (typeof raw !== 'string') return null
  // eslint-disable-next-line no-control-regex
  const s = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()
  if (!s) return null
  return [...s].slice(0, MAX_NAME).join('').trim()
}

/** Le nom du compagnon, toujours lisible : celui choisi, sinon « Pilou ». */
export function companionName(s = loadCompanion()) {
  return cleanName(s?.name) || DEFAULT_NAME
}

export function setCompanionName(raw) {
  const name = cleanName(raw)
  if (!name) return loadCompanion()
  const next = saveCompanion({ name })
  notify()
  return next
}

/**
 * Faut-il montrer la rencontre hors de l'onboarding ? Seulement à qui a déjà fini (ou sauté) son accueil sans avoir
 * rencontré le compagnon : une installation d'avant la refonte qui se met à jour. Une installation neuve le rencontre
 * dans l'onboarding (étape « meet »), jamais deux fois.
 * @param {{ done?: boolean }} onboarding réglages de l'accueil (settings/onboarding.js)
 */
export function needsMeeting(onboarding, s = loadCompanion()) {
  return !!onboarding?.done && !s.metAt
}

/**
 * La rencontre a eu lieu (dans l'onboarding ou, pour un utilisateur existant, sur l'Accueil).
 * @param {'onboarding'|'update'|'skipped'} by
 */
export function markMet(by, { name, now = new Date() } = {}) {
  const patch = { metAt: now.toISOString(), metBy: by }
  const clean = cleanName(name)
  if (clean) patch.name = clean
  const next = saveCompanion(patch)
  notify()
  return next
}

/** Temps 2 de l'onboarding : « Oui » à la montre → Pilou enfile la sienne (brief § 7.2, SPEC comprendre § 4). */
export function setWatch(on) {
  return saveCompanion({ watch: !!on })
}

/** Pilou porte sa montre : oui par défaut (décision du 14/11 « il garde la montre ») ; seul « Non » à l'onboarding l'enlève. */
export const wearsWatch = (s = loadCompanion()) => s.watch !== false

/**
 * La cérémonie du jour 7 est-elle due ? Quand le premier score du bien-être existe (7 jours notés) et qu'elle n'a
 * jamais eu lieu. Pour un utilisateur existant dont le score existait déjà à la rencontre, elle est notée « déjà
 * passée » (ceremonyAlreadyPast) : on ne fête pas une semaine qu'il a vécue avant Pilou.
 * @param {boolean} scoreReady le bien-être a son premier score (Objectifs, état 'score' ou 'quiet')
 */
export function ceremonyDue(scoreReady, s = loadCompanion()) {
  return !!scoreReady && !!s.metAt && !s.ceremony7At
}

export function markCeremony(by = 'shown', now = new Date()) {
  const next = saveCompanion({ ceremony7At: now.toISOString(), ceremony7By: by })
  notify()
  return next
}

/**
 * « Bon retour » (SPEC journée § 10) : à la première ouverture de Ma journée après au moins un jour entier sans
 * ouverture. Rien d'autre n'est compté : aucune série, aucun jour manqué. Rend le nombre de jours d'absence (0 si
 * c'est la même journée ou la veille) et note le jour d'aujourd'hui.
 * @param {string} todayKey jour local AAAA-MM-JJ
 */
export function openDay(todayKey, s = loadCompanion(), field = 'lastDay') {
  const last = s[field]
  if (last !== todayKey) saveCompanion({ [field]: todayKey })
  if (!last || last >= todayKey) return 0
  const gap = Math.round((Date.parse(`${todayKey}T12:00:00Z`) - Date.parse(`${last}T12:00:00Z`)) / 86_400_000)
  return gap > 1 ? gap - 1 : 0
}

/* ───────────── Sauvegarde : le nom et les moments déjà vécus suivent l'export et l'import JSON ───────────── */

/** Bloc `companion` de l'export (rien s'il n'y a ni nom ni rencontre). */
export function companionBackup(s = loadCompanion()) {
  const out = {}
  const name = cleanName(s.name)
  if (name) out.name = name
  if (s.metAt) out.metAt = s.metAt
  if (s.ceremony7At) out.ceremony7At = s.ceremony7At
  if (typeof s.watch === 'boolean') out.watch = s.watch
  return Object.keys(out).length ? out : null
}

const isIso = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v))

/** Bloc `companion` d'un fichier → forme sûre, ou null (ancien fichier, valeur illisible). */
export function sanitizeCompanionBackup(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out = {}
  const name = cleanName(raw.name)
  if (name) out.name = name
  if (isIso(raw.metAt)) out.metAt = raw.metAt
  if (isIso(raw.ceremony7At)) out.ceremony7At = raw.ceremony7At
  if (typeof raw.watch === 'boolean') out.watch = raw.watch
  return Object.keys(out).length ? out : null
}

/**
 * Restaure le bloc d'une sauvegarde. Ce qui est déjà vécu sur ce téléphone prime : un nom choisi ici n'est pas
 * remplacé ; une rencontre ou une cérémonie du fichier évite seulement de les rejouer.
 */
export function restoreCompanion(backup) {
  const b = sanitizeCompanionBackup(backup)
  if (!b) return false
  const s = loadCompanion()
  const patch = {}
  if (b.name && !cleanName(s.name)) patch.name = b.name
  if (b.metAt && !s.metAt) Object.assign(patch, { metAt: b.metAt, metBy: 'backup' })
  if (b.ceremony7At && !s.ceremony7At) Object.assign(patch, { ceremony7At: b.ceremony7At, ceremony7By: 'backup' })
  if (typeof b.watch === 'boolean' && typeof s.watch !== 'boolean') patch.watch = b.watch
  if (!Object.keys(patch).length) return false
  saveCompanion(patch)
  notify()
  return true
}

/** Prévient les écrans ouverts (nom changé, rencontre faite). */
export const COMPANION_EVENT = 'halcya-companion-updated'
function notify() {
  try {
    globalThis.window?.dispatchEvent(new CustomEvent(COMPANION_EVENT))
  } catch {
    // pas de fenêtre (tests node)
  }
}

/** Nom du compagnon pour les autres lots (CONTRAT.md § 4, `pilou:named` : « lu ensuite par `pilouName()` du lot VIE »). */
export const pilouName = () => companionName()
