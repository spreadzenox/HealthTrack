import { HorizonHeading } from './Horizon'
import { GUT_WEEKS_MIN_NOTED, gutWeekLabel, gutWeeksReady } from '../services/gutWeeks'

const LEVELS = [
  { id: 'pain', label: 'Douleur' },
  { id: 'discomfort', label: 'Gêne' },
  { id: 'calm', label: 'Calme' },
]

const shortDay = (key) => {
  const [, m, d] = key.split('-')
  return `${d}/${m}`
}

/**
 * Onglet Ventre, horizon « Sur quelques semaines » (retours du 04/11, point 4) : une colonne par semaine, sept cases,
 * une par jour noté (douleur en haut, puis gêne, puis calme) ; les jours sans note restent vides. Huit semaines au
 * plus, à partir de la première semaine notée. Tendances ne parle
 * que de la forme et du bien-être : le long terme du ventre vit ici, sans rien mélanger.
 */
export default function GutWeeks({ weeks }) {
  const ready = gutWeeksReady(weeks)
  // Les semaines d'avant la première note ne disent rien : le graphique commence à la première semaine notée.
  const shown = ready ? weeks.slice(weeks.findIndex((w) => w.notedDays > 0)) : []
  return (
    <section className="horizon-weeks gut-weeks" data-testid="gut-weeks">
      <HorizonHeading id="weeks" hint="Vos jours calmes, de gêne et de douleur, semaine par semaine." />
      {!ready && (
        <p className="gut-weeks-soon">
          Arrive après {GUT_WEEKS_MIN_NOTED} semaines de notes du ventre.
        </p>
      )}
      {ready && (
        <>
          <div className="gut-weeks-chart" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 44px))` }}>
            {shown.map((w) => (
              <div key={w.from} className="gut-weeks-col" role="img" aria-label={gutWeekLabel(w)}>
                <div className="gut-weeks-bar">
                  {Array.from({ length: 7 - w.notedDays }, (_, i) => (
                    <span key={`e${i}`} className="gut-weeks-day gut-weeks-day--empty" />
                  ))}
                  {LEVELS.flatMap((l) =>
                    Array.from({ length: w[l.id] }, (_, i) => (
                      <span key={`${l.id}${i}`} className={`gut-weeks-day gut-weeks-day--${l.id}`} />
                    )),
                  )}
                </div>
                <span className="gut-weeks-date mono" aria-hidden="true">{shortDay(w.from)}</span>
              </div>
            ))}
          </div>
          <ul className="gut-weeks-legend" aria-hidden="true">
            {[...LEVELS].reverse().map((l) => (
              <li key={l.id}>
                <span className={`gut-weeks-swatch gut-weeks-day--${l.id}`} />
                {l.label}
              </li>
            ))}
            <li>
              <span className="gut-weeks-swatch gut-weeks-day--empty" />
              Sans note
            </li>
          </ul>
        </>
      )}
    </section>
  )
}
