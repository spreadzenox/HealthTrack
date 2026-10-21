/**
 * Variante de distribution de l'app, fixée au build (`VITE_DISTRIBUTION`, voir `journal/PRODUIT.md`, jalon 3).
 *
 * - `sideload` (défaut) : la version complète publiée sur GitHub Releases, avec la mise à jour en un clic.
 * - `play` : la version Google Play — pas d'auto-mise à jour (interdite par les règles Play, c'est le Store qui
 *   met à jour), pas de permission REQUEST_INSTALL_PACKAGES côté Android.
 *
 * Toute valeur inconnue retombe sur `sideload` : c'est la version que le propriétaire installe aujourd'hui.
 */
export const DISTRIBUTIONS = ['sideload', 'play']

export function resolveDistribution(value) {
  const v = String(value ?? '').trim().toLowerCase()
  return DISTRIBUTIONS.includes(v) ? v : 'sideload'
}

/** Fonctions qui dépendent de la variante. */
export function featuresFor(distribution) {
  const d = resolveDistribution(distribution)
  return {
    // Bandeau « Une mise à jour est disponible » + téléchargement de l'APK depuis GitHub
    selfUpdate: d === 'sideload',
  }
}

export const DISTRIBUTION = resolveDistribution(import.meta.env?.VITE_DISTRIBUTION)
export const FEATURES = featuresFor(DISTRIBUTION)
