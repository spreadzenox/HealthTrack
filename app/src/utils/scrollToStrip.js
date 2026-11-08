/** Remonte au bandeau d'ajout de l'Accueil (`#today-add`) et y place le focus (AUJ-6). */
export function scrollToStrip(doc = document) {
  const strip = doc.getElementById('today-add')
  if (!strip) return
  strip.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  strip.classList.remove('is-called')
  // Relance l'animation discrète qui montre où est le bandeau (aucune si le téléphone réduit les animations)
  void strip.offsetWidth
  strip.classList.add('is-called')
  // POLISH-SIM-2 : les boutons du bandeau s'entourent un instant (perceptible même bandeau déjà à l'écran), puis le
  // signal s'éteint pour pouvoir être relancé
  clearTimeout(strip._calledTimer)
  strip._calledTimer = setTimeout(() => strip.classList.remove('is-called'), 1600)
  strip.querySelector('button, [role="button"]')?.focus?.({ preventScroll: true })
}
