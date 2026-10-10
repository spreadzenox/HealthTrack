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

function renderCards() {
  return render(<BrowserRouter><BaselineCards /></BrowserRouter>)
}

describe('BaselineCards', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('invites to connect a watch when there is no heart data at all', async () => {
    listEntries.mockResolvedValue([])
    renderCards()
    expect(await screen.findByText(/Connectez une montre/i)).toBeInTheDocument()
  })

  it('shows how many days are still needed to build the norm', async () => {
    listEntries.mockResolvedValue([rhr(0, 60), rhr(1, 61), rhr(8, 60)])
    renderCards()
    expect(await screen.findByText(/Encore 13 jours de mesures/i)).toBeInTheDocument()
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
    expect(screen.getByText(/pas un diagnostic/i)).toBeInTheDocument()
    expect(screen.getByText(/professionnel de santé/i)).toBeInTheDocument()
  })
})
