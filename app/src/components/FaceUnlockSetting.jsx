/**
 * Paramètres → « Lecture au déverrouillage » (POL-1c, journal/PLAY-CONFORMITE.md §1 bis) : un réglage pour la couper
 * à tout moment, ailleurs que dans la notification et la carte de Sources. Rien n'est affiché si la version n'a pas
 * cette lecture (sideload : elle se règle dans Sources ; play sans l'interrupteur de build). L'activation, elle,
 * reste dans Sources, derrière sa divulgation : ici on ne peut que couper.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { describeFaceUnlock, faceSensePlugin, getFaceSenseStatus, stopFaceUnlock } from '../services/faceSense'

export default function FaceUnlockSetting({ plugin = faceSensePlugin() }) {
  const [unlock, setUnlock] = useState(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setUnlock(describeFaceUnlock(await getFaceSenseStatus(plugin)))
  }, [plugin])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (!unlock) return null
  const active = unlock.state !== 'off'

  async function turnOff() {
    setBusy(true)
    try {
      await stopFaceUnlock(plugin)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="settings-block">
      <h3 className="section-title">Lecture au déverrouillage</h3>
      {active ? (
        <>
          <div className="debug-toggle-row">
            <label className="connector-toggle">
              <input
                type="checkbox"
                role="switch"
                aria-label="Lecture du visage à chaque déverrouillage"
                checked
                aria-checked="true"
                onChange={turnOff}
                disabled={busy}
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </label>
            <span className="debug-toggle-label">
              {unlock.state === 'on' ? 'Active à chaque déverrouillage' : 'En pause (arrêtée par Android)'}
            </span>
          </div>
          <p className="hint">
            Coupez-la ici quand vous voulez. La lecture à l’ouverture de l’app continue ; vos lectures gardées ne sont
            pas effacées.
          </p>
        </>
      ) : (
        <p className="hint">
          Coupée. Pour plus de lectures par jour, activez-la dans{' '}
          <Link to="/connectors">Sources → Lecture du visage</Link>.
        </p>
      )}
    </div>
  )
}
