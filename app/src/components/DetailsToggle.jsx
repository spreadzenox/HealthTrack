/**
 * Bouton « détails » des cartes de l'accueil (principe « simple par défaut, détails sur demande », DESIGN.md) :
 * un seul réglage pour toute la page (hooks/useDetailsMode.js), retenu d'une ouverture à l'autre.
 */
import './DetailsToggle.css'

export default function DetailsToggle({ on, onToggle }) {
  if (!onToggle) return null
  return (
    <button type="button" className="details-toggle mono" aria-pressed={on} onClick={onToggle}>
      {on ? 'simple' : 'détails'}
    </button>
  )
}
