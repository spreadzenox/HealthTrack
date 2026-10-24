import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import BaselineCards from './BaselineCards'
import { listEntries } from '../storage/localHealthStorage'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
}))

const NOW = new Date(2026, 4, 21, 14, 0)
const daysAgo = (n) => new Date(2026, 4, 21 - n, 7, 0).toISOString()
const rhr = (n, bpm) => ({ type: 'heart_rate', at: daysAgo(n), payload: { bpm, subtype: 'restingHeartRate' } })
const hrv = (n, value) => ({ type: 'heart_rate', at: daysAgo(n), payload: { value, subtype: 'heartRateVariability' } })

function history(make, base) {
  const out = []
  for (let n = 7; n <= 66; n++) out.push(make(n, base + (n % 2 === 0 ? -1 : 1)))
  return out
}

function renderCards(props = {}) {
  return render(<BrowserRouter><BaselineCards {...props} /></BrowserRouter>)
}

describe('BaselineCards', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('ne lit que la FC repos et la VFC, pas les tranches de FC / SpO₂ (perf D2)', async () => {
    listEntries.mockResolvedValue([])
    renderCards()
    await screen.findByText(/Ajoutez une montre/i)
    expect([...listEntries.mock.calls[0][0].subtypes].sort()).toEqual(['heartRateVariability', 'restingHeartRate'])
  })

  it('invites to connect a watch when there is no heart data at all', async () => {
    listEntries.mockResolvedValue([])
    renderCards()
    expect(await screen.findByText(/Ajoutez une montre/i)).toBeInTheDocument()
  })

  it('signale au bloc Forme combien de jours manquent pour établir la norme, sans carte (POL-6)', async () => {
    listEntries.mockResolvedValue([rhr(0, 60), rhr(1, 61), rhr(8, 60)])
    const onStatus = vi.fn()
    renderCards({ onStatus })
    await vi.waitFor(() => expect(onStatus).toHaveBeenCalledWith('heart', {
      active: false,
      soon: [{ id: 'restingHeartRate', label: 'FC au repos', progress: 'encore 13 j' }],
    }))
    expect(document.querySelector('.baseline-card')).toBeNull()
  })

  it('shows the 7-day mean, the personal range and an "within the norm" status', async () => {
    listEntries.mockResolvedValue([...history(rhr, 60), rhr(0, 60), rhr(1, 60), rhr(2, 60)])
    renderCards()
    expect(await screen.findByText('Dans votre norme')).toBeInTheDocument()
    expect(screen.getByText(/Votre norme : 59–61 bpm/)).toBeInTheDocument()
  })

  it('shows a decimal when rounding would put an out-of-norm mean inside the displayed range', async () => {
    // Norme ≈ 59,0–61,0 ; moyenne 58,6 → « plus basse », mais arrondie elle s'afficherait « 59 » dans « 59–61 ».
    listEntries.mockResolvedValue([...history(rhr, 60), rhr(0, 58.6), rhr(1, 58.6), rhr(2, 58.6)])
    renderCards()
    expect(await screen.findByText('Plus basse que d’habitude')).toBeInTheDocument()
    expect(screen.getByText('58,6')).toBeInTheDocument()
    expect(screen.getByText(/Votre norme : 59,0–61,0 bpm/)).toBeInTheDocument()
  })

  it('flags an unfavourable deviation with a cautious, non-diagnostic hint', async () => {
    listEntries.mockResolvedValue([
      ...history(rhr, 60), rhr(0, 66), rhr(1, 66), rhr(2, 66),
      ...history(hrv, 50), hrv(0, 35), hrv(1, 35), hrv(2, 35),
    ])
    renderCards()
    expect(await screen.findByText('Plus haute que d’habitude')).toBeInTheDocument()
    expect(screen.getByText('Plus basse que d’habitude')).toBeInTheDocument()
    expect(screen.getByText(/Hypothèse générale/)).toBeInTheDocument()
    expect(screen.getByText(/professionnel de santé/i)).toBeInTheDocument()
    expect(document.querySelector('.is-unfavourable, .is-favourable')).toBeNull()
  })

  it('D6 : un écart dans l’autre sens (FC plus basse, VFC plus haute) est montré sans jugement ni conseil', async () => {
    listEntries.mockResolvedValue([
      ...history(rhr, 60), rhr(0, 54), rhr(1, 54), rhr(2, 54),
      ...history(hrv, 50), hrv(0, 65), hrv(1, 65), hrv(2, 65),
    ])
    renderCards()
    expect(await screen.findByText('Plus basse que d’habitude')).toBeInTheDocument()
    expect(screen.getByText('Plus haute que d’habitude')).toBeInTheDocument()
    expect(screen.queryByText(/Hypothèse générale/)).not.toBeInTheDocument()
    expect(document.querySelectorAll('.baseline-card.is-outside')).toHaveLength(2)
  })
})
