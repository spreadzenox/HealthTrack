import { useEffect, useState } from 'react'
import { ENTITLEMENT_EVENT, getEntitlement } from '../services/entitlement'

/**
 * Droits premium (variante play) tenus à jour : chaque nouvel état donné par le relais — achat confirmé en arrière-plan,
 * retour dans l'app, restauration — met à jour l'écran qui l'affiche, sans le rouvrir (jalon 6c-3c).
 */
export function useEntitlement() {
  const [ent, setEnt] = useState(() => getEntitlement())
  useEffect(() => {
    const onChange = (e) => setEnt(e.detail ?? getEntitlement())
    window.addEventListener(ENTITLEMENT_EVENT, onChange)
    return () => window.removeEventListener(ENTITLEMENT_EVENT, onChange)
  }, [])
  return [ent, setEnt]
}
