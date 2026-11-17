/**
 * Le Studio Pilou ne se montre (entrée dans Réglages) que lorsque le compagnon est visible : il suit l'interrupteur de
 * la scène du lot SCÈNE (`companionSceneEnabled()`, contrat § 2 et § 6). Tant que ce fichier n'existe pas, ou qu'il
 * est éteint, le Studio reste caché : pas de réglage d'un Pilou que la personne n'a jamais vu.
 */
const flags = import.meta.glob('../flags.js', { eager: true })

export function studioEnabled() {
  const f = flags['../flags.js']
  try {
    return typeof f?.companionSceneEnabled === 'function' ? !!f.companionSceneEnabled() : false
  } catch {
    return false
  }
}
