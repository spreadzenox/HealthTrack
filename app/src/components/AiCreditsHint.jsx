import { useEffect, useState } from 'react'
import { FEATURES } from '../config/distribution'
import { describeCredits, getLastCredits, refreshCredits } from '../services/aiRelay'
import { useEntitlement } from '../hooks/useEntitlement'

/**
 * Compteur des analyses IA restantes (variante play, jalon 6c-3b) : « 12 analyses IA restantes · renouvellement le
 * 1 novembre ». Relu auprès du relais à l'affichage, et de nouveau quand le premium s'ouvre ou se ferme (6c-3c) ;
 * rien n'est montré tant qu'il est inconnu (hors connexion).
 */
export default function AiCreditsHint({ className = 'hint' }) {
  const [fetched, setFetched] = useState(null)
  const [ent] = useEntitlement()
  const premium = ent.premium
  useEffect(() => {
    if (!FEATURES.aiRelay) return undefined
    let alive = true
    refreshCredits().then((c) => {
      if (alive) setFetched(c)
    })
    return () => {
      alive = false
    }
  }, [premium])
  if (!FEATURES.aiRelay) return null
  // Le dernier état gardé suit chaque analyse ; celui relu au montage sert tant qu'aucune n'a eu lieu
  const text = describeCredits(getLastCredits() ?? fetched)
  return text ? <p className={`${className} ai-credits`} data-testid="ai-credits">{text}</p> : null
}
