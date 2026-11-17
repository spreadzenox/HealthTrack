/**
 * Le cairn des galets (lot VIE, étape 12 ; specs/comprendre.SPEC.md § 6.3) : à côté de Pilou, un galet par famille,
 * la taille du galet = la force du lien ; le plus gros porte les autres. Un poids dit « ça compte », sans dire « bien »
 * ou « mal ». Décoratif : la liste « Par famille », juste dessous, dit la même chose en texte.
 */
import PilouFigure from './PilouFigure'
import { cairnStones } from './guide'

export default function Cairn({ families }) {
  const placed = cairnStones(families)
  if (!placed.length) return null
  const top = Math.floor(Math.min(...placed.map((g) => g.cy - g.r * 0.72))) - 2
  const height = 122 - top
  return (
    <div className="cairn" aria-hidden="true" data-testid="cairn">
      <svg viewBox={`30 ${top} 80 ${height}`} width="80" height={height} focusable="false">
        {placed.map((s) => (
          <ellipse key={s.id} cx={s.cx} cy={s.cy} rx={s.r * 1.25} ry={s.r * 0.72}
            fill={`var(--${s.tone}-${s.quiet ? 'track' : 'label'})`} opacity={s.quiet ? 0.6 : 1} />
        ))}
      </svg>
      <PilouFigure size={64} expr="content" move="none" />
    </div>
  )
}
