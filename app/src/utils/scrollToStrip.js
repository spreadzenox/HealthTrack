/** Remonte au bandeau d'ajout de l'Accueil (`#today-add`) et y place le focus (AUJ-6). */
export function scrollToStrip(doc = document) {
  const strip = doc.getElementById('today-add')
  if (!strip) return
  strip.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  strip.classList.remove('is-called')
  // Relance l'animation discrète qui montre où est le bandeau (aucune si le téléphone réduit les animations)
  void strip.offsetWidth
  strip.classList.add('is-called')
  strip.querySelector('button, [role="button"]')?.focus?.({ preventScroll: true })
}
