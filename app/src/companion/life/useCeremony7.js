import { useEffect, useRef, useState } from 'react'
import { loadCompanion, markCeremony, saveCompanion } from './companionState'
import { digestionDaysLeft, wellbeingScoreReady } from './guide'
import { gutCardMode } from '../../settings/onboarding'
import { isExampleMode } from '../../storage/exampleMode'
import { bus, EVENTS } from '../bus'

const readStates = () => import('../../services/analysisRunner').then(({ getAnalysis }) => getAnalysis('dayStates'))
/** Écrans où la cérémonie peut s'ouvrir : l'Accueil et Objectifs. */
const PLACES = new Set(['/', '/recommendations'])

/**
 * La cérémonie du jour 7, une seule fois (SPEC comprendre § 5 et § 12). Au premier regard après la rencontre, si le
 * premier score existe déjà (utilisateur d'avant la refonte, sauvegarde importée), elle est notée « déjà passée » :
 * on ne fête pas une semaine vécue avant Pilou. Jamais pendant l'exemple de la visite guidée.
 * @returns {[ { gutDaysLeft: number|null } | null, () => void ]}
 */
export function useCeremony7(pathname, enabled, { read = readStates, now } = {}) {
  const [due, setDue] = useState(null)
  const checking = useRef(false)
  useEffect(() => {
    const s = loadCompanion()
    if (!enabled || !PLACES.has(pathname) || !s.metAt || s.ceremony7At || checking.current || isExampleMode()) return undefined
    checking.current = true
    let alive = true
    Promise.resolve()
      .then(read)
      .then((states) => {
        const at = now || new Date()
        const ready = wellbeingScoreReady(states, at)
        if (!loadCompanion().ceremony7Checked) {
          if (ready) markCeremony('already', at)
          else saveCompanion({ ceremony7Checked: true })
          return
        }
        if (ready && alive && !isExampleMode()) setDue({ gutDaysLeft: digestionDaysLeft(states, gutCardMode() === 'show', at) })
      })
      .catch(() => {})
      .finally(() => {
        checking.current = false
      })
    return () => {
      alive = false
    }
  }, [pathname, enabled, read, now])
  const done = () => {
    markCeremony('shown')
    bus.emit(EVENTS.MILESTONE, { kind: 'day7' })
    setDue(null)
  }
  return [due, done]
}
