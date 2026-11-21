/**
 * L'essai en cours, en une ligne qui ouvre sa page (POLISH-SIM-120 sous un objectif, POLISH-SIM-136 en haut
 * d'Objectifs) : la page d'un essai allume l'onglet Objectifs, on le retrouve donc là. `trial` : homeTrial().
 */
import { Link } from 'react-router-dom'
import LineIcon from './LineIcon'

export default function TrialLink({ trial, className = '', testId }) {
  if (!trial) return null
  return (
    <Link to={trial.to} className={`today-card act-card ${className}`.trim()} data-testid={testId}>
      <span className="act-card-body">
        <span className="act-card-title">Essai en cours : {trial.title}</span>
        <span className="act-card-detail">{trial.detail.replace(/^Essai · /, '')}</span>
      </span>
      <LineIcon name="chevron" size={20} className="act-chevron" />
    </Link>
  )
}
