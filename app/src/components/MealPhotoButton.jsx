import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setPendingMealPhoto } from '../services/mealPhotoHandoff'
import LineIcon from './LineIcon'

/**
 * Bouton « photo du repas » hors de la page Repas (TESTEUR-4b) : c'est le libellé d'un champ photo
 * (`capture="environment"`), donc le toucher ouvre directement l'appareil photo, sans passer par la page Repas.
 * La photo prise part ensuite vers la page Repas, qui l'affiche prête à analyser.
 * POLISH-SIM-17 : si l'appareil photo se ferme sans photo (annulé, refusé ou absent), un bandeau propose
 * de décrire le repas à la place, au lieu de ne rien montrer.
 */
const HINT_MS = 8000

export default function MealPhotoButton({ className, children, theme }) {
  const id = `meal-photo-${useId().replace(/:/g, '')}`
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [missed, setMissed] = useState(false)
  // L'événement `cancel` d'un champ fichier n'a pas d'attribut React : écouteur posé à la main.
  useEffect(() => {
    const input = inputRef.current
    if (!input) return undefined
    const onCancel = () => setMissed(true)
    input.addEventListener('cancel', onCancel)
    return () => input.removeEventListener('cancel', onCancel)
  }, [])
  useEffect(() => {
    if (!missed) return undefined
    const t = setTimeout(() => setMissed(false), HINT_MS)
    return () => clearTimeout(t)
  }, [missed])
  // Un label n'est pas atteignable au clavier : rôle bouton, Entrée et Espace ouvrent le champ.
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    inputRef.current?.click()
  }
  const onChange = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) { setMissed(true); return }
    setMissed(false)
    setPendingMealPhoto(f)
    navigate('/food')
  }
  return (
    <>
      <input ref={inputRef} id={id} type="file" accept="image/*" capture="environment" onChange={onChange}
        className="visually-hidden-input" data-testid="meal-photo-input" />
      <label htmlFor={id} className={className} data-theme={theme} role="button" tabIndex={0} onKeyDown={onKeyDown}>{children}</label>
      {missed && (
        <div className="meal-photo-missed" role="status">
          <span>Aucune photo prise.</span>
          <Link to="/food" state={{ describeMeal: true }} className="meal-photo-missed-link">Décrire le repas</Link>
          <button type="button" className="meal-photo-missed-close" aria-label="Fermer" onClick={() => setMissed(false)}>
            <LineIcon name="close" size={18} />
          </button>
        </div>
      )}
    </>
  )
}
