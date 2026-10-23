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

/** @param {'completed'|'skipped'|'existing'} endedBy */
export function finishOnboarding(endedBy = 'completed') {
  return saveOnboarding({ done: true, endedBy, doneAt: new Date().toISOString() })
}

/**
 * Faut-il ouvrir l'onboarding ? Oui seulement s'il n'a jamais été fait ET que la base est vide. Si la base ne
 * peut pas être lue, non : mieux vaut ne pas le montrer que le montrer à quelqu'un qui a déjà des données.
 */
export async function needsOnboarding({ countEntries = countAllEntries } = {}) {
  if (loadOnboarding().done) return false
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
