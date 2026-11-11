import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'

const boom = vi.hoisted(() => ({ on: false }))
vi.mock('../services/tourData', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    buildTourEntries: (...a) => {
      if (boom.on) throw new Error('panne simulée')
      return actual.buildTourEntries(...a)
    },
  }
})

import GuidedTour from './GuidedTour'
import { createEntry, exportToJson, listEntries } from '../storage/localHealthStorage'
import { isExampleMode } from '../storage/exampleMode'
import { loadOnboarding, saveOnboarding } from '../settings/onboarding'
import { tourSteps } from '../services/tour'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderTour(onClose = vi.fn(), from) {
  render(
    <MemoryRouter initialEntries={[from || '/']}>
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
      <GuidedTour onClose={onClose} from={from} />
    </MemoryRouter>,
  )
  return onClose
}

const btn = (name) => screen.getByRole('button', { name })
const snapshot = async () => JSON.parse(await exportToJson()).entries

describe('visite guidée sur les vrais écrans (ACC-8)', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
    localStorage.clear()
    boom.on = false
  })

  it('commence par l’écran réel, « Passer la visite » visible ; « Exemple au jour 14 » montre l’exemple étiqueté', async () => {
    saveOnboarding({ done: true, goals: ['stress'], tour: 'pending' })
    renderTour()
    expect(await screen.findByRole('heading', { name: 'Votre écran Aujourd’hui' })).toBeInTheDocument()
    expect(btn('Passer la visite')).toBeInTheDocument()
    expect(isExampleMode()).toBe(false)
    fireEvent.click(btn('Exemple au jour 14'))
    expect(screen.getByRole('heading', { name: 'Votre bien-être du jour' })).toBeInTheDocument()
    await waitFor(() => expect(isExampleMode()).toBe(true))
    // Dans la bulle, jamais par-dessus l’en-tête de l’app (POLISH-SIM-37c)
    expect(screen.getByText(/Exemple · données fictives/).closest('.tour-bubble')).not.toBeNull()
  })

  it('la base de la personne est identique avant et après la visite ; « Passer » rend ses vraies données', async () => {
    await createEntry({ type: 'wellbeing', source: 'app_wellbeing', at: '2026-11-08T10:00:00.000Z', payload: { score: 6 } })
    const before = await snapshot()
    saveOnboarding({ done: true, goals: ['gut'], tour: 'pending' })
    const onClose = renderTour()
    fireEvent.click(await screen.findByRole('button', { name: 'Exemple au jour 14' }))
    await waitFor(() => expect(isExampleMode()).toBe(true))
    expect((await listEntries({ limit: 10000 })).length).toBeGreaterThan(100)
    fireEvent.click(btn('Passer la visite'))
    expect(isExampleMode()).toBe(false)
    expect(onClose).toHaveBeenCalled()
    expect(loadOnboarding().tour).toBe('skipped')
    expect(await snapshot()).toEqual(before)
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/)
  })

  it('va jusqu’au bout, onglet par onglet (digestion au jour 28 avec « Ma digestion ») ; la fin rend les vraies données', async () => {
    saveOnboarding({ done: true, goals: ['gut'], tour: 'pending' })
    const onClose = renderTour()
    await screen.findByRole('heading', { name: 'Votre écran Aujourd’hui' })
    const seen = []
    for (let n = 0; n < 20; n++) {
      const title = screen.getByRole('dialog').querySelector('h2').textContent
      seen.push(title)
      const next = screen.getByRole('dialog').querySelector('.tour-next')
      if (next.textContent === 'Terminer') {
        fireEvent.click(next)
        break
      }
      fireEvent.click(next)
    }
    expect(seen).toContain('Au jour 28 : ce qui va avec votre ventre')
    expect(seen.at(-1)).toBe('À vous')
    expect(isExampleMode()).toBe(false)
    expect(loadOnboarding().tour).toBe('done')
    expect(onClose).toHaveBeenCalled()
  })

  it('relancée depuis Analyses › Digestion, elle s’ouvre sur la digestion, même sans l’objectif (POLISH-SIM-37)', async () => {
    saveOnboarding({ done: true, goals: ['stress'] })
    renderTour(vi.fn(), '/recommendations/ventre')
    expect(await screen.findByRole('heading', { name: 'Votre digestion' })).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent('/recommendations/ventre')
    fireEvent.click(btn('Exemple au jour 28'))
    expect(screen.getByRole('heading', { name: 'Au jour 28 : ce qui va avec votre ventre' })).toBeInTheDocument()
  })

  it('relancée depuis Agir, elle s’ouvre sur Agir', async () => {
    saveOnboarding({ done: true, goals: ['stress'] })
    renderTour(vi.fn(), '/agir')
    expect(await screen.findByRole('heading', { name: 'Agir' })).toBeInTheDocument()
  })

  it('un plantage de la visite ne bloque jamais l’app', async () => {
    boom.on = true
    saveOnboarding({ done: true, goals: ['stress'], tour: 'pending' })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onClose = renderTour()
    fireEvent.click(await screen.findByRole('button', { name: 'Exemple au jour 14' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(isExampleMode()).toBe(false)
    expect(loadOnboarding().tour).toBe('crashed')
  })

  it('étapes : digestion seulement avec digestion ou cycle ; la phrase Santé sur iPhone suit healthStoreName', () => {
    expect(tourSteps({ hc: true, face: false, gut: false }).some((s) => s.days === 28)).toBe(false)
    expect(tourSteps({ hc: true, face: false, gut: true }).some((s) => s.days === 28)).toBe(true)
    expect(tourSteps({ hc: false, face: false, gut: false })[2].text).toMatch(/^Avec Health Connect ou une montre/)
  })

  it('le bouton qui ouvre l’exemple dit ce qu’on verra et quel jour (POLISH-SIM-39)', () => {
    const steps = tourSteps({ hc: true, face: false, gut: true })
    const openers = steps.filter((s, k) => steps[k + 1]?.reveal)
    expect(openers.map((s) => s.button)).toEqual([
      'Exemple au jour 14', 'Exemple au jour 14', 'Exemple au jour 14',
      'Exemple au jour 28', 'Exemple au jour 14',
    ])
  })

  it('étape Analyses : avec la digestion, les deux échéances (14 et 28 jours), jamais seulement 14 (POLISH-SIM-15)', () => {
    const analyses = (gut) => tourSteps({ hc: true, face: false, gut }).find((s) => s.title === 'Les analyses').text
    expect(analyses(false)).toBe('Elles démarrent après 14 jours notés.')
    expect(analyses(true)).toBe('Bien-être après 14 jours notés, digestion après 28.')
  })
})

describe('visite guidée : étiquette et projecteur (POLISH-SIM-14)', () => {
  it('le compteur suit l’horloge : il finit au jour annoncé même si les ticks ont pris du retard', async () => {
    const { counterDay } = await import('../services/tour')
    expect(counterDay(0, 28)).toBe(1)
    expect(counterDay(450, 28)).toBe(14)
    expect(counterDay(900, 28)).toBe(28)
    // Un seul tick après 5 s de calcul (écran lent) : jour 28, plus jamais « jour 5 »
    expect(counterDay(5000, 28)).toBe(28)
  })

  it('le projecteur suit l’élément quand l’écran se remplit après coup', async () => {
    vi.useFakeTimers()
    try {
      const { Spotlight } = await import('./GuidedTour')
      const el = document.createElement('section')
      el.className = 'cible'
      let box = { top: 600, left: 0, width: 300, height: 40 }
      el.getBoundingClientRect = () => box
      document.body.appendChild(el)
      const { container } = render(<Spotlight selector=".cible" stepKey={1} />)
      const { act } = await import('@testing-library/react')
      await act(async () => vi.advanceTimersByTime(130))
      expect(container.querySelector('.tour-spot').style.top).toBe('594px')
      // Les analyses arrivent : la section grandit et remonte
      box = { top: 100, left: 0, width: 300, height: 500 }
      await act(async () => vi.advanceTimersByTime(320))
      const spot = container.querySelector('.tour-spot')
      expect(spot.style.top).toBe('94px')
      expect(spot.style.height).toBe('512px')
      el.remove()
    } finally {
      vi.useRealTimers()
    }
  })

  it('pendant « Exemple au jour 14 », l’écran qui se remplit reste sous le voile : jamais de bande claire (POLISH-SIM-20)', async () => {
    saveOnboarding({ done: true, goals: ['stress'], tour: 'pending' })
    renderTour()
    fireEvent.click(await screen.findByRole('button', { name: 'Exemple au jour 14' }))
    const curtain = document.querySelector('.tour-curtain')
    const shade = document.querySelector('.tour-shade')
    expect(curtain).not.toBeNull()
    expect(shade).not.toBeNull()
    // Même contexte d'empilement, sans z-index : le voile, peint après le rideau, le couvre
    expect(curtain.compareDocumentPosition(shade) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
