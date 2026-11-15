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
  const steps = ['intro', ...TEMPS]
  if (isFaceSenseAvailable()) steps.push('face')
  if (FEATURES.billing) steps.push('premium')
  return steps
}

/**
 * Temps 3 : ce que Halcya suit sans rien demander (brief § 3.3 ; le « stress » de la montre n'y est pas). Sans
 * montre, seuls le temps d'écran et la météo viennent du téléphone : le reste est annoncé pour plus tard.
 */
export const AUTO_TILES = [
  { id: 'sleep', label: 'Sommeil', tone: 'night', watch: true },
  { id: 'steps', label: 'Pas', tone: 'lilac', watch: true },
  { id: 'workouts', label: 'Séances de sport', tone: 'lilac', watch: true },
  { id: 'heart', label: 'Cœur', tone: 'rose', watch: true },
  { id: 'hrv', label: 'Variabilité cardiaque', tone: 'rose', watch: true },
  { id: 'breath', label: 'Respiration', tone: 'rose', watch: true },
  { id: 'skin', label: 'Température de la peau', tone: 'rose', watch: true },
  { id: 'screen', label: 'Temps d’écran', tone: 'stone' },
  { id: 'weather', label: 'Météo', tone: 'stone' },
]

/** Temps 4 : ce qui se note à la main chaque jour, hors habitudes (la digestion seulement avec son objectif). */
export function dailyNotes(gut) {
  return [
    { id: 'meals', label: 'Repas', detail: 'en photo, 3 par jour', tone: 'peach' },
    { id: 'wellbeing', label: 'Bien-être', detail: 'une note rapide', tone: 'mint' },
    gut && { id: 'gut', label: 'Digestion', detail: 'le soir', tone: 'peach' },
  ].filter(Boolean)
}

/** Résumé du temps 4 : « 5 choses par jour · environ 1 minute ». */
export const dailySummary = (count) => `${count} choses par jour · environ 1 minute`


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
