import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Une boîte est « étroite » quand sa largeur, comptée en rem, passe sous `minRem` : la grande police d'Android
 * (textZoom de la WebView) agrandit le rem, donc 320 px en police ×1,3 valent moins de place qu'en police normale.
 */
export function isNarrowBox(widthPx, rootFontPx, minRem) {
  if (!(widthPx > 0) || !(rootFontPx > 0)) return false
  return widthPx / rootFontPx < minRem
}

/** Renvoie [ref à poser sur la boîte, étroite ?], recalculé quand la boîte change de taille. */
export function useNarrowBox(minRem) {
  const ref = useRef(null)
  const [narrow, setNarrow] = useState(false)
  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return undefined
    const update = () => {
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 0
      setNarrow(isNarrowBox(box.clientWidth, root, minRem))
    }
    update()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(update)
    ro.observe(box)
    document.fonts?.ready?.then(update).catch(() => {})
    return () => ro.disconnect()
  }, [minRem])
  return [ref, narrow]
}
