/**
 * Réglages › « Vos habitudes » (refonte « Compagnon », étape 4 ; brief § 3.3 et § 3.4) : les quatre proposées et
 * une habitude libre. Ma journée demande ensuite oui ou non, chaque jour. Retirer une habitude garde ses réponses.
 */
import { useState } from 'react'
import { SUGGESTED_HABITS, CUSTOM_PREFIX, MAX_HABIT_LABEL, customHabit } from '../services/habits'
import { getHabits, setHabits } from '../settings/habits'

export default function HabitsSetting() {
  const [habits, setList] = useState(() => getHabits())
  const [name, setName] = useState(() => getHabits().find((h) => h.id.startsWith(CUSTOM_PREFIX))?.label ?? '')
  const ids = habits.map((h) => h.id)
  const save = (next) => setList(setHabits(next))
  const toggle = (h) => save(ids.includes(h.id) ? habits.filter((x) => x.id !== h.id) : [...habits, h])
  const rename = (value) => {
    setName(value)
    const custom = customHabit(value)
    save([...habits.filter((h) => !h.id.startsWith(CUSTOM_PREFIX)), ...(custom ? [custom] : [])])
  }

  return (
    <div className="settings-block" id="habitudes">
      <h3 className="section-title">Vos habitudes</h3>
      <div className="theme-choices" role="group" aria-label="Vos habitudes">
        {SUGGESTED_HABITS.map((h) => (
          <label key={h.id} className={`theme-choice${ids.includes(h.id) ? ' is-selected' : ''}`}>
            <input type="checkbox" name="habits" value={h.id} checked={ids.includes(h.id)} onChange={() => toggle(h)} />
            <span>{h.label}</span>
          </label>
        ))}
      </div>
      <label className="input-label" htmlFor="habit-custom">Une autre habitude</label>
      <input id="habit-custom" type="text" className="settings-input" value={name} maxLength={MAX_HABIT_LABEL}
        placeholder="Son nom" autoComplete="off" onChange={(e) => rename(e.target.value)} />
      {/* Enregistrée à chaque lettre : sans ce retour, la persona croyait qu'il manquait un bouton (POLISH-HABITUDE-AJOUTEE) */}
      <p className="habit-added" aria-live="polite">{customHabit(name) ? 'Ajoutée à Ma journée' : ''}</p>
      <p className="hint">
        Partez de ce que vous faites déjà : ce n’est pas une liste de bonnes résolutions. Ma journée vous demande oui
        ou non chaque jour. Retirer une habitude garde vos réponses.
      </p>
    </div>
  )
}
