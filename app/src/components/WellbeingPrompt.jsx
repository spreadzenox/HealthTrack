import { useState, useEffect } from 'react'
import { createEntry, updateEntry } from '../storage/localHealthStorage'
import { BEHAVIOR_TAGS } from '../services/behaviorTags'

const SESSION_KEY = 'healthtrack-wellbeing-prompt-session'

function hasAnsweredThisSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function markSessionAnswered() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* ignore quota / private mode */
  }
}

const SCORES = [0, 1, 2, 3, 4, 5]

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
 * WellbeingPrompt can work in two modes:
 * - Uncontrolled (no props): shows automatically once per session.
 * - Controlled (open + onClose props): caller manages visibility.
 * With `entry` (controlled mode), it edits that saved note in place: score and tags change,
 * the time and the other payload fields are kept.
 */
export default function WellbeingPrompt({ open: controlledOpen, onClose: controlledOnClose, entry } = {}) {
  const isControlled = controlledOpen !== undefined

  const [internalOpen, setInternalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [tags, setTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isControlled && !hasAnsweredThisSession()) {
      setInternalOpen(true)
    }
  }, [isControlled])

  // Reset (or prefill with the edited note) whenever the dialog opens
  useEffect(() => {
    const visible = isControlled ? controlledOpen : internalOpen
    if (visible) {
      const score = entry?.payload?.score
      setSelected(typeof score === 'number' ? score : null)
      setTags(Array.isArray(entry?.payload?.tags) ? entry.payload.tags : [])
      setError(null)
    }
  }, [isControlled ? controlledOpen : internalOpen, entry]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = isControlled ? controlledOpen : internalOpen

  const close = () => {
    if (isControlled) {
      controlledOnClose?.()
    } else {
      setInternalOpen(false)
      markSessionAnswered()
    }
  }

  const toggleTag = (id) => {
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
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
      if (!isControlled) {
        markSessionAnswered()
      }
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
            : 'Notez votre bien-être de 0 (très bas) à 5 (très bien). Les données restent sur cet appareil.'}
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
          {BEHAVIOR_TAGS.map((t) => {
            const on = tags.includes(t.id)
            return (
              <button
                key={t.id}
                type="button"
                className={'wellbeing-tag' + (on ? ' wellbeing-tag-selected' : '')}
                aria-pressed={on}
                onClick={() => toggleTag(t.id)}
              >
                <span aria-hidden>{t.emoji}</span> {t.label}
              </button>
            )
          })}
        </div>
        <p className="wellbeing-tags-hint">
          Ces tags permettent de voir, dans Analyses, ce qui va de pair avec vos bons et
          moins bons jours.
        </p>

        {error && (
          <p className="wellbeing-modal-error" role="alert">
            {error}
          </p>
        )}

        <div className="wellbeing-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={handleSkip} disabled={saving}>
            {isControlled ? 'Annuler' : 'Plus tard'}
          </button>
          <button type="button" className="btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
