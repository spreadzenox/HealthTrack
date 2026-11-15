/**
 * Onboarding du premier lancement (jalon 4, spécification journal/IDEES.md I154) – stocké dans localStorage.
 *
 * Jamais montré à un utilisateur existant : à la première ouverture après la mise à jour, s'il y a déjà des
 * entrées en base, l'onboarding est noté « fait » (endedBy: 'existing') sans s'afficher. `step` permet de
 * reprendre là où la personne s'est arrêtée ; `maxStep` (écran le plus loin atteint) sert au diagnostic (I156),
 * rien n'est envoyé. L'objectif et les suivis ne cachent ni n'effacent aucune donnée.
 */
import { countAllEntries, listEntries } from '../storage/localHealthStorage'

const KEY = 'healthtrack_onboarding'

/**
 * Objectifs de l'accueil (ACC-3, 08/11) : choix multiple, une option par persona. Stockés dans `goals` (tableau).
 * L'ancien `goal` (un seul choix : gut, energy, all) reste lu : voir legacyGoals.
 * Refonte « Compagnon », étape 1 (15/11) : « Mon cycle » et « Mon sport et ma récupération » ne sont plus proposés
 * (brief § 3.1). Qui les avait cochés les garde enregistrés (RETIRED_GOALS) et ne perd aucune donnée.
 */
export const GOALS = [
  { id: 'gut', label: 'Ma digestion', hint: 'ballonnements, SII, inconforts' },
  { id: 'stress', label: 'Mon stress et mon sommeil', hint: 'fatigue, nuits, charge mentale' },
  { id: 'care', label: 'Prendre soin de moi', hint: 'alimentation, poids, forme' },
  { id: 'all', label: 'Tout mesurer', hint: 'toutes mes montres et mesures au même endroit' },
]
/** Objectifs retirés du choix : encore lus dans les réglages enregistrés, jamais proposés. */
export const RETIRED_GOALS = ['cycle', 'sport']

/**
 * Refonte « Compagnon », étape 5a (brief § 3.2) : le bien-être pour tout le monde, plus un objectif facultatif, le
 * confort digestif. C'est la forme enregistrée après migrateGoals ; GOALS reste la liste de l'ancien accueil
 * jusqu'à l'étape 5b.
 */
export const OBJECTIVES = [
  { id: 'wellbeing', label: 'Bien-être', hint: 'Comprendre ce qui influence comment vous vous sentez.', locked: true },
  { id: 'gut', label: 'Confort digestif', hint: 'Pour une digestion sensible : repérer ce qui la soulage.' },
]
/** Forme des objectifs enregistrés : 2 = `goals` ne contient plus que wellbeing, gut et l'ancien marqueur cycle. */
export const GOALS_VERSION = 2
const GOAL_IDS = new Set([...OBJECTIVES.map((g) => g.id), ...GOALS.map((g) => g.id), ...RETIRED_GOALS])

/** Ancien accueil (un seul objectif) → tableau : gut → [gut], energy → [stress], all → [all]. */
export function legacyGoals(goal) {
  return { gut: ['gut'], energy: ['stress'], all: ['all'] }[goal] ?? []
}

/** Objectifs cochés, quel que soit le format enregistré (nouveau `goals` ou ancien `goal`). */
export function goalsOf(s = loadOnboarding()) {
  if (Array.isArray(s?.goals)) return s.goals.filter((g) => GOAL_IDS.has(g))
  return legacyGoals(s?.goal)
}

/**
 * L'objectif digestion : « Ma digestion », ou l'ancien « Mon cycle » (ventre et douleurs) pour qui l'avait coché
 * avant son retrait. Sans lui, l'app ne demande jamais de noter son ventre (brief § 3.2). Après la migration de
 * l'étape 5a (`wellbeing` présent), « cycle » n'est plus qu'un marqueur d'affichage du cycle : seul `gut` compte.
 */
export const wantsGut = (goals) =>
  goals.includes('gut') || (goals.includes('cycle') && !goals.includes('wellbeing'))

/**
 * Objectifs de la refonte déduits des anciens choix (étape 5a). Fonction pure, sans effet si c'est déjà fait.
 * - « Ma digestion » ou l'ancien « Mon cycle » : bien-être et confort digestif ;
 * - d'autres objectifs seulement : bien-être (le ventre était déjà masqué) ;
 * - aucun objectif : confort digestif seulement si le ventre a été noté ces 7 derniers jours (`gutRecent`), ce
 *   que l'app montrait déjà.
 * L'ancien « Mon cycle » reste dans `goals` comme marqueur : le cycle continue de s'afficher à qui l'avait coché
 * (cycleVisible). Les choix d'avant sont gardés dans `goalsBefore`. Aucune donnée n'est touchée.
 * @param {object} s réglages de l'accueil
 * @param {boolean} [gutRecent] une note du ventre de moins de 7 jours existe
 */
export function migrateGoals(s, gutRecent = false) {
  if (s?.goalsVersion === GOALS_VERSION) return s
  const before = goalsOf(s)
  const gut = wantsGut(before) || (!before.length && gutRecent)
  const goals = ['wellbeing', gut && 'gut', before.includes('cycle') && 'cycle'].filter(Boolean)
  return { ...s, goals, goalsBefore: before, goalsVersion: GOALS_VERSION }
}

/**
 * Temps 1 de l'accueil (étape 5b) : le bien-être toujours, le confort digestif coché ou non. Les choix d'un ancien
 * accueil commencé sont gardés une fois dans `goalsBefore`, comme à la migration.
 * @param {object} s réglages de l'accueil
 * @param {boolean} gut confort digestif coché
 */
export function chooseObjectives(s, gut) {
  const m = migrateGoals(s)
  const goals = ['wellbeing', gut && 'gut', m.goals.includes('cycle') && 'cycle'].filter(Boolean)
  return { goals, goalsBefore: m.goalsBefore, goalsVersion: GOALS_VERSION }
}

/**
 * Anciens suivis (écran « Que voulez-vous suivre ? », retiré le 08/11) : déduits des objectifs pour les anciens
 * fichiers. Le champ `tracks` n'est lu nulle part dans l'app.
 */
export const TRACKS = [
  { id: 'gut', label: 'Ma digestion' },
  { id: 'meals', label: 'Mes repas' },
  { id: 'sleep', label: 'Mon sommeil' },
  { id: 'wellbeing', label: 'Mon énergie et mon bien-être' },
  { id: 'activity', label: 'Mon activité' },
]

const TRACKS_BY_GOAL = {
  gut: ['gut', 'meals', 'sleep', 'wellbeing'],
  cycle: ['gut', 'meals', 'sleep', 'wellbeing'],
  stress: ['sleep', 'wellbeing', 'activity'],
  sport: ['sleep', 'wellbeing', 'activity'],
  care: ['meals', 'sleep', 'wellbeing', 'activity'],
}

/** Suivis déduits des objectifs (tous si rien n'est coché ou avec « Tout mesurer »). Accepte aussi un ancien id. */
export function defaultTracks(goals) {
  const list = Array.isArray(goals) ? goals : legacyGoals(goals)
  if (!list.length || list.includes('all')) return TRACKS.map((t) => t.id)
  const set = new Set(list.flatMap((g) => TRACKS_BY_GOAL[g] || []))
  return TRACKS.map((t) => t.id).filter((id) => set.has(id))
}

/**
 * Ce que l'on note à la main quand aucune source n'est reliée (« Votre téléphone suffit », POLISH-SIM-51) : la liste
 * suit les objectifs (poids avec « Prendre soin de moi », règles avec l'ancien « Mon cycle », digestion seulement
 * avec l'objectif digestion).
 */
export function handNotes(goals = []) {
  return [
    'bien-être',
    wantsGut(goals) && 'digestion',
    goals.includes('cycle') && 'règles',
    'repas en photo',
    goals.includes('care') && 'poids',
  ].filter(Boolean)
}

/**
 * Version du parcours : 3 = accueil en 4 temps de la refonte « Compagnon » (étape 5b : ouverture, objectifs, montre,
 * ce qui est suivi seul, ce qu'on note ; puis visage et Gold). 2 = accueil du 08/11.
 */
export const FLOW_VERSION = 3

const EMPTY = { done: false, goal: null, goals: null, tracks: null, watch: null, step: 0, maxStep: 0 }

/**
 * Ce que les objectifs changent sur la carte des pistes (I155) : stress et sommeil sans ventre → sommeil → bien-être ;
 * sinon, repas → ventre.
 * @returns {'gut'|'energy'}
 */
export function homeFocus(goals = goalsOf()) {
  const list = Array.isArray(goals) ? goals : legacyGoals(goals)
  return list.includes('stress') && !wantsGut(list) ? 'energy' : 'gut'
}

/**
 * Le ventre dans l'app (POL-4, ACC-3, refonte étape 1) : avec l'objectif digestion, toujours ; avec d'autres
 * objectifs seulement, jamais. Sans aucun objectif (installation d'avant l'onboarding, ou accueil passé sans
 * choisir) : 'used', l'app ne demande rien et ne montre le ventre qu'à qui l'a noté ces 7 derniers jours
 * (gutAsked). Masquer n'efface rien.
 * @returns {'show'|'used'|'hide'}
 */
export function gutCardMode(s = loadOnboarding()) {
  const goals = goalsOf(s)
  if (wantsGut(goals)) return 'show'
  return goals.length ? 'hide' : 'used'
}

/** Notes du ventre regardées pour 'used' : les 7 derniers jours. */
export const GUT_USED_MS = 7 * 86_400_000

/**
 * Faut-il proposer de noter le ventre (bouton « Digestion », photo des selles, bloc digestif d'Aujourd'hui) ?
 * Oui avec l'objectif digestion ; sans aucun objectif, seulement si une note du ventre a moins de 7 jours.
 * @param {'show'|'used'|'hide'} mode
 * @param {object[]} entries entrées du journal (toutes sortes)
 */
export function gutAsked(mode, entries = [], now = Date.now()) {
  if (mode !== 'used') return mode === 'show'
  return entries.some((e) => e?.type === 'gut' && now - Date.parse(e.at) < GUT_USED_MS)
}

/**
 * Migration des objectifs au démarrage (étape 5a), une seule fois, quand l'accueil est fini. Sans objectif
 * enregistré, lit les notes du ventre ; si la base ne se lit pas, rien n'est figé : on réessaiera.
 */
export async function ensureGoalsMigrated({ list = listEntries, now = Date.now() } = {}) {
  const s = loadOnboarding()
  if (!s.done || s.goalsVersion === GOALS_VERSION) return s
  let gutRecent = false
  if (!goalsOf(s).length) {
    try {
      gutRecent = gutAsked('used', await list({ type: 'gut', limit: 50 }), now)
    } catch {
      return s
    }
  }
  return saveOnboarding(migrateGoals(loadOnboarding(), gutRecent))
}

export function loadOnboarding() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    return raw && typeof raw === 'object' ? { ...EMPTY, ...raw } : { ...EMPTY }
  } catch {
    return { ...EMPTY }
  }
}

export function saveOnboarding(patch) {
  const prev = loadOnboarding()
  const next = { ...prev, ...patch }
  next.maxStep = Math.max(prev.maxStep || 0, next.step || 0)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
  return next
}

/**
 * Note qu'un écran a été affiché (I156) : `seen` (identifiants des écrans, dans l'ordre de première visite),
 * `lastScreen` (le dernier montré : celui où l'on s'est arrêté si l'onboarding n'est pas fini) et `screens`
 * (nombre d'écrans du parcours, qui dépend des choix). Aucune réponse libre, rien n'est envoyé.
 */
export function markScreenSeen(screen, screens) {
  const prev = loadOnboarding()
  const seen = Array.isArray(prev.seen) ? prev.seen : []
  return saveOnboarding({ seen: seen.includes(screen) ? seen : [...seen, screen], lastScreen: screen, screens })
}

/**
 * Bloc « onboarding » du diagnostic exportable (I156) : où la personne en est, sans donnée de santé. Permet de
 * repérer, avec 12 à 15 testeurs, l'écran où l'on décroche.
 */
export function onboardingDiagnostic(s = loadOnboarding()) {
  return {
    done: !!s.done,
    endedBy: s.endedBy ?? null,
    doneAt: s.doneAt ?? null,
    goal: s.goal ?? null,
    goals: goalsOf(s),
    goalsBefore: Array.isArray(s.goalsBefore) ? s.goalsBefore : null,
    huawei: s.huawei ?? null,
    weather: s.weather ?? null,
    screen: s.screen ?? null,
    watch: s.watch ?? null,
    health: s.health ?? null,
    face: s.face ?? null,
    unlockLater: s.unlockLater === true,
    unlockReminderDone: !!s.unlockReminderDone,
    step: s.step || 0,
    maxStep: s.maxStep || 0,
    screens: s.screens ?? null,
    lastScreen: s.lastScreen ?? null,
    seen: Array.isArray(s.seen) ? s.seen : [],
  }
}

/** Délai avant le rappel de la lecture au déverrouillage (POL-PLAY-84) : pas le lendemain de « Plus tard ». */
export const UNLOCK_REMINDER_DELAY_MS = 2 * 86_400_000

/**
 * Rappel discret de la lecture au déverrouillage dans la carte Bien-être (POL-PLAY-84, demande du propriétaire du
 * 31/10) : seulement pour qui a touché « Plus tard » sur l'écran qui la met en avant (`unlockLater`, jamais après un
 * « Pas maintenant » dans la divulgation), au moins 2 jours après la fin de l'onboarding, tant qu'elle est coupée et
 * existe dans cette version (`unlock` : describeFaceUnlock), et une seule fois : fermé ou suivi, il ne revient plus.
 */
export function shouldShowUnlockReminder(s = loadOnboarding(), unlock = null, now = new Date()) {
  if (s.unlockLater !== true || s.unlockReminderDone) return false
  if (unlock?.state !== 'off' || !s.doneAt) return false
  const since = now.getTime() - new Date(s.doneAt).getTime()
  return Number.isFinite(since) && since >= UNLOCK_REMINDER_DELAY_MS
}

/** Le rappel ne revient plus (fermé, ou « Voir dans Sources » touché). */
export function dismissUnlockReminder() {
  return saveOnboarding({ unlockReminderDone: true })
}

/** @param {'completed'|'skipped'|'existing'} endedBy */
export function finishOnboarding(endedBy = 'completed') {
  const end = { done: true, endedBy, doneAt: new Date().toISOString() }
  // utilisateur existant : ses objectifs dépendent de ses notes, ensureGoalsMigrated s'en charge
  if (endedBy === 'existing') return saveOnboarding(end)
  return saveOnboarding(migrateGoals({ ...loadOnboarding(), ...end }))
}

/**
 * Faut-il ouvrir l'onboarding ? Oui seulement s'il n'a jamais été fait ET que la base est vide. Si la base ne
 * peut pas être lue, non : mieux vaut ne pas le montrer que le montrer à quelqu'un qui a déjà des données.
 * Un onboarding déjà commencé (au moins un écran passé) reprend même si la base s'est remplie entre-temps : ce
 * sont l'import Health Connect et le premier geste de l'onboarding lui-même.
 */
export async function needsOnboarding({ countEntries = countAllEntries, list, now } = {}) {
  const s = loadOnboarding()
  if (s.done) return false
  if (s.maxStep > 0) return true
  let count
  try {
    count = await countEntries()
  } catch {
    return false
  }
  if (count > 0) {
    finishOnboarding('existing')
    ensureGoalsMigrated({ list, now }).catch(() => {})
    return false
  }
  return true
}
