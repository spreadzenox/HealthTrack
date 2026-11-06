import { Link } from 'react-router-dom'
import { HORIZONS } from '../services/horizons'
import { formatSigned } from '../utils/format'

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

/**
 * Bien-être « dans les heures » (ANALYSES-ONGLETS-5) : lectures du visage dans les 2 h après un repas, comparées au
 * reste du même jour (services/mood/mealHours.js). Rien sans lecture du visage ni repas noté ; un compteur tant que
 * les jours manquent ; un écart dit seulement s'il est net, sans sens présupposé ni conseil (règle 6).
 */
export function MealHoursHorizon({ result }) {
  if (!result || result.status === 'no_face' || result.status === 'no_meals') return null
  let body
  if (result.status === 'not_enough_data') {
    body = (
      <p className="horizon-line horizon-line--soon">
        Après un repas : arrive avec {result.minDays} jours de lectures du visage avant et après vos repas
        <span className="horizon-num"> ({result.currentDays} / {result.minDays})</span>.
      </p>
    )
  } else if (result.clear) {
    body = (
      <p className="horizon-line">
        Dans les 2 h après un repas, votre bien-être estimé est un peu plus {result.shift > 0 ? 'haut' : 'bas'} que
        le reste de la journée.
        <span className="horizon-num"> {formatSigned(result.shift, 1)} point · {result.days} jours</span>
      </p>
    )
  } else {
    body = (
      <p className="horizon-line">
        Pas de différence nette entre les 2 h après un repas et le reste de la journée.
        <span className="horizon-num"> {result.days} jours</span>
      </p>
    )
  }
  return (
    <section className="horizon-hours" data-testid="meal-hours">
      <HorizonHeading id="hours" hint="Votre bien-être estimé par le visage, juste après vos repas." />
      {body}
    </section>
  )
}
