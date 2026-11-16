import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LifeMoments from './LifeMoments'
import { guideLine } from './guide'
import { loadCompanion, markMet } from './companionState'
import { saveOnboarding } from '../../settings/onboarding'
import { bus, EVENTS } from '../bus'

vi.mock('./guide', async (orig) => {
  const real = await orig()
  return { ...real, wellbeingScoreReady: (states) => !!states?.ready, digestionDaysLeft: (states, gut) => (gut ? 7 : null) }
})

beforeEach(() => {
  localStorage.clear()
  bus.clear()
  saveOnboarding({ done: true })
})

const show = (read) => render(
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route path="/" element={<LifeMoments read={read} />} />
      <Route path="/recommendations" element={<p>Page Objectifs</p>} />
    </Routes>
  </MemoryRouter>,
)

describe('cérémonie du jour 7', () => {
  it('nouvelle installation : pas encore 7 jours, puis le premier score, une seule fois', async () => {
    markMet('onboarding')
    const first = show(() => ({ ready: false }))
    await waitFor(() => expect(loadCompanion().ceremony7Checked).toBe(true))
    expect(screen.queryByRole('dialog')).toBeNull()
    first.unmount()

    const got = []
    bus.on(EVENTS.MILESTONE, (p) => got.push(p))
    show(() => ({ ready: true }))
    expect(await screen.findByRole('heading', { name: 'Vos premières analyses sont prêtes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voir mes objectifs' }))
    expect(await screen.findByText('Page Objectifs')).toBeInTheDocument()
    expect(loadCompanion().ceremony7By).toBe('shown')
    expect(got).toEqual([{ kind: 'day7' }])
  })

  it('utilisateur d’avant la refonte dont le score existe déjà : pas de fête rétroactive', async () => {
    markMet('update')
    show(() => ({ ready: true }))
    await waitFor(() => expect(loadCompanion().ceremony7By).toBe('already'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('sans rencontre : rien', async () => {
    const read = vi.fn(() => ({ ready: true }))
    saveOnboarding({ done: false })
    render(<MemoryRouter initialEntries={['/bienvenue']}><LifeMoments read={read} /></MemoryRouter>)
    expect(read).not.toHaveBeenCalled()
  })
})

describe('Pilou guide dans Objectifs', () => {
  it('jamais triste, aucun chiffre de score', () => {
    expect(guideLine({ state: 'score', trend: 'up' }).text).toBe('Plutôt une bonne semaine.')
    expect(guideLine({ state: 'score', trend: 'down' }).expr).toBe('reconfortant')
    expect(guideLine({ state: 'waiting', daysLeft: 1 }).text).toBe('Encore 1 jour noté pour votre premier score.')
    expect(guideLine({ state: 'waiting', daysLeft: 3 }).text).toBe('Encore 3 jours notés pour votre premier score.')
    expect(guideLine(undefined).expr).toBe('tranquille')
  })
})
