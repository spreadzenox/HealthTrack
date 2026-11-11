/**
 * Onboarding du premier lancement (jalon 4, spécification journal/IDEES.md I154) – stocké dans localStorage.
 *
 * Jamais montré à un utilisateur existant : à la première ouverture après la mise à jour, s'il y a déjà des
 * entrées en base, l'onboarding est noté « fait » (endedBy: 'existing') sans s'afficher. `step` permet de
 * reprendre là où la personne s'est arrêtée ; `maxStep` (écran le plus loin atteint) sert au diagnostic (I156),
 * rien n'est envoyé. L'objectif et les suivis ne cachent ni n'effacent aucune donnée.
 */
import { countAllEntries } from '../storage/localHealthStorage'

const KEY = 'healthtrack_onboarding'

/**
 * Objectifs de l'accueil (ACC-3, 08/11) : choix multiple, une option par persona. Stockés dans `goals` (tableau).
 * L'ancien `goal` (un seul choix : gut, energy, all) reste lu : voir legacyGoals.
 */
export const GOALS = [
  { id: 'gut', label: 'Ma digestion', hint: 'ballonnements, SII, inconforts' },
  { id: 'cycle', label: 'Mon cycle', hint: 'règles, douleurs, endométriose' },
  { id: 'stress', label: 'Mon stress et mon sommeil', hint: 'fatigue, nuits, charge mentale' },
  { id: 'sport', label: 'Mon sport et ma récupération', hint: 'entraînements, cœur, repos' },
  { id: 'care', label: 'Prendre soin de moi', hint: 'alimentation, poids, forme' },
  { id: 'all', label: 'Tout mesurer', hint: 'toutes mes montres et mesures au même endroit' },
]
const GOAL_IDS = new Set(GOALS.map((g) => g.id))

/** Ancien accueil (un seul objectif) → tableau : gut → [gut], energy → [stress], all → [all]. */
export function legacyGoals(goal) {
  return { gut: ['gut'], energy: ['stress'], all: ['all'] }[goal] ?? []
}

/** Objectifs cochés, quel que soit le format enregistré (nouveau `goals` ou ancien `goal`). */
export function goalsOf(s = loadOnboarding()) {
  if (Array.isArray(s?.goals)) return s.goals.filter((g) => GOAL_IDS.has(g))
  return legacyGoals(s?.goal)
}

/** Le ventre est mis en avant avec « Ma digestion » ou « Mon cycle » (ventre et douleurs). */
export const wantsGut = (goals) => goals.includes('gut') || goals.includes('cycle')

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
 * suit les objectifs (poids avec « Prendre soin de moi », règles avec « Mon cycle », digestion avec le ventre).
 */
export function handNotes(goals = []) {
  const broad = !goals.length || goals.includes('all')
  return [
    'bien-être',
    (broad || wantsGut(goals)) && 'digestion',
    goals.includes('cycle') && 'règles',
    'repas en photo',
    goals.includes('care') && 'poids',
  ].filter(Boolean)
}

/** Version du parcours : 2 = nouvel accueil du 08/11 (tuto, objectifs, sources, trouvé, visage, première note, Gold). */
export const FLOW_VERSION = 2

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
 * Carte « Votre ventre » de l'Accueil (POL-4, ACC-3) : avec « Ma digestion » ou « Mon cycle », toujours ; avec
 * d'autres objectifs seulement, jamais. Sans objectif : installation d'avant l'onboarding ('existing') → seulement
 * pour qui a noté son ventre ces 7 derniers jours ; accueil passé sans choisir → affichée. Masquer n'efface rien.
 * @returns {'show'|'used'|'hide'}
 */
export function gutCardMode(s = loadOnboarding()) {
  const goals = goalsOf(s)
  if (wantsGut(goals)) return 'show'
  if (goals.length) return 'hide'
  return s.endedBy === 'existing' ? 'used' : 'show'
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
  return saveOnboarding({ done: true, endedBy, doneAt: new Date().toISOString() })
}

/**
 * Faut-il ouvrir l'onboarding ? Oui seulement s'il n'a jamais été fait ET que la base est vide. Si la base ne
 * peut pas être lue, non : mieux vaut ne pas le montrer que le montrer à quelqu'un qui a déjà des données.
 * Un onboarding déjà commencé (au moins un écran passé) reprend même si la base s'est remplie entre-temps : ce
 * sont l'import Health Connect et le premier geste de l'onboarding lui-même.
 */
export async function needsOnboarding({ countEntries = countAllEntries } = {}) {
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
    return false
  }
  return true
}
