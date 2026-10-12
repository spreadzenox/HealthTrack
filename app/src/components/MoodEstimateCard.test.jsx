import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MoodEstimateCard from './MoodEstimateCard'
import { listEntries } from '../storage/localHealthStorage'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
}))

const NOW = new Date(2026, 4, 21, 14, 0)
const dayAt = (n, h = 7, m = 0) => new Date(2026, 4, 21 - n, h, m).toISOString()
const rhr = (n, bpm) => ({ type: 'heart_rate', at: dayAt(n), payload: { bpm, subtype: 'restingHeartRate' } })
const hrv = (n, value) => ({ type: 'heart_rate', at: dayAt(n, 6, 30), payload: { value, subtype: 'heartRateVariability' } })
const steps = (n, value) => ({ type: 'steps', at: dayAt(n, 18), payload: { value } })
const wellbeing = (n, score) => ({ type: 'wellbeing', at: dayAt(n, 20), payload: { score } })
const sleep = (n, minutes) => {
  const end = new Date(2026, 4, 21 - n, 7, 0)
  const start = new Date(end.getTime() - minutes * 60000)
  return { type: 'sleep', at: start.toISOString(), payload: { durationMinutes: minutes, endDate: end.toISOString(), sleepState: 'asleep' } }
}

function usualDays(from, to) {
  const out = []
  for (let n = from; n <= to; n++) {
    const odd = n % 2 === 0 ? -1 : 1
    out.push(rhr(n, 60 + odd), hrv(n, 50 + 2 * odd), sleep(n, 450 + 20 * odd), steps(n, 8000 + 1000 * odd))
  }
  return out
}

function serve(entries) {
  listEntries.mockImplementation(async ({ type } = {}) => entries.filter((e) => !type || e.type === type))
}

describe('MoodEstimateCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
    listEntries.mockReset()
  })

  it('renders nothing without any measurement', async () => {
    serve([])
    const { container } = render(<MoodEstimateCard />)
    await vi.waitFor(() => expect(listEntries).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('says how many days of measurements are still needed', async () => {
    serve(usualDays(0, 4))
    render(<MoodEstimateCard />)
    expect(await screen.findByText(/Encore 3 jours de mesures/)).toBeInTheDocument()
  })

  it('shows the band, the signals compared to the usual and that it is an estimate', async () => {
    serve([...usualDays(1, 35), rhr(0, 68), hrv(0, 35), sleep(0, 330)])
    render(<MoodEstimateCard />)
    expect(await screen.findByText('En dessous de votre habitude')).toBeInTheDocument()
    expect(screen.getByText('5 h 30')).toBeInTheDocument()
    expect(screen.getByText(/habituellement 7 h 30/)).toBeInTheDocument()
    expect(screen.getByText(/pas un diagnostic/)).toBeInTheDocument()
    expect(screen.getByText(/0\/14 notes de bien-être/)).toBeInTheDocument()
  })

  it('suggests talking to someone when the estimate stays low for about two weeks', async () => {
    const entries = usualDays(16, 60)
    for (let n = 0; n < 16; n++) entries.push(rhr(n, 67), hrv(n, 38), sleep(n, 340), steps(n, 3000))
    serve(entries)
    render(<MoodEstimateCard />)
    expect(await screen.findByText(/3114/)).toBeInTheDocument()
  })

  it('gives a score out of 5 with a range once calibrated on check-ins', async () => {
    let s = 7
    const rnd = () => {
      s = (s * 1103515245 + 12345) % 2147483648
      return (s / 2147483648) * 2 - 1
    }
    const entries = []
    for (let n = 0; n <= 75; n++) {
      const sleepMin = 450 + 60 * rnd()
      entries.push(rhr(n, 60 + rnd()), hrv(n, 50 + 3 * rnd()), sleep(n, sleepMin), steps(n, 8000 + 1500 * rnd()))
      if (n < 45) entries.push(wellbeing(n, Math.min(5, Math.max(0, 3 + (sleepMin - 450) / 60 + 0.2 * rnd()))))
    }
    serve(entries)
    render(<MoodEstimateCard />)
    expect(await screen.findByText(/\/ 5/)).toBeInTheDocument()
    expect(screen.getByText(/entre \d,\d et \d,\d/)).toBeInTheDocument()
    expect(screen.getByText(/Ce qui suit le plus vos notes : sommeil/)).toBeInTheDocument()
  })
})
