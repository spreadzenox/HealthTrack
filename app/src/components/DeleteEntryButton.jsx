import { useState } from 'react'
import { deleteEntry } from '../storage/localHealthStorage'

/**
 * Bouton « Supprimer » discret avec confirmation en deux temps (pas de suppression
 * sur un tap accidentel). Prévient les autres écrans via `health-entries-updated`.
 */
export default function DeleteEntryButton({ entryId, label = 'cette entrée', onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const confirm = async () => {
    setDeleting(true)
    setError(null)
    try {
      await deleteEntry(entryId)
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      onDeleted?.(entryId)
    } catch {
      setError('Suppression impossible, réessayez.')
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <div className="entry-delete">
        <button
          type="button"
          className="entry-delete-btn"
          onClick={() => setConfirming(true)}
          aria-label={`Supprimer ${label}`}
        >
          Supprimer
        </button>
      </div>
    )
  }

  return (
    <div className="entry-delete entry-delete-confirm">
      <span className="entry-delete-question">Supprimer {label} ?</span>
      <button type="button" className="entry-delete-btn" onClick={() => setConfirming(false)} disabled={deleting}>
        Annuler
      </button>
      <button type="button" className="entry-delete-btn entry-delete-btn-danger" onClick={confirm} disabled={deleting}>
        {deleting ? 'Suppression…' : 'Confirmer'}
      </button>
      {error && <span className="entry-delete-error" role="alert">{error}</span>}
    </div>
  )
}
