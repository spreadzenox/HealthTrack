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
 * Écrans fixes du nouvel accueil (ACC-1, 08/11) : tuto (3 cartes), objectifs, sources, ce qui a été trouvé, visage
 * (si le téléphone sait le lire), première note, Gold (variante play). Aucun écran ne dépend d'un choix : le
 * compteur est calculé une fois et ne bouge plus.
 */
export function stepsFor() {
  const steps = ['tuto', 'goal', 'sources', 'found']
  if (isFaceSenseAvailable()) steps.push('face')
  steps.push('first')
  if (FEATURES.billing) steps.push('premium')
  return steps
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


export const FEELINGS = [
  { value: 1, label: 'Mal' },
  { value: 2, label: 'Bof' },
  { value: 3, label: 'Neutre' },
  { value: 4, label: 'Bien' },
  { value: 5, label: 'Très bien' },
]
export const BELLY = [
  { id: 'calm', label: 'Calme' },
  { id: 'discomfort', label: 'Gêné' },
  { id: 'pain', label: 'Douloureux' },
]

