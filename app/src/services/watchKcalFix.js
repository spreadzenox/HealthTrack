/**
 * Signalement du 27/10/2026 (« 658 625 kcal » le 26/10) : les minutes de la montre Huawei donnent des petites
 * calories, rangées jusqu'à la v313 comme des kcal. La synchro écrit maintenant des kcal (avec la valeur brute dans
 * `rawCal`) ; ce module convertit de la même façon les tranches horaires déjà en base (au premier lancement, puis
 * après un import). Rien n'est perdu : la valeur d'origine reste dans `rawCal`. La lecture corrige aussi les
 * entrées pas encore converties (activityTotals.js), si bien que l'ordre n'a pas d'importance.
 */
import { WATCH_SOURCE } from '../devices/huawei/sync'
import { rewriteSourceEntries } from '../storage/localHealthStorage'
import { isLegacyWatchCalories } from './activityTotals'

const DONE_KEY = 'healthtrack_watch_kcal_v1'

/** Plan de réécriture (pur) : chaque ancienne tranche est remplacée par la même en kcal, valeur brute gardée. */
export function planWatchKcalFix(entries) {
  const remove = []
  const add = []
  for (const e of entries) {
    if (!isLegacyWatchCalories(e) || typeof e.payload?.value !== 'number') continue
    remove.push(e.id)
    add.push({ type: e.type, at: e.at, payload: { ...e.payload, value: Math.round(e.payload.value / 100) / 10, unit: 'kcal', rawCal: e.payload.value } })
  }
  return { remove, add }
}

/** Convertit les calories de la montre déjà en base. Rend { removed, added }. */
export function fixWatchKcal() {
  return rewriteSourceEntries(WATCH_SOURCE, planWatchKcalFix)
}

let running = null

/** Une seule fois par téléphone (drapeau local) ; `force` après un import (ancien fichier). Idempotent. */
export function fixWatchKcalOnce({ storage = globalThis.localStorage, force = false } = {}) {
  if (running) return running
  try {
    if (!force && storage?.getItem(DONE_KEY)) return Promise.resolve(null)
  } catch {
    /* stockage indisponible : on tente quand même */
  }
  running = Promise.resolve()
    .then(fixWatchKcal)
    .then((r) => {
      try {
        storage?.setItem(DONE_KEY, new Date().toISOString())
      } catch {
        /* ignoré */
      }
      return r
    })
    .catch(() => null)
    .finally(() => {
      running = null
    })
  return running
}
