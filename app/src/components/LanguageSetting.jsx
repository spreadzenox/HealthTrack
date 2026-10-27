import { useState } from 'react'
import { getLangChoice, setLangChoice } from '../i18n/locale.js'

// Les noms des langues restent dans leur propre langue (« English » même en français) : c'est ce qu'on cherche
// quand l'app n'est pas dans la sienne.
const LANGUAGE_CHOICES = [
  { value: 'auto', label: 'Automatique (langue du téléphone)' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

/**
 * Réglage « Langue » des Paramètres (jalon 9). Le changement recharge l'app : les dates et les nombres mis en forme
 * au chargement suivent ainsi la nouvelle langue. Aucune donnée n'est touchée.
 */
export default function LanguageSetting({ reload = () => window.location.reload() }) {
  const [choice, setChoice] = useState(getLangChoice)

  const handle = (value) => {
    if (value === choice) return
    setChoice(value)
    setLangChoice(value)
    reload()
  }

  return (
    <div className="settings-block">
      <h3 className="section-title">Langue</h3>
      <div className="theme-choices" role="radiogroup" aria-label="Langue">
        {LANGUAGE_CHOICES.map((c) => (
          <label key={c.value} className={`theme-choice${choice === c.value ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name="lang"
              value={c.value}
              checked={choice === c.value}
              onChange={() => handle(c.value)}
            />
            <span lang={c.value === 'en' ? 'en' : undefined}>{c.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
