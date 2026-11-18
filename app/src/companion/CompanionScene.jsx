/**
 * `<CompanionScene>` : Pilou sur son île, en tête de l'Accueil (refonte « Compagnon », étape 8 ; CONTRAT.md § 2).
 *
 * - Un seul canevas WebGL (three.js chargé à la demande), décoratif (`aria-hidden`) ; l'information passe par
 *   l'étiquette texte (brief § 8).
 * - Paliers de qualité : un premier choix d'après l'appareil, puis la mesure du temps d'image pendant 2 s
 *   (descente d'un palier au-delà de 33 ms) ; palier bas = image fixe de la scène.
 * - Pause hors écran, en arrière-plan et quand l'onglet est caché ; 30 i/s au plus, 20 au repos.
 * - `overlay(stage)` pose la couche avant (les bulles DOM du lot BULLES) par-dessus, au palier bas aussi.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { bus, EVENTS } from './bus'
import { useReducedMotion } from './motion'
import { CAMERA, projectPoint } from './scene/camera'
import { createFrameMeter, initialTier } from './scene/quality'
import { moodWord, restExpression, appOpenedReaction, webglAvailable } from './mood'
import { createLoop } from './scene/loop'
import { createGestureRecognizer } from './scene/gestures'
import { GOLDEN } from './scene/light'
import { weatherNow } from './scene/weatherNow'
import { getWeatherSettings } from '../services/weatherSync'
import { stillKey } from './scene/stills.js'
import './CompanionScene.css'

// images fixes de l'îlot (palier bas et attente du premier rendu) : étape de croissance × saison, et la nuit
const STILLS = Object.fromEntries(
  Object.entries(import.meta.glob('./scene/stills/*.webp', { eager: true, import: 'default', query: '?url' }))
    .map(([file, url]) => [file.replace('./scene/stills/', '').replace('.webp', ''), url]),
)

const pilouModules = import.meta.glob('./pilou/index.js')
const worldModules = import.meta.glob(['./world/index.js', './world/context.js'])

const MAX_WIDTH = 360

function skyStyle(light) {
  return {
    '--cs-sky-top': light.sky.top,
    '--cs-sky-bottom': light.sky.bottom,
    '--cs-haze': light.haze,
  }
}


/** Délai avant de recompter les jours d'usage : après l'ouverture de l'Accueil, jamais pendant. */
export const USAGE_RECOUNT_DELAY_MS = 4000

/** Durée de la nouvelle de l'îlot dans l'étiquette. */
export const WORLD_NEWS_MS = 6000

function hemisphereNow() {
  try {
    const lat = getWeatherSettings()?.location?.lat
    return typeof lat === 'number' ? lat : 'nord'
  } catch {
    return 'nord'
  }
}

/** Saison de l'îlot (SPEC île § 8) : selon la date et l'hémisphère de la position météo, si elle est connue. */
function seasonNow(world, now) {
  if (typeof world?.seasonOf !== 'function') return null
  let lat = null
  try {
    lat = getWeatherSettings()?.location?.lat ?? null
  } catch {
    lat = null
  }
  return world.seasonOf(now, typeof lat === 'number' ? lat : 'nord')
}

export default function CompanionScene({
  height = 320,
  mood: moodProp,
  label,
  name = 'Pilou',
  overlay,
  quality = 'auto',
  reducedMotion: reducedProp,
  onPilouTap,
  now = () => new Date(),
}) {
  const systemReduced = useReducedMotion()
  const reducedMotion = reducedProp ?? systemReduced
  const reducedRef = useRef(reducedMotion)
  reducedRef.current = reducedMotion
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const loopRef = useRef(null)
  const frameFns = useRef(new Set())
  const sizeRef = useRef({ width: MAX_WIDTH, height })
  const [tier, setTier] = useState(() =>
    initialTier({
      webgl: quality === 'bas' ? false : webglAvailable(),
      saveData: typeof navigator !== 'undefined' && navigator.connection?.saveData,
      deviceMemory: typeof navigator !== 'undefined' ? navigator.deviceMemory : undefined,
      forced: quality === 'auto' ? undefined : quality,
    }),
  )
  const [ready, setReady] = useState(false)
  const [light, setLight] = useState(GOLDEN)
  // ce que l'image fixe montre de l'îlot : jours d'usage et saison
  const [look, setLook] = useState({ days: null, season: null })
  const [busMood, setBusMood] = useState(() => bus.last(EVENTS.MOOD_CHANGED)?.value ?? 0)
  const mood = moodProp ?? busMood
  const nowRef = useRef(now)
  nowRef.current = now
  const tapRef = useRef(onPilouTap)
  tapRef.current = onPilouTap

  useEffect(() => bus.on(EVENTS.MOOD_CHANGED, (p) => setBusMood(Number(p?.value) || 0), { replay: true }), [])

  // la couche avant voit une scène stable, au palier bas aussi (même caméra que l'image fixe)
  const stage = useMemo(() => {
    const api = {
      project(x, y, z) {
        const { width, height: h } = sizeRef.current
        const base = projectPoint([x, y, z], width, h)
        const live = stageRef.current
        if (live) {
          const p = live.project(x, y, z, width, h)
          return { ...base, x: p.x, y: p.y }
        }
        return base
      },
      onFrame(fn) {
        frameFns.current.add(fn)
        return () => frameFns.current.delete(fn)
      },
      pilouBox() {
        const { width, height: h } = sizeRef.current
        const a = projectPoint([-0.5, 1.6, 0.3], width, h)
        const b = projectPoint([0.5, 0, 0.3], width, h)
        return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }
      },
    }
    Object.defineProperties(api, {
      width: { get: () => sizeRef.current.width, enumerable: true },
      height: { get: () => sizeRef.current.height, enumerable: true },
      quality: { get: () => stageRef.current?.tier ?? 'bas', enumerable: true },
      reducedMotion: { get: () => Boolean(stageRef.current ? stageRef.current.reducedMotion : reducedRef.current), enumerable: true },
      paused: { get: () => loopRef.current?.paused ?? true, enumerable: true },
    })
    return api
  }, [])

  // la lumière : heure dorée fixe, ou le cycle du jour du lot MONDE quand il est là (toutes les 5 min)
  useEffect(() => {
    const load = worldModules['./world/index.js']
    if (!load) {
      bus.emit(EVENTS.TIME_PHASE, { phase: GOLDEN.phase, light: GOLDEN, at: Date.now() })
      return undefined
    }
    let alive = true
    let timer = null
    // lever et coucher habituels, lus dans le sommeil une fois par jour (même calcul que le widget Android)
    const loadContext = worldModules['./world/context.js']
    const habits = { wake: null, bedtime: null }
    // jours d'usage pour la croissance de l'îlot (MONDE-3) : le décompte gardé à l'ouverture, recompté plus tard
    const usage = { days: null }
    let usageTimer = null
    // un seul chargement du module, partagé par les heures de sommeil et les jours d'usage
    let ctxPromise = null
    const context = () => (ctxPromise ||= loadContext ? loadContext() : Promise.reject(new Error('sans contexte')))
    load()
      .then((world) => {
        if (!alive || typeof world.lightAt !== 'function') return
        const tick = () => {
          const now = nowRef.current()
          const l = world.lightAt(now, habits)
          setLight((prev) => ({ ...prev, ...l, sky: { ...prev.sky, ...(l?.sky || {}) } }))
          const season = seasonNow(world, now)
          const growth = usage.days != null && typeof world.growthAt === 'function'
            ? world.growthAt(usage.days, now, { hemisphere: hemisphereNow() })
            : null
          setLook((prev) => (prev.days === usage.days && prev.season === season ? prev : { days: usage.days, season }))
          bus.emit(EVENTS.TIME_PHASE, { phase: l?.phase, light: l, season, growth, at: Date.now() })
          // ce qui est nouveau sur l'îlot, dit une fois ; la nuit, Pilou dort : la nouvelle attend son réveil
          if (growth && !l?.asleep && loadContext) {
            context()
              .then((ctx) => {
                const text = alive ? ctx.takeWorldNews?.({ growth, season }) : null
                if (text) bus.emit(EVENTS.WORLD_NEWS, { text, at: Date.now() })
              })
              .catch(() => {})
          }
        }
        tick()
        timer = setInterval(() => {
          refreshHabits()
          refreshUsage()
          tick()
        }, 5 * 60 * 1000)
        const setUsage = (days) => {
          if (!alive || !Number.isFinite(days) || days === usage.days) return
          usage.days = days
          tick()
        }
        // relire les notes ne se fait qu'une fois par jour, et jamais pendant l'ouverture de l'Accueil (budget de lectures)
        const refreshUsage = () => {
          if (!loadContext) return
          context()
            .then((ctx) => ctx.usageDaysForDay({ now: nowRef.current() }))
            .then(setUsage)
            .catch(() => {})
        }
        if (loadContext) {
          context()
            .then((ctx) => {
              const stored = ctx.storedUsageDays?.()
              setUsage(stored ? stored.days : 0)
              usageTimer = setTimeout(refreshUsage, USAGE_RECOUNT_DELAY_MS)
            })
            .catch(() => {})
        }
        const refreshHabits = () => {
          if (!loadContext) return
          context()
            .then((ctx) => ctx.sleepHabitsForDay({ now: nowRef.current() }))
            .then((c) => {
              if (!alive || !c) return
              const wake = Number.isFinite(c.wake) ? c.wake : null
              const bedtime = Number.isFinite(c.bedtime) ? c.bedtime : null
              if (wake === habits.wake && bedtime === habits.bedtime) return
              habits.wake = wake
              habits.bedtime = bedtime
              tick()
            })
            .catch(() => {})
        }
        refreshHabits()
      })
      .catch(() => {})
    return () => {
      alive = false
      if (timer) clearInterval(timer)
      if (usageTimer) clearTimeout(usageTimer)
    }
  }, [])

  // la nouvelle de l'îlot (MONDE-4b) : l'étiquette la dit quelques secondes à la place de l'humeur
  const [news, setNews] = useState(null)
  useEffect(() => {
    let timer = null
    const off = bus.on(EVENTS.WORLD_NEWS, (p) => {
      if (!p?.text) return
      setNews(p.text)
      clearTimeout(timer)
      timer = setTimeout(() => setNews(null), WORLD_NEWS_MS)
    })
    return () => { off?.(); clearTimeout(timer) }
  }, [])

  // la météo réelle (déjà gardée par Halcya) → `weather:changed`, à l'ouverture puis toutes les 30 min
  const [weatherLabel, setWeatherLabel] = useState(null)
  useEffect(() => {
    let alive = true
    let decorOf = null
    const tick = () => {
      const weather = weatherNow(getWeatherSettings(), nowRef.current())
      if (!weather) {
        setWeatherLabel(null)
        return
      }
      const decor = decorOf ? decorOf(weather) : null
      setWeatherLabel(decor?.effect && decor?.label ? decor.label : null)
      bus.emit(EVENTS.WEATHER_CHANGED, { weather, decor })
    }
    const load = worldModules['./world/index.js']
    ;(load ? load().catch(() => null) : Promise.resolve(null)).then((world) => {
      if (!alive) return
      if (typeof world?.weatherDecor === 'function') decorOf = world.weatherDecor
      tick()
    })
    const timer = setInterval(tick, 30 * 60 * 1000)
    window.addEventListener('weather-settings-updated', tick)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener('weather-settings-updated', tick)
    }
  }, [])

  // la scène 3D (paliers haut et moyen)
  useEffect(() => {
    if (tier === 'bas') return undefined
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return undefined
    let alive = true
    let cleanup = () => {}
    const width = Math.min(MAX_WIDTH, wrap.clientWidth || MAX_WIDTH)
    sizeRef.current = { width, height }
    Promise.all([import('./scene/stage.js'), pilouModules['./pilou/index.js']?.().catch(() => null)])
      .then(([{ createStage }, pilouMod]) => {
        if (!alive) return
        let live
        try {
          live = createStage(canvas, {
            width,
            height,
            tier,
            reducedMotion,
            light,
            // la saison déjà connue : un îlot reconstruit (changement de palier) garde ses couleurs
            season: bus.last(EVENTS.TIME_PHASE)?.season ?? undefined,
            createPilou: typeof pilouMod?.createPilou === 'function' ? pilouMod.createPilou : undefined,
          })
        } catch (err) {
          console.warn('Pilou : rendu 3D indisponible, image fixe', err)
          bus.emit(EVENTS.SCENE_QUALITY, { quality: 'bas', frameMs: null, reason: 'erreur' })
          setTier('bas')
          return
        }
        live.reducedMotion = reducedMotion
        stageRef.current = live
        const meter = createFrameMeter()
        let lastEventAt = -Infinity
        const loop = createLoop({
          render: ({ t, dt }) => {
            const measuring = meter.average == null
            const t0 = performance.now()
            let moving
            if (measuring) {
              live.renderSynced(t)
              moving = true
            } else moving = live.render(t)
            const frameMs = performance.now() - t0
            for (const fn of frameFns.current) fn({ t, dt })
            const decision = meter.push(frameMs, tier)
            if (decision) {
              bus.emit(EVENTS.SCENE_QUALITY, { quality: decision.tier, frameMs: Math.round(decision.frameMs), reason: decision.reason })
              setTier(decision.tier)
            } else if (measuring && meter.average != null) {
              bus.emit(EVENTS.SCENE_READY, { quality: tier, frameMs: Math.round(meter.average * 10) / 10 })
            }
            const busy = moving || t - lastEventAt < 2500
            loop.setFps(busy ? 30 : live.reducedMotion ? 12 : 20)
          },
        })
        loopRef.current = loop
        live.render(0)
        setReady(true)
        loop.start()

        // pause : hors écran, arrière-plan, onglet caché
        const io = typeof IntersectionObserver !== 'undefined'
          ? new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { loop.resume('hors-ecran'); bus.emit(EVENTS.SCENE_RESUMED, { reason: 'hors-ecran' }) }
            else { loop.pause('hors-ecran'); bus.emit(EVENTS.SCENE_PAUSED, { reason: 'hors-ecran' }) }
          })
          : null
        io?.observe(wrap)
        const onVisibility = () => {
          if (document.hidden) { loop.pause('onglet'); bus.emit(EVENTS.SCENE_PAUSED, { reason: 'onglet' }) }
          else { loop.resume('onglet'); bus.emit(EVENTS.SCENE_RESUMED, { reason: 'onglet' }) }
        }
        document.addEventListener('visibilitychange', onVisibility)
        let appListeners = []
        import('@capacitor/app')
          .then(({ App }) => Promise.all([
            App.addListener('pause', () => { loop.pause('arriere-plan'); bus.emit(EVENTS.SCENE_PAUSED, { reason: 'arriere-plan' }) }),
            App.addListener('resume', () => { loop.resume('arriere-plan'); bus.emit(EVENTS.SCENE_RESUMED, { reason: 'arriere-plan' }) }),
          ]))
          .then((handles) => { if (alive) appListeners = handles; else handles.forEach((h) => h?.remove?.()) })
          .catch(() => {})

        // le bus → Pilou (CONTRAT.md § 3)
        const P = () => live.pilou
        const poke = () => { lastEventAt = loop.time }
        let backTimer = null
        // la nuit, le repos de Pilou est le sommeil : aucune réaction ne le laisse les yeux ouverts
        let asleepNow = false
        const rest = () => restExpression(asleepNow, bus.last(EVENTS.MOOD_CHANGED)?.value ?? 0)
        const backToMood = (ms) => {
          clearTimeout(backTimer)
          backTimer = setTimeout(() => P().setExpression?.(rest()), ms)
        }
        const toWorld = ({ x, y }) => {
          const { width: w, height: h } = sizeRef.current
          const dist = Math.hypot(...CAMERA.position.map((c, i) => c - CAMERA.target[i]))
          const half = Math.tan((CAMERA.fov / 2) * Math.PI / 180) * dist
          return { x: ((x - w / 2) / (h / 2)) * half, y: CAMERA.target[1] - ((y - h / 2) / (h / 2)) * half, z: 1 }
        }
        const offs = [
          bus.on(EVENTS.MOOD_CHANGED, (p) => { P().setMood?.(p?.value ?? 0); poke() }, { replay: true }),
          bus.on(EVENTS.EXPRESSION_REQUEST, (p) => {
            if (!p?.name) return
            if (p.mode === 'sequence') P().play?.(p.name)
            else P().setExpression?.(p.name)
            poke()
          }),
          bus.on(EVENTS.LOOK_REQUEST, (p) => {
            const tgt = p?.target
            P().lookAt?.(tgt && typeof tgt === 'object' ? toWorld(tgt) : tgt ?? null)
          }),
          bus.on(EVENTS.TRAITS_CHANGED, (p) => P().setTraits?.(p?.fiche ?? null), { replay: true }),
          bus.on(EVENTS.REDUCED_MOTION_CHANGED, (p) => { live.reducedMotion = Boolean(p?.value); live.setReducedMotion(Boolean(p?.value)) }),
          bus.on(EVENTS.BUBBLE_PRESSED, (p) => { if (p && p.x != null) P().lookAt?.(toWorld(p)); poke() }),
          bus.on(EVENTS.BUBBLE_POPPED, (p) => {
            if (p && p.x != null) P().lookAt?.(toWorld(p))
            P().jump?.({ height: 0.15, side: p && p.x != null && p.x < sizeRef.current.width / 2 ? 'left' : 'right' })
            setTimeout(() => P().lookAt?.('camera'), 1400)
            poke()
          }),
          bus.on(EVENTS.FLOWER_GROW, (p) => { if (p?.id != null) { live.flowers.grow(p, loop.time); poke() } }),
          bus.on(EVENTS.FLOWERS_SET, (p) => live.flowers.set(p?.flowers || [], loop.time), { replay: true }),
          bus.on(EVENTS.MEAL_LOGGED, () => { P().setExpression?.('rassasie'); backToMood(8000); poke() }),
          bus.on(EVENTS.WELLBEING_NOTED, (p) => { if (p?.difficult) P().play?.('reconfortant'); poke() }),
          bus.on(EVENTS.ACTIVITY_START, (p) => {
            if (p?.kind === 'meditation') P().setExpression?.('concentre')
            if (p?.kind === 'reading') P().setExpression?.('absorbe')
            poke()
          }),
          bus.on(EVENTS.ACTIVITY_END, () => P().setExpression?.(rest())),
          bus.on(EVENTS.GIFT_OPENED, () => { P().play?.('surpris'); P().lookAt?.({ x: 0.05, y: 0.1, z: 0.62 }); live.gifts.openBox(loop.time); setTimeout(() => P().lookAt?.('camera'), 3400); poke() }),
          bus.on(EVENTS.GIFT_PLACED, (p) => {
            // à l'ouverture (événement ancien rejoué) : tout est posé d'un coup ; sinon le nouveau cadeau arrive
            const fresh = p?.at == null || Date.now() - p.at < 5000
            const items = Array.isArray(p?.items) ? p.items : []
            live.gifts.setItems(fresh ? items.filter((it) => it !== p?.item) : items)
            if (p?.item) {
              if (fresh) live.gifts.place(p.item, loop.time)
              else live.gifts.setItems([p.item])
            }
            poke()
          }, { replay: true }),
          bus.on(EVENTS.MILESTONE, () => { P().play?.('fier'); poke() }),
          bus.on(EVENTS.WORLD_NEWS, () => { if (!asleepNow) P().jump?.({ height: 0.15 }); poke() }),
          bus.on(EVENTS.DAY_DONE, () => { P().setExpression?.('rayonnant'); poke() }),
          bus.on(EVENTS.APP_OPENED, (p) => {
            const r = appOpenedReaction(p, asleepNow)
            if (r?.play) P().play?.(r.play)
            else if (r?.set) { P().setExpression?.(r.set); backToMood(2500) }
            poke()
          }),
          bus.on(EVENTS.WEATHER_CHANGED, (p) => { live.setWeather(p?.decor ?? null); poke() }, { replay: true }),
          bus.on(EVENTS.TIME_PHASE, (p) => {
            if (p?.light) live.applyLight(p.light)
            if (p?.season && p.season !== live.season) { live.setSeason?.(p.season); poke() }
            if (p?.growth && p.growth.days !== live.growthDays) { live.setGrowth?.(p.growth); poke() }
            const asleep = Boolean(p?.light?.asleep ?? p?.phase === 'nuit')
            const changed = asleep !== asleepNow
            asleepNow = asleep
            if (asleep) { clearTimeout(backTimer); P().setExpression?.('endormi') }
            else if (changed) P().setExpression?.(rest())
          }, { replay: true }),
        ]

        // toucher Pilou (SPEC personnage § 7)
        const rec = createGestureRecognizer()
        let holdTimer = null
        const point = (e) => {
          const r = canvas.getBoundingClientRect()
          return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now(), w: r.width, h: r.height }
        }
        const fire = (list) => {
          for (const g of list) {
            P().react?.(g.gesture, g)
            bus.emit(EVENTS.PILOU_TOUCHED, { gesture: g.gesture, x: Math.round(g.x), y: Math.round(g.y) })
            tapRef.current?.(g.gesture)
            poke()
          }
        }
        const onDown = (e) => {
          const p = point(e)
          if (!live.pilouHit((p.x / p.w) * 2 - 1, -(p.y / p.h) * 2 + 1)) return
          fire(rec.down(p))
          clearInterval(holdTimer)
          holdTimer = setInterval(() => fire(rec.hold(performance.now())), 60)
        }
        const onMove = (e) => fire(rec.move(point(e)))
        const onUp = (e) => { clearInterval(holdTimer); fire(rec.up(point(e))) }
        const onCancel = () => { clearInterval(holdTimer); rec.cancel() }
        canvas.addEventListener('pointerdown', onDown)
        canvas.addEventListener('pointermove', onMove)
        canvas.addEventListener('pointerup', onUp)
        canvas.addEventListener('pointercancel', onCancel)

        cleanup = () => {
          offs.forEach((off) => off())
          clearTimeout(backTimer)
          clearInterval(holdTimer)
          canvas.removeEventListener('pointerdown', onDown)
          canvas.removeEventListener('pointermove', onMove)
          canvas.removeEventListener('pointerup', onUp)
          canvas.removeEventListener('pointercancel', onCancel)
          io?.disconnect()
          document.removeEventListener('visibilitychange', onVisibility)
          appListeners.forEach((h) => h?.remove?.())
          loop.stop()
          live.dispose()
          stageRef.current = null
          loopRef.current = null
        }
      })
      .catch((err) => {
        console.warn('Pilou : three.js indisponible, image fixe', err)
        if (alive) setTier('bas')
      })
    return () => {
      alive = false
      setReady(false)
      cleanup()
    }
    // la scène ne se reconstruit qu'au changement de palier ou de hauteur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, height])

  useEffect(() => {
    const live = stageRef.current
    if (!live) return
    live.reducedMotion = reducedMotion
    live.setReducedMotion(reducedMotion)
  }, [reducedMotion])

  // la nuit (heure de coucher, lot MONDE), Pilou dort : l'étiquette le dit (SPEC île § 5)
  const asleep = Boolean(light.asleep)
  const text = (!asleep && news) || label || [asleep ? `${name} dort` : `${name} est ${moodWord(mood)}`, weatherLabel].filter(Boolean).join(' · ')
  const showFallback = tier === 'bas' || !ready

  return (
    <section
      className={`companion-scene companion-scene--${tier}`}
      style={{ height, ...skyStyle(light) }}
      ref={wrapRef}
      aria-label={`${name} sur son île`}
      data-quality={tier}
    >
      <div className="companion-scene__frame" style={{ maxWidth: MAX_WIDTH, height }}>
        {showFallback && (
          <img className="companion-scene__still" src={STILLS[stillKey({ ...look, night: light.night || light.phase === 'nuit' })]} alt="" aria-hidden="true" draggable="false" />
        )}
        {tier !== 'bas' && (
          <canvas
            ref={canvasRef}
            className={`companion-scene__canvas${ready ? ' is-ready' : ''}`}
            aria-hidden="true"
            style={{ width: '100%', height }}
          />
        )}
        {overlay ? <div className="companion-scene__overlay">{overlay(stage)}</div> : null}
      </div>
      <p className="companion-scene__label" aria-live="polite">{text}</p>
    </section>
  )
}
