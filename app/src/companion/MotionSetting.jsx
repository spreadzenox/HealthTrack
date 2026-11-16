/**
 * Réglage « Mouvements de Pilou » (brief § 7.7, SPEC personnage § 10) : comme le téléphone, réduits ou complets.
 * Réduits : plus de sauts, de flottement ni de particules ; Pilou garde ses expressions et ses clignements.
 * Caché quand la scène du compagnon est éteinte.
 */
import { useState } from 'react'
import { companionSceneEnabled } from './flags'
import { getReducedMotionSetting, setReducedMotionSetting } from './motion'

const CHOICES = [
  { value: 'auto', label: 'Automatiques' },
  { value: 'on', label: 'Réduits' },
  { value: 'off', label: 'Complets' },
]

export default function MotionSetting({ enabled = companionSceneEnabled() }) {
  const [value, setValue] = useState(getReducedMotionSetting)
  if (!enabled) return null
  const choose = (v) => {
    setReducedMotionSetting(v)
    setValue(v)
  }
  return (
    <div className="settings-block">
      <h3 className="section-title">Mouvements de Pilou</h3>
      <div className="theme-choices" role="radiogroup" aria-label="Mouvements de Pilou">
        {CHOICES.map((c) => (
          <label key={c.value} className={`theme-choice${value === c.value ? ' is-selected' : ''}`}>
            <input type="radio" name="pilou-motion" value={c.value} checked={value === c.value} onChange={() => choose(c.value)} />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
      <p className="hint">Automatiques : selon le réglage du téléphone. Réduits : Pilou ne saute plus, il garde ses expressions.</p>
    </div>
  )
}
