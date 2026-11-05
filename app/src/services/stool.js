/**
 * Forme des selles (I176), facultative, en un geste depuis la carte « Votre ventre » (objectif « Mon ventre »).
 *
 * Trois formes d'abord (dures, normales, liquides : les groupes 1–2, 3–5 et 6–7 de l'échelle de Bristol), le
 * type précis 1 à 7 seulement si la personne le veut. Entrée `stool` `{ form, bristol? }`, source `app_stool`,
 * supprimable. Aucun sous-type du SII n'est déduit ni affiché (ce serait un diagnostic) : on décrit, on compte.
 * Les descriptions des 7 types sont écrites par nous (la carte de la Rome Foundation est sous droits).
 *
 * Ce n'est pas un facteur des analyses du bien-être (analysisEngine l'ignore) ni des pistes repas → ventre.
 */
import { localDateKey } from './analysisEngine'

export const STOOL_TYPE = 'stool'
export const STOOL_SOURCE = 'app_stool'

/** Les trois formes, dans l'ordre affiché, avec les types de Bristol qu'elles regroupent. */
export const STOOL_FORMS = [
  { id: 'hard', label: 'Dures', plural: 'dures', bristol: [1, 2] },
  { id: 'normal', label: 'Normales', plural: 'normales', bristol: [3, 4, 5] },
  { id: 'loose', label: 'Liquides', plural: 'liquides', bristol: [6, 7] },
]

/** Échelle de Bristol, en mots simples. */
export const BRISTOL_TYPES = [
  { n: 1, text: 'Petites boules dures, séparées' },
  { n: 2, text: 'En boudin, grumeleuses' },
  { n: 3, text: 'En boudin, craquelées en surface' },
  { n: 4, text: 'En boudin, lisses et molles' },
  { n: 5, text: 'Morceaux mous, bords nets' },
  { n: 6, text: 'Morceaux floconneux, pâteux' },
  { n: 7, text: 'Entièrement liquides' },
]

export const isBristol = (n) => Number.isInteger(n) && n >= 1 && n <= 7

export const formOfBristol = (n) => (isBristol(n) ? STOOL_FORMS.find((f) => f.bristol.includes(n)).id : null)

/** Forme d'une entrée : `payload.form` s'il est connu, sinon déduite du type de Bristol ; `null` si illisible. */
export function stoolForm(e) {
  const p = e?.payload
  if (STOOL_FORMS.some((f) => f.id === p?.form)) return p.form
  return formOfBristol(p?.bristol)
}

export const stoolFormLabel = (id) => STOOL_FORMS.find((f) => f.id === id)?.label ?? null

/**
 * Payload à enregistrer : la forme, et le type précis s'il a été choisi (la forme suit alors le type). Estimée par
 * photo (SELLES-PHOTO-2) : `estimated: true` et `estimate` (ce que proposait le modèle), pour mesurer la fiabilité
 * chez la personne sans garder aucune image. Champs ajoutés : les anciennes entrées restent valides, sans migration.
 */
export function stoolPayload({ form = null, bristol = null, estimate = null } = {}) {
  let payload
  if (isBristol(bristol)) payload = { form: formOfBristol(bristol), bristol }
  else if (STOOL_FORMS.some((f) => f.id === form)) payload = { form }
  else throw new Error('Forme des selles inconnue')
  if (isBristol(estimate?.bristol)) {
    payload.estimated = true
    payload.estimate = { bristol: estimate.bristol, form: formOfBristol(estimate.bristol) }
  }
  return payload
}

/** Libellé court d'une entrée : « Normales », « Dures · type 2 ». */
export function stoolEntryLabel(e) {
  const label = stoolFormLabel(stoolForm(e))
  if (!label) return null
  return isBristol(e.payload?.bristol) ? `${label} · type ${e.payload.bristol}` : label
}

/**
 * Décompte sur une période (rapport PDF) : nombre de selles notées par forme et nombre de jours avec au moins une
 * note. `null` s'il n'y en a aucune (la section n'est alors pas imprimée : la saisie est facultative).
 */
export function stoolCounts(entries, from = null, to = null) {
  const counts = { hard: 0, normal: 0, loose: 0 }
  const days = new Set()
  let estimated = 0
  for (const e of entries || []) {
    if (e?.type !== STOOL_TYPE || !e.at || Number.isNaN(Date.parse(e.at))) continue
    const form = stoolForm(e)
    if (!form) continue
    const day = localDateKey(e.at)
    if ((from && day < from) || (to && day > to)) continue
    counts[form] += 1
    days.add(day)
    if (e.payload?.estimated) estimated += 1
  }
  const total = counts.hard + counts.normal + counts.loose
  if (!total) return null
  // Rapport PDF (SELLES-PHOTO-3) : combien ont été estimées par photo puis vérifiées ; absent sans aucune photo.
  return estimated ? { total, days: days.size, ...counts, estimated } : { total, days: days.size, ...counts }
}

/** Nombre de photos à partir duquel la fiabilité chez la personne est affichée (étude I221). */
export const STOOL_PHOTO_MIN = 5

/**
 * Fiabilité de l'estimation par photo chez la personne (SELLES-PHOTO-3) : parmi les notes estimées par photo, combien
 * la personne a corrigées, au niveau des trois formes (un 4 estimé enregistré en 3 reste « normales »). `null` avant
 * STOOL_PHOTO_MIN photos. `often` : plus d'une sur trois corrigée, l'estimation est alors signalée comme à vérifier.
 */
export function stoolPhotoReliability(entries) {
  let total = 0
  let corrected = 0
  for (const e of entries || []) {
    if (e?.type !== STOOL_TYPE || !e.payload?.estimated) continue
    const guess = formOfBristol(e.payload.estimate?.bristol)
    const kept = stoolForm(e)
    if (!guess || !kept) continue
    total += 1
    if (guess !== kept) corrected += 1
  }
  if (total < STOOL_PHOTO_MIN) return null
  return { total, corrected, often: corrected * 3 > total }
}

export function stoolPhotoReliabilityText(r) {
  if (!r) return null
  if (!r.corrected) return `Aucune estimation corrigée sur ${r.total}.`
  return `Vous avez corrigé ${r.corrected} ${r.corrected > 1 ? 'estimations' : 'estimation'} sur ${r.total}.`
}
