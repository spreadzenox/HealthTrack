/**
 * La bannière de Pilou dans Ma journée (lot VIE, étape 11 ; specs/journee.SPEC.md § 1 à 10) : Pilou dans un hublot
 * rond (ciel abricot, mauve-pêche après 19 h), sa phrase, et « Encore N choses aujourd'hui » avec une pastille par
 * tâche. Il répond à chaque saisie : un repas le nourrit, une note de bien-être se reflète, la méditation se fait
 * avec lui, « Non » le fait hausser les épaules gentiment, une annulation le fait « rembobiner ». Après une absence :
 * « Bon retour ». La phrase est annoncée au lecteur d'écran ; le dessin est décoratif.
 */
import { useEffect, useRef, useState } from 'react'
import { useCompanionName } from './useCompanionName'
import PilouFigure from './PilouFigure'
import { openDay } from './companionState'
import { EVENING_FROM_HOUR, idleLine, remainingText, welcomeBackLine } from './lines'
import { diffToday, loadSeen, pickReaction, saveSeen } from './reactions'
import { emitEntry } from './emit'
import './PilouBanner.css'

/** Durée d'une réponse avant le retour au repos ; la méditation dure 4,4 s (SPEC § 6). */
const REACTION_MS = 4400
const MEDITATE_THEN_MS = 2900

/**
 * @param {{ entries: object[], tasks: { id: string, done: boolean }[], remaining: number, todayKey: string,
 *   now?: Date }} props
 */
export default function PilouBanner({ entries, tasks, remaining, todayKey, now }) {
  const name = useCompanionName()
  const hour = (now || new Date()).getHours()
  // « Bon retour » : une fois, à la première ouverture de la journée après une absence
  const [welcome] = useState(() => welcomeBackLine(openDay(todayKey)))
  const [reaction, setReaction] = useState(welcome)
  const [phase, setPhase] = useState(0)
  const timers = useRef([])

  useEffect(() => {
    const diff = diffToday(loadSeen(), entries, todayKey)
    saveSeen(diff.next)
    const r = pickReaction(diff, { name })
    if (!r) return
    timers.current.forEach(clearTimeout)
    setReaction(r)
    setPhase(0)
    emitEntry(r.entry, { undone: r.undone, mealsToday: Object.values(diff.next.ids).filter((t) => t === 'food').length })
    timers.current = [
      r.then && setTimeout(() => setPhase(1), MEDITATE_THEN_MS),
      setTimeout(() => setReaction(null), REACTION_MS + (r.then ? 1500 : 0)),
    ].filter(Boolean)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, todayKey])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  // La salutation de retour s'efface comme une réponse
  useEffect(() => {
    if (!welcome) return undefined
    const t = setTimeout(() => setReaction((r) => (r === welcome ? null : r)), REACTION_MS)
    return () => clearTimeout(t)
  }, [welcome])

  const line = reaction ?? idleLine({ remaining, hour })
  const text = reaction?.then && phase === 1 ? reaction.then : line.text
  return (
    <div className={`pilou-banner${hour >= EVENING_FROM_HOUR ? ' is-evening' : ''}`} data-testid="pilou-banner">
      <span className="pilou-porthole">
        <PilouFigure key={`${line.expr}-${line.move}-${text}`} size={58} expr={line.expr} move={line.move} />
      </span>
      <div className="pilou-banner-text">
        <p className="pilou-says" aria-live="polite">{text}</p>
        {reaction?.sub && <p className="pilou-sub">{reaction.sub}</p>}
        {!reaction?.sub && remaining > 0 && (
          <p className="pilou-remaining">
            <span>{remainingText(remaining)}</span>
            <span className="day-dots" aria-hidden="true">
              {tasks.map((t) => <span key={t.id} className={t.done ? 'day-dot' : 'day-dot is-todo'} />)}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
