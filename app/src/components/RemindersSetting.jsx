/**
 * Réglages › Rappels (POLISH-SIM-114) : les rappels déjà offerts ailleurs, regroupés là où l'on cherche à être peu
 * dérangé. Aucun nouveau rappel : la note de bien-être du soir (proposée dans la fenêtre de note), le bilan digestif
 * du soir (carte ventre) et la portion du jour d'une réintroduction (page Réintroduction) gardent leurs interrupteurs
 * et leurs préférences ; ce bloc ne fait que les montrer ensemble. Rien n'apparaît là où le téléphone ne sait pas
 * programmer de rappel (navigateur, plugin absent sur iPhone).
 */
import { useEffect, useState } from 'react'
import { APP_NAME } from '../config/brand'
import { FEATURES } from '../config/distribution'
import {
  DEFAULT_MINUTE,
  eveningNotePlugin,
  formatMinute,
  getEveningNoteStatus,
  isEveningNoteEnabled,
  setEveningNoteEnabled,
} from '../services/eveningNote'
import { gutEveningPlugin } from '../services/gutEvening'
import { portionReminderAvailable, portionReminderPrefs, setPortionReminder } from '../services/fodmapReminder'
import GutEveningReminder from './GutEveningReminder'

// FEATURES.iosStore n'existe que dans la version iPhone (variante appstore) : faux sur Android.
const BLOCKED = FEATURES.iosStore
  ? `Notifications refusées : autorisez-les dans Réglages › Notifications › ${APP_NAME}.`
  : `Notifications refusées : autorisez-les pour ${APP_NAME} dans les réglages Android.`

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="debug-toggle-row">
      <label className="connector-toggle" aria-label={label}>
        <input type="checkbox" checked={checked} onChange={onChange} aria-checked={checked} />
        <span className="toggle-track">
          <span className="toggle-thumb" />
        </span>
      </label>
      <span className="debug-toggle-label">{label}</span>
    </div>
  )
}

function EveningNoteRow() {
  const [on, setOn] = useState(() => isEveningNoteEnabled())
  const [minute, setMinute] = useState(null)
  const [hint, setHint] = useState(null)

  useEffect(() => {
    let alive = true
    getEveningNoteStatus().then((s) => {
      if (!alive || !s) return
      setOn(!!s.enabled)
      setMinute(s.minuteOfDay ?? null)
    })
    return () => {
      alive = false
    }
  }, [])

  const toggle = async () => {
    const next = !on
    setOn(next)
    setHint(null)
    try {
      const res = await setEveningNoteEnabled(next)
      setOn(res.enabled)
      if (res.blocked) setHint(BLOCKED)
      const s = await getEveningNoteStatus()
      if (s) setMinute(s.minuteOfDay ?? null)
    } catch {
      setOn(!next)
    }
  }

  return (
    <>
      <ToggleRow label="Note de bien-être, le soir" checked={on} onChange={toggle} />
      <p className="hint">Vers {formatMinute(minute ?? DEFAULT_MINUTE)}, seulement si vous n’avez pas déjà noté.</p>
      {hint && <p className="hint" role="alert">{hint}</p>}
    </>
  )
}

function PortionRow() {
  const [prefs, setPrefs] = useState(() => portionReminderPrefs())
  const [hint, setHint] = useState(null)

  const toggle = async () => {
    const next = { ...prefs, enabled: !prefs.enabled }
    setPrefs(next)
    setHint(null)
    const res = await setPortionReminder(next)
    if (res.blocked) setHint(BLOCKED)
  }

  return (
    <>
      <ToggleRow label="Portion du jour, pendant une réintroduction" checked={prefs.enabled} onChange={toggle} />
      <p className="hint">Chaque jour de test vers {formatMinute(prefs.minute)}. L’heure se change dans Réintroduction.</p>
      {hint && <p className="hint" role="alert">{hint}</p>}
    </>
  )
}

export default function RemindersSetting({ gutGoal = false }) {
  const evening = !!eveningNotePlugin()
  const portion = portionReminderAvailable()
  const gut = gutGoal && !!gutEveningPlugin()
  if (!evening && !portion && !gut) return null
  return (
    <div className="settings-block" role="region" aria-label="Rappels">
      <h3 className="section-title">Rappels</h3>
      {evening && <EveningNoteRow />}
      {gut && <GutEveningReminder variant="setting" />}
      {portion && <PortionRow />}
    </div>
  )
}
