/**
 * Nom affiché de l'app : une seule source, pour pouvoir le changer en un commit. Nom décidé par le
 * propriétaire le 21/10/2026 : « Halcya » (de « halcyon days », les jours de calme). Jamais utilisé
 * dans les identifiants techniques (applicationId, package Java, base IndexedDB, clés de stockage,
 * dépôt GitHub, noms des fichiers du code). Seule exception : le nom de la sauvegarde que la personne
 * télécharge (`EXPORT_FILE_PREFIX`), qu'elle doit reconnaître dans ses fichiers.
 */
export const APP_NAME = 'Halcya'

/** Début du nom de la sauvegarde téléchargée : « halcya-export-AAAA-MM-JJ.json » (l'import ne lit pas le nom). */
export const EXPORT_FILE_PREFIX = `${APP_NAME.toLowerCase()}-export-`

/** Politique de confidentialité publiée par GitHub Pages (app/scripts/site/build-site.mjs). */
export const PRIVACY_URL = 'https://spreadzenox.github.io/HealthTrack/confidentialite/'

/** Conditions d'utilisation et de vente publiées par GitHub Pages (VC-18 ; source app/public/conditions.html). */
export const TERMS_URL = 'https://spreadzenox.github.io/HealthTrack/conditions/'
