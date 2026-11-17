/**
 * La fiche de style de Pilou (double numérique, étape 14) : environ 450 octets de JSON, gardés sur le téléphone
 * seulement, joints à l'export JSON et restaurés par l'import (PILOU-DOUBLE.md § 2, point 7).
 *
 * Stockage : une petite base IndexedDB à part (`halcya-compagnon`, magasin `pilou`), pour ne pas changer la
 * version de la base des saisies (`HealthTrack`, v5) : une installation d'avant la refonte n'a rien à migrer, ses
 * saisies restent intactes, et l'absence de fiche veut dire « Pilou d'origine ». Toute fiche lue ou écrite passe par
 * `sanitizeFiche` (schéma seulement : jamais d'âge, de genre, d'origine ni de santé).
 */
import { sanitizeFiche } from './traits'
import { bus, EVENTS } from '../bus'

export const COMPANION_DB = 'halcya-compagnon'
const DB_VERSION = 1
const STORE = 'pilou'
const CLE = 'fiche'

let cache // undefined : pas encore lue ; null : Pilou d'origine
const abonnes = new Set()

function ouvrir() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponible'))
      return
    }
    const req = indexedDB.open(COMPANION_DB, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'cle' })
    }
  })
}

async function transaction(mode, fn) {
  const db = await ouvrir()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const out = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(out?.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

function prevenir(fiche) {
  // contrat du compagnon § 4 : la scène relaie à Pilou (`setTraits`) ; rejouée aux composants montés plus tard
  bus.emit(EVENTS.TRAITS_CHANGED, { fiche })
  for (const cb of abonnes) {
    try {
      cb(fiche)
    } catch { /* un abonné ne casse pas les autres */ }
  }
}

/** @returns {Promise<object|null>} la fiche, ou null pour le Pilou d'origine */
export async function loadFiche() {
  if (cache !== undefined) return cache
  try {
    const row = await transaction('readonly', (s) => s.get(CLE))
    cache = sanitizeFiche(row?.fiche)
  } catch {
    cache = null
  }
  if (cache) bus.emit(EVENTS.TRAITS_CHANGED, { fiche: cache })
  return cache
}

/** Dernière fiche lue (undefined tant que `loadFiche` n'a pas répondu). */
export function getFicheCache() {
  return cache
}

/** Garde la fiche (normalisée) ; null ou une fiche illisible revient au Pilou d'origine. */
export async function saveFiche(fiche) {
  const propre = sanitizeFiche(fiche)
  if (!propre) return resetFiche()
  await transaction('readwrite', (s) => s.put({ cle: CLE, fiche: propre, modifiee: new Date().toISOString() }))
  cache = propre
  prevenir(propre)
  return propre
}

/** « Revenir au Pilou d'origine » et « Réinitialiser Pilou » : la fiche est effacée. */
export async function resetFiche() {
  await transaction('readwrite', (s) => s.delete(CLE))
  cache = null
  prevenir(null)
  return null
}

/** @param {(fiche: object|null) => void} cb @returns {() => void} */
export function onFicheChange(cb) {
  abonnes.add(cb)
  return () => abonnes.delete(cb)
}

/** Pour les tests : oublie la fiche lue. */
export function __resetFicheCacheForTests() {
  cache = undefined
  abonnes.clear()
}
