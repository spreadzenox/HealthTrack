import { useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { setPendingMealPhoto } from '../services/mealPhotoHandoff'

/**
 * Bouton « photo du repas » hors de la page Repas (TESTEUR-4b) : c'est le libellé d'un champ photo
 * (`capture="environment"`), donc le toucher ouvre directement l'appareil photo, sans passer par la page Repas.
 * La photo prise part ensuite vers la page Repas, qui l'affiche prête à analyser.
 */
export default function MealPhotoButton({ className, children, theme }) {
  const id = `meal-photo-${useId().replace(/:/g, '')}`
  const navigate = useNavigate()
  const inputRef = useRef(null)
  // Un label n'est pas atteignable au clavier : rôle bouton, Entrée et Espace ouvrent le champ.
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    inputRef.current?.click()
  }
  const onChange = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setPendingMealPhoto(f)
    navigate('/food')
  }
  return (
    <>
      <input ref={inputRef} id={id} type="file" accept="image/*" capture="environment" onChange={onChange}
        className="visually-hidden-input" data-testid="meal-photo-input" />
      <label htmlFor={id} className={className} data-theme={theme} role="button" tabIndex={0} onKeyDown={onKeyDown}>{children}</label>
    </>
  )
}
