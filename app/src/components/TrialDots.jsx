/**
 * Calendrier de pastilles d'un essai (ORG-8) : pleine = jour « avec », contour = jour « sans » ; ✓ tenu, – pas tenu ;
 * rien tant que le jour n'est pas passé ou que la tenue est inconnue.
 */
import { appLocale } from '../i18n/locale.js'

export default function TrialDots({ days }) {
  const label = (d) => `${new Date(`${d.date}T12:00:00`).toLocaleDateString(appLocale(), { day: 'numeric', month: 'long' })} : ${d.with ? 'avec' : 'sans'}${d.held === true ? ', tenu' : d.held === false ? ', pas tenu' : ''}`
  return (
    <ol className="trial-dots" aria-label="Calendrier de l’essai">
      {days.map((d) => (
        <li key={d.date} className={`trial-dot${d.with ? ' is-with' : ''}${d.today ? ' is-today' : ''}${d.future ? ' is-future' : ''}`}
          aria-label={label(d)}>
          <span aria-hidden="true">{d.held === true ? '✓' : d.held === false ? '–' : ''}</span>
        </li>
      ))}
    </ol>
  )
}
