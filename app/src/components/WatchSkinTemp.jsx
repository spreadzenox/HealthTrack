/**
 * Réglage « mesure continue de la température de la peau » de la montre (M3, journal/protocoles/huawei.md §10.10) :
 * désactivé par défaut (ça use la batterie), choisi par l'utilisateur, envoyé à la montre à la prochaine synchro.
 */
import { useState } from 'react'
import { getSkinTempContinuous, setSkinTempContinuous } from '../services/watchSync'

function describe(state) {
  if (state.wanted == null) return 'Désactivée tant que vous ne l’activez pas.'
  if (state.outcome === 'unsupported') return 'Votre montre ne propose pas ce réglage : elle envoie ce qu’elle mesure déjà.'
  if (state.outcome === 'refused') return 'La montre a refusé le réglage. Il sera renvoyé à la prochaine synchronisation.'
  if (state.applied === state.wanted && state.outcome === 'applied') return state.wanted ? 'Activée sur la montre.' : 'Désactivée sur la montre.'
  return 'Envoyé à la montre à la prochaine synchronisation.'
}

export default function WatchSkinTemp({ storage = globalThis.localStorage }) {
  const [state, setState] = useState(() => getSkinTempContinuous(storage))
  const on = state.wanted === true
  return (
    <div className="watch-setting">
      <div className="debug-toggle-row">
        <label className="connector-toggle">
          <input type="checkbox" checked={on} onChange={() => setState(setSkinTempContinuous(!on, storage))} aria-checked={on} aria-label="Mesure continue de la température de la peau" />
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
        </label>
        <span className="debug-toggle-label">Mesure continue de la température de la peau</span>
      </div>
      <p className="hint">
        La montre mesure la température de votre poignet jour et nuit (un peu plus de batterie). Ce n’est pas une température
        corporelle. {describe(state)}
      </p>
    </div>
  )
}
