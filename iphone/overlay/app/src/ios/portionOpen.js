/**
 * Version iOS (HealthTrack-iOS) — rappel de portion touché. Sur Android, le toucher est connu avant que la page ne
 * redevienne visible ; sur iPhone, iOS le transmet après (vérifié sur simulateur le 28/10) : `usePortionOpen`
 * (`Layout.jsx`) le manquait. Le natif (`PortionReminderPlugin.swift`) le signale donc aussi par cet évènement de la
 * fenêtre, et la page refait la même vérification (`takePortionOpen`).
 */
export const PORTION_OPEN_EVENT = 'halcya-portion-open'

/** Écoute le signal du natif ; rend de quoi retirer l'écoute. */
export function onPortionOpen(check, target = typeof window !== 'undefined' ? window : undefined) {
  if (!target?.addEventListener) return () => {}
  target.addEventListener(PORTION_OPEN_EVENT, check)
  return () => target.removeEventListener(PORTION_OPEN_EVENT, check)
}
