/**
 * Le bandeau de l'Accueil au défilement (refonte « Compagnon », étape 10 ; specs/ile.SPEC.md § 9) : quand l'îlot
 * sort de l'écran, un bandeau en haut garde le compagnon, son humeur et les bulles qui restent ; le toucher remonte
 * à l'îlot. Il n'apparaît que sur l'Accueil, tant que l'îlot est presque hors de vue.
 */
import { useEffect, useState } from 'react'

const sceneImages = import.meta.glob('../scene/fallback.webp', { eager: true, import: 'default', query: '?url' })
const stillImage = Object.values(sceneImages)[0] ?? null

export default function ScrollBanner({ targetRef, title, sub, dots = [], reduced = false }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = targetRef.current
    if (!el || typeof IntersectionObserver !== 'function') return undefined
    // À 70 % de la course, le bandeau prend le relais : moins de 30 % de l'îlot encore visible
    const io = new IntersectionObserver(([e]) => setShown(e.boundingClientRect.top < 0 && e.intersectionRatio < 0.3),
      { threshold: [0, 0.1, 0.2, 0.3, 0.5, 1] })
    io.observe(el)
    return () => io.disconnect()
  }, [targetRef])
  if (!shown) return null
  const back = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }
  return (
    <button type="button" className="cmp-banner" onClick={back} aria-label={`${title}, ${sub}. Revenir à l’îlot`}>
      <span className="cmp-banner-island" aria-hidden="true">
        {stillImage && <img src={stillImage} alt="" />}
      </span>
      <span className="cmp-banner-text">
        <span className="cmp-banner-title">{title}</span>
        <span className="cmp-banner-sub">
          {dots.length > 0 && (
            <span className="cmp-banner-dots" aria-hidden="true">
              {dots.map((d) => <span key={d.id} className="cmp-banner-dot" data-tone={d.tone} />)}
            </span>
          )}
          {sub}
        </span>
      </span>
    </button>
  )
}
