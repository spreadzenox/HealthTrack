/**
 * Mes règles (CYCLE-2, « Ok cycle » du propriétaire du 10/11) : noter ses règles du jour en un geste depuis le bandeau
 * d'ajout d'Aujourd'hui. Toucher un flux enregistre le jour de règles ; toucher un autre flux le corrige ; « Retirer »
 * l'efface. Les données restent sur le téléphone (entrées `cycle` ordinaires, voir services/cycle.js).
 * Avec `dateKey` et `onDone` (Journal › Jours, CYCLE-2b) : corrige le flux d'un jour passé, puis se referme.
 * Symptômes du jour (CYCLE-2c) : un geste coche (enregistre), un second décoche (efface) ; ceux d'une autre source
 * restent cochés, sans modification possible ici.
 */
import { useCallback, useEffect, useState } from 'react'
import { createEntry, deleteEntry, listEntries, updateEntry } from '../storage/localHealthStorage'
import { localDateKey } from '../services/analysisEngine'
import {
  CYCLE_SOURCE, CYCLE_TYPE, MAX_CYCLE_DAY, SYMPTOMS, SYMPTOM_LABELS, cycleByDay, periodEntry, periodEntryOn,
  symptomEntriesOn, symptomEntry,
} from '../services/cycle'
import Ordinal from './Ordinal'
import './AddStrip.css'

const CHOICES = [
  { flow: 'light', label: 'Léger' },
  { flow: 'medium', label: 'Moyen' },
  { flow: 'heavy', label: 'Abondant' },
]

const realNow = () => new Date()
const notify = () => window.dispatchEvent(new CustomEvent('health-entries-updated'))

/** Saisies de cycle des 62 jours avant `dateKey` (et après) : assez pour compter le jour des règles. */
function readCycle(dateKey) {
  const since = new Date(`${dateKey}T00:00:00`)
  since.setDate(since.getDate() - MAX_CYCLE_DAY - 2)
  return listEntries({ type: CYCLE_TYPE, since: since.toISOString(), limit: 5000 })
}

export default function PeriodSheet({ now = realNow, dateKey = null, onDone = null }) {
  const todayKey = localDateKey(now().toISOString())
  const dayKey = dateKey || todayKey
  const isToday = dayKey === todayKey
  const [list, setList] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => readCycle(dayKey).then(setList), [dayKey])

  useEffect(() => {
    let alive = true
    readCycle(dayKey).then((rows) => { if (alive) setList(rows) }).catch(() => { if (alive) setList([]) })
    return () => { alive = false }
  }, [dayKey])

  const today = list ? periodEntryOn(list, dayKey) : null
  const info = list ? cycleByDay(list, [dayKey]).get(dayKey) : null
  const symptoms = list ? symptomEntriesOn(list, dayKey) : new Map()

  const save = async (flow) => {
    setError(null)
    try {
      if (today && today.source === CYCLE_SOURCE) {
        await updateEntry(today.id, { payload: { ...today.payload, flow } })
      } else {
        await createEntry(periodEntry(dayKey, flow))
      }
      notify()
      if (onDone) return onDone()
      await load()
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

  const toggleSymptom = async (symptom) => {
    setError(null)
    const noted = symptoms.get(symptom)
    try {
      if (noted) await deleteEntry(noted.id)
      else await createEntry(symptomEntry(dayKey, symptom))
      await load()
      notify()
    } catch {
      setError('Enregistrement impossible. Réessayez.')
    }
  }

  const editable = !today || today.source === CYCLE_SOURCE
  return (
    <div className="period-sheet">
      <p className="period-sheet-day">
        {!isToday && info?.periodDay
          ? <><Ordinal n={info.periodDay} /> jour des règles, flux :</>
          : today && info?.periodDay
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
        {onDone && <button type="button" className="entry-delete-btn" onClick={onDone}>Annuler</button>}
        {!onDone && !today && (
          <button type="button" className="btn btn-secondary" disabled={!list} onClick={() => save('unknown')}>
            Sans préciser le flux
          </button>
        )}
        {!onDone && today && editable && (
          <button type="button" className="btn btn-secondary" onClick={remove}>Retirer</button>
        )}
      </div>
      {!onDone && (
        <>
          <p className="period-sheet-day period-sheet-symptoms-title" id="period-symptoms-title">Symptômes</p>
          <div className="period-symptoms" role="group" aria-labelledby="period-symptoms-title">
            {SYMPTOMS.map((s) => {
              const noted = symptoms.get(s)
              return (
                <button key={s} type="button" className="period-symptom" aria-pressed={Boolean(noted)}
                  disabled={!list || (noted && noted.source !== CYCLE_SOURCE)} onClick={() => toggleSymptom(s)}>
                  {SYMPTOM_LABELS[s]}
                </button>
              )
            })}
          </div>
        </>
      )}
      {error && <p className="period-sheet-error" role="alert">{error}</p>}
    </div>
  )
}
