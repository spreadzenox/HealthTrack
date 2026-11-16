/**
 * Petit Pilou en 2D (lot VIE) : l'emplacement des images pré-rendues que fournira le lot PILOU (brief § 7.9 : les
 * petits Pilou sont des images, pas un second canevas). En attendant, un dessin vectoriel simple aux couleurs de la
 * planche (corps menthe, ventre crème, antenne et point ambre, joues, montre indigo), sans contour brun. Toujours
 * décoratif (aria-hidden) : ce qu'il exprime est aussi écrit à côté (brief § 8).
 *
 * `move` choisit une petite animation CSS (saut, haussement, méditation…), coupée par les mouvements réduits : il
 * garde alors son expression et ses clignements (PilouFigure.css).
 */
import { wearsWatch } from './companionState'
import './life.tokens.css'
import './PilouFigure.css'

const LAUGH = new Set(['rayonnant', 'content', 'fier', 'salut', 'rassasie'])
const CLOSED = new Set(['endormi', 'absorbe'])

function Eyes({ expr }) {
  if (CLOSED.has(expr)) {
    return (
      <g className="pilou-eyes" stroke="#2B1D16" strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path d="M33 47 q6 5 12 0" />
        <path d="M55 47 q6 5 12 0" />
      </g>
    )
  }
  if (LAUGH.has(expr)) {
    return (
      <g className="pilou-eyes" stroke="#2B1D16" strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M33 48 q6 -7 12 0" />
        <path d="M55 48 q6 -7 12 0" />
      </g>
    )
  }
  const r = expr === 'surpris' || expr === 'curieux' ? 7.4 : 6.4
  const lid = expr === 'reconfortant' ? 0.55 : 1
  return (
    <g className="pilou-eyes pilou-blink">
      <ellipse cx="39" cy="46" rx={r * 0.9} ry={r * lid} fill="#24170F" />
      <ellipse cx="61" cy="46" rx={r * 0.9} ry={r * lid} fill="#24170F" />
      <circle cx="41" cy={46 - r * 0.35 * lid} r="1.9" fill="#FFF7EA" />
      <circle cx="63" cy={46 - r * 0.35 * lid} r="1.9" fill="#FFF7EA" />
    </g>
  )
}

function Mouth({ expr }) {
  if (expr === 'surpris' || expr === 'curieux') return <ellipse cx="50" cy="60" rx="3.4" ry="4" fill="#7A3B33" />
  if (expr === 'rayonnant' || expr === 'fier') return <path d="M42 57 q8 10 16 0 z" fill="#7A3B33" />
  if (expr === 'rassasie') return <path d="M43 59 q3.5 3 7 0 q3.5 3 7 0" stroke="#7A3B33" strokeWidth="2.6" fill="none" strokeLinecap="round" />
  if (expr === 'endormi' || expr === 'absorbe') return <path d="M46 59 q4 3 8 0" stroke="#7A3B33" strokeWidth="2.4" fill="none" strokeLinecap="round" />
  return <path d="M43 57 q7 7 14 0" stroke="#7A3B33" strokeWidth="2.8" fill="none" strokeLinecap="round" />
}

/**
 * @param {{ size?: number, expr?: string, move?: string, watch?: boolean, className?: string }} props
 */
export default function PilouFigure({ size = 66, expr = 'tranquille', move = 'none', watch, className = '' }) {
  const withWatch = watch ?? wearsWatch()
  return (
    <span className={`pilou-figure pilou-move-${move} ${className}`.trim()} data-expr={expr} aria-hidden="true"
      style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} focusable="false">
        <g className="pilou-body">
          {/* antenne : la courbe montante du logo, terminée par le point ambre */}
          <path className="pilou-antenna" d="M50 22 C 50 14, 56 9, 62 7" stroke="#33B989" strokeWidth="3.6" fill="none" strokeLinecap="round" />
          <circle className="pilou-amber" cx="63" cy="6.5" r="4.6" fill="#FFB84D" />
          {/* pieds plats */}
          <ellipse cx="38" cy="90" rx="10" ry="4.6" fill="#4FC097" />
          <ellipse cx="62" cy="90" rx="10" ry="4.6" fill="#4FC097" />
          {/* corps en galet (largeur 0,87) */}
          <path d="M50 21 C 72 21, 85 40, 85 62 C 85 80, 70 90, 50 90 C 30 90, 15 80, 15 62 C 15 40, 28 21, 50 21 Z" fill="#78D8B4" />
          <ellipse cx="50" cy="72" rx="20" ry="15" fill="#FFF1DC" />
          {/* bras */}
          <path className="pilou-arm-l" d="M17 60 q-8 6 -6 14" stroke="#78D8B4" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path className="pilou-arm-r" d="M83 60 q8 6 6 14" stroke="#78D8B4" strokeWidth="7" strokeLinecap="round" fill="none" />
          {withWatch && <rect x="85" y="65" width="7" height="5" rx="1.6" fill="#5B5F9E" transform="rotate(28 88 67)" />}
          {/* joues */}
          <ellipse cx="31" cy="56" rx="5.5" ry="3.4" fill="#FF8A8A" opacity="0.7" />
          <ellipse cx="69" cy="56" rx="5.5" ry="3.4" fill="#FF8A8A" opacity="0.7" />
          <Eyes expr={expr} />
          <Mouth expr={expr} />
        </g>
      </svg>
    </span>
  )
}
