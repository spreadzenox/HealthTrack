/**
 * Petit « + » sous un bloc de l'Accueil (AUJ-6, revue design du 07/11) : il remonte au bandeau d'ajout, le seul vrai
 * endroit pour ajouter (leçon 7 : une action, un endroit principal). Un bloc qui attend la personne (calibration,
 * analyses, repas vides) a plutôt un bouton large vers la même saisie.
 */
import LineIcon from './LineIcon'
import { scrollToStrip } from '../utils/scrollToStrip'
import './StripPlus.css'

export default function StripPlus({ label = 'Ajouter' }) {
  return (
    <div className="strip-plus-row">
      <button type="button" className="strip-plus" aria-label={label} onClick={() => scrollToStrip()}>
        <LineIcon name="plus" size={18} />
      </button>
    </div>
  )
}
