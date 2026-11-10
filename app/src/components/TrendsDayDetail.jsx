/**
 * Détail d'un jour passé de Journal › Tendances (ORG-3c, revue design du 07/11, maquette validée) :
 * « Expressions du visage » en étoile à 8 branches (rayon en racine carrée, le jour en couleur pleine, l'habitude des
 * 28 jours en trait gris), « Humeur et éveil » (un point par lecture, la moyenne du jour, l'habitude en ellipse grise)
 * et « Ce qui a pu peser ce jour-là » (les 3 plus grandes contributions du modèle d'Analyses, barres de part et d'autre
 * de zéro, couleur du thème). Des estimations de l'expression du visage, jamais un diagnostic.
 */
import { contributionText, formatPoints } from '../services/trendsDay'
import { monoDigits } from '../utils/monoDigits'

const pct = (p) => `${Math.round(p * 100)} %`
const THEME_TONE = { wellbeing: 'mint', digestion: 'peach', nutrition: 'peach', activity: 'lilac', sleep: 'night', body: 'rose', context: 'stone' }

/** Étoile à 8 branches : rayon ∝ √part (une part double ne paraît pas quatre fois plus grande). */
export function ExpressionStar({ mix }) {
  const S = 220
  const c = S / 2
  const R = 64
  const order = ['exHappiness', 'exSurprise', 'exFear', 'exAnger', 'exDisgust', 'exContempt', 'exSadness', 'exNeutral']
  const items = order.map((k) => mix.items.find((it) => it.key === k)).filter(Boolean)
  const max = Math.sqrt(Math.max(...items.flatMap((it) => [it.p, it.habit ?? 0]), 0.01))
  const pt = (i, p) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / items.length
    const r = (Math.sqrt(Math.max(0, p)) / max) * R
    return [c + r * Math.cos(ang), c + r * Math.sin(ang)]
  }
  const poly = (key) => items.map((it, i) => pt(i, it[key] ?? 0).map((v) => v.toFixed(1)).join(',')).join(' ')
  const hasHabit = items.every((it) => typeof it.habit === 'number')
  return (
    <svg className="tdd-star" viewBox={`0 0 ${S} ${S}`} role="img"
      aria-label={`Expressions du visage : ${items.map((it) => `${it.label} ${pct(it.p)}`).join(', ')}`}>
      {items.map((it, i) => {
        const [x, y] = pt(i, max * max)
        return <line key={it.key} className="tdd-star-axis" x1={c} y1={c} x2={x} y2={y} />
      })}
      {hasHabit && <polygon className="tdd-star-habit" points={poly('habit')} />}
      <polygon className="tdd-star-day" points={poly('p')} />
      {items.map((it, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / items.length
        const x = c + (R + 22) * Math.cos(ang)
        const y = c + (R + 18) * Math.sin(ang)
        return (
          <text key={it.key} className="tdd-star-label" x={x} y={y} textAnchor="middle">
            <tspan x={x} dy="-0.2em">{it.label}</tspan>
            <tspan x={x} dy="1.15em" className="tdd-star-pct">{Math.round(it.p * 100)}</tspan><tspan>{'\u202f%'}</tspan>
          </text>
        )
      })}
    </svg>
  )
}

/** Carte valence × éveil : désagréable / agréable, calme / animé ; coins tendu, enjoué, las, détendu. */
export function MoodMap({ points, day, habit }) {
  // Carré de C × C, centré ; à gauche et à droite, la place de « désagréable » et « agréable » écrits à l'horizontale.
  const W = 280
  const C = 156
  const L = (W - C) / 2
  const T = 18
  const H = C + 2 * T
  const k = C / 2
  const x = (v) => L + ((v + 1) / 2) * C
  const y = (a) => T + ((1 - (a + 1) / 2)) * C
  return (
    <svg className="tdd-map" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Humeur et éveil : ${points.length} lectures`}>
      <rect className="tdd-map-frame" x={L} y={T} width={C} height={C} rx="10" />
      <line className="tdd-map-axis" x1={W / 2} x2={W / 2} y1={T} y2={T + C} />
      <line className="tdd-map-axis" x1={L} x2={L + C} y1={H / 2} y2={H / 2} />
      {habit && <ellipse className="tdd-map-habit" cx={x(habit.v)} cy={y(habit.a)} rx={Math.max(4, habit.sv * k)} ry={Math.max(4, habit.sa * k)} />}
      {points.map((p, i) => <circle key={i} className="tdd-map-dot" cx={x(p.v)} cy={y(p.a)} r="3" />)}
      {day && <circle className="tdd-map-mean" cx={x(day.v)} cy={y(day.a)} r="6" />}
      <text className="tdd-map-corner" x={L + 6} y={T + 13}>tendu</text>
      <text className="tdd-map-corner" x={L + C - 6} y={T + 13} textAnchor="end">enjoué</text>
      <text className="tdd-map-corner" x={L + 6} y={T + C - 6}>las</text>
      <text className="tdd-map-corner" x={L + C - 6} y={T + C - 6} textAnchor="end">détendu</text>
      <text className="tdd-map-edge" x={W / 2} y={T - 5} textAnchor="middle">animé</text>
      <text className="tdd-map-edge" x={W / 2} y={H - 3} textAnchor="middle">calme</text>
      <text className="tdd-map-edge" x={L - 6} y={H / 2 + 3} textAnchor="end">désagréable</text>
      <text className="tdd-map-edge" x={L + C + 6} y={H / 2 + 3} textAnchor="start">agréable</text>
    </svg>
  )
}

/**
 * « Ce qui a pu peser ce jour-là » : ce qui s'est passé (« Nuits plus courtes que d'habitude (6 h 21) », T4), barres de
 * part et d'autre de zéro, en points sur 5 (« −0,29 pt »), couleur du thème.
 */
export function ContributionBars({ items }) {
  const max = Math.max(...items.map((c) => Math.abs(c.points)), 0.1)
  return (
    <ul className="tdd-contrib">
      {items.map((c) => (
        <li key={c.key} data-tone={THEME_TONE[c.theme] ?? 'stone'}>
          <span className="tdd-contrib-label">{contributionText(c)}</span>
          <span className="tdd-contrib-track" aria-hidden="true">
            <span className="tdd-contrib-zero" />
            <span className="tdd-contrib-bar"
              style={c.points >= 0 ? { left: '50%', width: `${(c.points / max) * 50}%` } : { right: '50%', width: `${(-c.points / max) * 50}%` }} />
          </span>
          <span className="tdd-contrib-value">{monoDigits(formatPoints(c.points))}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * @param {{ face: ReturnType<typeof import('../services/trendsDay').dayFaceDetail> | null,
 *   contributions: object[] | null }} props
 */
export default function TrendsDayDetail({ face, contributions }) {
  return (
    <>
      {face?.mix && (
        <section className="tdd-block" aria-label="Expressions du visage">
          <h3 className="tdd-title">Expressions du visage</h3>
          <ExpressionStar mix={face.mix} />
          {(face.shifts || face.mix.habitDays) && (
            <p className="tdd-text">
              {[face.shifts && `${face.shifts}.`, face.mix.habitDays && 'Le trait gris montre votre habitude.'].filter(Boolean).join(' ')}
            </p>
          )}
        </section>
      )}
      {face?.points?.length > 0 && (
        <section className="tdd-block" aria-label="Humeur et éveil">
          <h3 className="tdd-title">Humeur et éveil</h3>
          <MoodMap points={face.points} day={face.day} habit={face.habit} />
          <p className="tdd-text">
            {[face.vaText && `${face.vaText}.`, face.habit ? 'Chaque point est une lecture ; la zone grise, votre habitude.' : 'Chaque point est une lecture.'].filter(Boolean).join(' ')}
          </p>
        </section>
      )}
      {contributions?.length > 0 && (
        <section className="tdd-block" aria-label="Ce qui a pu peser ce jour-là">
          <h3 className="tdd-title">Ce qui a pu peser ce jour-là</h3>
          <ContributionBars items={contributions} />
        </section>
      )}
    </>
  )
}
