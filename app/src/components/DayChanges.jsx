/**
 * « Ce qui change aujourd'hui » (TESTEUR-1d-2, retours du testeur iPhone du 06/11, maquette
 * journal/maquettes/aujourdhui §2.3) : au plus trois mesures du jour loin de votre médiane des 14 jours précédents.
 * Surface neutre, aucune couleur de jugement ni aucun lien de cause (règle 6) ; masquée avant 7 jours de mesures.
 */
import { useCallback, useEffect, useState } from 'react'
import { buildDailyJournal } from '../services/dailyJournal'
import { dayDeviations, readDeviationEntries } from '../services/dayDeviations'
import './DayChanges.css'

/**
 * @param {{ read?: () => Promise<object[]>, now?: Date, onItems?: (items: object[]) => void }} props
 *   `onItems` : les écarts du jour, pour que la carte des analyses cite la piste qui les touche (TESTEUR-1d-3).
 */
export default function DayChanges({ read = readDeviationEntries, now, onItems }) {
  const [result, setResult] = useState(null)
  const refresh = useCallback(async () => {
    try {
      const entries = await read()
      const next = dayDeviations(buildDailyJournal(entries), now || new Date())
      setResult(next)
      onItems?.(next.ready ? next.items : [])
    } catch {
      setResult(null)
      onItems?.([])
    }
  }, [read, now, onItems])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement asynchrone depuis IndexedDB
    refresh()
    window.addEventListener('health-entries-updated', refresh)
    return () => window.removeEventListener('health-entries-updated', refresh)
  }, [refresh])

  if (!result?.ready) return null
  return (
    <section className="day-changes" aria-labelledby="day-changes-title">
      <h2 id="day-changes-title" className="day-changes-title">Ce qui change aujourd’hui</h2>
      {result.items.length === 0 ? (
        <p className="day-changes-none">Une journée comme les autres pour vos mesures.</p>
      ) : (
        <ul className="day-changes-list">
          {result.items.map((i) => (
            <li key={i.key} className="day-changes-item">
              <span className="day-changes-arrow mono" aria-hidden>{i.direction === 'up' ? '↑' : '↓'}</span>
              <span className="day-changes-text">{i.text}</span>
              <span className="day-changes-value mono">{i.value}</span>
              <span className="day-changes-usual mono">{i.usual}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
