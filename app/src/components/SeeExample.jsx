/**
 * « Voir un exemple » (ACC-8), en bas des écrans encore vides : relance la visite guidée. Montré les 14 premiers jours
 * après l'accueil (FIRST_RESULTS_DAY.wellbeing), tant que les premiers résultats ne sont pas là.
 */
import { startTour, stillEmpty } from '../services/tour'
import './SeeExample.css'

export default function SeeExample() {
  if (!stillEmpty()) return null
  return (
    <p className="see-example">
      <button type="button" className="see-example-btn" onClick={startTour}>
        Voir un exemple
      </button>
    </p>
  )
}
