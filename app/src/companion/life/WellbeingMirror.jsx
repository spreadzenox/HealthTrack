/**
 * Le miroir du bien-être (lot VIE, étape 11 ; specs/journee.SPEC.md § 4) : sous l'échelle, Pilou prend la pose du cran
 * choisi et dit sa phrase. « Difficile » le rend tendre (il reste près de vous), jamais triste. Le mot du cran est
 * écrit : le dessin n'est que décoratif.
 */
import PilouFigure from './PilouFigure'
import { WELLBEING_MIRROR } from './lines'
import './WellbeingMirror.css'

export default function WellbeingMirror({ choice }) {
  const m = WELLBEING_MIRROR[choice]
  if (!m) return null
  return (
    <div className="wellbeing-mirror" data-testid="wellbeing-mirror">
      <PilouFigure key={choice} size={56} expr={m.expr} move={choice >= 4 ? 'hop' : 'none'} />
      <p className="wellbeing-mirror-text">
        <span className="wellbeing-mirror-word">{m.word}</span>
        <span>{m.text}</span>
      </p>
    </div>
  )
}
