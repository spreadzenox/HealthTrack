/** Ouvre et fait défiler jusqu'au guide « Votre montre n'apparaît pas ? » (src/data/watchGuides.jsx). */
export function openGuide(guideId) {
  const el = document.getElementById(`guide-${guideId}`)
  if (!el) return
  el.open = true
  el.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}
