import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import HealthRadar from './HealthRadar'
import { listEntries } from '../storage/localHealthStorage'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
}))

const NOW = new Date(2026, 4, 21, 14, 0)
const dayAt = (n, h = 7) => new Date(2026, 4, 21 - n, h, 0).toISOString()
const rhr = (n, bpm) => ({ type: 'heart_rate', at: dayAt(n), payload: { bpm, subtype: 'restingHeartRate' } })
const hrv = (n, value) => ({ type: 'heart_rate', at: dayAt(n), payload: { value, subtype: 'heartRateVariability' } })
const sleep = (n, minutes) => ({
  type: 'sleep',
  at: new Date(new Date(2026, 4, 21 - n, 7).getTime() - minutes * 60000).toISOString(),
  payload: { durationMinutes: minutes, endDate: dayAt(n), sleepState: 'asleep' },
})

function history() {
  const out = []
  for (let n = 3; n < 63; n++) {
    const odd = n % 2 === 0 ? -1 : 1
    out.push(rhr(n, 60 + odd), hrv(n, 50 + 2 * odd), sleep(n, 450 + 20 * odd))
  }
  return out
}

function mockEntries(entries) {
  listEntries.mockImplementation(async ({ type }) => entries.filter((e) => e.type === type))
}

describe('HealthRadar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('renders nothing when there is no heart or sleep data at all', async () => {
    mockEntries([])
    const { container } = render(<HealthRadar />)
    await vi.waitFor(() => expect(listEntries).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('explains how much data is needed before the radar works', async () => {
    mockEntries([rhr(0, 60), sleep(0, 420)])
    render(<HealthRadar />)
    expect(await screen.findByText(/s’active après 2 semaines/i)).toBeInTheDocument()
  })

  it('says nothing unusual when the last days are within the norm', async () => {
    mockEntries([...history(), rhr(0, 60), hrv(0, 50), sleep(0, 450)])
    render(<HealthRadar />)
    expect(await screen.findByText('Rien d’inhabituel')).toBeInTheDocument()
    expect(screen.getByText(/FC au repos, VFC et sommeil/)).toBeInTheDocument()
  })

  it('lists the unusual signals of the day with the usual value', async () => {
    mockEntries([...history(), rhr(0, 66), hrv(0, 40), sleep(0, 450)])
    render(<HealthRadar />)
    expect(await screen.findByText('À surveiller')).toBeInTheDocument()
    expect(screen.getByText(/66 bpm/)).toBeInTheDocument()
    expect(screen.getByText(/habituellement 60 bpm/)).toBeInTheDocument()
    expect(screen.getByText(/Aujourd’hui/)).toBeInTheDocument()
  })

  it('alerts after several days, with cautious advice and a referral to a professional', async () => {
    mockEntries([...history(), rhr(0, 67), hrv(0, 38), sleep(0, 380), rhr(1, 66), hrv(1, 40), sleep(1, 450)])
    render(<HealthRadar />)
    expect(await screen.findByText('Depuis 2 jours')).toBeInTheDocument()
    expect(screen.getByText(/6 h 20/)).toBeInTheDocument()
    expect(screen.getByText(/professionnel de santé/)).toBeInTheDocument()
    expect(screen.getByText(/pas un diagnostic/i)).toBeInTheDocument()
  })

  it('asks to sync the watch when the recent days have no measurements', async () => {
    mockEntries(history())
    render(<HealthRadar />)
    expect(await screen.findByText(/synchronisez votre montre/i)).toBeInTheDocument()
  })
})
