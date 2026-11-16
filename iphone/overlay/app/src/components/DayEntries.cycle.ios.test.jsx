import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Version iOS, CYCLE-iOS (décision du propriétaire du 10/11, « Ok cycle ») : de bout en bout, des règles et des
// symptômes notés dans l'app Santé (échantillons du plugin `CycleHealth`, rangés par `cycleSante.js`, source
// `health_connect`) donnent la ligne du détail du jour de Tendances (REFONTE-7c : le Journal est retiré) :
// « Règles · 2e jour · flux moyen ».
vi.mock('../storage/localHealthStorage', async (orig) => ({
  ...(await orig()),
  listEntries: vi.fn(),
  countEntries: vi.fn(async () => 0),
}))
vi.mock('react-router-dom', async (importOriginal) => ({ ...(await importOriginal()), useNavigate: () => vi.fn() }))

import DayEntries from './DayEntries'
import { cycleEntriesFromSante } from '../ios/cycleSante'

const at = (daysAgo, h = 0) => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysAgo, h).getTime()
}
const key = (daysAgo) => {
  const d = new Date(at(daysAgo))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('Tendances › Jour : le cycle de l’app Santé (iPhone)', () => {
  it('règles et symptômes lus dans Santé : la ligne du jour', async () => {
    const entries = cycleEntriesFromSante([
      { kind: 'period', flow: 'heavy', start: at(2), sourceName: 'Santé' },
      { kind: 'period', flow: 'medium', start: at(1), sourceName: 'Santé' },
      { kind: 'symptom', symptom: 'constipation', start: at(1, 9), sourceName: 'Clue' },
    ]).map((e, i) => ({ id: i + 1, ...e }))
    expect(entries.every((e) => e.source === 'health_connect')).toBe(true)
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockImplementation(async (o = {}) => entries
      .filter((e) => !o.type || e.type === o.type)
      .filter((e) => !o.since || e.at >= o.since)
      .filter((e) => !o.until || e.at <= o.until))
    render(<MemoryRouter><DayEntries dateKey={key(1)} /></MemoryRouter>)
    const line = await screen.findByText((_, el) => el?.classList?.contains('day-cycle') && /Règles · 2e jour · flux moyen/.test(el.textContent))
    expect(line.textContent).toMatch(/Constipation/)
  })
})
