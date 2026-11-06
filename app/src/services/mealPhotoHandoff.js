/**
 * Photo de repas prise hors de la page Repas (Accueil, Nutrition, Journal vierge : retours du testeur du 06/11 (4),
 * TESTEUR-4b). Le bouton ouvre l'appareil photo sur place ; la photo est confiée ici, en mémoire seulement, puis la
 * page Repas la reprend une fois à son ouverture. Rien n'est écrit sur l'appareil ni envoyé.
 */
let pending = null

export function setPendingMealPhoto(file) {
  pending = file || null
}

/** Rend la photo en attente et l'oublie (une seule reprise). */
export function takePendingMealPhoto() {
  const f = pending
  pending = null
  return f
}
