import { useState, useEffect } from 'react'
import { createEntry, updateEntry, listEntries } from '../storage/localHealthStorage'
import {
  BEHAVIOR_TAGS,
  autoDetectedTagIds,
  AUTO_LATE_SCREEN_MIN,
  EVENING_SPORT_FROM_HOUR,
  LATE_MEAL_FROM_HOUR,
  isWorkoutEntry,
  mealsLoggedRegularly,
  measuredTagsByDay,
} from '../services/behaviorTags'
import { localDateKey } from '../services/wellbeingSeries'
import { readPhrase } from '../services/mood/lexicon'
import { recordTimezoneContext } from '../services/timezoneContext'
import { getPhoneUsageSettings } from '../services/phoneUsageSync'
import {
  DEFAULT_MINUTE,
  eveningNotePlugin,
  formatMinute,
  getEveningNoteMinute,
  getEveningNoteStatus,
  setEveningNoteEnabled,
  setEveningNoteMinute,
} from '../services/eveningNote'
import { APP_NAME } from '../config/brand'
import LineIcon from './LineIcon'
import { NOTE_CHOICES, choiceToScore, scoreToChoice } from '../services/mood/wellbeingScale'


const minuteToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const timeToMinute = (t) => {
  const [h, m] = String(t).split(':').map(Number)
  return Number.isInteger(h) && Number.isInteger(m) ? h * 60 + m : null
}

/** Séances et repas relus sur cette période : au-delà, la source n'est sans doute plus utilisée. */
const CAPTURE_DAYS = 14

/** Fuseaux horaires relus pour savoir si celui d'aujourd'hui a changé. */
const TIMEZONE_DAYS = 4

/**
 * Sources récentes dont l'app déduit elle-même un tag : séances de la montre ou de Health Connect
 * (« Sport le soir »), repas notés régulièrement (« Repas tardif »), fuseau horaire changé aujourd'hui (« Voyage »).
 */
async function recentCaptures() {
  try {
    const since = new Date(Date.now() - CAPTURE_DAYS * 86_400_000).toISOString()
    await recordTimezoneContext()
    const [activity, food, context] = await Promise.all([
      listEntries({ type: 'activity', since, limit: 200 }),
      listEntries({ type: 'food', since, limit: 200 }),
      listEntries({ type: 'context', since: new Date(Date.now() - TIMEZONE_DAYS * 86_400_000).toISOString(), limit: 50 }),
    ])
    const travelToday = measuredTagsByDay(context).get('travel').get(localDateKey(new Date().toISOString())) === true
    return { workouts: activity.some(isWorkoutEntry), meals: mealsLoggedRegularly(food), travelToday }
  } catch {
    return { workouts: false, meals: false, travelToday: false }
  }
}

/** How the app captures each tag it no longer asks for, in tag order. */
const AUTO_HINTS = {
  late_meal: `Repas tardif (repas noté après ${LATE_MEAL_FROM_HOUR} h)`,
  late_screen: `Écran tard (≥ ${AUTO_LATE_SCREEN_MIN} min après 22 h)`,
  evening_sport: `Sport le soir (séance après ${EVENING_SPORT_FROM_HOUR} h)`,
  travel: 'Voyage (fuseau horaire changé aujourd’hui)',
}

/** Précisions proposées d'abord (retours du testeur du 06/11), puis les autres dans l'ordre habituel. */
const FIRST_TAGS = ['stress', 'alcohol', 'coffee_late', 'late_meal', 'late_screen']
const PROMPT_TAGS = [
  ...FIRST_TAGS.map((id) => BEHAVIOR_TAGS.find((t) => t.id === id)).filter(Boolean),
  ...BEHAVIOR_TAGS.filter((t) => !FIRST_TAGS.includes(t.id)),
]

function isToday(iso) {
  const d = new Date(iso)
  return !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString()
}

/** Tags dans l'ordre stable ; clé omise sans tag (même forme qu'avant l'existence des tags). */
function withTags(payload, tags) {
  const rest = { ...payload }
  delete rest.tags
  const ordered = BEHAVIOR_TAGS.map((t) => t.id).filter((id) => tags.includes(id))
  return ordered.length > 0 ? { ...rest, tags: ordered } : rest
}

/**
 * Note de bien-être donnée à la main, ouverte par l'appelant (open + onClose) : depuis la carte « Bien-être estimé »
 * de l'Accueil, et le Journal. Elle ne s'ouvre plus d'elle-même au lancement (POL-3, retour
 * du propriétaire du 24/10 : la lecture du visage estime déjà le bien-être). Avec `entry`, elle modifie cette note :
 * la note et les tags changent, l'heure et les autres champs restent.
 */
export default function WellbeingPrompt({ open = false, onClose, entry, initialMode = 'now' } = {}) {
  const [selected, setSelected] = useState(null)
  const [tags, setTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [captures, setCaptures] = useState({ workouts: false, meals: false, travelToday: false })
  const [evening, setEvening] = useState(null)
  const [eveningHint, setEveningHint] = useState(null)
  // TESTEUR-2c : « Remplir maintenant » (la note) ou « Recevoir un rappel » (le soir, heure réglable).
  const [mode, setMode] = useState('now')
  const [reminderTime, setReminderTime] = useState(minuteToTime(DEFAULT_MINUTE))
  const [scheduling, setScheduling] = useState(false)
  const [phrase, setPhrase] = useState('')

  // Reset (or prefill with the edited note) whenever the dialog opens
  useEffect(() => {
    if (open) {
      setSelected(scoreToChoice(entry?.payload?.score))
      setTags(Array.isArray(entry?.payload?.tags) ? entry.payload.tags : [])
      setPhrase('')
      setError(null)
    }
  }, [open, entry])

  useEffect(() => {
    if (!open) return undefined
    let alive = true
    recentCaptures().then((v) => alive && setCaptures(v))
    setEveningHint(null)
    setMode(initialMode)
    if (eveningNotePlugin()) {
      getEveningNoteStatus().then((v) => {
        if (!alive) return
        setEvening(v)
        setReminderTime(minuteToTime(getEveningNoteMinute() ?? v?.minuteOfDay ?? DEFAULT_MINUTE))
      })
    }
    return () => {
      alive = false
    }
  }, [open, initialMode])

  // Never ask for what the app already measures (an old note keeps its tag visible, to remove it).
  const autoIds = open ? autoDetectedTagIds({ phoneUsage: getPhoneUsageSettings().enabled, ...captures }) : []
  const shownTags = PROMPT_TAGS.filter((t) => !autoIds.includes(t.id) || tags.includes(t.id))
  const autoHints = autoIds.map((id) => AUTO_HINTS[id]).filter(Boolean)

  // I119 : la phrase ne fait que proposer (lexiques disjoints ressenti / contexte) ; elle n'est jamais enregistrée.
  const read = phrase.trim() ? readPhrase(phrase) : null
  const readChoice = read?.score != null ? scoreToChoice(read.score) : null
  const proposedScore = readChoice !== null && readChoice !== selected ? readChoice : null
  const proposedTags = read ? shownTags.filter((t) => read.tags.includes(t.id) && !tags.includes(t.id)) : []

  // TESTEUR-2b : la note d'abord ; précisions, phrase et rappel du soir apparaissent une fois la note choisie.
  const showDetails = selected !== null
  // Le choix du rappel n'a de sens qu'avant de noter, pour une nouvelle note, là où le téléphone sait le programmer.
  const offerReminder = !!evening && !entry && selected === null
  const reminderMode = offerReminder && mode === 'reminder'

  const close = () => onClose?.()

  const toggleTag = (id) => {
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const scheduleReminder = async (on) => {
    setScheduling(true)
    setEveningHint(null)
    try {
      if (on) setEveningNoteMinute(timeToMinute(reminderTime))
      const res = await setEveningNoteEnabled(on)
      setEvening(await getEveningNoteStatus())
      if (res.blocked) {
        setEveningHint(`Notifications refusées : autorisez-les pour ${APP_NAME} dans les réglages Android.`)
      } else if (on) {
        close()
      }
    } catch {
      setEveningHint('Rappel impossible à programmer pour l’instant.')
    } finally {
      setScheduling(false)
    }
  }

  const handleSkip = () => {
    setError(null)
    close()
  }

  const handleSave = async () => {
    if (selected === null) {
      setError('Choisissez une note de 1 à 5.')
      return
    }
    // Choix inchangé en modifiant une ancienne note : la valeur stockée reste exactement la même (aucune perte).
    const score =
      entry && typeof entry.payload?.score === 'number' && scoreToChoice(entry.payload.score) === selected
        ? entry.payload.score
        : choiceToScore(selected)
    setSaving(true)
    setError(null)
    try {
      if (entry) {
        await updateEntry(entry.id, { payload: withTags({ ...entry.payload, score }, tags) })
      } else {
        await createEntry({
          type: 'wellbeing',
          source: 'app_wellbeing',
          payload: withTags({ score }, tags),
        })
      }
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      close()
    } catch (e) {
      setError(e.message || 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="wellbeing-modal-backdrop" role="presentation">
      <div
        className="wellbeing-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wellbeing-modal-title"
        aria-describedby="wellbeing-modal-desc"
      >
        <h2 id="wellbeing-modal-title" className="wellbeing-modal-title">
          {entry ? 'Modifier votre note' : 'Comment vous sentez-vous ?'}
        </h2>
        <p id="wellbeing-modal-desc" className="wellbeing-modal-desc">
          {entry
            ? 'Corrigez la note ou les tags ; l’heure de la note ne change pas.'
            : reminderMode
              ? 'Une notification le soir, pour noter d’un geste.'
              : '1 = très bas, 3 = moyen, 5 = très bien.'}
        </p>

        {offerReminder && (
          <div className="wellbeing-when" role="group" aria-label="Quand noter">
            {[
              ['now', 'Remplir maintenant'],
              ['reminder', 'Recevoir un rappel'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={'wellbeing-when-choice' + (mode === id ? ' wellbeing-when-selected' : '')}
                aria-pressed={mode === id}
                onClick={() => {
                  setMode(id)
                  setEveningHint(null)
                  setError(null)
                }}
              >
                {id === 'reminder' && <LineIcon name="bell" size={16} />} {label}
              </button>
            ))}
          </div>
        )}

        {reminderMode ? (
          <div className="wellbeing-reminder">
            <label className="wellbeing-reminder-time">
              <span>Chaque soir à</span>
              <input
                type="time"
                aria-label="Heure du rappel"
                min="18:00"
                max="23:00"
                step="300"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </label>
            {evening?.enabled && (
              <p className="wellbeing-tags-hint">
                Rappel prévu vers {formatMinute(evening.minuteOfDay ?? DEFAULT_MINUTE)}, sauf si vous avez déjà noté.{' '}
                <button type="button" className="wellbeing-reminder-stop" onClick={() => scheduleReminder(false)} disabled={scheduling}>
                  Arrêter le rappel
                </button>
              </p>
            )}
            {eveningHint && <p className="wellbeing-tags-hint">{eveningHint}</p>}
          </div>
        ) : (
        <div className="wellbeing-circles" role="group" aria-label="Note de bien-être de 1 à 5">
          {NOTE_CHOICES.map((n) => (
            <button
              key={n}
              type="button"
              className={
                'wellbeing-circle' + (selected === n ? ' wellbeing-circle-selected' : '')
              }
              aria-pressed={selected === n}
              aria-label={`Note ${n} sur 5`}
              onClick={() => {
                setSelected(n)
                setError(null)
              }}
            >
              <span className="wellbeing-circle-dot" aria-hidden />
              <span className="wellbeing-circle-label">{n}</span>
            </button>
          ))}
        </div>
        )}

        {showDetails && (
          <div className="wellbeing-details">
          <p className="wellbeing-tags-title" id="wellbeing-tags-title">
            {entry && !isToday(entry.at) ? 'Ce jour-là' : 'Aujourd’hui'} <span className="wellbeing-tags-optional">(facultatif)</span>
          </p>
          <div className="wellbeing-tags" role="group" aria-labelledby="wellbeing-tags-title">
            {shownTags.map((t) => {
              const on = tags.includes(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  className={'wellbeing-tag' + (on ? ' wellbeing-tag-selected' : '')}
                  aria-pressed={on}
                  onClick={() => toggleTag(t.id)}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
          {autoHints.length > 0 && <p className="wellbeing-tags-hint">Repéré sans vous : {autoHints.join(', ')}.</p>}

          <label className="wellbeing-phrase">
            <span className="wellbeing-tags-title">
              En une phrase <span className="wellbeing-tags-optional">(facultatif)</span>
            </span>
            <textarea
              className="wellbeing-phrase-input"
              rows={2}
              maxLength={500}
              value={phrase}
              placeholder="« Journée crevante mais contente, apéro le soir »"
              onChange={(e) => setPhrase(e.target.value)}
            />
          </label>
          {proposedScore !== null || proposedTags.length > 0 ? (
            <div className="wellbeing-proposals">
              <p className="wellbeing-tags-hint">Proposé d’après votre phrase (touchez pour garder) :</p>
              <div className="wellbeing-tags">
                {proposedScore !== null && (
                  <button
                    type="button"
                    className="wellbeing-tag wellbeing-proposal"
                    aria-label={`Prendre la note ${proposedScore}`}
                    onClick={() => {
                      setSelected(proposedScore)
                      setError(null)
                    }}
                  >
                    Note {proposedScore}
                  </button>
                )}
                {proposedTags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="wellbeing-tag wellbeing-proposal"
                    aria-label={`Ajouter le tag ${t.label}`}
                    onClick={() => toggleTag(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="wellbeing-tags-hint">
              Halcya en tire une note et des précisions à vous proposer ; la phrase n’est pas enregistrée.
            </p>
          )}

          </div>
        )}

        {error && (
          <p className="wellbeing-modal-error" role="alert">
            {error}
          </p>
        )}

        <div className="wellbeing-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={handleSkip} disabled={saving}>
            Annuler
          </button>
          {reminderMode ? (
            <button type="button" className="btn" onClick={() => scheduleReminder(true)} disabled={scheduling || !reminderTime}>
              {evening?.enabled ? 'Changer l’heure' : 'Programmer le rappel'}
            </button>
          ) : (
            <button type="button" className="btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
