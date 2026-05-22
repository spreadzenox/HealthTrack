import { useState } from 'react'
import { createEntry } from '../storage/localHealthStorage'

/**
 * One-tap control to log a single cigarette on the dashboard.
 * Each click creates one `cigarette` entry (count: 1) for today.
 */
export default function CigaretteQuickAdd() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)

  const handleAdd = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    setSavedFlash(false)
    try {
      await createEntry({
        type: 'cigarette',
        source: 'app_cigarette',
        payload: { count: 1 },
      })
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 1500)
    } catch (e) {
      setError(e.message || 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cigarette-quick-add">
      <button
        type="button"
        className="btn btn-secondary dashboard-cigarette-btn"
        onClick={handleAdd}
        disabled={saving}
        aria-label="Ajouter une cigarette"
      >
        {saving ? 'Enregistrement…' : '+ 1 cigarette'}
      </button>
      {savedFlash && (
        <span className="cigarette-quick-add-ok" role="status">
          Enregistré
        </span>
      )}
      {error && (
        <span className="cigarette-quick-add-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
