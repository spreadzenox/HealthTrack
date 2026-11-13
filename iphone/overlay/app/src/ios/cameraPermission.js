/**
 * Version iOS (HealthTrack-iOS) — accès à l'appareil photo seul, demandé à l'accueil (retours du premier testeur, 06/11) :
 * `FaceSense.requestCamera` (natif) n'active pas la lecture du visage. « granted » ou « denied » ; refusé avant, l'iPhone
 * ne redemande pas (Réglages › Halcya).
 */
import { faceSensePlugin } from '../services/faceSense'

export async function requestCamera(plugin = faceSensePlugin()) {
  if (typeof plugin?.requestCamera !== 'function') return 'denied'
  const res = await plugin.requestCamera()
  return res?.granted ? 'granted' : 'denied'
}
