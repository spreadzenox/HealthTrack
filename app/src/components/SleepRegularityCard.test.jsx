import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SleepRegularityCard from './SleepRegularityCard'
import { listEntries } from '../storage/localHealthStorage'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
}))

// Mercredi 20 mai 2026, 14 h
const NOW = new Date(2026, 4, 20, 14, 0)

function night(n, [bedH, bedM], [wakeH, wakeM]) {
  const end = new Date(2026, 4, 20 - n, wakeH, wakeM)
  const start = bedH >= 12 ? new Date(2026, 4, 20 - n - 1, bedH, bedM) : new Date(2026, 4, 20 - n, bedH, bedM)
  return {
    type: 'sleep',
    at: start.toISOString(),
    payload: { durationMinutes: Math.round((end - start) / 60000), endDate: end.toISOString(), sleepState: 'asleep' },
  }
}

const weekend = (n) => [0, 6].includes(new Date(2026, 4, 20 - n).getDay())

describe('SleepRegularityCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('renders nothing without any sleep data', async () => {
    listEntries.mockResolvedValue([])
    const { container } = render(<SleepRegularityCard />)
    await vi.waitFor(() => expect(listEntries).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('says how many nights are still needed', async () => {
    listEntries.mockResolvedValue([0, 1, 2].map((n) => night(n, [23, 0], [7, 0])))
    render(<SleepRegularityCard />)
    expect(await screen.findByText(/Encore 4 nuits/)).toBeInTheDocument()
  })

  it('shows typical hours, their spread, the index and a "regular" badge', async () => {
    listEntries.mockResolvedValue(Array.from({ length: 14 }, (_, n) => night(n, [23, 0], [7, 0])))
    render(<SleepRegularityCard />)
    expect(await screen.findByText('Horaires réguliers')).toBeInTheDocument()
    expect(screen.getByText('23 h')).toBeInTheDocument()
    expect(screen.getByText('7 h')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.queryByText(/week-end/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('points out a late weekend shift and gives a cautious tip', async () => {
    listEntries.mockResolvedValue(Array.from({ length: 14 }, (_, n) =>
      weekend(n) ? night(n, [0, 30], [9, 30]) : night(n, [23, 0], [7, 0]),
    ))
    render(<SleepRegularityCard />)
    expect(await screen.findByText(/Le week-end, vos nuits sont décalées de/)).toBeInTheDocument()
    expect(screen.getByText(/2 h plus tard/)).toBeInTheDocument()
    // D6 : la norme générale est présentée comme une hypothèse, que les données personnelles tranchent
    expect(screen.getByRole('note')).toHaveTextContent(/Hypothèse générale/)
    expect(screen.getByRole('note')).toHaveTextContent(/chez vous/)
  })

  it('flags variable hours without blaming', async () => {
    listEntries.mockResolvedValue(Array.from({ length: 14 }, (_, n) =>
      n % 2 === 0 ? night(n, [22, 0], [6, 0]) : night(n, [0, 30], [8, 30]),
    ))
    render(<SleepRegularityCard />)
    expect(await screen.findByText('Horaires variables')).toBeInTheDocument()
    expect(screen.getByRole('note')).toBeInTheDocument()
  })
})
