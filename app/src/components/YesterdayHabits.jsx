import './DayChecklist.css'

/**
 * Carte « Hier » en tête de Ma journée (REFONTE-7c-2 (3), journee.SPEC § 10) : les habitudes d'hier restées sans
 * réponse, en Oui / Non de même poids, et « Passer ». Elle disparaît d'elle-même quand tout est répondu.
 * @param {{ catchUp: { dateKey: string, title: string, pending: { id: string, label: string }[] } | null,
 *   onAnswer: (habit: object, done: boolean, dateKey: string) => void, onSkip: (dateKey: string) => void }} props
 */
export default function YesterdayHabits({ catchUp, onAnswer, onSkip }) {
  if (!catchUp) return null
  const { dateKey, title, pending } = catchUp
  const ask = pending.length === 1 ? 'Une question, si vous voulez.' : `${pending.length} questions, si vous voulez.`
  return (
    <section className="day-yesterday" aria-label={title}>
      <div className="day-yesterday-head">
        <h2 className="day-yesterday-title">{title}</h2>
        <button type="button" className="day-yesterday-skip" onClick={() => onSkip(dateKey)}>Passer</button>
      </div>
      <p className="day-yesterday-ask">{ask}</p>
      {pending.map((h) => (
        <div key={h.id} role="group" aria-label={h.label} data-tone="honey" className="day-line">
          <div className="day-line-row">
            <span className="day-line-title">{h.label}</span>
            <span className="day-habit-answers">
              <button type="button" className="day-habit-btn" onClick={() => onAnswer(h, true, dateKey)}>Oui</button>
              <button type="button" className="day-habit-btn" onClick={() => onAnswer(h, false, dateKey)}>Non</button>
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}
