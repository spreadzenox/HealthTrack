/**
 * POLISH-SIM-130 : les courbes choisies dans Tendances restent le temps de la session (sessionStorage, effacé à la
 * fermeture de l'app) ; revenir sur l'onglet ne ramène plus au seul bien-être. Un lien `?mesure=` garde la priorité.
 */
export const TRENDS_KEYS_KEY = 'halcya.trends.keys'

/** @returns {string[] | null} les mesures gardées, ou null */
export function readKeptKeys() {
  try {
    const keys = JSON.parse(globalThis.sessionStorage?.getItem(TRENDS_KEYS_KEY) || 'null')
    return Array.isArray(keys) && keys.length && keys.every((k) => typeof k === 'string') ? keys : null
  } catch {
    return null
  }
}

/** @param {string[]} keys */
export function keepKeys(keys) {
  try {
    if (keys?.length) globalThis.sessionStorage?.setItem(TRENDS_KEYS_KEY, JSON.stringify(keys))
  } catch {
    /* stockage indisponible : le choix vaut pour cet affichage seulement */
  }
}
