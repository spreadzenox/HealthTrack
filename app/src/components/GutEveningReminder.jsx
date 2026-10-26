/**
 * Rappel du bilan du ventre du soir (I170 étape 2), deux formes :
 * - `offer` (carte « Votre ventre ») : une ligne discrète « Me le demander chaque soir » tant que le rappel n'est pas
 *   choisi ; rien hors de l'app Android ;
 * - `setting` (Paramètres → Ce qui vous amène) : l'interrupteur, avec l'heure prévue.
 * Le choix est gardé même si l'objectif change ; sans carte ventre, le natif ne programme rien (gutEvening.js).
 */
import { useEffect, useState } from 'react'
import { APP_NAME } from '../config/brand'
import { formatMinute } from '../services/eveningNote'
import {
  GUT_DEFAULT_MINUTE,
  getGutEveningStatus,
  gutEveningPlugin,
  isGutEveningWanted,
  setGutEveningEnabled,
} from '../services/gutEvening'

const BLOCKED = `Notifications refusées : autorisez-les pour ${APP_NAME} dans les réglages Android.`

export default function GutEveningReminder({ variant = 'offer' }) {
  const available = !!gutEveningPlugin()
  const [wanted, setWanted] = useState(() => isGutEveningWanted())
  const [status, setStatus] = useState(null)
  const [hint, setHint] = useState(null)
  const [justOn, setJustOn] = useState(false)

  useEffect(() => {
    let alive = true
    if (available) getGutEveningStatus().then((s) => alive && setStatus(s))
    return () => {
      alive = false
    }
  }, [available])

  if (!available) return null
  const time = formatMinute(status?.minuteOfDay ?? GUT_DEFAULT_MINUTE)

  const toggle = async (on) => {
    setWanted(on)
    setHint(null)
    try {
      const res = await setGutEveningEnabled(on)
      if (res.blocked) setHint(BLOCKED)
      setJustOn(on)
      setStatus(await getGutEveningStatus())
    } catch {
      setWanted(!on)
    }
  }

  if (variant === 'setting') {
    return (
      <>
        <div className="debug-toggle-row">
          <label className="connector-toggle" aria-label="Rappel du bilan du ventre, le soir">
            <input type="checkbox" checked={wanted} onChange={() => toggle(!wanted)} aria-checked={wanted} />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </label>
          <span className="debug-toggle-label">Bilan du ventre le soir, d’un geste depuis une notification</span>
        </div>
        <p className="hint">Vers {time}, seulement si le bilan du jour n’est pas déjà fait.</p>
        {hint && <p className="hint" role="alert">{hint}</p>}
      </>
    )
  }

  if (wanted && !justOn) return null
  return (
    <>
      {wanted ? (
        <p className="gut-evening-reminder-done">C’est noté : rappel chaque soir vers {time}. Réglable dans Paramètres.</p>
      ) : (
        <button type="button" className="gut-evening-reminder" onClick={() => toggle(true)}>
          Me le demander chaque soir par notification
        </button>
      )}
      {hint && <p className="gut-evening-reminder-done" role="alert">{hint}</p>}
    </>
  )
}
