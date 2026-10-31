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

// Sauvegarde Android conservée (décision du 24/10) : les nombres gardés suivent la sauvegarde du téléphone si la
// personne l'a activée ; l'app, elle, n'envoie rien (POL-PLAY-25).
const CAMERA_LEAVES = `Envoyé par ${APP_NAME} : rien, ni image ni mesure. Les nombres suivent la sauvegarde du téléphone, si elle est activée.`
const DATA_LEAVES = `Envoyé par ${APP_NAME} : rien. Vos mesures suivent la sauvegarde du téléphone, si elle est activée.`

export const DISCLOSURES = {
  camera: {
    title: 'Avant d’autoriser la caméra',
    points: [
      'Quand vous déverrouillez le téléphone, la caméra frontale prend quelques images de votre visage, pendant une à deux secondes.',
      'Un système d’IA de reconnaissance des émotions les analyse sur le téléphone et en tire quelques nombres (expression, plaisir, énergie) : l’estimation de votre bien-être.',
      'Seuls ces nombres sont gardés, dans vos données. Aucune image n’est conservée.',
      'Une notification reste affichée tant que la lecture est active. « Désactiver » l’arrête à tout moment, et vous pouvez retirer l’accès dans les réglages d’Android.',
    ],
    leaves: CAMERA_LEAVES,
    accept: 'J’accepte, autoriser la caméra',
    decline: 'Pas maintenant',
  },
  // Variante play (journal/PLAY-CONFORMITE.md, option B) : lecture à l'ouverture de l'app, sans service caméra.
  camera_app_open: {
    title: 'Avant d’autoriser la caméra',
    points: [
      `Quand vous ouvrez ${APP_NAME}, la caméra frontale prend quelques images de votre visage, pendant une à deux secondes, au plus une fois par demi-heure. Un bandeau l’indique à l’écran pendant toute la lecture.`,
      'Un système d’IA de reconnaissance des émotions les analyse sur le téléphone et en tire quelques nombres (expression, plaisir, énergie) : l’estimation de votre bien-être.',
      'Seuls ces nombres sont gardés, dans vos données. Aucune image n’est conservée.',
      'Rien ne se passe quand l’app est fermée. « Désactiver » l’arrête à tout moment, et vous pouvez retirer l’accès dans les réglages d’Android.',
    ],
    leaves: CAMERA_LEAVES,
    accept: 'J’accepte, autoriser la caméra',
    decline: 'Pas maintenant',
  },
  // Variante play avec l'interrupteur faceUnlockPlay (POL-1, journal/PLAY-CONFORMITE.md §1 bis) : la lecture au
  // déverrouillage s'ajoute à celle de l'ouverture ; elle ne démarre que par ce geste, app ouverte.
  camera_unlock: {
    title: 'Avant la lecture à chaque déverrouillage',
    points: [
      'À chaque déverrouillage du téléphone, la caméra frontale prend 3 images de votre visage, en une à deux secondes. Le témoin vert de la caméra d’Android s’allume.',
      'Un système d’IA de reconnaissance des émotions les analyse sur le téléphone et en tire quelques nombres (expression, plaisir, énergie) : l’estimation de votre bien-être.',
      'Seuls ces nombres sont gardés, dans vos données. Aucune image n’est conservée.',
      'Une notification « Lecture du visage active » reste affichée tant que c’est en marche, avec un bouton « Arrêter ». Vous pouvez aussi couper ici à tout moment.',
      `Après un redémarrage du téléphone, rien ne reprend tout seul : il faudra rouvrir ${APP_NAME}.`,
    ],
    leaves: CAMERA_LEAVES,
    accept: 'J’accepte, lire au déverrouillage',
    decline: 'Pas maintenant',
  },
  // Onboarding de la variante play avec faceUnlockPlay (demande du propriétaire du 31/10) : un seul « Activer » allume
  // la lecture à l'ouverture de l'app ET au déverrouillage (start({ unlock: true }) note les deux accords).
  camera_onboarding_unlock: {
    title: 'Avant d’activer la lecture du visage',
    points: [
      `À chaque déverrouillage du téléphone, et quand vous ouvrez ${APP_NAME} (au plus une fois par demi-heure), la caméra frontale prend 3 images de votre visage, en une à deux secondes. Le témoin vert de la caméra d’Android s’allume.`,
      'Un système d’IA de reconnaissance des émotions les analyse sur le téléphone et en tire quelques nombres (expression, plaisir, énergie) : l’estimation de votre bien-être.',
      'Seuls ces nombres sont gardés, dans vos données. Aucune image n’est conservée.',
      'Une notification « Lecture du visage active » reste affichée tant que la lecture au déverrouillage est en marche, avec un bouton « Arrêter ». Vous pouvez tout couper à tout moment dans l’onglet Sources.',
      `Après un redémarrage du téléphone, la lecture au déverrouillage ne reprend pas toute seule : il faudra rouvrir ${APP_NAME}.`,
    ],
    leaves: CAMERA_LEAVES,
    accept: 'J’accepte, activer',
    decline: 'Pas maintenant',
  },
  // Onboarding (jalon 4b) et Sources : lecture seule de Health Connect.
  health_connect: {
    title: 'Avant d’autoriser Health Connect',
    points: [
      `${APP_NAME} lit ce que vos montres, bagues et applis santé écrivent dans Health Connect : sommeil, pas, fréquence cardiaque, VFC, activité et quelques mesures (poids, température…). Il n’y écrit rien.`,
      'Android vous laisse choisir type par type : tout est facultatif.',
      'Les 30 derniers jours sont importés tout de suite, puis les nouvelles données au fil des jours.',
      'Elles restent dans vos données, sur le téléphone. Vous pouvez retirer l’accès à tout moment dans Health Connect.',
    ],
    leaves: DATA_LEAVES,
    accept: 'J’accepte, ouvrir Health Connect',
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
    leaves: DATA_LEAVES,
    accept: 'J’accepte, ouvrir le réglage',
    decline: 'Pas maintenant',
  },
  // Variante play : première analyse IA d'un repas par le relais (journal/PRODUIT.md, jalon 6a)
  ai_meal: {
    title: 'Avant d’analyser un repas avec l’IA',
    points: [
      'Pour remplir le repas, la photo (réduite, sans position ni modèle de téléphone) ou votre description part vers notre serveur, qui la fait analyser par Gemini (Google Cloud, en Europe).',
      'Notre serveur ne garde ni la photo ni le texte, seulement le nombre d’analyses faites (effacé au bout de 13 mois sans analyse), et Google ne s’en sert pas pour entraîner ses modèles. Seuls les aliments et les grammes reviennent sur le téléphone, et les calories sont calculées ici.',
      'Aucune autre donnée de santé ne part. Sans IA, vous pouvez toujours ajouter les aliments à la main.',
    ],
    leaves: 'Envoyé : la photo ou la description du repas, à chaque analyse que vous lancez. Rien d’autre.',
    accept: 'J’accepte, analyser ce repas',
    decline: 'Pas maintenant',
  },
}

/** La divulgation d'un accès ; erreur si l'accès n'est pas décrit (pour ne jamais demander sans prévenir). */
export function disclosureFor(key) {
  const d = DISCLOSURES[key]
  if (!d) throw new Error(`Divulgation inconnue : ${key}`)
  return d
}
