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
  getEveningNoteStatus,
  setEveningNoteEnabled,
} from '../services/eveningNote'
import { APP_NAME } from '../config/brand'
import LineIcon from './LineIcon'

const SCORES = [0, 1, 2, 3, 4, 5]

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
export default function WellbeingPrompt({ open = false, onClose, entry } = {}) {
  const [selected, setSelected] = useState(null)
  const [tags, setTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [captures, setCaptures] = useState({ workouts: false, meals: false, travelToday: false })
  const [evening, setEvening] = useState(null)
  const [eveningHint, setEveningHint] = useState(null)
  const [phrase, setPhrase] = useState('')

  // Reset (or prefill with the edited note) whenever the dialog opens
  useEffect(() => {
    if (open) {
      const score = entry?.payload?.score
      setSelected(typeof score === 'number' ? score : null)
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
    if (eveningNotePlugin()) getEveningNoteStatus().then((v) => alive && setEvening(v))
    return () => {
      alive = false
    }
  }, [open])

  // Never ask for what the app already measures (an old note keeps its tag visible, to remove it).
  const autoIds = open ? autoDetectedTagIds({ phoneUsage: getPhoneUsageSettings().enabled, ...captures }) : []
  const shownTags = BEHAVIOR_TAGS.filter((t) => !autoIds.includes(t.id) || tags.includes(t.id))
  const autoHints = autoIds.map((id) => AUTO_HINTS[id]).filter(Boolean)

  // I119 : la phrase ne fait que proposer (lexiques disjoints ressenti / contexte) ; elle n'est jamais enregistrée.
  const read = phrase.trim() ? readPhrase(phrase) : null
  const proposedScore = read?.score != null && read.score !== selected ? read.score : null
  const proposedTags = read ? shownTags.filter((t) => read.tags.includes(t.id) && !tags.includes(t.id)) : []

  const close = () => onClose?.()

  const toggleTag = (id) => {
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const toggleEvening = async () => {
    const on = !evening?.enabled
    setEvening((prev) => ({ ...prev, enabled: on }))
    try {
      const res = await setEveningNoteEnabled(on)
      setEveningHint(res.blocked ? `Notifications refusées : autorisez-les pour ${APP_NAME} dans les réglages Android.` : null)
      setEvening(await getEveningNoteStatus())
    } catch {
      setEvening((prev) => ({ ...prev, enabled: !on }))
    }
  }

  const handleSkip = () => {
    setError(null)
    close()
  }

  const handleSave = async () => {
    if (selected === null) {
      setError('Choisissez une note de 0 à 5.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (entry) {
        await updateEntry(entry.id, { payload: withTags({ ...entry.payload, score: selected }, tags) })
      } else {
        await createEntry({
          type: 'wellbeing',
          source: 'app_wellbeing',
          payload: withTags({ score: selected }, tags),
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
            : '0 = très bas, 5 = très bien.'}
        </p>

        <div className="wellbeing-circles" role="group" aria-label="Note de bien-être de 0 à 5">
          {SCORES.map((n) => (
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
            Dictez-la avec le micro du clavier si vous préférez : elle sert seulement à vous proposer une note et des
            tags, elle n’est pas gardée.
          </p>
        )}

        {evening && (
          <>
            <button
              type="button"
              className={'wellbeing-evening' + (evening.enabled ? ' wellbeing-evening-on' : '')}
              aria-pressed={!!evening.enabled}
              onClick={toggleEvening}
            >
              <LineIcon name="bell" size={18} /> Me la demander le soir, d’un geste depuis une notification
              {evening.enabled ? ` (vers ${formatMinute(evening.minuteOfDay ?? DEFAULT_MINUTE)})` : ''}
            </button>
            {eveningHint && <p className="wellbeing-tags-hint">{eveningHint}</p>}
          </>
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
          <button type="button" className="btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
