/**
 * Forme des selles estimée par photo (SELLES-PHOTO-2, retour (7) du 04/11, étude I221) : une ligne discrète du
 * Journal, jamais sur l'Accueil, affichée seulement si la carte ventre l'est (objectif « Mon ventre »).
 *
 * Geste explicite : l'appareil photo s'ouvre directement (pas la galerie), la photo part une fois à l'analyse puis
 * est oubliée (le champ est vidé, rien n'est écrit). La forme estimée est présélectionnée, modifiable, et rien n'est
 * enregistré avant « Enregistrer ». L'entrée garde ce que proposait le modèle (`estimate`) pour mesurer plus tard la
 * fiabilité chez la personne (SELLES-PHOTO-3), sans aucune image. Jamais un diagnostic : seule la forme revient.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FEATURES } from '../config/distribution'
import useDisclosure from '../hooks/useDisclosure'
import { canAnalyzeMeals } from '../services/mealAi'
import { analyzeStoolPhoto } from '../services/stoolPhoto'
import {
  BRISTOL_TYPES,
  STOOL_FORMS,
  STOOL_SOURCE,
  STOOL_TYPE,
  formOfBristol,
  stoolEntryLabel,
  stoolPayload,
  stoolPhotoReliability,
  stoolPhotoReliabilityText,
} from '../services/stool'
import { WHEN_TO_SEE_DOCTOR } from '../services/today'
import { createEntry, listEntries } from '../storage/localHealthStorage'
import { appLocale } from '../i18n/locale.js'
import LineIcon from './LineIcon'
import './TodayCards.css'

const CONSENT_KEY = 'halcya_ai_stool_consent'
const MISSING_KEY = 'Ajoutez votre clé API Gemini dans Réglages (roue en haut à droite) → Paramètres pour estimer avec une photo.'

function hasConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1'
  } catch {
    return false
  }
}

function rememberConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, '1')
  } catch {
    // stockage indisponible : la question reviendra à la prochaine photo
  }
}

const timeOf = (iso) => new Date(iso).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })

/** Notes de selles lues pour la fiabilité (les plus récentes ; le Journal, lui, ne charge que quelques jours). */
const RELIABILITY_LIMIT = 200

/**
 * Dès 5 photos, la ligne dit combien d'estimations la personne a corrigées, et le résultat la prévient si c'est
 * souvent le cas (SELLES-PHOTO-3). Les notes de selles sont lues ici, indépendamment des jours affichés.
 */
export default function StoolPhotoLine({ features = FEATURES }) {
  const inputRef = useRef(null)
  const [disclosure, askConsent] = useDisclosure()
  const [busy, setBusy] = useState(false)
  // estimate : null (fermé), { readable, bristol, form, confidence } après l'analyse
  const [estimate, setEstimate] = useState(null)
  const [choice, setChoice] = useState(null)
  const [precise, setPrecise] = useState(false)
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState(null)
  const [stools, setStools] = useState([])

  const loadStools = useCallback(async () => {
    try {
      setStools(await listEntries({ type: STOOL_TYPE, limit: RELIABILITY_LIMIT }))
    } catch {
      setStools([])
    }
  }, [])

  useEffect(() => {
    loadStools()
    window.addEventListener('health-entries-updated', loadStools)
    return () => window.removeEventListener('health-entries-updated', loadStools)
  }, [loadStools])

  async function start() {
    setError(null)
    setSaved(null)
    if (!canAnalyzeMeals(features)) {
      setError(MISSING_KEY)
      return
    }
    if (features.aiRelay && !hasConsent()) {
      if (!(await askConsent('ai_stool'))) return
      rememberConsent()
    }
    inputRef.current?.click()
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0]
    // La photo n'est lue qu'une fois : le champ est vidé tout de suite
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const r = await analyzeStoolPhoto(file, features)
      setEstimate(r)
      setChoice(r.readable ? { bristol: r.bristol } : null)
      setPrecise(false)
    } catch (err) {
      setError(err?.message || 'L’estimation n’a pas abouti. Réessayez dans un instant.')
    } finally {
      setBusy(false)
    }
  }

  function close() {
    setEstimate(null)
    setChoice(null)
    setPrecise(false)
  }

  async function save() {
    if (!choice) return
    setBusy(true)
    setError(null)
    try {
      const entry = {
        type: STOOL_TYPE,
        source: STOOL_SOURCE,
        payload: stoolPayload({ ...choice, estimate: estimate?.readable ? { bristol: estimate.bristol } : null }),
        at: new Date().toISOString(),
      }
      await createEntry(entry)
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      setSaved(entry)
      close()
    } catch (err) {
      setError(err?.message || 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  const reliability = useMemo(() => stoolPhotoReliability(stools), [stools])
  const chosenForm = choice ? (choice.bristol ? formOfBristol(choice.bristol) : choice.form) : null
  const estimatedType = estimate?.readable ? BRISTOL_TYPES.find((t) => t.n === estimate.bristol) : null

  return (
    <div className="stool-photo">
      {disclosure}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhoto}
        className="hidden-file-input"
        aria-label="Prendre la photo des selles"
        tabIndex={-1}
      />
      {saved && <p className="stool-saved">Selles notées : {stoolEntryLabel(saved)}, à {timeOf(saved.at)}.</p>}
      {!estimate && (
        <button type="button" className="stool-photo-open" onClick={start} disabled={busy}>
          <LineIcon name="camera" size={16} />
          {busy ? 'Estimation en cours…' : 'Selles : estimer la forme avec une photo'}
        </button>
      )}
      {!estimate && reliability && <p className="stool-photo-reliability">{stoolPhotoReliabilityText(reliability)}</p>}
      {estimate && (
        <div className="stool-photo-result" role="group" aria-labelledby="stool-photo-title">
          <div className="stool-head">
            <p id="stool-photo-title" className="stool-title">Forme des selles</p>
            <button type="button" className="stool-close" onClick={close} aria-label="Fermer">✕</button>
          </div>
          {estimatedType ? (
            <p className="stool-photo-estimate">
              Estimé : <span className="mono">type {estimatedType.n}</span> · {estimatedType.text}
              {estimate.confidence === 'low' ? ' (forme peu nette, vérifiez)' : ''}
            </p>
          ) : (
            <p className="stool-photo-estimate">Photo difficile à lire. Choisissez vous-même.</p>
          )}
          {estimatedType && reliability?.often && (
            <p className="stool-photo-often">Souvent corrigée chez vous : vérifiez la forme.</p>
          )}
          <div className="stool-forms">
            {STOOL_FORMS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={'stool-form' + (chosenForm === f.id ? ' selected' : '')}
                aria-pressed={chosenForm === f.id}
                disabled={busy}
                onClick={() => setChoice({ form: f.id })}
              >
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
                  <button
                    type="button"
                    className={'stool-bristol-choice' + (choice?.bristol === t.n ? ' selected' : '')}
                    aria-pressed={choice?.bristol === t.n}
                    disabled={busy}
                    onClick={() => setChoice({ bristol: t.n })}
                  >
                    <span className="stool-bristol-n mono">{t.n}</span>
                    {t.text}
                  </button>
                </li>
              ))}
            </ol>
          )}
          <button type="button" className="btn btn-primary stool-photo-save" onClick={save} disabled={busy || !choice}>
            Enregistrer
          </button>
          <p className="stool-photo-note">{WHEN_TO_SEE_DOCTOR}</p>
        </div>
      )}
      {error && <p className="error-msg" role="alert">{error}</p>}
    </div>
  )
}
