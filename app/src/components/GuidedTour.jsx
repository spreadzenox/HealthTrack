/**
 * Visite guidée sur les vrais écrans (ACC-8, nouvel accueil du 08/11) : à l'arrivée dans l'app après l'accueil, puis
 * par « Voir un exemple ». Pour chaque onglet, l'écran réel de la personne (« maintenant »), puis le même écran rempli
 * de données fictives (mode exemple : en mémoire, jamais écrites dans sa base). « Passer la visite » est toujours là ;
 * la fin, « Passer » et un plantage rendent ses vraies données.
 */
import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enterExampleMode, exitExampleMode } from '../storage/exampleMode'
import { buildTourEntries, receivedMeasures } from '../services/tourData'
import { goalsOf, loadOnboarding, saveOnboarding, wantsGut } from '../settings/onboarding'
import { isFaceSenseEnabled } from '../services/faceSense'
import { getWeatherSettings } from '../services/weatherSync'
import { getPhoneUsageSettings } from '../services/phoneUsageSync'
import { COUNTER_MS, counterDay, startIndex, tourSteps } from '../services/tour'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

/** Compteur « jour 1 → jour N » de l'animation (sans animation si l'utilisateur les réduit). */
function DayCounter({ days, animate }) {
  const [day, setDay] = useState(animate ? 1 : days)
  useEffect(() => {
    if (!animate) return undefined
    const start = Date.now()
    const tick = () => setDay(counterDay(Date.now() - start, days))
    const t = setInterval(tick, Math.max(30, COUNTER_MS / days))
    // Dernière valeur garantie, même si les ticks ont été retardés
    const end = setTimeout(() => {
      clearInterval(t)
      setDay(days)
    }, COUNTER_MS + 50)
    return () => {
      clearInterval(t)
      clearTimeout(end)
    }
  }, [days, animate])
  return <span className="tour-day">jour <span className="mono">{day}</span></span>
}

const sameRect = (a, b) => a && b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height

/**
 * Projecteur sur l'élément de l'étape. L'écran se remplit après coup (données de l'exemple, analyses) : la position est
 * remesurée tant que l'étape dure, sinon la découpe reste où l'élément était vide (bande blanche sous la bulle).
 */
export function Spotlight({ selector, stepKey }) {
  const [rect, setRect] = useState(null)
  useEffect(() => {
    setRect(null)
    if (!selector) return undefined
    let tries = 0
    let timer = null
    let found = false
    const measure = () => {
      const el = document.querySelector(selector)
      if (el) {
        if (!found) el.scrollIntoView?.({ block: 'center' })
        found = true
        const r = el.getBoundingClientRect()
        const next = { top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 }
        setRect((prev) => (sameRect(prev, next) ? prev : next))
        timer = setTimeout(measure, 300)
        return
      }
      // L'écran se charge : on réessaie un peu, puis la bulle reste seule (jamais bloquant)
      if (found) setRect(null)
      if (found || ++tries < 15) timer = setTimeout(measure, 150)
    }
    timer = setTimeout(measure, 120)
    return () => clearTimeout(timer)
  }, [selector, stepKey])
  if (!rect) return <div className="tour-shade" aria-hidden="true" />
  return <div className="tour-spot" style={rect} aria-hidden="true" />
}

function Tour({ onEnd, from }) {
  const navigate = useNavigate()
  const [ctx, setCtx] = useState(null)
  const [picked, setI] = useState(null)
  const [revealing, setRevealing] = useState(false)
  const shownDays = useRef(0)

  // « Voir un exemple » se cache pendant la visite
  useEffect(() => {
    document.body.classList.add('tour-open')
    return () => document.body.classList.remove('tour-open')
  }, [])

  // Ce que la personne reçoit vraiment (ACC-5), lu dans sa base avant tout exemple
  useEffect(() => {
    let alive = true
    receivedMeasures()
      .catch(() => new Set())
      .then((received) => {
        if (!alive) return
        const s = loadOnboarding()
        setCtx({
          received,
          hc: received.size > 0 || s.health === 'granted' || s.huawei === 'pair',
          face: isFaceSenseEnabled(),
          // Relancée depuis Analyses › Digestion : l'exemple de la digestion, même sans cet objectif
          gut: wantsGut(goalsOf(s)) || from === '/recommendations/ventre',
          weather: getWeatherSettings().enabled,
          screen: getPhoneUsageSettings().enabled,
          huawei: s.huawei === 'pair',
        })
      })
    return () => {
      alive = false
    }
  }, [from])

  const steps = useMemo(() => (ctx ? tourSteps(ctx) : null), [ctx])
  const i = picked ?? (steps ? startIndex(steps, from) : 0)
  const step = steps?.[i]

  useEffect(() => {
    if (!step) return
    navigate(step.route)
    if (!step.days) {
      exitExampleMode()
      shownDays.current = 0
    } else if (shownDays.current !== step.days) {
      shownDays.current = step.days
      enterExampleMode(buildTourEntries({ ...ctx, days: shownDays.current }))
    }
  }, [step, ctx, navigate])

  useEffect(() => {
    if (!revealing) return undefined
    const t = setTimeout(() => setRevealing(false), 1100)
    return () => clearTimeout(t)
  }, [revealing])

  if (!step) return null
  const next = () => {
    if (step.last) return onEnd('done')
    // « Voir dans 14 jours » : le même écran se remplit de haut en bas (sans animation si on les réduit)
    if (steps[i + 1]?.reveal && !reducedMotion()) setRevealing(true)
    return setI(i + 1)
  }
  const animate = step.reveal && !reducedMotion()

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Le rideau d'abord : le voile le couvre, l'écran se remplit sous lui (jamais une bande claire, POLISH-SIM-20) */}
      {revealing && <div className="tour-curtain" aria-hidden="true" />}
      <Spotlight selector={revealing ? null : step.anchor} stepKey={i} />
      <div className="tour-bubble">
        {/* Dans la bulle : jamais par-dessus l'en-tête de l'app (POLISH-SIM-37c) */}
        {step.days && (
          <div className="tour-badge">
            Exemple · données fictives · <DayCounter key={`${i}-${step.days}`} days={step.days} animate={animate} />
          </div>
        )}
        <h2 id="tour-title" className="tour-title">{step.title}</h2>
        <p className="tour-text">{step.text}</p>
        <div className="tour-actions">
          {!step.last && (
            <button type="button" className="tour-skip" onClick={() => onEnd('skipped')}>
              Passer la visite
            </button>
          )}
          <button type="button" className="btn btn-primary tour-next" onClick={next}>
            {step.button}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Un plantage de la visite ne bloque jamais l'app : données réelles rendues, visite close. */
class TourBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    exitExampleMode()
    this.props.onCrash()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * Visite ouverte par TourHost (Layout) : à la fin, « Passer » ou un plantage, données réelles rendues et visite close.
 */
export default function GuidedTour({ onClose, from }) {
  const navigate = useNavigate()
  const end = useCallback((how) => {
    exitExampleMode()
    saveOnboarding({ tour: how })
    onClose()
    navigate('/')
  }, [navigate, onClose])

  // Visite démontée d'une autre façon : jamais de données fictives qui restent
  useEffect(() => () => exitExampleMode(), [])

  return (
    <TourBoundary onCrash={() => end('crashed')}>
      <Tour onEnd={end} from={from} />
    </TourBoundary>
  )
}
