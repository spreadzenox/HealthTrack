import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Version iOS (HealthTrack-iOS), CYCLE-iOS (décision du propriétaire du 10/11, « Ok cycle ») : de bout en bout, des règles
// et des symptômes notés dans l'app Santé (échantillons du plugin `CycleHealth`, rangés par `cycleSante.js`, source
// `health_connect`) donnent la ligne du Journal d'Android (CYCLE-1b, v979) : « Règles · 2e jour · flux moyen ».
vi.mock('../storage/localHealthStorage', async (orig) => ({
  ...(await orig()),
  listEntries: vi.fn(),
  countEntries: vi.fn(async () => 0),
}))
vi.mock('react-router-dom', async (importOriginal) => ({ ...(await importOriginal()), useNavigate: () => vi.fn() }))

import DailyJournal from './DailyJournal'
import { cycleEntriesFromSante } from '../ios/cycleSante'

const at = (daysAgo, h = 0) => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysAgo, h).getTime()
}

describe('Journal : le cycle de l’app Santé (iPhone)', () => {
  it('règles et symptômes lus dans Santé : la ligne du jour et le jour du cycle', async () => {
    const entries = cycleEntriesFromSante([
      { kind: 'period', flow: 'heavy', start: at(2), sourceName: 'Santé' },
      { kind: 'period', flow: 'medium', start: at(1), sourceName: 'Santé' },
      { kind: 'symptom', symptom: 'constipation', start: at(1, 9), sourceName: 'Clue' },
    ]).map((e, i) => ({ id: i + 1, ...e }))
    expect(entries.every((e) => e.source === 'health_connect')).toBe(true)
    // une note aujourd'hui, pour que la carte du jour existe (comme le test d'Android)
    entries.push({ id: 9, type: 'wellbeing', source: 'app_wellbeing', at: new Date().toISOString(), payload: { score: 3 } })
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockImplementation(async (o = {}) => (o.type ? entries.filter((e) => e.type === o.type) : entries))
    render(<BrowserRouter><DailyJournal /></BrowserRouter>)
    const line = await screen.findByText((_, el) => el?.classList?.contains('day-cycle') && /Règles · 2e jour · flux moyen/.test(el.textContent))
    expect(line.textContent).toMatch(/Constipation/)
    expect(document.querySelector('.day-card-cycle')?.textContent).toBe('3e jour du cycle')
  })
})
