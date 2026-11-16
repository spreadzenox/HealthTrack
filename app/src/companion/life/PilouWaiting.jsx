/**
 * Pilou attend à côté d'une piste à tester (SPEC comprendre § 6.5) : 80 px, paupières mi-closes, sans bulle. Le texte
 * dit qu'une piste se vérifie par un essai ; le dessin est décoratif.
 */
import PilouFigure from './PilouFigure'
import { useCompanionName } from './useCompanionName'

export default function PilouWaiting() {
  const name = useCompanionName()
  return (
    <div className="pilou-waiting" data-testid="pilou-waiting">
      <PilouFigure size={80} expr="reconfortant" move="none" />
      <p className="pilou-waiting-text">Une piste se vérifie par un essai. {name} vous accompagne.</p>
    </div>
  )
}
