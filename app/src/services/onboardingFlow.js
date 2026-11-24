/**
 * Nouvel accueil (ACC-1 à ACC-9, 08/11) : ce qui ne dessine rien (écrans, import, appareils trouvés, textes partagés),
 * hors de pages/Onboarding.jsx.
 */
import { Capacitor } from '@capacitor/core'
import { FEATURES } from '../config/distribution'
import { getConnector } from '../connectors/connectorRegistry'
import { isFaceSenseAvailable } from './faceSense'
import { runFirstImport } from './firstImport'
import { matchHealthApp } from '../devices/healthApps'
import { loadCompanion } from '../companion/life/companionState'

/** iPhone : la carte principale dit « Santé » (Apple), Android « Health Connect ». */
/**
 * Connecteur Health Connect de l'accueil. L'outil de captures (`npm run visual -- --onboarding=sources`) en simule un
 * dans le navigateur (`window.__healthtrackFakeHealthConnect`), qui n'importe rien.
 */
export function healthConnector() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeHealthConnect) {
    return {
      id: 'health_connect',
      availabilityDetails: async () => ({ available: true }),
      checkPermissions: async () => 'not_asked',
      requestPermissions: async () => 'granted',
      sync: async () => ({ synced: 0, skipped: 0, errors: [] }),
    }
  }
  return getConnector('health_connect')
}

export const healthStoreName = () => (Capacitor?.getPlatform?.() === 'ios' ? 'Santé' : 'Health Connect')

/**
 * Écrans de l'accueil en 4 temps (refonte « Compagnon », étape 5b, brief § 3.4) : une carte d'ouverture, les 4 temps
 * (objectifs, montre, ce que Halcya suit seule, ce qu'on note), puis le visage (si le téléphone sait le lire) et
 * Gold (variante play). Aucun écran ne dépend d'un choix : le compteur ne bouge pas.
 */
export const TEMPS = ['goal', 'watch', 'auto', 'notes']
export function stepsFor() {
  // Lot VIE (étape 12) : la rencontre de Pilou et son nom, juste après l'ouverture, une seule fois
  const steps = ['intro', ...(loadCompanion().metAt ? [] : ['meet']), ...TEMPS]
  if (isFaceSenseAvailable()) steps.push('face')
  if (FEATURES.billing) steps.push('premium')
  return steps
}

/**
 * Temps 3 : ce que Halcya suit sans rien demander (brief § 3.3 ; le « stress » de la montre n'y est pas). Sans
 * montre, les pas, le temps d'écran et la météo viennent du téléphone : le reste est annoncé pour plus tard.
 * POLISH-SIM-105 : `maybe` = beaucoup de montres ne l'envoient pas (PERSONAS.md), dit « selon votre montre » ;
 * `phone` = seulement s'il a été allumé à l'écran d'avant, sinon dit « activable ». POLISH-SIM-156 : le cœur aussi (bracelets
 * qui écrivent dans Santé ou Health Connect : FC partielle ou absente).
 */
export const AUTO_TILES = [
  { id: 'sleep', label: 'Sommeil', tone: 'night', watch: true },
  { id: 'steps', label: 'Pas', tone: 'lilac', watch: true, phoneLabel: 'Pas (votre téléphone)' },
  { id: 'workouts', label: 'Séances de sport', tone: 'lilac', watch: true },
  { id: 'heart', label: 'Cœur', tone: 'rose', watch: true, maybe: true },
  { id: 'hrv', label: 'Variabilité cardiaque', tone: 'rose', watch: true, maybe: true },
  { id: 'breath', label: 'Respiration', tone: 'rose', watch: true, maybe: true },
  { id: 'skin', label: 'Température de la peau', tone: 'rose', watch: true, maybe: true },
  { id: 'screen', label: 'Temps d’écran', tone: 'stone', phone: true },
  { id: 'weather', label: 'Météo', tone: 'stone', phone: true },
]

/**
 * Ce que le temps 3 montre : `tiles` sûres, `maybe` (selon la montre), `off` (activable dans Sources), `later`
 * (avec une montre). `on` dit pour chaque source du téléphone si elle est allumée, `available` si elle existe ici.
 * POLISH-SIM-124 : sans montre, le téléphone compte les pas (Health Connect ou Santé, `health` du temps 2) : suivis
 * si l'accès est donné, activables sinon, absents si le téléphone n'a ni l'un ni l'autre ; jamais « avec une montre ».
 */
export function autoTiles({ watch, health = null, on = {}, available = {} }) {
  const tiles = []
  const maybe = []
  const off = []
  const later = []
  for (const t of AUTO_TILES) {
    if (t.phoneLabel && !watch) {
      const phoneTile = { ...t, label: t.phoneLabel }
      if (health === 'granted') tiles.push(phoneTile)
      else if (health !== 'unavailable') off.push(phoneTile)
    } else if (t.phone) {
      if (on[t.id]) tiles.push(t)
      else if (available[t.id] !== false) off.push(t)
    } else if (!watch) later.push(t)
    else if (t.maybe) maybe.push(t)
    else tiles.push(t)
  }
  const words = (list) => list.map((t) => t.label.toLowerCase())
  return { tiles, maybe: words(maybe), off: words(off), later: words(later) }
}

/** Temps 4 : ce qui se note à la main chaque jour, hors habitudes (la digestion seulement avec son objectif). */
export function dailyNotes(gut) {
  return [
    { id: 'meals', label: 'Repas', detail: 'en photo, 3 par jour', tone: 'peach' },
    { id: 'wellbeing', label: 'Bien-être', detail: 'une note rapide', tone: 'mint' },
    gut && { id: 'gut', label: 'Digestion', detail: 'le soir', tone: 'peach' },
  ].filter(Boolean)
}

/**
 * Résumé du temps 4 : « Repas, bien-être et 1 habitude · environ 1 minute ». Les repas valent 3 gestes : un total
 * « N choses par jour » ne collait jamais (POLISH-SIM-132), on nomme donc ce qui se note.
 */
export function dailySummary(notes, habitCount) {
  const words = notes.map((n, i) => (i === 0 ? n.label : n.label.toLowerCase()))
  if (habitCount > 0) words.push(`${habitCount} habitude${habitCount > 1 ? 's' : ''}`)
  const list = words.length > 1 ? `${words.slice(0, -1).join(', ')} et ${words[words.length - 1]}` : words.join('')
  return `${list} · environ 1 minute`
}


/** Au-delà, « ce qui a été trouvé » s'affiche sans attendre la fin de l'import (qui continue en arrière-plan). */
export const IMPORT_PATIENCE_MS = 20000


/**
 * Les cas où des données quittent le téléphone (ACC-2, carte 3), vérifiés contre le code le 08/11 : analyse IA
 * (relais, variante play ; Gemini avec votre clé, variante sideload), export et rapport, avis, météo, sauvegarde
 * Android. La vérification de l'abonnement (numéro anonyme) est dans la petite ligne.
 */
export const DATA_LEAVES = {
  onDemand: [
    {
      title: 'Analyser un repas ou une photo de selles',
      // Variante sideload : Gemini appelé avec la clé de la personne, sans garantie de zone
      detail: FEATURES.aiRelay
        ? 'La photo ou le texte est lu par une IA de Google, en Europe. Halcya n’en garde rien.'
        : 'La photo ou le texte est lu par l’IA de Google, avec votre clé. Halcya n’en garde rien.',
    },
    { title: 'Exporter vos données, partager le rapport pour votre médecin', detail: 'Le fichier part là où vous l’envoyez.' },
    { title: 'Envoyer votre avis', detail: 'Le texte que vous écrivez et la version de l’app.' },
  ],
  ifEnabled: [
    { title: 'Météo', detail: 'Votre position, à quelques kilomètres près.' },
    { title: 'Sauvegarde du téléphone', detail: 'Une copie chiffrée, comme pour vos autres apps.' },
  ],
}


/** Un seul import à la fois, même si l'écran est monté deux fois (StrictMode, retour en arrière). */
let importInFlight = null
let importProgress = null
const progressListeners = new Set()

/** Avancement de l'import en cours (null avant le premier pas). */
export const importProgressNow = () => importProgress
/** Abonnement à l'avancement de l'import. */
export function onImportProgress(fn) {
  progressListeners.add(fn)
  return () => progressListeners.delete(fn)
}

export function startImport() {
  importInFlight ||= runFirstImport({
    connector: healthConnector(),
    onProgress: (p) => {
      importProgress = p
      progressListeners.forEach((fn) => fn(p))
    },
  })
  return importInFlight
}

/** Pour les tests : oublie l'import en cours. */
export function resetImportForTests() {
  importInFlight = null
  importProgress = null
}


/**
 * Appareils trouvés : les apps qui ont vraiment écrit ces 30 jours (`sourceName` des entrées importées), puis les
 * apps installées qui n'envoient encore rien, avec la façon de les activer.
 */
export function foundDevices(entries, installed) {
  const sending = new Map()
  for (const e of entries || []) {
    const raw = e?.payload?.sourceName
    if (!raw) continue
    const app = matchHealthApp(raw)
    const key = app?.id || raw
    if (!sending.has(key)) sending.set(key, { id: key, name: app?.name || raw, sending: true })
  }
  const silent = (installed || [])
    .filter((a) => !sending.has(a.id) && a.writesHealthConnect && a.enableHint && !a.bridgeFor)
    .map((a) => ({ id: a.id, name: a.name, sending: false, hint: a.enableHint }))
  return [...sending.values(), ...silent]
}
