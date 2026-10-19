/**
 * « Humeur estimée » (accueil) : le bien-être du jour estimé par la Lecture du visage dès la première lecture
 * (mood/faceMood.js, consigne du propriétaire du 19/10/2026 au soir), sur l'échelle 0–5 des notes, avec sa
 * fourchette dessinée et sa confiance. Toujours « une estimation, pas un diagnostic ». Rien n'est affiché tant
 * qu'aucune lecture du déverrouillage n'a vu un visage (lecture pas activée, ou hors de l'app Android).
 */
import { useCallback, useEffect, useState } from 'react'
import { describeFaceMood, faceMoodEstimate } from '../services/mood/faceMood'
import { loadFaceMoodEntries } from '../services/mood/faceMoodData'
import './MoodEstimateCard.css'

async function defaultLoad() {
  const { bursts, notes } = await loadFaceMoodEntries()
  if (!bursts.length) return null
  return faceMoodEstimate([...bursts, ...notes], { now: new Date() })
}

const pct = (v) => `${(v / 5) * 100}%`

/** Fourchette sur l'échelle 0–5 : bande = fourchette, trait = estimation. */
export function MoodRange({ low, high, note }) {
  return (
    <div className="mood-range" aria-hidden="true">
      <div className="mood-range-track">
        <div className="mood-range-band" style={{ left: pct(low), width: pct(high - low) }} />
        <div className="mood-range-mark" style={{ left: pct(note) }} />
      </div>
      <div className="mood-range-scale"><span>0</span><span>2,5</span><span>5</span></div>
    </div>
  )
}

/** @param {{ load?: () => Promise<object|null> }} props */
export default function MoodEstimateCard({ load = defaultLoad }) {
  const [est, setEst] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setEst(await load())
    } catch {
      setEst(null)
    }
  }, [load])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement asynchrone depuis IndexedDB
    refresh()
    window.addEventListener('health-entries-updated', refresh)
    return () => window.removeEventListener('health-entries-updated', refresh)
  }, [refresh])

  if (!est) return null
  const lines = describeFaceMood(est)
  const shown = est.day || { ...est.moment }
  return (
    <section className="mood-estimate" aria-labelledby="mood-estimate-title">
      <div className="mood-estimate-head">
        <h3 id="mood-estimate-title" className="mood-estimate-title">Humeur estimée</h3>
        <span className={`mood-estimate-badge is-${est.confidence}`}>Confiance {est.confidence}</span>
      </div>
      <p className="mood-estimate-main">{lines[0]}</p>
      <MoodRange low={shown.low} high={shown.high} note={shown.note} />
      {lines.slice(1).map((line) => <p key={line} className="mood-estimate-sub">{line}</p>)}
    </section>
  )
}
