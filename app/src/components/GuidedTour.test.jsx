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

function renderTour(onClose = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
      <GuidedTour onClose={onClose} />
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

  it('commence par l’écran réel, « Passer la visite » visible ; « Voir dans 14 jours » montre l’exemple étiqueté', async () => {
    saveOnboarding({ done: true, goals: ['stress'], tour: 'pending' })
    renderTour()
    expect(await screen.findByRole('heading', { name: 'Votre écran Aujourd’hui' })).toBeInTheDocument()
    expect(btn('Passer la visite')).toBeInTheDocument()
    expect(isExampleMode()).toBe(false)
    fireEvent.click(btn('Voir dans 14 jours'))
    expect(screen.getByRole('heading', { name: 'Votre bien-être du jour' })).toBeInTheDocument()
    await waitFor(() => expect(isExampleMode()).toBe(true))
    expect(screen.getByText(/Exemple · données fictives/)).toBeInTheDocument()
  })

  it('la base de la personne est identique avant et après la visite ; « Passer » rend ses vraies données', async () => {
    await createEntry({ type: 'wellbeing', source: 'app_wellbeing', at: '2026-11-08T10:00:00.000Z', payload: { score: 6 } })
    const before = await snapshot()
    saveOnboarding({ done: true, goals: ['gut'], tour: 'pending' })
    const onClose = renderTour()
    fireEvent.click(await screen.findByRole('button', { name: 'Voir dans 14 jours' }))
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

  it('un plantage de la visite ne bloque jamais l’app', async () => {
    boom.on = true
    saveOnboarding({ done: true, goals: ['stress'], tour: 'pending' })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onClose = renderTour()
    fireEvent.click(await screen.findByRole('button', { name: 'Voir dans 14 jours' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(isExampleMode()).toBe(false)
    expect(loadOnboarding().tour).toBe('crashed')
  })

  it('étapes : digestion seulement avec digestion ou cycle ; la phrase Santé sur iPhone suit healthStoreName', () => {
    expect(tourSteps({ hc: true, face: false, gut: false }).some((s) => s.days === 28)).toBe(false)
    expect(tourSteps({ hc: true, face: false, gut: true }).some((s) => s.days === 28)).toBe(true)
    expect(tourSteps({ hc: false, face: false, gut: false })[2].text).toMatch(/^Avec Health Connect ou une montre/)
  })
})
