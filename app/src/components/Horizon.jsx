import { Link } from 'react-router-dom'
import { HORIZONS } from '../services/horizons'

/** Titre d'un horizon d'effet (ANALYSES-ONGLETS-3) : le délai en titre, une ligne pour dire ce qu'il compare. */
export function HorizonHeading({ id, hint }) {
  const h = HORIZONS.find((x) => x.id === id)
  return (
    <div className="horizon-heading" data-testid={`horizon-${id}`}>
      <p className="horizon-title">{h.title}</p>
      <p className="horizon-hint">{hint ?? h.hint}</p>
    </div>
  )
}

/** Le long terme du bien-être vit dans Tendances : une ligne pour y aller, en bas de l'onglet Bien-être. */
export function WeeksHorizon() {
  return (
    <section className="horizon-weeks">
      <HorizonHeading id="weeks" />
      <Link to="/tendances" className="horizon-link">Voir vos tendances ›</Link>
    </section>
  )
}
