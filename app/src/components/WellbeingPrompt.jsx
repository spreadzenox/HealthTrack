import { useState, useEffect } from 'react'
import { createEntry } from '../storage/localHealthStorage'

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

export default function WellbeingPrompt() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!hasAnsweredThisSession()) {
      setOpen(true)
    }
  }, [])

  const close = () => {
    setOpen(false)
    markSessionAnswered()
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
      await createEntry({
        type: 'wellbeing',
        source: 'app_wellbeing',
        payload: { score: selected },
      })
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      markSessionAnswered()
      setOpen(false)
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
          Comment vous sentez-vous ?
        </h2>
        <p id="wellbeing-modal-desc" className="wellbeing-modal-desc">
          Notez votre bien-être de 0 (très bas) à 5 (très bien). Les données restent sur cet appareil.
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

        {error && (
          <p className="wellbeing-modal-error" role="alert">
            {error}
          </p>
        )}

        <div className="wellbeing-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={handleSkip} disabled={saving}>
            Plus tard
          </button>
          <button type="button" className="btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
