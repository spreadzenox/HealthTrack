/**
 * La checklist de « Ma journée » (refonte « Compagnon », étape 3 ; brief § 4, specs/journee.SPEC.md § 1, 2 et 8) :
 * seulement ce qui se note à la main. Repas (trois cercles Matin, Midi, Soir ; un cercle vide ouvre l'appareil
 * photo), bien-être (« Noter »), digestion le soir (seulement avec l'objectif digestion). Une ligne part quand
 * c'est fait ; tout fait : « Plus rien à faire ». « Déjà noté (n) » rouvre les saisies du jour pour les modifier.
 * Aucune calorie ici, aucun compteur de jours manqués (brief § 5). Pilou et les habitudes arrivent plus tard.
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
import './DayChecklist.css'

/** Temps laissé à la ligne pour dire « Noté » puis partir (spec § 2 : pose ≥ 300 ms, glissé 400 ms). */
export const LEAVE_MS = 700

const TASKS = {
  meals: { title: 'Repas', tone: 'peach' },
  wellbeing: { title: 'Bien-être', tone: 'mint' },
  gut: { title: 'Votre digestion ce soir', tone: 'peach' },
}

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

/**
 * @param {{ entries: object[], askGut?: boolean, now?: Date, onWellbeing: (entry?: object) => void, onGut: () => void }} props
 */
export default function DayChecklist({ entries, askGut = false, now, onWellbeing, onGut }) {
  const list = dayChecklist(entries, { now: now || new Date(), askGut })
  const [notedOpen, setNotedOpen] = useState(false)
  // Une ligne faite sous nos yeux reste le temps de dire « Noté », puis part (spec § 2).
  const pendingBefore = useRef(null)
  const [leaving, setLeaving] = useState([])
  const [said, setSaid] = useState('')
  const pendingKey = list.tasks.filter((t) => !t.done).map((t) => t.id).join(',')
  useEffect(() => {
    const before = pendingBefore.current
    const pending = pendingKey ? pendingKey.split(',') : []
    pendingBefore.current = pending
    if (!before) return undefined
    const gone = before.filter((id) => !pending.includes(id))
    if (!gone.length) return undefined
    setLeaving((l) => [...new Set([...l, ...gone])])
    setSaid(`${gone.map((id) => TASKS[id].title).join(', ')} : noté. ${pending.length ? `${remainingText(pending.length)}.` : 'Plus rien à faire.'}`)
    const t = setTimeout(() => setLeaving((l) => l.filter((id) => !gone.includes(id))), LEAVE_MS)
    return () => clearTimeout(t)
  }, [pendingKey])

  const shown = list.tasks.filter((t) => !t.done || leaving.includes(t.id))
  const finished = list.allDone && !leaving.length

  return (
    <section className="day-checklist" aria-label="À noter aujourd’hui">
      <p className="visually-hidden" role="status">{said}</p>
      {!list.allDone && (
        <p className="day-remaining">
          <span>{remainingText(list.remaining)}</span>
          <span className="day-dots" aria-hidden="true">
            {list.tasks.map((t) => <span key={t.id} className={t.done ? 'day-dot' : 'day-dot is-todo'} />)}
          </span>
        </p>
      )}
      {shown.map((t) => {
        const gone = t.done
        return (
          <div key={t.id} role="group" aria-label={TASKS[t.id].title} data-tone={TASKS[t.id].tone}
            className={`day-line${gone ? ' is-leaving' : ''}${t.id === 'gut' && !t.available && !gone ? ' is-waiting' : ''}`}>
            {gone ? (
              <div className="day-line-row">
                <span className="day-line-title">{TASKS[t.id].title}</span>
                <span className="day-line-done"><LineIcon name="check" size={18} /> Noté</span>
              </div>
            ) : (
              <>
                {t.id === 'meals' && <MealsLine task={t} />}
                {t.id === 'wellbeing' && <NoteLine title="Bien-être" onNote={() => onWellbeing()} />}
                {t.id === 'gut' && (
                  <NoteLine title="Votre digestion ce soir" hint={`À partir de ${GUT_EVENING_FROM_HOUR} h`}
                    onNote={t.available ? onGut : undefined} />
                )}
              </>
            )}
          </div>
        )
      })}
      {finished && (
        <div className="day-finished" data-tone="mint">
          <span className="day-finished-mark" aria-hidden="true"><LineIcon name="check" size={26} /></span>
          <h2 className="day-finished-title">Plus rien à faire</h2>
          <p className="day-finished-text">Tout est noté pour aujourd’hui.</p>
        </div>
      )}
      {list.noted.length > 0 && (
        <div className="day-noted">
          <button type="button" className="day-noted-toggle" aria-expanded={notedOpen} onClick={() => setNotedOpen((o) => !o)}>
            Déjà noté ({list.noted.length})
            <LineIcon name="chevron" size={18} className={notedOpen ? 'day-noted-chevron is-open' : 'day-noted-chevron'} />
          </button>
          {notedOpen && (
            <ul className="day-noted-list">
              {list.noted.map(({ kind, entry }) => {
                const inner = (
                  <>
                    <span className="day-noted-time mono">{hhmm(entry.at)}</span>
                    <span className="day-noted-name">
                      {kind === 'meal' && mealTitle(entry)}
                      {kind === 'wellbeing' && `Bien-être · ${scoreToChoice(entry.payload?.score)} sur 5`}
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
