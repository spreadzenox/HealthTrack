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
  listEntries.mockImplementation(async ({ type, subtypes }) =>
    entries.filter((e) => e.type === type && (!subtypes || subtypes.includes(e.payload?.subtype))))
}

describe('HealthRadar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('ne lit que la FC repos et la VFC, pas les tranches de FC / SpO₂ (perf D2)', async () => {
    mockEntries([])
    render(<HealthRadar />)
    await vi.waitFor(() => expect(listEntries).toHaveBeenCalledWith(expect.objectContaining({ type: 'heart_rate' })))
    const call = listEntries.mock.calls.find(([o]) => o.type === 'heart_rate')[0]
    expect([...call.subtypes].sort()).toEqual(['heartRateVariability', 'restingHeartRate'])
  })

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
    expect(await screen.findByText('Inhabituel chez vous')).toBeInTheDocument()
    expect(screen.getByText(/66 bpm/)).toBeInTheDocument()
    expect(screen.getByLabelText('plus haute que d’habitude')).toBeInTheDocument()
    expect(screen.getByText(/habituellement 60 bpm/)).toBeInTheDocument()
    expect(screen.getByText(/Aujourd’hui/)).toBeInTheDocument()
  })

  it('alerts after several days, with cautious advice and a referral to a professional', async () => {
    mockEntries([...history(), rhr(0, 67), hrv(0, 38), sleep(0, 380), rhr(1, 66), hrv(1, 40), sleep(1, 450)])
    render(<HealthRadar />)
    expect(await screen.findByText('Depuis 2 jours')).toBeInTheDocument()
    expect(screen.getByText(/6 h 20/)).toBeInTheDocument()
    expect(screen.getByText(/Hypothèse générale/)).toBeInTheDocument()
    expect(screen.getByText(/professionnel de santé/)).toBeInTheDocument()
  })

  it('D6 : un écart dans l’autre sens est « inhabituel chez vous », sans conseil de repos ni sens imposé', async () => {
    mockEntries([...history(), rhr(0, 54), hrv(0, 65), sleep(0, 560), rhr(1, 54), hrv(1, 65), sleep(1, 560)])
    render(<HealthRadar />)
    expect(await screen.findByText('Depuis 2 jours')).toBeInTheDocument()
    expect(screen.getByText(/pas dans le sens généralement associé à la fatigue/)).toBeInTheDocument()
    expect(screen.queryByText(/reposez|allégez|fatigue, le surmenage/i)).not.toBeInTheDocument()
    expect(document.querySelector('.radar.is-neutral')).not.toBeNull()
  })

  it('asks to sync the watch when the recent days have no measurements', async () => {
    mockEntries(history())
    render(<HealthRadar />)
    expect(await screen.findByText(/synchronisez votre montre/i)).toBeInTheDocument()
  })

  const checkin = (n, tags, h = 21) => ({ type: 'wellbeing', at: dayAt(n, h), payload: { score: 6, tags } })

  it('explains a flagged day with the alcohol noted the evening before, without worrying', async () => {
    mockEntries([...history(), rhr(0, 66), hrv(0, 40), sleep(0, 450), checkin(1, ['alcohol'])])
    render(<HealthRadar />)
    expect(await screen.findByText('Explicable')).toBeInTheDocument()
    expect(screen.getByText(/Probablement lié à 🍷 Alcool \(hier\)/)).toBeInTheDocument()
    expect(screen.queryByText('Inhabituel chez vous')).not.toBeInTheDocument()
    expect(document.querySelector('.radar.is-explained')).not.toBeNull()
  })

  it('« Malade » noted: confirms and refers to a professional instead of explaining', async () => {
    mockEntries([...history(), rhr(0, 67), hrv(0, 38), sleep(0, 380), rhr(1, 66), hrv(1, 40), sleep(1, 450), checkin(0, ['sick'], 9)])
    render(<HealthRadar />)
    expect(await screen.findByText('Depuis 2 jours')).toBeInTheDocument()
    expect(screen.getByText(/Vous avez noté « Malade »/)).toBeInTheDocument()
    expect(screen.queryByText(/Probablement lié/)).not.toBeInTheDocument()
  })

  it('alert over 2 days with one tagged evening: keeps the alert and mentions the partial cause', async () => {
    mockEntries([...history(), rhr(0, 67), hrv(0, 38), sleep(0, 380), rhr(1, 66), hrv(1, 40), sleep(1, 450), checkin(2, ['evening_sport'])])
    render(<HealthRadar />)
    expect(await screen.findByText('Depuis 2 jours')).toBeInTheDocument()
    expect(screen.getByText(/peut en expliquer une partie, pas tout/)).toBeInTheDocument()
    expect(screen.getByText(/Sport le soir/)).toBeInTheDocument()
  })
})
