import { useEffect, useState } from 'react'
import { companionName, COMPANION_EVENT } from './companionState'

/** Le nom du compagnon, relu quand il change (Réglages, rencontre). */
export function useCompanionName() {
  const [name, setName] = useState(() => companionName())
  useEffect(() => {
    const on = () => setName(companionName())
    window.addEventListener(COMPANION_EVENT, on)
    return () => window.removeEventListener(COMPANION_EVENT, on)
  }, [])
  return name
}
