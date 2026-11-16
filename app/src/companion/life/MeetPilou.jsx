/**
 * La rencontre et le nom (lot VIE, étape 12 ; specs/comprendre.SPEC.md § 2 et § 3). Pilou pousse sur son îlot
 * (d'abord l'antenne, puis lui), salue, puis « Comment voulez-vous l'appeler ? ». « Passer » saute la séquence.
 * À « Valider », il saute une fois par syllabe de son nom (deux sauts au plus au-delà de 3 syllabes) et dit
 * « {nom} ! Ça me plaît. » Mouvements réduits : Pilou apparaît en fondu, sans saut.
 *
 * Deux usages : dans l'onboarding d'une installation neuve (`mode="onboarding"`), et une seule fois sur l'Accueil
 * pour un utilisateur qui met à jour depuis une version d'avant la refonte (`mode="update"`, sans refaire l'accueil).
 */
import { useEffect, useRef, useState } from 'react'
import PilouFigure from './PilouFigure'
import { DEFAULT_NAME, MAX_NAME, cleanName, companionName, markMet } from './companionState'
import { hopsFor } from './syllables'
import { bus, EVENTS } from '../bus'
import './MeetPilou.css'

/** Durée de l'éclosion avant la carte du nom (SPEC § 2 : ≈ 4 s, le salut à 4,5 s). */
export const HATCH_MS = 4600

/**
 * @param {{ mode?: 'onboarding'|'update', onDone: (name: string) => void, hatchMs?: number }} props
 */
export default function MeetPilou({ mode = 'onboarding', onDone, hatchMs = HATCH_MS }) {
  const [phase, setPhase] = useState('hatch')
  const [value, setValue] = useState(() => companionName())
  const [named, setNamed] = useState(null)
  const [said, setSaid] = useState('Bonjour !')
  const timers = useRef([])
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))

  useEffect(() => {
    later(() => setPhase('name'), hatchMs)
    const t = timers.current
    return () => t.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const skip = () => {
    if (phase === 'hatch') setPhase('name')
  }

  const name = cleanName(value)
  const validate = (e) => {
    e?.preventDefault()
    if (!name) return
    markMet(mode, { name })
    bus.emit(EVENTS.PILOU_NAMED, { name })
    setNamed(name)
    setPhase('named')
    setSaid(`${name} ! Ça me plaît.`)
    later(() => setSaid(mode === 'update' ? 'Enchanté ! Je vous accompagne maintenant dans votre journée.' : 'Enchanté ! On fait connaissance ?'), 1600)
  }

  const hops = named ? hopsFor(named) : 0
  return (
    <div className={`meet-pilou is-${phase}`} data-testid="meet-pilou">
      {phase === 'hatch' && <h1 className="visually-hidden">Pilou arrive sur son îlot</h1>}
      <div className="meet-sky">
        <div className="meet-island" aria-hidden="true" />
        <div className={`meet-pilou-figure${named ? ` meet-hops-${hops}` : ''}`}>
          <PilouFigure key={named ? `n-${named}` : phase} size={128}
            expr={named ? 'rayonnant' : phase === 'hatch' ? 'tranquille' : 'salut'} move={phase === 'name' ? 'wave' : 'none'} />
        </div>
        <p className="meet-bubble" role="status">{phase === 'hatch' ? 'Bonjour !' : said}</p>
        {phase === 'hatch' && (
          <button type="button" className="meet-skip" onClick={skip}>Passer</button>
        )}
      </div>
      {phase !== 'hatch' && (
        <form className="meet-card" onSubmit={phase === 'named' ? (e) => { e.preventDefault(); onDone(named) } : validate}>
          <h1 className="meet-title">Comment voulez-vous l’appeler ?</h1>
          <p className="meet-lead">C’est vous qui choisissez. Vous pourrez changer son nom dans Réglages.</p>
          <label className="meet-field">
            <span className="visually-hidden">Son nom</span>
            <input type="text" value={value} maxLength={MAX_NAME + 10} placeholder="Son nom…" autoComplete="off"
              enterKeyHint="done" disabled={phase === 'named'} aria-label="Son nom"
              onChange={(e) => setValue(e.target.value)} />
            {phase === 'named' && <span className="meet-check" aria-hidden="true">✓</span>}
          </label>
          <button type="submit" className="btn meet-action" disabled={!name}>
            {phase === 'named' ? 'Continuer' : 'Valider'}
          </button>
          {phase !== 'named' && value !== DEFAULT_NAME && (
            <button type="button" className="meet-default" onClick={() => setValue(DEFAULT_NAME)}>Garder « {DEFAULT_NAME} »</button>
          )}
        </form>
      )}
    </div>
  )
}
