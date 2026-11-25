/**
 * Bus du compagnon : un petit émetteur d'événements, sans dépendance, partagé par les lots de la refonte « Compagnon ».
 * Le contrat (noms des événements, charges utiles, qui émet, qui écoute) est dans `CONTRAT.md`, à côté. Ce fichier est
 * tenu par le lot SCÈNE : les autres lots le recopient à l'identique et ne le modifient jamais.
 *
 * - `emit` est synchrone ; une erreur dans un écouteur ne casse ni l'émetteur ni les autres écouteurs.
 * - Chaque événement garde sa dernière charge utile : `last(type)` la relit, et `on(type, fn, { replay: true })`
 *   la rejoue tout de suite (pour l'humeur, la météo, la fiche de traits… qu'un composant monté tard doit connaître).
 * - `'*'` écoute tout : `fn(payload, type)`.
 */

/** Noms des événements (voir CONTRAT.md § 4). Ajouts seulement, jamais de renommage. */
export const EVENTS = Object.freeze({
  // Accueil et bulles (lot BULLES)
  BUBBLE_PRESSED: 'bubble:pressed',
  BUBBLE_POPPED: 'bubble:popped',
  FLOWER_GROW: 'flower:grow',
  FLOWERS_SET: 'flowers:set',
  MOOD_CHANGED: 'mood:changed',
  GIFT_OPENED: 'gift:opened',
  GIFT_PLACED: 'gift:placed',
  LANTERN_LIT: 'gift:lantern-lit',
  // Saisies (lot VIE ; Ma journée)
  MEAL_LOGGED: 'meal:logged',
  WELLBEING_NOTED: 'wellbeing:noted',
  HABIT_NOTED: 'habit:noted',
  GUT_NOTED: 'gut:noted',
  ENTRY_UNDONE: 'entry:undone',
  ACTIVITY_START: 'activity:start',
  ACTIVITY_END: 'activity:end',
  DAY_DONE: 'day:done',
  MILESTONE: 'milestone',
  APP_OPENED: 'app:opened',
  PILOU_NAMED: 'pilou:named',
  // Pilou (lot PILOU, demandé par tous)
  EXPRESSION_REQUEST: 'expression:request',
  LOOK_REQUEST: 'look:request',
  PILOU_TOUCHED: 'pilou:touched',
  // Monde (lot MONDE, relayé par la scène)
  TIME_PHASE: 'time:phase',
  WEATHER_CHANGED: 'weather:changed',
  WORLD_NEWS: 'world:news',
  // Double numérique (lots STUDIO et PHOTO)
  TRAITS_CHANGED: 'traits:changed',
  // Scène (lot SCÈNE)
  SCENE_READY: 'scene:ready',
  SCENE_QUALITY: 'scene:quality',
  SCENE_PAUSED: 'scene:paused',
  SCENE_RESUMED: 'scene:resumed',
  REDUCED_MOTION_CHANGED: 'reduced-motion:changed',
})

/** Les 12 expressions de la planche, plus la séquence du réveil (CONTRAT.md § 3). Jamais triste ni déçu. */
export const EXPRESSIONS = Object.freeze([
  'tranquille', 'content', 'rayonnant', 'curieux', 'surpris', 'concentre',
  'absorbe', 'rassasie', 'endormi', 'fier', 'reconfortant', 'salut',
])
/** Séquences jouées une fois (les autres expressions sont des états qui durent). */
export const SEQUENCES = Object.freeze(['surpris', 'reveil', 'fier', 'reconfortant'])

/** Thèmes de couleur (brief § 6) : menthe bien-être, pêche digestion, lilas activité, nuit sommeil, rose corps, gris contexte, miel habitudes. */
export const THEMES = Object.freeze(['menthe', 'peche', 'lilas', 'nuit', 'rose', 'gris', 'miel'])

export function createBus() {
  const listeners = new Map()
  const lastPayloads = new Map()

  function off(type, fn) {
    const set = listeners.get(type)
    if (set) set.delete(fn)
  }

  function on(type, fn, { replay = false } = {}) {
    if (typeof fn !== 'function') throw new TypeError('bus.on : écouteur manquant')
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type).add(fn)
    if (replay && type !== '*' && lastPayloads.has(type)) call(fn, lastPayloads.get(type), type)
    return () => off(type, fn)
  }

  function once(type, fn) {
    const stop = on(type, (payload, t) => {
      stop()
      fn(payload, t)
    })
    return stop
  }

  function call(fn, payload, type) {
    try {
      fn(payload, type)
    } catch (err) {
      console.error(`bus : écouteur de « ${type} » en erreur`, err)
    }
  }

  function emit(type, payload = {}) {
    if (typeof type !== 'string' || !type || type === '*') throw new TypeError('bus.emit : type invalide')
    lastPayloads.set(type, payload)
    for (const fn of [...(listeners.get(type) || [])]) call(fn, payload, type)
    for (const fn of [...(listeners.get('*') || [])]) call(fn, payload, type)
  }

  function last(type) {
    return lastPayloads.get(type)
  }

  function clear() {
    listeners.clear()
    lastPayloads.clear()
  }

  function count(type) {
    return listeners.get(type)?.size ?? 0
  }

  return { on, once, off, emit, last, clear, count }
}

/** Le bus de l'app (un seul). Les tests créent le leur avec `createBus()` ou appellent `bus.clear()`. */
export const bus = createBus()

export default bus
