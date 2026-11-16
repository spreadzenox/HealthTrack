/**
 * Mouvements réduits (brief § 7.7, ile.SPEC § 0) : le réglage du téléphone (`prefers-reduced-motion`). Le réglage
 * de l'app (Réglages › Pilou) s'y ajoutera par le contrat du compagnon.
 */
import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion() {
  try {
    return Boolean(window.matchMedia?.(QUERY)?.matches)
  } catch {
    return false
  }
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY)
    if (!mq?.addEventListener) return undefined
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}
