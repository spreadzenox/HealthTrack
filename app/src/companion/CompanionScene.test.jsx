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
