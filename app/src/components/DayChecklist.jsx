/**
 * La checklist de « Ma journée » (refonte « Compagnon », étape 3 ; brief § 4, specs/journee.SPEC.md § 1, 2 et 8) :
 * seulement ce qui se note à la main. Repas (trois cercles Matin, Midi, Soir ; un cercle vide ouvre l'appareil
 * photo), bien-être (« Noter »), digestion le soir (seulement avec l'objectif digestion). Une ligne part quand
 * c'est fait ; tout fait : « Plus rien à faire ». « Déjà noté (n) » rouvre les saisies du jour pour les modifier.
 * Étape 4 : une ligne miel par habitude suivie, « Oui » et « Non » de même poids (on note, on ne juge pas).
 * Aucune calorie ici, aucun compteur de jours manqués (brief § 5).
 * Étape 11 (lot VIE) : la bannière de Pilou remplace « Encore N choses » et répond à chaque saisie ; la fin de
 * journée est la sienne (fête sobre, ou le calme du soir à partir de 21 h).
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { dayChecklist } from '../services/dayChecklist'
import { GUT_EVENING_FROM_HOUR, gutLevelLabel } from '../services/today'
import { mealTitle } from '../services/mealEditing'
import { scoreToChoice } from '../services/mood/wellbeingScale'
import { appLocale } from '../i18n/locale.js'
import MealPhotoButton from './MealPhotoButton'
import LineIcon from './LineIcon'
import PilouBanner from '../companion/life/PilouBanner'
import PilouFigure from '../companion/life/PilouFigure'
import { finishedLine } from '../companion/life/lines'
import { companionName } from '../companion/life/companionState'
import { useDayDone } from '../companion/life/useDayDone'
import { localDateKey } from '../services/analysisEngine'
import './DayChecklist.css'

/** Temps laissé à la ligne pour dire « Noté » puis partir (spec § 2 : pose ≥ 300 ms, glissé 400 ms). */
export const LEAVE_MS = 700

const TASKS = {
  meals: { title: 'Repas', tone: 'peach' },
  wellbeing: { title: 'Bien-être', tone: 'mint' },
  gut: { title: 'Votre digestion ce soir', tone: 'peach' },
}

/** Titre et couleur d'une tâche ; une habitude porte son nom et le miel (brief § 6). */
const metaOf = (t) => (t.habit ? { title: t.habit.label, tone: 'honey' } : TASKS[t.id])

const hhmm = (iso) => new Date(iso).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })
const remainingText = (n) => `Encore ${n} ${n > 1 ? 'choses' : 'chose'} aujourd’hui`

function MealsLine({ task }) {
  return (
    <>
      <div className="day-line-head">
        <span className="day-line-title">Repas</span>
        <span className="day-line-count">{task.count} sur {task.slots.length}</span>
      </div>
      <div className="day-meal-slots">
        {task.slots.map((s) => (s.filled ? (
          <Link key={s.id} to="/food" className="day-meal-slot is-filled" aria-label={`${s.label} : noté`}>
            <span className="day-meal-circle"><LineIcon name="check" size={22} /></span>
            <span className="day-meal-label">{s.label}</span>
          </Link>
        ) : (
          <MealPhotoButton key={s.id} className="day-meal-slot" ariaLabel={`${s.label} : photographier le repas`}>
            <span className="day-meal-circle"><LineIcon name="camera" size={22} /></span>
            <span className="day-meal-label">{s.label}</span>
          </MealPhotoButton>
        )))}
      </div>
    </>
  )
}

function NoteLine({ title, hint, onNote }) {
  return (
    <div className="day-line-row">
      <span className="day-line-title">{title}</span>
      {onNote
        ? <button type="button" className="day-line-btn" onClick={onNote}>Noter</button>
        : <span className="day-line-hint">{hint}</span>}
    </div>
  )
}

function HabitLine({ habit, onAnswer }) {
  return (
    <div className="day-line-row">
      <span className="day-line-title">{habit.label}</span>
      <span className="day-habit-answers">
        <button type="button" className="day-habit-btn" onClick={() => onAnswer(habit, true)}>Oui</button>
        <button type="button" className="day-habit-btn" onClick={() => onAnswer(habit, false)}>Non</button>
      </span>
    </div>
  )
}

/**
 * @param {{ entries: object[], askGut?: boolean, habits?: { id: string, label: string }[], now?: Date,
 *   onWellbeing: (entry?: object) => void, onGut: () => void,
 *   onHabit?: (habit: object, done: boolean) => void, onHabitUndo?: (entry: object) => void }} props
 */
export default function DayChecklist({ entries, askGut = false, habits = [], now, onWellbeing, onGut, onHabit, onHabitUndo }) {
  const at = now || new Date()
  const list = dayChecklist(entries, { now: at, askGut, habits })
  const [notedOpen, setNotedOpen] = useState(false)
  // Une ligne faite sous nos yeux reste le temps de dire « Noté », puis part (spec § 2).
  const pendingBefore = useRef(null)
  const [leaving, setLeaving] = useState([])
  const [said, setSaid] = useState('')
  // « id, tabulation, titre » par ligne à faire : une ligne qui part garde son titre, habitude comprise
  const pendingKey = list.tasks.filter((t) => !t.done).map((t) => `${t.id}\t${metaOf(t).title}`).join('\n')
  useEffect(() => {
    const before = pendingBefore.current
    const pending = pendingKey ? pendingKey.split('\n').map((line) => line.split('\t')) : []
    pendingBefore.current = pending
    if (!before) return undefined
    const gone = before.filter(([id]) => !pending.some(([p]) => p === id))
    if (!gone.length) return undefined
    const ids = gone.map(([id]) => id)
    setLeaving((l) => [...new Set([...l, ...ids])])
    setSaid(`${gone.map(([, title]) => title).join(', ')} : noté. ${pending.length ? `${remainingText(pending.length)}.` : 'Plus rien à faire.'}`)
    const t = setTimeout(() => setLeaving((l) => l.filter((id) => !ids.includes(id))), LEAVE_MS)
    return () => clearTimeout(t)
  }, [pendingKey])

  const shown = list.tasks.filter((t) => !t.done || leaving.includes(t.id))
  const finished = list.allDone && !leaving.length
  useDayDone(finished)

  return (
    <section className="day-checklist" aria-label="À noter aujourd’hui">
      <p className="visually-hidden" role="status">{said}</p>
      {!finished && (
        <PilouBanner entries={entries} tasks={list.tasks} remaining={list.allDone ? 0 : list.remaining}
          todayKey={localDateKey(at.toISOString())} now={at} />
      )}
      {shown.map((t) => {
        const gone = t.done
        const meta = metaOf(t)
        return (
          <div key={t.id} role="group" aria-label={meta.title} data-tone={meta.tone}
            className={`day-line${gone ? ' is-leaving' : ''}${t.id === 'gut' && !t.available && !gone ? ' is-waiting' : ''}`}>
            {gone ? (
              <div className="day-line-row">
                <span className="day-line-title">{meta.title}</span>
                <span className="day-line-done"><LineIcon name="check" size={18} /> Noté</span>
              </div>
            ) : (
              <>
                {t.id === 'meals' && <MealsLine task={t} />}
                {t.id === 'wellbeing' && <NoteLine title="Bien-être" onNote={() => onWellbeing()} />}
                {t.habit && <HabitLine habit={t.habit} onAnswer={onHabit} />}
                {t.id === 'gut' && (
                  <NoteLine title="Votre digestion ce soir" hint={`À partir de ${GUT_EVENING_FROM_HOUR} h`}
                    onNote={t.available ? onGut : undefined} />
                )}
              </>
            )}
          </div>
        )
      })}
      {finished && (() => {
        const end = finishedLine(at.getHours(), companionName())
        return (
          <div className={`day-finished${end.move === 'sleep' ? ' is-night' : ''}`} data-tone="mint" data-testid="day-finished">
            <PilouFigure size={88} expr={end.expr} move={end.move} className="day-finished-pilou" />
            <h2 className="day-finished-title">{end.title}</h2>
            <p className="day-finished-text">{end.text}</p>
          </div>
        )
      })()}
      {list.noted.length > 0 && (
        <div className="day-noted">
          <button type="button" className="day-noted-toggle" aria-expanded={notedOpen} onClick={() => setNotedOpen((o) => !o)}>
            Déjà noté ({list.noted.length})
            <LineIcon name="chevron" size={18} className={notedOpen ? 'day-noted-chevron is-open' : 'day-noted-chevron'} />
          </button>
          {notedOpen && (
            <ul className="day-noted-list">
              {list.noted.map(({ kind, entry, habit }) => {
                const answer = kind === 'habit' ? `${habit.label} · ${entry.payload?.done ? 'oui' : 'non'}` : null
                const inner = (
                  <>
                    {kind !== 'habit' && <span className="day-noted-time mono">{hhmm(entry.at)}</span>}
                    <span className="day-noted-name">
                      {kind === 'meal' && mealTitle(entry)}
                      {kind === 'wellbeing' && `Bien-être · ${scoreToChoice(entry.payload?.score)} sur 5`}
                      {answer}
                      {kind === 'gut' && `Digestion du jour · ${gutLevelLabel(entry.payload?.level)}`}
                    </span>
                    <LineIcon name="chevron" size={18} />
                  </>
                )
                return (
                  <li key={`${kind}-${entry.id ?? entry.at}`}>
                    {kind === 'meal' && <Link to="/food" className="day-noted-item">{inner}</Link>}
                    {kind === 'wellbeing' && <button type="button" className="day-noted-item" onClick={() => onWellbeing(entry)}>{inner}</button>}
                    {kind === 'gut' && <button type="button" className="day-noted-item" onClick={onGut}>{inner}</button>}
                    {kind === 'habit' && (
                      <button type="button" className="day-noted-item" aria-label={`${answer}, changer la réponse`}
                        onClick={() => onHabitUndo?.(entry)}>{inner}</button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
