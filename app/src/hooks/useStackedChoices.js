import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Rangée de choix « rond + libellé » (carte « Votre ventre ») : si un seul libellé ne tient plus à côté de son rond
 * (grande police d'Android, petit écran), toute la rangée passe le rond au-dessus du mot, pour que les choix restent
 * alignés entre eux. `items` : largeur disponible et largeur nécessaire de chaque choix, en pixels.
 */
export function shouldStackChoices(items) {
  return items.some(({ available, needed }) => available > 0 && needed > available)
}

/**
 * 'row' (rond à côté du mot), 'stacked' (rond au-dessus, trois colonnes) ou 'column' (un choix par ligne, pleine
 * largeur) quand même un mot seul ne tient plus dans sa colonne (320 px, police ×1,3). `label` : largeur du mot.
 */
export function choiceLayout(items) {
  const measured = items.filter(({ available }) => available > 0)
  if (measured.some(({ available, label }) => label > available)) return 'column'
  return shouldStackChoices(measured) ? 'stacked' : 'row'
}

const px = (v) => parseFloat(v) || 0

/** Mesure à partir de la largeur de la rangée (et non du bouton) : en colonne, le bouton s'élargit. */
function measureRow(row) {
  const buttons = [...row.children]
  if (!buttons.length) return []
  const rowStyle = getComputedStyle(row)
  const gap = px(rowStyle.columnGap)
  const column = (row.clientWidth - gap * (buttons.length - 1)) / buttons.length
  return buttons.map((button) => {
    const st = getComputedStyle(button)
    const available =
      column - px(st.paddingLeft) - px(st.paddingRight) - px(st.borderLeftWidth) - px(st.borderRightWidth)
    const parts = [...button.children]
    const needed = parts.reduce((sum, el) => sum + el.scrollWidth, 0) + px(st.columnGap) * Math.max(0, parts.length - 1)
    const labelEl = button.querySelector('.choice-label') || parts[parts.length - 1]
    return { available: row.clientWidth > 0 ? available : 0, needed, label: labelEl ? labelEl.scrollWidth : 0 }
  })
}

/** Renvoie [ref à poser sur la rangée, disposition]. Les choix ont pour enfants le rond puis `.choice-label`. */
export function useStackedChoices() {
  const ref = useRef(null)
  const [layout, setLayout] = useState('row')
  useLayoutEffect(() => {
    const row = ref.current
    if (!row) return undefined
    const update = () => setLayout(choiceLayout(measureRow(row)))
    update()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(update)
    ro.observe(row)
    document.fonts?.ready?.then(update).catch(() => {})
    return () => ro.disconnect()
  }, [])
  return [ref, layout]
}
