/**
 * « Voir un exemple » (ACC-8), en bas des écrans encore vides : relance la visite guidée. Montré les 14 premiers jours
 * après l'accueil (FIRST_RESULTS_DAY.wellbeing), tant que les premiers résultats ne sont pas là.
 */
import { useLocation } from 'react-router-dom'
import { startTour, stillEmpty } from '../services/tour'
import './SeeExample.css'

export default function SeeExample() {
  const { pathname } = useLocation()
  if (!stillEmpty()) return null
  return (
    <p className="see-example">
      <button type="button" className="see-example-btn" onClick={() => startTour(pathname)}>
        Voir un exemple
      </button>
    </p>
  )
}
