/**
 * Réponses du formulaire « Sécurité des données » de Google Play pour la variante play (jalon 10,
 * journal/PRODUIT.md P16). Chaque réponse dit pourquoi, d'après le code et la politique de confidentialité
 * (app/public/privacypolicy.html) : à garder en accord avec elles.
 *
 * Définitions de Google : « collecter » = envoyer hors du téléphone ; ce qui est traité seulement sur le
 * téléphone ne se déclare pas (Health Connect, montre, lecture du visage, temps d'écran, saisies du journal).
 * Un envoi à un prestataire qui traite pour le compte de l'éditeur (Open-Meteo, Gemini) n'est pas un « partage ».
 * Choix prudents : rien n'est déclaré « éphémère », puisque la durée de conservation des prestataires ne
 * dépend pas de nous.
 *
 * Format : question (Question ID), response (Response ID, vide pour une question à valeur), value.
 * Les lignes non citées restent vides. Le CSV complet est produit par scripts/play/dataSafety.mjs à partir de
 * template.csv (modèle exporté de la Play Console).
 */

/** Une donnée collectée (pas partagée), facultative, pour le fonctionnement de l'app. */
const collectedForFunctionality = (type, why) => [
  { question: `PSL_DATA_USAGE_RESPONSES:${type}:PSL_DATA_USAGE_COLLECTION_AND_SHARING`, response: 'PSL_DATA_USAGE_ONLY_COLLECTED', value: true, why },
  { question: `PSL_DATA_USAGE_RESPONSES:${type}:PSL_DATA_USAGE_EPHEMERAL`, value: false, why: 'Prudence : la conservation chez le prestataire ne dépend pas de nous.' },
  { question: `PSL_DATA_USAGE_RESPONSES:${type}:DATA_USAGE_USER_CONTROL`, response: 'PSL_DATA_USAGE_USER_CONTROL_OPTIONAL', value: true, why: 'Fonction facultative, désactivée tant que la personne ne la lance pas.' },
  { question: `PSL_DATA_USAGE_RESPONSES:${type}:DATA_USAGE_COLLECTION_PURPOSE`, response: 'PSL_APP_FUNCTIONALITY', value: true, why: 'Seul usage : rendre le service demandé (météo, analyse du repas).' },
]

export const DATA_SAFETY_ANSWERS = [
  { question: 'PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA', value: true, why: 'Position arrondie (météo) et repas analysés par l’IA quittent le téléphone.' },
  { question: 'PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT', value: true, why: 'Open-Meteo et Gemini en HTTPS uniquement.' },
  { question: 'PSL_SUPPORTED_ACCOUNT_CREATION_METHODS', response: 'PSL_ACM_NONE', value: true, why: 'Aucun compte Halcya.' },
  { question: 'PSL_HAS_OUTSIDE_APP_ACCOUNTS', value: false, why: 'On n’entre pas dans l’app avec un compte (Withings relie une source, ce n’est pas une connexion à l’app).' },
  { question: 'PSL_SUPPORT_DATA_DELETION_BY_USER', response: 'DATA_DELETION_YES', value: true, why: 'Suppression dans le Journal ou en effaçant les données de l’app ; l’éditeur ne garde rien.' },
  { question: 'PSL_DATA_DELETION_URL', value: 'https://spreadzenox.github.io/HealthTrack/confidentialite/#vos-droits', why: 'Section « Vos droits » de la politique de confidentialité.' },

  { question: 'PSL_DATA_TYPES_LOCATION', response: 'PSL_APPROX_LOCATION', value: true, why: 'Position arrondie à ~10 km (ou ville choisie) envoyée à Open-Meteo pour la météo.' },
  ...collectedForFunctionality('PSL_APPROX_LOCATION', 'Envoyée à Open-Meteo, prestataire météo : collectée, pas partagée.'),

  { question: 'PSL_DATA_TYPES_PHOTOS_AND_VIDEOS', response: 'PSL_PHOTOS', value: true, why: 'Photo du repas (réduite, sans métadonnées) envoyée à Gemini quand la personne lance l’analyse.' },
  ...collectedForFunctionality('PSL_PHOTOS', 'Envoyée à Gemini, prestataire d’analyse : collectée, pas partagée.'),

  { question: 'PSL_DATA_TYPES_APP_ACTIVITY', response: 'PSL_USER_GENERATED_CONTENT', value: true, why: 'Description écrite d’un repas envoyée à Gemini quand la personne lance l’analyse.' },
  ...collectedForFunctionality('PSL_USER_GENERATED_CONTENT', 'Envoyée à Gemini, prestataire d’analyse : collectée, pas partagée.'),
]

/**
 * Types de données déclarés : la liste attendue, vérifiée par les tests. Absents exprès : santé et forme
 * (Health Connect, montre, ventre, sommeil restent sur le téléphone et ne partent jamais à l'IA), photos du
 * visage (aucune image gardée ni envoyée), applis installées / temps d'écran (sur le téléphone), plantages
 * et diagnostics (aucun outil de suivi), identifiants (aucun).
 */
export const DECLARED_DATA_TYPES = ['PSL_APPROX_LOCATION', 'PSL_PHOTOS', 'PSL_USER_GENERATED_CONTENT']
