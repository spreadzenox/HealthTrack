/**
 * Section « Noter » de l'Accueil (TESTEUR-1d, retours du testeur iPhone du 06/11, maquette
 * journal/maquettes/aujourdhui §2.5) : le seul endroit où l'on note. « Photo du repas » est l'action principale ;
 * « Mon bien-être » (menthe) ouvre la note de 1 à 5 ; la carte ventre (pêche) suit, seulement si elle est montrée
 * (objectif « Mon ventre », POL-4) ; « Autre chose » réunit les gestes sans thème (cigarette si le compteur est actif).
 * Une couleur garde son sens : menthe = bien-être, pêche = ventre, surface neutre = le reste.
 */
import MealPhotoButton from './MealPhotoButton'
import LineIcon from './LineIcon'
import './NoteSection.css'

/**
 * @param {{ onWellbeing: () => void, gut?: import('react').ReactNode, other?: import('react').ReactNode }} props
 */
export default function NoteSection({ onWellbeing, gut = null, other = null }) {
  return (
    <section className="today-note" aria-labelledby="today-note-title">
      <h2 id="today-note-title" className="today-note-title">Noter</h2>
      {/* TESTEUR-4b : ouvre directement l'appareil photo ; la photo part ensuite vers la page Repas. */}
      <MealPhotoButton className="btn today-note-photo">
        <LineIcon name="camera" size={22} />
        Photo du repas
      </MealPhotoButton>
      <button type="button" className="today-note-tile is-wellbeing" onClick={onWellbeing}>
        <LineIcon name="pen" size={20} />
        <span className="today-note-tile-label">Mon bien-être</span>
        <span className="today-note-tile-hint mono">1 à 5</span>
      </button>
      {gut}
      {other && (
        <div className="today-note-other" role="group" aria-label="Autre chose">
          <span className="today-note-other-label">Autre chose</span>
          {other}
        </div>
      )}
    </section>
  )
}
