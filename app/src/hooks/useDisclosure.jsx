/**
 * Divulgation avant une autorisation sensible (jalon 3b) : `askConsent(kind)` affiche la feuille
 * PermissionDisclosure et résout `true` sur l'accord explicite, `false` sur « Pas maintenant ».
 */
import { useCallback, useState } from 'react'
import { PermissionDisclosure } from '../components/PermissionDisclosure'
import { disclosureFor } from '../config/permissionDisclosures'

/** [élément à rendre, askConsent(kind) → Promise<boolean>] */
export default function useDisclosure() {
  const [pending, setPending] = useState(null)
  const askConsent = useCallback((kind) => {
    disclosureFor(kind)
    return new Promise((resolve) => setPending({ kind, resolve }))
  }, [])
  const answer = (ok) => {
    pending?.resolve(ok)
    setPending(null)
  }
  const element = pending
    ? <PermissionDisclosure kind={pending.kind} onAccept={() => answer(true)} onDecline={() => answer(false)} />
    : null
  return [element, askConsent]
}
