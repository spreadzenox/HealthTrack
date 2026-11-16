/**
 * Petite tête de Pilou dans Données (SPEC comprendre § 8) : 64 px, seule la tête dépasse du bord de la carte ; il ne
 * saute pas, ne parle pas. Décoratif : Données reste l'écran des chiffres.
 */
import PilouFigure from './PilouFigure'

export default function PilouPeek() {
  return (
    <div className="pilou-peek" aria-hidden="true" data-testid="pilou-peek">
      <PilouFigure size={64} expr="curieux" move="none" />
    </div>
  )
}
