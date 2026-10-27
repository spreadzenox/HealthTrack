/**
 * Forme des selles (I176) dans la carte « Votre ventre » : une ligne discrète « + Selles », puis Dures / Normales /
 * Liquides en un geste ; le type précis de l'échelle de Bristol (1 à 7) seulement si la personne veut préciser.
 * Rien n'est lu au chargement (budget de lectures de l'accueil) : la confirmation ne montre que la note qu'on vient
 * d'enregistrer, le Journal montre les autres.
 */
import { useState } from 'react'
import { createEntry } from '../storage/localHealthStorage'
import { BRISTOL_TYPES, STOOL_FORMS, STOOL_SOURCE, STOOL_TYPE, stoolEntryLabel, stoolPayload } from '../services/stool'

const timeOf = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export default function StoolLine() {
  const [open, setOpen] = useState(false)
  const [precise, setPrecise] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState(null)

  async function save(choice) {
    setSaving(true)
    setError(null)
    try {
      const entry = { type: STOOL_TYPE, source: STOOL_SOURCE, payload: stoolPayload(choice), at: new Date().toISOString() }
      await createEntry(entry)
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      setSaved(entry)
      setOpen(false)
      setPrecise(false)
    } catch (e) {
      setError(e?.message || 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <div className="stool-line">
        {saved && (
          <p className="stool-saved">Selles notées : {stoolEntryLabel(saved)}, à {timeOf(saved.at)}.</p>
        )}
        <button type="button" className="stool-open" onClick={() => setOpen(true)} aria-expanded="false">
          + Selles
        </button>
      </div>
    )
  }

  return (
    <div className="stool-line stool-line-open" role="group" aria-labelledby="stool-title">
      <div className="stool-head">
        <p id="stool-title" className="stool-title">Selles</p>
        <button type="button" className="stool-close" onClick={() => { setOpen(false); setPrecise(false) }} aria-label="Fermer">
          ✕
        </button>
      </div>
      <div className="stool-forms">
        {STOOL_FORMS.map((f) => (
          <button key={f.id} type="button" className="stool-form" disabled={saving} onClick={() => save({ form: f.id })}>
            {f.label}
          </button>
        ))}
      </div>
      {!precise ? (
        <button type="button" className="stool-precise-toggle" onClick={() => setPrecise(true)}>
          Préciser le type (échelle de Bristol)
        </button>
      ) : (
        <ol className="stool-bristol" aria-label="Échelle de Bristol">
          {BRISTOL_TYPES.map((t) => (
            <li key={t.n}>
              <button type="button" className="stool-bristol-choice" disabled={saving} onClick={() => save({ bristol: t.n })}>
                <span className="stool-bristol-n mono">{t.n}</span>
                {t.text}
              </button>
            </li>
          ))}
        </ol>
      )}
      {error && <p className="error-msg" role="alert">{error}</p>}
    </div>
  )
}
