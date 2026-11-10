/**
 * Mes règles (CYCLE-2, « Ok cycle » du propriétaire du 10/11) : noter ses règles du jour en un geste depuis le bandeau
 * d'ajout d'Aujourd'hui. Toucher un flux enregistre le jour de règles ; toucher un autre flux le corrige ; « Retirer »
 * l'efface. Les données restent sur le téléphone (entrées `cycle` ordinaires, voir services/cycle.js).
 */
import { useCallback, useEffect, useState } from 'react'
import { createEntry, deleteEntry, listEntries, updateEntry } from '../storage/localHealthStorage'
import { localDateKey } from '../services/analysisEngine'
import { CYCLE_SOURCE, CYCLE_TYPE, MAX_CYCLE_DAY, cycleByDay, periodEntry, periodEntryOn } from '../services/cycle'
import Ordinal from './Ordinal'

const CHOICES = [
  { flow: 'light', label: 'Léger' },
  { flow: 'medium', label: 'Moyen' },
  { flow: 'heavy', label: 'Abondant' },
]

const realNow = () => new Date()
const notify = () => window.dispatchEvent(new CustomEvent('health-entries-updated'))

/** Saisies de cycle des 62 derniers jours : assez pour compter le jour des règles. */
function readCycle(now) {
  const since = now()
  since.setDate(since.getDate() - MAX_CYCLE_DAY - 2)
  return listEntries({ type: CYCLE_TYPE, since: since.toISOString(), limit: 5000 })
}

export default function PeriodSheet({ now = realNow }) {
  const todayKey = localDateKey(now().toISOString())
  const [list, setList] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => readCycle(now).then(setList), [now])

  useEffect(() => {
    let alive = true
    readCycle(now).then((rows) => { if (alive) setList(rows) }).catch(() => { if (alive) setList([]) })
    return () => { alive = false }
  }, [now])

  const today = list ? periodEntryOn(list, todayKey) : null
  const info = list ? cycleByDay(list, [todayKey]).get(todayKey) : null

  const save = async (flow) => {
    setError(null)
    try {
      if (today && today.source === CYCLE_SOURCE) {
        await updateEntry(today.id, { payload: { ...today.payload, flow } })
      } else {
        await createEntry(periodEntry(todayKey, flow))
      }
      await load()
      notify()
    } catch {
      setError('Enregistrement impossible. Réessayez.')
    }
  }

  const remove = async () => {
    setError(null)
    try {
      await deleteEntry(today.id)
      await load()
      notify()
    } catch {
      setError('Suppression impossible. Réessayez.')
    }
  }

  const editable = !today || today.source === CYCLE_SOURCE
  return (
    <div className="period-sheet">
      <p className="period-sheet-day">
        {today && info?.periodDay
          ? <>Aujourd’hui, <Ordinal n={info.periodDay} /> jour des règles</>
          : 'Règles aujourd’hui, flux :'}
      </p>
      <div className="gut-choices period-choices" role="group" aria-label="Flux">
        {CHOICES.map((c) => (
          <button key={c.flow} type="button" className="gut-choice period-choice" disabled={!list || !editable}
            aria-pressed={today?.payload?.flow === c.flow} onClick={() => save(c.flow)}>
            <span className="gut-choice-radio" aria-hidden="true" />
            <span className="choice-label">{c.label}</span>
          </button>
        ))}
      </div>
      <div className="period-sheet-more">
        {!today && (
          <button type="button" className="btn btn-secondary" disabled={!list} onClick={() => save('unknown')}>
            Sans préciser le flux
          </button>
        )}
        {today && editable && (
          <button type="button" className="btn btn-secondary" onClick={remove}>Retirer</button>
        )}
      </div>
      {error && <p className="period-sheet-error" role="alert">{error}</p>}
    </div>
  )
}
