/**
 * Android ≤ 14 : le plugin natif SystemBars injecte --safe-area-inset-* dans la page, mais une page rechargée
 * juste après l'injection les perd (échec de l'émulateur API 34 du 30/10 : encarts à 0 px, contenu sous la barre
 * d'état). Au démarrage, la page redemande donc au natif les derniers encarts connus. Android 15+ : rien à faire.
 */
const SIDES = ['top', 'right', 'bottom', 'left']

export async function restoreSafeArea(plugin) {
  try {
    const insets = await plugin?.getInsets?.()
    if (!insets?.known) return false
    const style = document.documentElement.style
    for (const side of SIDES) style.setProperty(`--safe-area-inset-${side}`, `${Math.round(Number(insets[side]) || 0)}px`)
    return true
  } catch {
    // Ancienne version native sans getInsets : l'injection native seule s'applique.
    return false
  }
}
