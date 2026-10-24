import './SoonList.css'

/**
 * « Bientôt » : une ligne discrète par bloc qui attend encore des données (POL-6 et POL-7), jamais une carte presque
 * vide. `lines` : `{ id, label, progress }`.
 */
export default function SoonList({ lines, testId }) {
  if (!lines?.length) return null
  return (
    <section className="soon" data-testid={testId}>
      <h3 className="soon-title">Bientôt</h3>
      <ul className="soon-list">
        {lines.map((l) => (
          <li key={l.id} className="soon-row">
            <span>{l.label}</span>
            <span className="soon-progress">{l.progress}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
