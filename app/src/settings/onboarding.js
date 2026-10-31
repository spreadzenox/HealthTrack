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

export const GOALS = [
  { id: 'gut', label: 'Mon ventre', hint: 'SII, ballonnements, inconforts digestifs' },
  { id: 'energy', label: 'Mon énergie et mon sommeil', hint: 'fatigue, nuits, récupération' },
  { id: 'all', label: 'Tout comprendre de mes données', hint: 'toutes mes montres, tout mesurer' },
]

export const TRACKS = [
  { id: 'gut', label: 'Mon ventre', hint: 'calme, gêne ou douleur, en un geste' },
  { id: 'meals', label: 'Mes repas', hint: 'une photo ou quelques mots' },
  { id: 'sleep', label: 'Mon sommeil', hint: 'durée et régularité des nuits' },
  { id: 'wellbeing', label: 'Mon énergie et mon bien-être', hint: 'estimé ou noté par vous' },
  { id: 'activity', label: 'Mon activité', hint: 'pas, cœur, entraînements' },
]

const DEFAULT_TRACKS = {
  gut: ['gut', 'meals', 'sleep', 'wellbeing'],
  energy: ['sleep', 'wellbeing', 'activity'],
  all: TRACKS.map((t) => t.id),
}

const EMPTY = { done: false, goal: null, tracks: null, watch: null, step: 0, maxStep: 0 }

/**
 * Ce que l'objectif change sur la carte des pistes (I155) : avec « Mon énergie et mon sommeil », elle parle
 * sommeil → bien-être ; sinon, repas → ventre. La carte ventre suit gutCardMode. Réglable ensuite dans Paramètres
 * (« Ce qui vous amène »).
 * @returns {'gut'|'energy'}
 */
export function homeFocus(goal = loadOnboarding().goal) {
  return goal === 'energy' ? 'energy' : 'gut'
}

/**
 * Carte « Votre ventre » de l'Accueil (retour du propriétaire du 24/10, POL-4) : avec « Mon ventre », toujours ;
 * avec un autre objectif, jamais. Sans objectif : installation d'avant l'onboarding ('existing') → seulement pour
 * qui a noté son ventre ces 7 derniers jours ; onboarding passé sans choisir → affichée (le ventre est la porte
 * d'entrée de l'app). Masquer n'efface aucune note ; le réglage se change dans Paramètres.
 * @returns {'show'|'used'|'hide'}
 */
export function gutCardMode(s = loadOnboarding()) {
  if (s.goal === 'gut') return 'show'
  if (s.goal) return 'hide'
  return s.endedBy === 'existing' ? 'used' : 'show'
}

/** Suivis cochés d'avance pour un objectif (tous si l'objectif est inconnu). */
export function defaultTracks(goal) {
  return [...(DEFAULT_TRACKS[goal] || DEFAULT_TRACKS.all)]
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
