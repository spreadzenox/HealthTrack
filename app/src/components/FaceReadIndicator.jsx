/**
 * Bandeau visible pendant une lecture du visage à l'ouverture de l'app (variante play, services/faceAppOpen.js) :
 * la caméra ne lit jamais sans que ce soit dit à l'écran. Après la lecture, un mot bref sur ce qui a été gardé
 * (des nombres, aucune image), puis il disparaît.
 */
import { useEffect, useState } from 'react'
import { FACE_READ_EVENT } from '../services/faceAppOpen'
import './FaceReadIndicator.css'

const DONE_MS = 2500

export default function FaceReadIndicator() {
  const [phase, setPhase] = useState(null)

  useEffect(() => {
    let timer = null
    const on = (e) => {
      clearTimeout(timer)
      const { phase: p, outcome } = e.detail || {}
      if (p === 'start') setPhase('reading')
      else if (p === 'end' && outcome === 'face') {
        setPhase('done')
        timer = setTimeout(() => setPhase(null), DONE_MS)
      } else setPhase(null)
    }
    window.addEventListener(FACE_READ_EVENT, on)
    return () => {
      clearTimeout(timer)
      window.removeEventListener(FACE_READ_EVENT, on)
    }
  }, [])

  if (!phase) return null
  return (
    <div className="face-read-indicator" role="status" aria-live="polite">
      <span className={`face-read-dot${phase === 'reading' ? ' face-read-dot-live' : ''}`} aria-hidden />
      {phase === 'reading'
        ? <span><strong>Lecture du visage</strong> · regardez l’écran une seconde</span>
        : <span><strong>Bien-être lu</strong> · quelques nombres gardés, aucune image</span>}
    </div>
  )
}
