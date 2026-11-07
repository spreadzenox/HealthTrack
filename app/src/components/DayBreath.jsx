/**
 * « Horizon qui respire » (TESTEUR-1e, maquette journal/maquettes/aujourdhui §4) : deux disques menthe qui gonflent
 * doucement, une courbe dont la pente suit le statut du jour (monte, plate, descend : écho de la barre du logo) et un
 * point ambre qui flotte dessus. Purement décoratif (aria-hidden), CSS seul, immobile avec « réduire les animations ».
 */
import { BREATH_CURVES, BREATH_DOT_Y } from './dayBreathCurves'
import './DayBreath.css'

/** @param {{ level: 'good'|'medium'|'hard'|null }} props */
export default function DayBreath({ level }) {
  if (!BREATH_CURVES[level]) return null
  return (
    <div className="day-breath" data-level={level}>
      <svg viewBox="0 0 80 60" width="80" height="60" aria-hidden="true" focusable="false">
        <circle className="day-breath-disc day-breath-disc-outer" cx="40" cy="30" r="26" />
        <circle className="day-breath-disc day-breath-disc-inner" cx="40" cy="30" r="17" />
        <path className="day-breath-curve" d={BREATH_CURVES[level]} />
        <circle className="day-breath-dot" cx="40" cy={BREATH_DOT_Y[level]} r="4.5" />
      </svg>
    </div>
  )
}
