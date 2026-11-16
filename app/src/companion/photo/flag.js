/**
 * Interrupteur de build du double numérique par photo (étape 15 de la refonte, lot PHOTO du sprint du 16/11).
 *
 * ÉTEINT PAR DÉFAUT DANS TOUTES LES VARIANTES (play, sideload, appstore) : décision du propriétaire, rien de ce
 * chemin n'est actif dans une version envoyée aux testeurs avant qu'il ait envoyé ses déclarations (Sécurité des
 * données de Google Play, étiquettes de confidentialité de l'App Store ; missions P49 et PI3 de journal/missions/).
 * Éteint : aucun écran, aucune route, aucune autorisation demandée, aucun appel réseau. Seul `VITE_PILOU_PHOTO=on`
 * au build l'allume ; aucun workflow ne le règle.
 */
export function pilouPhotoEnabled(value) {
  return String(value ?? '').trim().toLowerCase() === 'on'
}

export const PILOU_PHOTO = pilouPhotoEnabled(import.meta.env?.VITE_PILOU_PHOTO)
