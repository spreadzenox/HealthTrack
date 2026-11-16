import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import CompanionScene from './CompanionScene'
import { moodWord } from './mood'
import { bus, EVENTS } from './bus'
import { companionSceneEnabled, setCompanionSceneEnabled } from './flags'
import { getReducedMotionSetting, setReducedMotionSetting, isReducedMotion } from './motion'

afterEach(() => {
  cleanup()
  bus.clear()
  localStorage.clear()
})

describe('<CompanionScene> (CONTRAT.md § 2)', () => {
  it('sans WebGL (jsdom) : image fixe décorative et étiquette lisible', () => {
    const { container } = render(<CompanionScene />)
    const img = container.querySelector('img.companion-scene__still')
    expect(img).toBeTruthy()
    expect(img.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('canvas')).toBeNull()
    expect(container.querySelector('section').dataset.quality).toBe('bas')
    expect(screen.getByText('Pilou est tranquille')).toBeTruthy()
  })

  it('l’étiquette suit l’humeur du bus, et le nom choisi', () => {
    render(<CompanionScene name="Nuage" />)
    expect(screen.getByText('Nuage est tranquille')).toBeTruthy()
    act(() => bus.emit(EVENTS.MOOD_CHANGED, { value: 0.5, word: 'Content', done: 2, planned: 4 }))
    expect(screen.getByText('Nuage est content')).toBeTruthy()
    act(() => bus.emit(EVENTS.MOOD_CHANGED, { value: 1, word: 'Rayonnant', done: 4, planned: 4 }))
    expect(screen.getByText('Nuage est rayonnant')).toBeTruthy()
  })

  it('rend la couche avant avec une scène qui projette des points du monde', () => {
    const overlay = vi.fn((stage) => {
      const p = stage.project(0, 0.6, 0)
      return <button type="button">Repas {Math.round(p.x)}</button>
    })
    render(<CompanionScene overlay={overlay} />)
    const stage = overlay.mock.calls[0][0]
    expect(stage.width).toBeGreaterThan(0)
    expect(stage.quality).toBe('bas')
    expect(typeof stage.onFrame(() => {})).toBe('function')
    const box = stage.pilouBox()
    expect(box.w).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Repas 180/ })).toBeTruthy()
  })

  it('mot de l’humeur : jamais triste, plancher « tranquille »', () => {
    expect(moodWord(0)).toBe('tranquille')
    expect(moodWord(0.19)).toBe('tranquille')
    expect(moodWord(0.5)).toBe('content')
    expect(moodWord(0.95)).toBe('rayonnant')
  })
})

describe('réglages partagés (CONTRAT.md § 6)', () => {
  it('interrupteur de la scène : allumé par défaut, éteint sur demande', () => {
    expect(companionSceneEnabled()).toBe(true)
    setCompanionSceneEnabled(false)
    expect(companionSceneEnabled()).toBe(false)
    setCompanionSceneEnabled(true)
    expect(companionSceneEnabled()).toBe(true)
  })

  it('mouvements réduits : auto, on, off, et l’événement du bus', () => {
    const seen = vi.fn()
    bus.on(EVENTS.REDUCED_MOTION_CHANGED, seen)
    expect(getReducedMotionSetting()).toBe('auto')
    setReducedMotionSetting('on')
    expect(isReducedMotion()).toBe(true)
    expect(seen).toHaveBeenLastCalledWith({ value: true }, 'reduced-motion:changed')
    setReducedMotionSetting('off')
    expect(isReducedMotion()).toBe(false)
    expect(() => setReducedMotionSetting('peut-être')).toThrow()
  })
})

describe('météo de l’île (SPEC île § 6)', () => {
  it('estime la météo de l’heure depuis la journée gardée, sans réseau', async () => {
    const { weatherNow } = await import('./scene/weatherNow')
    expect(weatherNow({ enabled: false, today: { tempMinC: 5 } })).toBeNull()
    expect(weatherNow({ enabled: true, today: null })).toBeNull()
    const s = { enabled: true, today: { tempMinC: 6, tempMaxC: 14, precipMm: 12 } }
    expect(weatherNow(s, new Date(2026, 10, 16, 6, 0)).tempC).toBe(6)
    expect(weatherNow(s, new Date(2026, 10, 16, 15, 0)).tempC).toBe(14)
    expect(weatherNow(s, new Date(2026, 10, 16, 15, 0)).precipMmH).toBe(0.5)
    const at = new Date(2026, 10, 16, 14, 0)
    const cur = { ...s, current: { tempC: 11, precipMmH: 0.4, windKmH: 20, code: 61, at: at.toISOString() } }
    expect(weatherNow(cur, new Date(2026, 10, 16, 15, 0))).toEqual({ tempC: 11, precipMmH: 0.4, windKmH: 20, code: 61 })
    // trop ancienne : on revient à l'estimation de la journée
    expect(weatherNow(cur, new Date(2026, 10, 16, 19, 0)).code).toBeNull()
  })

  it('émet weather:changed à l’ouverture quand la météo est activée', async () => {
    localStorage.setItem('healthtrack_weather', JSON.stringify({ enabled: true, today: { tempMinC: 6, tempMaxC: 14, precipMm: 0 } }))
    const seen = vi.fn()
    bus.on(EVENTS.WEATHER_CHANGED, seen)
    render(<CompanionScene />)
    await vi.waitFor(() => expect(seen).toHaveBeenCalled())
    expect(seen.mock.calls[0][0].weather.precipMmH).toBe(0)
  })
})

describe('Réglages › Mouvements de Pilou', async () => {
  const { default: MotionSetting } = await import('./MotionSetting')
  const { fireEvent } = await import('@testing-library/react')
  it('choisit Réduits et prévient le bus ; caché quand la scène est éteinte', () => {
    const seen = vi.fn()
    bus.on(EVENTS.REDUCED_MOTION_CHANGED, seen)
    render(<MotionSetting />)
    expect(screen.getByRole('radio', { name: 'Automatiques' }).checked).toBe(true)
    fireEvent.click(screen.getByRole('radio', { name: 'Réduits' }))
    expect(getReducedMotionSetting()).toBe('on')
    expect(seen).toHaveBeenLastCalledWith({ value: true }, 'reduced-motion:changed')
    cleanup()
    const { container } = render(<MotionSetting enabled={false} />)
    expect(container.innerHTML).toBe('')
  })
})
