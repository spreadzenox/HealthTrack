/**
 * Divulgations affichées juste avant chaque autorisation sensible (jalon 3b, journal/PLAY-CONFORMITE.md).
 *
 * Règle Google Play « divulgation bien visible et consentement » : avant la boîte d'Android, l'app dit dans
 * l'app, en clair, quelle donnée est lue, pourquoi, ce qui quitte le téléphone, et demande un geste explicite
 * (« J'accepte… ») ; « Pas maintenant » ne demande rien à Android. Pour la caméra, c'est aussi l'information
 * due par l'AI Act aux personnes exposées à un système de reconnaissance des émotions.
 *
 * Une entrée par accès : `title`, `points` (phrases courtes, vouvoiement), `leaves` (ce qui sort du téléphone,
 * affiché à part), `accept` (libellé du bouton d'accord), `decline`.
 */
import { APP_NAME } from './brand'

export const DISCLOSURES = {
  camera: {
    title: 'Avant d’autoriser la caméra',
    points: [
      'Quand vous déverrouillez le téléphone, la caméra frontale prend quelques images de votre visage, pendant une à deux secondes.',
      'Un système d’IA de reconnaissance des émotions les analyse sur le téléphone et en tire quelques nombres (expression, plaisir, énergie) : l’estimation de votre bien-être. Une estimation, pas un diagnostic.',
      'Seuls ces nombres sont gardés, dans vos données. Aucune image n’est conservée.',
      'Une notification reste affichée tant que la lecture est active. « Désactiver » l’arrête à tout moment, et vous pouvez retirer l’accès dans les réglages d’Android.',
    ],
    leaves: 'Rien ne quitte le téléphone : ni image, ni mesure.',
    accept: 'J’accepte, autoriser la caméra',
    decline: 'Pas maintenant',
  },
  // Variante play (journal/PLAY-CONFORMITE.md, option B) : lecture à l'ouverture de l'app, sans service caméra.
  camera_app_open: {
    title: 'Avant d’autoriser la caméra',
    points: [
      `Quand vous ouvrez ${APP_NAME}, la caméra frontale prend quelques images de votre visage, pendant une à deux secondes, au plus une fois par demi-heure. Un bandeau l’indique à l’écran pendant toute la lecture.`,
      'Un système d’IA de reconnaissance des émotions les analyse sur le téléphone et en tire quelques nombres (expression, plaisir, énergie) : l’estimation de votre bien-être. Une estimation, pas un diagnostic.',
      'Seuls ces nombres sont gardés, dans vos données. Aucune image n’est conservée.',
      'Rien ne se passe quand l’app est fermée. « Désactiver » l’arrête à tout moment, et vous pouvez retirer l’accès dans les réglages d’Android.',
    ],
    leaves: 'Rien ne quitte le téléphone : ni image, ni mesure.',
    accept: 'J’accepte, autoriser la caméra',
    decline: 'Pas maintenant',
  },
  location: {
    title: 'Avant d’utiliser votre position',
    points: [
      'Votre position approximative est lue une fois, maintenant, pour trouver la météo, la pression, l’air et les pollens de votre ville.',
      'Elle est arrondie à environ 10 km et n’est pas suivie en continu.',
      'Vous pouvez aussi refuser et choisir une ville à la place.',
    ],
    leaves: 'Envoyé : la position arrondie (≈ 10 km), au service météo Open-Meteo. Rien d’autre.',
    accept: 'J’accepte, utiliser ma position',
    decline: 'Pas maintenant',
  },
  usage: {
    title: 'Avant d’ouvrir l’accès aux données d’utilisation',
    points: [
      `${APP_NAME} lit les moments où l’écran s’allume, s’éteint ou se déverrouille, et le temps passé par app (sans rien lire de ce que vous y faites).`,
      'Ça sert à estimer votre temps d’écran et votre sommeil, pour les comparer à votre bien-être.',
      `Android va ouvrir « Accès aux données d’utilisation » : activez-y ${APP_NAME}. Vous pourrez le retirer au même endroit.`,
    ],
    leaves: 'Rien ne quitte le téléphone.',
    accept: 'J’accepte, ouvrir le réglage',
    decline: 'Pas maintenant',
  },
}

/** La divulgation d'un accès ; erreur si l'accès n'est pas décrit (pour ne jamais demander sans prévenir). */
export function disclosureFor(key) {
  const d = DISCLOSURES[key]
  if (!d) throw new Error(`Divulgation inconnue : ${key}`)
  return d
}
