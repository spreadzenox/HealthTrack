/**
 * Pilou dans Objectifs : 84 px à côté du titre, une phrase, aucun chiffre (SPEC comprendre § 6.1). Il ne saute pas
 * pour une baisse et n'est jamais triste. La phrase est le texte ; le dessin est décoratif.
 */
import PilouFigure from './PilouFigure'
import { guideLine } from './guide'

export default function PilouGuide({ card }) {
  const line = guideLine(card)
  return (
    <div className="pilou-guide" data-testid="pilou-guide">
      <PilouFigure size={84} expr={line.expr} move="none" />
      <p className="pilou-guide-text">{line.text}</p>
    </div>
  )
}
