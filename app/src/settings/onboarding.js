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
 * Ce que l'objectif change sur l'Accueil (I155) : avec « Mon énergie et mon sommeil », la carte ventre descend en
 * bas et la carte des pistes parle sommeil → bien-être ; sinon, l'ordre de la maquette (ventre d'abord). Rien n'est
 * masqué. Réglable ensuite dans Paramètres (« Ce qui vous amène »).
 * @returns {'gut'|'energy'}
 */
export function homeFocus(goal = loadOnboarding().goal) {
  return goal === 'energy' ? 'energy' : 'gut'
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
    step: s.step || 0,
    maxStep: s.maxStep || 0,
    screens: s.screens ?? null,
    lastScreen: s.lastScreen ?? null,
    seen: Array.isArray(s.seen) ? s.seen : [],
  }
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
