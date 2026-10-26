import { Link } from 'react-router-dom'

/** Carte lilas d'Analyses (objectif « Mon ventre ») qui ouvre la réintroduction guidée (jalon 7b). */
export default function ReintroductionEntry() {
  return (
    <Link to="/reintroduction" className="today-card fodmap-card fodmap-entry" data-testid="reintro-entry">
      <span className="today-card-title">Tester un groupe FODMAP</span>
      <p className="fodmap-entry-line">3 jours, des portions croissantes : l’app vous dit ce qui passe. ›</p>
    </Link>
  )
}
