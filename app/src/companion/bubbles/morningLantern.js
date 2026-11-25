/**
 * LANT-3 (journal/maquettes/compagnon/DECOUPAGE-RITUEL-LANTERNES.md) : à l'ouverture de l'Accueil, si hier était un
 * jour « avec » d'un essai, tenu, la lanterne de l'îlot s'allume (une fois par jour). Aucune lecture de plus : les
 * essais et les saisies récentes sont déjà lus par l'Accueil ; les résumés des jours en sortent comme dans Agir.
 */
import { buildDailyJournal } from '../../services/dailyJournal'
import { habitDays } from '../../services/habits'
import { morningLantern } from '../../services/trials'

export const LANTERN_SEEN_KEY = 'halcya.lantern.morningSeen'

/** Résumés des jours (sommeil, pas, écran, habitudes) depuis les saisies récentes de l'Accueil. */
export function summariesOf(entries) {
  const summaries = new Map(buildDailyJournal(entries || []).map((d) => [d.dateKey, d.summary]))
  for (const [dk, answers] of habitDays(entries)) summaries.set(dk, { ...summaries.get(dk), habits: answers })
  return summaries
}

/** La lanterne à allumer ce matin, ou null (rien à fêter, ou déjà montrée aujourd'hui). */
export function lanternToShow({ trials, entries, now = new Date(), storage = globalThis.localStorage } = {}) {
  const lit = morningLantern(trials, { summaries: summariesOf(entries), now })
  if (!lit) return null
  try {
    if (storage?.getItem(LANTERN_SEEN_KEY) === lit.key) return null
  } catch {
    return null
  }
  return lit
}

export function markLanternShown(key, storage = globalThis.localStorage) {
  try {
    storage?.setItem(LANTERN_SEEN_KEY, key)
  } catch {
    // stockage indisponible : la lanterne pourra se rallumer, rien de grave
  }
}
