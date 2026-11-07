import { HORIZONS } from '../services/horizons'
import { formatSigned } from '../utils/format'
import { decimalMark } from '../i18n/locale.js'
import {
  WELLBEING_WEEKS_MIN, shownWellbeingWeeks, wellbeingWeekLabel, wellbeingWeeksReady,
} from '../services/mood/wellbeingWeeks'

const shortDay = (key) => {
  const [, m, d] = key.split('-')
  return `${d}/${m}`
}

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

/**
 * Bien-être « Sur quelques semaines » (retours du 04/11, point 4) : une colonne par semaine, la barre = bien-être estimé
 * moyen (même note du jour que l'historique), le point = moyenne de vos notes, jamais mêlés. Huit semaines au plus, à
 * partir de la première semaine lue ou notée (services/mood/wellbeingWeeks.js). Description seulement.
 */
export function WellbeingWeeks({ weeks }) {
  const ready = wellbeingWeeksReady(weeks)
  const shown = ready ? shownWellbeingWeeks(weeks) : []
  const withNotes = shown.some((w) => w.note != null)
  return (
    <section className="horizon-weeks wb-weeks" data-testid="wellbeing-weeks">
      <HorizonHeading id="weeks" hint="Votre bien-être moyen, semaine par semaine." />
      {!ready && (
        <p className="horizon-line horizon-line--soon">
          Arrive après {WELLBEING_WEEKS_MIN} semaines de bien-être estimé ou noté.
        </p>
      )}
      {ready && (
        <>
          <div className="wb-weeks-chart" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 44px))` }}>
            {shown.map((w) => (
              <div key={w.from} className="wb-weeks-col" role="img" aria-label={wellbeingWeekLabel(w)}>
                <span className="wb-weeks-value mono" aria-hidden="true">
                  {w.est != null ? w.est.toFixed(1).replace('.', decimalMark()) : ''}
                </span>
                <div className="wb-weeks-track">
                  {w.est != null && <span className="wb-weeks-bar" style={{ height: `${(w.est / 5) * 100}%` }} />}
                  {w.note != null && <span className="wb-weeks-note" style={{ bottom: `${(w.note / 5) * 100}%` }} />}
                </div>
                <span className="wb-weeks-date mono" aria-hidden="true">{shortDay(w.from)}</span>
              </div>
            ))}
          </div>
          <ul className="wb-weeks-legend" aria-hidden="true">
            <li><span className="wb-weeks-swatch" />Estimé, moyenne sur 5</li>
            {withNotes && <li><span className="wb-weeks-swatch wb-weeks-swatch--note" />Vos notes</li>}
          </ul>
        </>
      )}
    </section>
  )
}

/**
 * Bien-être « dans les heures » (ANALYSES-ONGLETS-5) : lectures du visage dans les 2 h après un repas, comparées au
 * reste du même jour (services/mood/mealHours.js). Rien sans lecture du visage ni repas noté ; un compteur tant que
 * les jours manquent ; un écart dit seulement s'il est net, sans sens présupposé ni conseil (règle 6).
 */
/** TESTEUR-3a : ce qui manque, en une ligne. */
function soonMealHours({ currentDays, minDays }) {
  const left = Math.max(minDays - (currentDays || 0), 1)
  return `Après un repas : encore ${left} jour${left > 1 ? 's' : ''} de lectures du visage.`
}

export function MealHoursHorizon({ result }) {
  if (!result || result.status === 'no_face' || result.status === 'no_meals') return null
  let body
  if (result.status === 'not_enough_data') {
    body = (
      <p className="horizon-line horizon-line--soon">
        {soonMealHours(result)}
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
