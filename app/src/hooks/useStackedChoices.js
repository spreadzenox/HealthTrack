import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Rangée de choix « rond + libellé » (carte « Votre ventre ») : si un seul libellé ne tient plus à côté de son rond
 * (grande police d'Android, petit écran), toute la rangée passe le rond au-dessus du mot, pour que les choix restent
 * alignés entre eux. `items` : largeur disponible et largeur nécessaire de chaque choix, en pixels.
 */
export function shouldStackChoices(items) {
  return items.some(({ available, needed }) => available > 0 && needed > available)
}

const px = (v) => parseFloat(v) || 0

function measure(button) {
  const st = getComputedStyle(button)
  const available = button.clientWidth - px(st.paddingLeft) - px(st.paddingRight)
  const parts = [...button.children]
  const needed =
    parts.reduce((sum, el) => sum + el.scrollWidth, 0) + px(st.columnGap) * Math.max(0, parts.length - 1)
  return { available, needed }
}

/** Renvoie [ref à poser sur la rangée, empilée ?]. Les choix ont pour enfants le rond puis `.choice-label`. */
export function useStackedChoices() {
  const ref = useRef(null)
  const [stacked, setStacked] = useState(false)
  useLayoutEffect(() => {
    const row = ref.current
    if (!row) return undefined
    const update = () => setStacked(shouldStackChoices([...row.children].map(measure)))
    update()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(update)
    ro.observe(row)
    document.fonts?.ready?.then(update).catch(() => {})
    return () => ro.disconnect()
  }, [])
  return [ref, stacked]
}
