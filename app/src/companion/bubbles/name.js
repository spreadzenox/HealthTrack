/**
 * Le nom du compagnon, choisi par l'utilisateur (lot VIE, `life/companionState.js`) ; « Pilou » tant que le module
 * n'est pas là. Lu par `import.meta.glob` pour ne dépendre d'aucun fichier absent.
 */
import { useEffect, useState } from 'react'

const lifeModules = import.meta.glob('../life/companionState.js', { eager: true })
const life = Object.values(lifeModules)[0] ?? null

export function companionNameNow() {
  try {
    const n = life?.companionName?.()
    return typeof n === 'string' && n.trim() ? n : 'Pilou'
  } catch {
    return 'Pilou'
  }
}

export function useCompanionNameSafe() {
  const [name, setName] = useState(companionNameNow)
  useEffect(() => {
    const event = life?.COMPANION_EVENT
    if (!event) return undefined
    const on = () => setName(companionNameNow())
    window.addEventListener(event, on)
    return () => window.removeEventListener(event, on)
  }, [])
  return name
}
