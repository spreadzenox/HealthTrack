/**
 * Calendrier de pastilles d'un essai (ORG-8) : pleine = jour « avec », contour = jour « sans » ; ✓ tenu, – pas tenu ;
 * rien tant que le jour n'est pas passé ou que la tenue est inconnue.
 * `grid` (page d'un essai, POLISH-ESSAI-GRILLE) : cases numérotées, une ligne de 7 par semaine, comme la maquette.
 */
import { appLocale } from '../i18n/locale.js'

const mark = (d) => (d.held === true ? '✓' : d.held === false ? '–' : '')

export default function TrialDots({ days, grid = false }) {
  const label = (d) => `${new Date(`${d.date}T12:00:00`).toLocaleDateString(appLocale(), { day: 'numeric', month: 'long' })} : ${d.with ? 'avec' : 'sans'}${d.held === true ? ', tenu' : d.held === false ? ', pas tenu' : ''}`
  const cls = (d) => `trial-dot${d.with ? ' is-with' : ''}${d.today ? ' is-today' : ''}${d.future ? ' is-future' : ''}`
  if (!grid) {
    return (
      <ol className="trial-dots" aria-label="Calendrier de l’essai">
        {days.map((d) => (
          <li key={d.date} className={cls(d)} aria-label={label(d)}>
            <span aria-hidden="true">{mark(d)}</span>
          </li>
        ))}
      </ol>
    )
  }
  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return (
    <div className="trial-grid">
      {weeks.map((week, w) => (
        <ol key={week[0].date} className="trial-dots is-grid" aria-label={`Semaine ${w + 1}`} start={w * 7 + 1}>
          {week.map((d, i) => (
            <li key={d.date} className={cls(d)} aria-label={label(d)}>
              <span aria-hidden="true">{w * 7 + i + 1}</span>
              {mark(d) && <span className="trial-dot-mark" aria-hidden="true">{mark(d)}</span>}
            </li>
          ))}
        </ol>
      ))}
    </div>
  )
}
