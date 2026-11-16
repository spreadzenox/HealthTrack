/**
 * Réglages › Pilou (lot VIE, étape 12) : changer son nom (SPEC comprendre § 3 : « Vous pourrez changer son
 * nom dans Réglages »). Enregistré sur le téléphone, dans l'export ; jamais vide (« Pilou » par défaut).
 */
import { useState } from 'react'
import PilouFigure from './PilouFigure'
import { MAX_NAME, cleanName, setCompanionName } from './companionState'
import { useCompanionName } from './useCompanionName'
import { bus, EVENTS } from '../bus'

export default function CompanionNameSetting() {
  const name = useCompanionName()
  const [value, setValue] = useState(name)
  const [saved, setSaved] = useState(false)
  const clean = cleanName(value)
  const save = (e) => {
    e.preventDefault()
    if (!clean || clean === name) return
    setCompanionName(clean)
    bus.emit(EVENTS.PILOU_NAMED, { name: clean })
    setValue(clean)
    setSaved(true)
  }
  return (
    <div className="settings-block companion-setting">
      <h3 className="section-title">Pilou</h3>
      <form className="companion-name-form" onSubmit={save}>
        <PilouFigure size={56} expr="content" />
        <label className="companion-name-label">
          <span>Son nom</span>
          <input className="settings-input" type="text" value={value} maxLength={MAX_NAME + 10} autoComplete="off"
            onChange={(e) => { setValue(e.target.value); setSaved(false) }} />
        </label>
        <button type="submit" className="btn" disabled={!clean || clean === name}>Enregistrer</button>
      </form>
      {saved && <p className="hint" role="status">C’est noté : il s’appelle {name}.</p>}
    </div>
  )
}
