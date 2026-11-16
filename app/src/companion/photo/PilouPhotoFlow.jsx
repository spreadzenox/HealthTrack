/**
 * Parcours « Et si Pilou vous ressemblait ? » (PILOU-DOUBLE.md § 2, brief § 9, étape 15) :
 * proposition → information et consentement séparés → caméra avant (cadre ovale) → une analyse → les traits
 * nommés un par un, « À vérifier » quand l'IA hésite → le Studio. Refuser, annuler ou échouer mène toujours au
 * Studio à la main (« On le fait ensemble ? »), jamais à une impasse. Monté seulement si l'interrupteur de build
 * PILOU_PHOTO est allumé (flag.js).
 */
import { useEffect, useRef, useState } from 'react'
import { analyzeSelfie, photoAnalysesLeft } from './client.js'
import { captureSelfie, openFrontCamera, stopCamera } from './selfie.js'
import { checksToShow, traitsToShow } from './style.js'

/** Texte d'information affiché avant la caméra, mot pour mot (PILOU-DOUBLE.md § 2, point 2). */
export const PHOTO_NOTICE =
  'Votre photo part une seule fois, vers le serveur de Halcya en Europe. Une IA (Gemini, de Google) en tire une petite fiche de style : cheveux, yeux, lunettes… La photo n’est gardée ni sur le serveur ni dans l’app. Halcya ne déduit jamais votre âge, votre genre, votre origine ni votre santé.'

const left = (n) => (n > 1 ? `${n} analyses de photo possibles ce mois-ci.` : n === 1 ? '1 analyse de photo possible ce mois-ci.' : 'Plus d’analyse de photo ce mois-ci.')

/**
 * @param {{ name?: string, start?: 'propose' | 'info', onStudio: (style: object | null) => void, onLater: () => void,
 *   analyze?: typeof analyzeSelfie, openCamera?: typeof openFrontCamera, capture?: typeof captureSelfie, remaining?: number }} props
 */
export default function PilouPhotoFlow({
  name = 'Pilou',
  start = 'propose',
  onStudio,
  onLater,
  analyze = analyzeSelfie,
  openCamera = openFrontCamera,
  capture = captureSelfie,
  remaining = photoAnalysesLeft(),
}) {
  const [step, setStep] = useState(start)
  const [error, setError] = useState(null)
  const [style, setStyle] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // La caméra ne s'ouvre qu'à l'étape « caméra », donc après le consentement ; elle se coupe en sortant
  useEffect(() => {
    if (step !== 'camera') return undefined
    let cancelled = false
    openCamera()
      .then((stream) => {
        if (cancelled) {
          stopCamera(stream)
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play?.()?.catch?.(() => {})
        }
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setStep('error')
      })
    return () => {
      cancelled = true
      stopCamera(streamRef.current)
      streamRef.current = null
    }
  }, [step, openCamera])

  async function takePhoto() {
    let photo
    try {
      photo = capture(videoRef.current)
    } catch (err) {
      setError(err.message)
      setStep('error')
      return
    }
    stopCamera(streamRef.current)
    streamRef.current = null
    setStep('analyse')
    try {
      const result = await analyze(photo)
      setStyle(result.style)
      setStep('result')
    } catch (err) {
      setError(err.message)
      setStep('error')
    } finally {
      photo.data = null
    }
  }

  const byHand = () => onStudio(null)

  return (
    <section className="food-page pilou-photo" aria-labelledby="pilou-photo-title">
      {step === 'propose' && (
        <>
          <h2 id="pilou-photo-title" className="page-title">Et si {name} vous ressemblait ?</h2>
          <p className="page-intro">{name} peut porter vos cheveux, vos lunettes, la couleur de vos yeux… Avec une photo, ou à la main.</p>
          <div className="pilou-photo-actions">
            <button type="button" className="btn btn-primary" onClick={() => setStep('info')}>Prendre une photo</button>
            <button type="button" className="btn btn-secondary" onClick={byHand}>Le faire à la main</button>
            <button type="button" className="btn btn-secondary" onClick={onLater}>Plus tard</button>
          </div>
        </>
      )}

      {step === 'info' && (
        <>
          <h2 id="pilou-photo-title" className="page-title">Avant la photo</h2>
          <p className="pilou-photo-notice">{PHOTO_NOTICE}</p>
          <p className="pilou-photo-left">{left(remaining)}</p>
          <div className="pilou-photo-actions">
            {remaining > 0 && (
              <button type="button" className="btn btn-primary" onClick={() => setStep('camera')}>J’accepte, prendre la photo</button>
            )}
            <button type="button" className="btn btn-secondary" onClick={byHand}>Non merci, le faire à la main</button>
          </div>
        </>
      )}

      {step === 'camera' && (
        <>
          <h2 id="pilou-photo-title" className="page-title">Votre visage dans l’ovale</h2>
          <div className="pilou-photo-frame">
            <video ref={videoRef} className="pilou-photo-video" autoPlay playsInline muted aria-label="Aperçu de la caméra avant" />
            <div className="pilou-photo-oval" aria-hidden="true" />
          </div>
          <div className="pilou-photo-actions">
            <button type="button" className="btn btn-primary" onClick={takePhoto}>Prendre la photo</button>
            <button type="button" className="btn btn-secondary" onClick={byHand}>Annuler</button>
          </div>
        </>
      )}

      {step === 'analyse' && (
        <>
          <h2 id="pilou-photo-title" className="page-title">{name} regarde la photo…</h2>
          <p className="page-intro" role="status">Quelques secondes. La photo sera effacée dès la réponse.</p>
        </>
      )}

      {step === 'result' && style && (
        <>
          <h2 id="pilou-photo-title" className="page-title">Voilà, c’est nous !</h2>
          <ul className="pilou-photo-traits" aria-label={`Les traits de ${name}`}>
            {traitsToShow(style).map((t, i) => (
              <li key={t.id} style={{ '--i': i }}>
                <span>{t.label}</span>
                {t.unsure && <span className="pilou-photo-check">À vérifier</span>}
              </li>
            ))}
          </ul>
          {checksToShow(style).length > 0 && (
            <p className="pilou-photo-left">{checksToShow(style).join(' · ')} dans le Studio.</p>
          )}
          <p className="pilou-photo-left">La photo est effacée. Seule cette fiche reste, sur ce téléphone.</p>
          <div className="pilou-photo-actions">
            <button type="button" className="btn btn-primary" onClick={() => onStudio(style)}>Ajuster dans le Studio</button>
          </div>
        </>
      )}

      {step === 'error' && (
        <>
          <h2 id="pilou-photo-title" className="page-title">On le fait ensemble ?</h2>
          <p className="page-intro" role="alert">{error}</p>
          <div className="pilou-photo-actions">
            <button type="button" className="btn btn-primary" onClick={byHand}>Ouvrir le Studio</button>
            <button type="button" className="btn btn-secondary" onClick={onLater}>Plus tard</button>
          </div>
        </>
      )}
    </section>
  )
}
