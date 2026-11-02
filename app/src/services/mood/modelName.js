/**
 * Nom technique des modèles de lecture du visage : affiché dans la variante sideload seulement. La variante play ne
 * montre aucun nom de modèle (décision du propriétaire du 31/10, POL-PLAY-100) ; l'attribution de la licence reste
 * dans les conditions (`public/conditions.html`, § Propriété).
 */
import { FEATURES } from '../../config/distribution'

export const FACE_MODEL_NAME = 'HSEmotion'

/** « (HSEmotion) » à ajouter après un libellé en sideload, chaîne vide en play. */
export function faceModelTag(features = FEATURES) {
  return features?.aiModelName ? ` (${FACE_MODEL_NAME})` : ''
}
