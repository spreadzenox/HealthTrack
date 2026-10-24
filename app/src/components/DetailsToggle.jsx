/**
 * Chevron « détails » des cartes (principe « simple par défaut, détails sur demande », DESIGN.md) : un rond discret
 * qui pivote quand les détails sont ouverts (POL-3 : le bouton texte « simple / détails » était jugé peu ergonomique).
 * Sur l'Accueil, un seul réglage pour toute la page (hooks/useDetailsMode.js), retenu d'une ouverture à l'autre.
 */
import LineIcon from './LineIcon'
import './DetailsToggle.css'

export default function DetailsToggle({ on, onToggle }) {
  if (!onToggle) return null
  return (
    <button type="button" className="details-toggle" aria-expanded={on}
      aria-label={on ? 'Masquer les détails' : 'Afficher les détails'} onClick={onToggle}>
      <span className="details-toggle-dot"><LineIcon name="chevron" size={18} /></span>
    </button>
  )
}
