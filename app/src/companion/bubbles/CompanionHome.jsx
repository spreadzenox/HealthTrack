/**
 * Le haut de l'Accueil du compagnon (refonte « Compagnon », étape 10 ; brief § 4 et § 5, specs/ile.SPEC.md § 3, 4,
 * 7 et 12) : la jauge « Humeur du jour », l'îlot entouré de bulles (ce qu'il reste à noter aujourd'hui) et la barre
 * de la première semaine avec ses cadeaux.
 * Les bulles sont de vrais boutons 2D (texte net, lecteur d'écran) ; seuls l'île et Pilou seront en 3D : la scène
 * arrive par `scene`, et sans elle l'îlot reste un emplacement simple, l'Accueil marche pareil.
 * Rien ne fane, rien ne s'accumule : seules les bulles du jour existent ; « Oui » et « Non » éclatent pareil.
 * Tout ce qui se passe est aussi écrit (étiquette de l'îlot, annonce pour le lecteur d'écran).
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MealPhotoButton from '../../components/MealPhotoButton'
import LineIcon from '../../components/LineIcon'
import BubbleIcon from './BubbleIcon'
import { homeBubbles, habitQuestion, poppedMessage, bubblesLeftText, orbitWorld, stillProject, BUBBLE_RADIUS } from './bubbles'
import { dayMood, MOOD_TOP } from './mood'
import { islandFlowers, flowerForBus, flowersForBus } from './flowers'
import { firstWeek, openGift, markReadySeen, giftText, digestionCountdown, GIFTS, WEEK_DAYS } from './firstWeek'
import { GUT_EVENING_FROM_HOUR } from '../../services/today'
import { bus, EVENTS } from '../bus'
import { useReducedMotion } from './useReducedMotion'
import './bubbles.css'

/** Durée de l'éclatement (ile.SPEC § 3) ; en mouvements réduits, un fondu de 200 ms. */
export const POP_MS = 700
const POP_MS_REDUCED = 200
const FLOWER_DELAY_MS = 620
const MOOD_DELAY_MS = 600
const GIFT_PLACED_MS = 3350
const MESSAGE_MS = 2000
const ORBIT_PERIOD_MS = 60_000
const RESUME_MS = 900
const MIN_BUBBLE_PX = 64

const MOOD_PHRASES = ['est tranquille', 'est de bonne humeur', 'est content', 'est ravi', 'est rayonnant']

// La scène 3D du lot SCÈNE (CONTRAT.md § 2), si elle est là et allumée ; sinon l'îlot dessiné ci-dessous.
const sceneLoaders = import.meta.glob('../CompanionScene.jsx')
const flagModules = import.meta.glob('../flags.js', { eager: true })
const loadScene = Object.values(sceneLoaders)[0]
const LazyScene = loadScene ? lazy(loadScene) : null
function sceneEnabled() {
  const flags = Object.values(flagModules)[0]
  try {
    return Boolean(LazyScene && flags?.companionSceneEnabled?.())
  } catch {
    return false
  }
}

/**
 * La scène de repli (sans 3D) : même forme que `stage` du contrat, sur le cadre de l'îlot dessiné.
 * Les images s'arrêtent hors écran et en arrière-plan ; 30 par seconde au plus.
 */
function useStillStage(boxRef, reducedMotion) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    if (typeof ResizeObserver !== 'function') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [boxRef])
  const frames = useRef(new Set())
  useEffect(() => {
    if (typeof window.requestAnimationFrame !== 'function') return undefined
    let raf = 0
    let last = 0
    let t0 = 0
    let visible = true
    let io = null
    if (boxRef.current && typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
      io.observe(boxRef.current)
    }
    const tick = (t) => {
      raf = window.requestAnimationFrame(tick)
      if (!t0) t0 = t
      if (!visible || document.hidden || !frames.current.size || t - last < 33) return
      const dt = last ? Math.min(100, t - last) : 0
      last = t
      for (const fn of frames.current) fn({ t: t - t0, dt })
    }
    raf = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(raf)
      io?.disconnect()
    }
  }, [boxRef])
  return useMemo(() => ({
    project: (x, y, z) => {
      const q = stillProject(x, y, z)
      return { x: q.x * size.w, y: q.y * size.h, scale: q.scale, behind: q.behind }
    },
    onFrame: (fn) => {
      frames.current.add(fn)
      return () => frames.current.delete(fn)
    },
    width: size.w,
    height: size.h,
    quality: 'bas',
    reducedMotion,
    paused: false,
  }), [size, reducedMotion])
}

/** Les bulles, posées sur la scène (couche 4 du contrat) : l'orbite tourne avec les images de la scène. */
function BubblesLayer({ stage, bubbles, heldRef, reduced, onPress, popping, positionsRef }) {
  const [phase, setPhase] = useState(0)
  const resumeAt = useRef(0)
  const wasHeld = useRef(false)
  useEffect(() => {
    if (reduced || !bubbles.length || !stage?.onFrame) return undefined
    return stage.onFrame(({ t, dt }) => {
      if (heldRef.current) {
        wasHeld.current = true
        return
      }
      if (wasHeld.current) {
        wasHeld.current = false
        resumeAt.current = t + RESUME_MS
      }
      if (t < resumeAt.current) return
      setPhase((p) => (p + (2 * Math.PI * dt) / ORBIT_PERIOD_MS) % (2 * Math.PI))
    })
  }, [stage, reduced, bubbles.length, heldRef])
  const o = stage.project(0, 0, 0)
  const unit = Math.abs(stage.project(1, 0, 0).x - o.x) || 0
  const world = orbitWorld(bubbles.length, reduced ? 0 : phase)
  const placed = world.map((w) => {
    const p = stage.project(w.x, w.y, w.z)
    const d = Math.max(MIN_BUBBLE_PX, 2 * BUBBLE_RADIUS * unit * p.scale * w.size)
    return { x: p.x, y: p.y, d, scale: p.scale, behind: p.behind }
  })
  // Dernière place connue de chaque bulle : une bulle qui part éclate là où elle était
  useEffect(() => {
    positionsRef.current = new Map(bubbles.map((b, i) => [b.id, placed[i]]))
  })
  return (
    <div className="cmp-overlay">
      <ul className="cmp-bubbles" aria-label="À noter aujourd’hui">
        {bubbles.map((b, i) => {
          const p = placed[i]
          const style = { width: `${p.d}px`, height: `${p.d}px`, transform: `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)` }
          const cls = `cmp-bubble${b.waiting ? ' is-waiting' : ''}`
          return (
            <li key={b.id} className="cmp-bubble-slot" style={style} data-back={p.behind ? '1' : undefined}>
              {b.kind === 'meal' ? (
                <MealPhotoButton className={cls} ariaLabel={b.ariaLabel}><BubbleFace b={b} /></MealPhotoButton>
              ) : (
                <button type="button" className={cls} data-tone={b.tone} aria-label={b.ariaLabel}
                  onClick={(e) => onPress(b, e, p)}>
                  <BubbleFace b={b} />
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {popping.map(({ b, at }) => (
        <span key={`pop-${b.id}`} className="cmp-pop" data-tone={b.tone} aria-hidden="true"
          style={{ width: `${at?.d ?? MIN_BUBBLE_PX}px`, height: `${at?.d ?? MIN_BUBBLE_PX}px`,
            transform: `translate(${at?.x ?? 0}px, ${at?.y ?? 0}px) translate(-50%, -50%)` }}>
          <span className="cmp-pop-ring" />
          {Array.from({ length: 8 }, (_, i) => <span key={i} className="cmp-pop-drop" style={{ '--i': i }} />)}
          <span className="cmp-pop-check"><LineIcon name="check" size={22} /></span>
        </span>
      ))}
    </div>
  )
}

function BubbleFace({ b }) {
  return (
    <>
      {b.kind === 'meals' && (
        <span className="cmp-bubble-fill" aria-hidden="true" style={{ '--fill': `${(b.fill / b.total) * 100}%` }} />
      )}
      <span className="cmp-bubble-film" aria-hidden="true" />
      <span className="cmp-bubble-face">
        <BubbleIcon name={b.icon} size={22} />
        <span className={`cmp-bubble-word${b.label.split(' ').some((w) => w.length > 8) ? ' is-long' : ''}`}>{b.label}</span>
      </span>
      {b.waiting && <span className="cmp-bubble-moon" aria-hidden="true"><LineIcon name="moon" size={12} /></span>}
    </>
  )
}

function ActionSheet({ sheet, onClose, onAnswer }) {
  const first = useRef(null)
  useEffect(() => {
    first.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  const { bubble } = sheet
  const title = bubble.kind === 'habit' ? habitQuestion(bubble.habit) : 'Votre digestion, ce soir'
  return (
    <div className="cmp-sheet-veil">
      <button type="button" className="cmp-sheet-backdrop" aria-label="Fermer" tabIndex={-1} onClick={onClose} />
      <div className="cmp-sheet" role="dialog" aria-modal="true" aria-labelledby="cmp-sheet-title" data-tone={bubble.tone}
        style={{ '--from-x': `${sheet.x}px`, '--from-y': `${sheet.y}px` }}>
        <h2 id="cmp-sheet-title" className="cmp-sheet-title">{title}</h2>
        {bubble.kind === 'habit' ? (
          <>
            <div className="cmp-sheet-answers">
              <button ref={first} type="button" className="cmp-sheet-btn" onClick={() => onAnswer(bubble, true)}>Oui</button>
              <button type="button" className="cmp-sheet-btn" onClick={() => onAnswer(bubble, false)}>Non</button>
            </div>
            <p className="cmp-sheet-hint">Oui ou non, les deux comptent.</p>
          </>
        ) : (
          <p className="cmp-sheet-hint">Elle se note le soir, à partir de {GUT_EVENING_FROM_HOUR} h.</p>
        )}
        <button ref={bubble.kind === 'habit' ? undefined : first} type="button" className="cmp-sheet-close" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}

function Flower({ f, small }) {
  // Repère de l'îlot projeté sur le plateau dessiné : angle 0 vers l'écran
  const a = (f.angle * Math.PI) / 180
  // plateau dessiné : centre à 50 % / 65 %, demi-largeur 28 %, demi-hauteur 9 %
  const x = 50 + Math.sin(a) * f.r * 25
  const y = 65 + Math.cos(a) * f.r * 7.5
  return (
    <span className={`cmp-flower${small ? ' is-meadow' : ''}`} data-tone={f.tone} aria-hidden="true"
      style={{ left: `${x}%`, top: `${y}%` }}>
      <span className="cmp-flower-head" />
    </span>
  )
}

function FirstWeekCard({ week, gut, name, onOpenGift }) {
  if (week.state === 'done') return null
  if (week.state === 'ready') {
    return (
      <section className="cmp-week cmp-week-ready" data-tone="mint" aria-labelledby="cmp-week-ready">
        <h2 id="cmp-week-ready" className="cmp-week-title">Vos premières analyses de bien-être sont prêtes</h2>
        {gut && <p className="cmp-week-text">{digestionCountdown(gut.daysLeft)}</p>}
        <Link to="/recommendations" className="cmp-week-cta" onClick={() => markReadySeen()}>Découvrir</Link>
      </section>
    )
  }
  return (
    <section className="cmp-week" aria-labelledby="cmp-week-title">
      <h2 id="cmp-week-title" className="cmp-week-title">Jour {week.day} sur {WEEK_DAYS} avant vos premières analyses</h2>
      <div className="cmp-week-bar" aria-hidden="true">
        {GIFTS.map((g) => <span key={g.day} className={g.day <= week.filled ? 'cmp-week-seg is-full' : 'cmp-week-seg'} />)}
      </div>
      <ol className="cmp-week-gifts">
        {week.gifts.map((g) => {
          const today = week.todayGift?.day === g.day
          const state = g.given ? 'reçu' : today ? 'à ouvrir aujourd’hui' : 'à venir'
          return (
            <li key={g.day} className={`cmp-week-gift${g.given ? ' is-given' : ''}${today ? ' is-today' : ''}`}>
              <span className="cmp-week-case" role="img"
                aria-label={`Jour ${g.day} : ${g.given ? g.name.toLowerCase() : 'cadeau'}, ${state}`}>
                <BubbleIcon name={g.given || today ? 'gift' : 'lock'} size={18} />
              </span>
              <span className="cmp-week-day" aria-hidden="true">J{g.day}</span>
            </li>
          )
        })}
      </ol>
      {week.giftToday && <p className="cmp-week-note" role="status">{giftText(week.giftToday, name)}</p>}
      {!week.giftToday && week.todayGift && (
        <p className="cmp-week-note cmp-week-note-gift">
          <span>Cadeau du jour : touchez la bulle dorée</span>
          <button type="button" className="cmp-week-open" onClick={onOpenGift}>Ouvrir</button>
        </p>
      )}
      {gut && gut.daysLeft > 0 && <p className="cmp-week-text">{digestionCountdown(gut.daysLeft)}</p>}
    </section>
  )
}

/**
 * @param {{ entries: object[], askGut?: boolean, habits?: object[], wellbeing?: { noted: number, todayNoted: boolean }|null,
 *   gut?: { daysLeft: number }|null, name?: string, scene?: boolean, now?: Date,
 *   onWellbeing: () => void, onHabit: (habit: object, done: boolean) => void }} props
 *   `scene` : false force l'îlot dessiné (tests, captures) ; sinon la scène 3D si elle est là et allumée.
 */
export default function CompanionHome({ entries, askGut = false, habits = [], wellbeing = null, gut = null,
  name = 'Pilou', scene, now, onWellbeing, onHabit }) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const at = now || new Date()
  const list = homeBubbles(entries, { now: at, askGut, habits })
  const mood = dayMood(list.done, list.total, { now: at })
  const flowers = islandFlowers(entries, at)
  const flowerKey = flowers.today.map((f) => f.id).join('|')
  // `weekTick` relit la semaine après l'ouverture d'un cadeau
  const [weekTick, setWeekTick] = useState(0)
  const week = wellbeing ? firstWeek(wellbeing, { now: at, tick: weekTick }) : null
  const use3d = scene !== false && sceneEnabled()

  const boxRef = useRef(null)
  const stillStage = useStillStage(boxRef, reduced)
  const heldRef = useRef(false)
  const hold = useCallback(() => { heldRef.current = true }, [])
  const release = useCallback(() => { heldRef.current = false }, [])
  const positionsRef = useRef(new Map())

  // Une bulle qui disparaît de la liste éclate là où elle était (« Oui » et « Non » pareil)
  const prev = useRef(null)
  const [popping, setPopping] = useState([])
  const [message, setMessage] = useState('')
  const lastAnswer = useRef(null)
  const bubbleKey = list.bubbles.map((b) => `${b.id}:${b.fill ?? ''}`).join('|')
  useEffect(() => {
    const before = prev.current
    prev.current = list.bubbles
    if (!before) return undefined
    const gone = before.filter((b) => !list.bubbles.some((n) => n.id === b.id))
    const timers = []
    for (const b of gone) {
      const spot = positionsRef.current.get(b.id)
      const answer = b.kind === 'habit' ? (lastAnswer.current?.id === b.id && !lastAnswer.current.done ? 'no' : 'yes') : 'value'
      bus.emit(EVENTS.BUBBLE_POPPED, { id: b.id, kind: b.kind, theme: b.theme, answer, x: spot?.x ?? null, y: spot?.y ?? null, at: Date.now() })
      setMessage(poppedMessage(b, answer !== 'no'))
      setPopping((p) => [...p, { b, at: spot }])
      timers.push(setTimeout(() => setPopping((p) => p.filter((x) => x.b.id !== b.id)), reduced ? POP_MS_REDUCED : POP_MS))
    }
    if (gone.length) timers.push(setTimeout(() => setMessage(''), MESSAGE_MS))
    return () => timers.forEach(clearTimeout)
  }, [bubbleKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // La jauge monte d'un cran après l'éclatement (600 ms) ; elle ne redescend jamais dans la journée
  const moodBefore = useRef(null)
  useEffect(() => {
    const before = moodBefore.current
    moodBefore.current = mood.level
    const payload = { value: mood.level / MOOD_TOP, word: mood.word, done: list.done, planned: list.total }
    if (before == null) {
      bus.emit(EVENTS.MOOD_CHANGED, payload)
      return undefined
    }
    if (mood.level <= before) return undefined
    const t = setTimeout(() => bus.emit(EVENTS.MOOD_CHANGED, payload), reduced ? 0 : MOOD_DELAY_MS)
    return () => clearTimeout(t)
  }, [mood.level]) // eslint-disable-line react-hooks/exhaustive-deps

  // Les fleurs : l'état complet à l'ouverture, puis une fleur qui pousse pour chaque geste (620 ms après)
  const flowerIds = useRef(null)
  useEffect(() => {
    const before = flowerIds.current
    flowerIds.current = new Set(flowers.today.map((f) => f.id))
    if (!before) {
      bus.emit(EVENTS.FLOWERS_SET, { flowers: flowersForBus(flowers) })
      return undefined
    }
    const fresh = flowers.today.filter((f) => !before.has(f.id))
    if (!fresh.length) return undefined
    const t = setTimeout(() => fresh.forEach((f) => bus.emit(EVENTS.FLOWER_GROW, { ...flowerForBus(f), at: Date.now() })),
      reduced ? 0 : FLOWER_DELAY_MS)
    return () => clearTimeout(t)
  }, [flowerKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Les cadeaux déjà reçus sont à leur place dès l'ouverture
  useEffect(() => {
    const given = week?.gifts?.filter((g) => g.given) ?? []
    if (!given.length) return
    const lastGift = given[given.length - 1]
    bus.emit(EVENTS.GIFT_PLACED, { day: lastGift.day, item: lastGift.item, items: given.map((g) => g.item) })
  }, [week?.state, week?.day]) // eslint-disable-line react-hooks/exhaustive-deps

  const [sheet, setSheet] = useState(null)
  const pressed = (b, p) => bus.emit(EVENTS.BUBBLE_PRESSED, { id: b.id, kind: b.kind, theme: b.theme, x: p?.x ?? null, y: p?.y ?? null })
  const answer = (b, done) => {
    lastAnswer.current = { id: b.id, done }
    setSheet(null)
    onHabit?.(b.habit, done)
  }
  const press = (b, e, p) => {
    pressed(b, p)
    if (b.kind === 'wellbeing') onWellbeing?.()
    else if (b.kind === 'gut' && !b.waiting) navigate('/ma-journee', { state: { open: 'digestion' } })
    else {
      const r = e?.currentTarget?.getBoundingClientRect?.()
      setSheet({ bubble: b, x: r ? r.left + r.width / 2 : 0, y: r ? r.top + r.height / 2 : 0 })
    }
  }

  const giftTimer = useRef(null)
  useEffect(() => () => clearTimeout(giftTimer.current), [])
  const giveGift = (g) => {
    openGift(g.day, { now: at })
    bus.emit(EVENTS.GIFT_OPENED, { day: g.day, item: g.item })
    const items = GIFTS.filter((x) => x.day <= g.day).map((x) => x.item)
    giftTimer.current = setTimeout(() => bus.emit(EVENTS.GIFT_PLACED, { day: g.day, item: g.item, items }),
      reduced ? 0 : GIFT_PLACED_MS)
  }
  const openTodayGift = () => {
    if (!week?.todayGift) return
    const g = week.todayGift
    giveGift(g)
    setMessage(giftText(g, name))
    setWeekTick((t) => t + 1)
  }
  // Le 7e jour : l'arc-en-ciel arrive avec la carte des premières analyses, une seule fois
  useEffect(() => {
    if (week?.state !== 'ready' || week.rainbowGiven) return
    giveGift(GIFTS[WEEK_DAYS - 1])
    bus.emit(EVENTS.MILESTONE, { kind: 'day7' })
  }, [week?.state]) // eslint-disable-line react-hooks/exhaustive-deps

  const label = message || `${name} ${MOOD_PHRASES[mood.level]} · ${bubblesLeftText(list.bubbles.length)}`
  const overlay = (stage) => (
    <BubblesLayer stage={stage} bubbles={list.bubbles} heldRef={heldRef} reduced={reduced || Boolean(stage?.reducedMotion)}
      onPress={press} popping={popping} positionsRef={positionsRef} />
  )
  const giftBubble = week?.state === 'week' && week.todayGift && (
    <button type="button" className="cmp-gift-bubble" onClick={openTodayGift}
      aria-label={`Cadeau du jour pour ${name} : touchez pour l’ouvrir`}>
      <BubbleIcon name="gift" size={24} />
    </button>
  )
  const still = (
    <div className="cmp-island" ref={boxRef}>
      <div className="cmp-island-still" aria-hidden="true">
        <span className="cmp-island-top" />
        <span className="cmp-island-soil" />
        {flowers.meadow.map((f) => <Flower key={`m-${f.id}`} f={f} small />)}
        {flowers.today.map((f) => <Flower key={`t-${f.id}`} f={f} />)}
      </div>
      {overlay(stillStage)}
      {giftBubble}
    </div>
  )

  return (
    <section className="cmp-home" aria-label={`${name} et votre journée`}>
      <div className="cmp-mood" data-level={mood.level}>
        <span className="cmp-mood-title" id="cmp-mood-title">Humeur du jour</span>
        <span className="cmp-mood-word">{mood.word}</span>
        <div className="cmp-mood-track" role="meter" aria-labelledby="cmp-mood-title" aria-valuemin={0}
          aria-valuemax={MOOD_TOP} aria-valuenow={mood.level} aria-valuetext={mood.word}>
          <span className="cmp-mood-fill" style={{ '--mood': mood.fill }} />
        </div>
      </div>

      <div className={`cmp-stage${reduced ? ' is-reduced' : ''}`}
        onPointerDown={hold} onPointerUp={release} onPointerCancel={release} onPointerLeave={release}>
        {use3d ? (
          <Suspense fallback={still}>
            <LazyScene height={320} name={name} mood={mood.level / MOOD_TOP} label={label}
              overlay={(stage) => <>{overlay(stage)}{giftBubble}</>} />
          </Suspense>
        ) : still}
      </div>
      {!use3d && <p className="cmp-island-label">{label}</p>}
      <p className="visually-hidden" role="status">{message}</p>

      {week && <FirstWeekCard week={week} gut={askGut ? gut : null} name={name} onOpenGift={openTodayGift} />}
      {sheet && <ActionSheet sheet={sheet} onClose={() => setSheet(null)} onAnswer={answer} />}
    </section>
  )
}
