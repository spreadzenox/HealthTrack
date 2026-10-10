import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import WellbeingCharts from './WellbeingCharts'
import { computeTodayPrediction } from '../services/analysisEngine'
import { listEntries } from '../storage/localHealthStorage'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn().mockResolvedValue([]),
  listEntriesForAnalysis: vi.fn().mockResolvedValue([]),
}))

vi.mock('../services/analysisEngine', () => ({
  computeTodayPrediction: vi.fn(),
}))

describe('WellbeingCharts — prédiction du jour', () => {
  beforeEach(() => {
    computeTodayPrediction.mockReset()
  })

  it('signale que la journée en cours est complétée par une journée habituelle', async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 2.6, actual: null, assumedTypical: ['steps'] })
    render(<WellbeingCharts />)
    expect(await screen.findByText('2,6 / 5')).toBeInTheDocument()
    expect(screen.getByText(/compte comme une journée\s+habituelle/)).toBeInTheDocument()
  })

  it("n'affiche pas la mention quand tout est déjà connu", async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 3.1, actual: 3, assumedTypical: [] })
    render(<WellbeingCharts />)
    expect(await screen.findByText('3,1 / 5')).toBeInTheDocument()
    expect(screen.queryByText(/journée\s+habituelle/)).not.toBeInTheDocument()
  })
})

describe('WellbeingCharts — libellés et bloc « Par heure »', () => {
  beforeEach(() => {
    computeTodayPrediction.mockReset()
    listEntries.mockResolvedValue([])
  })

  it('parle de « Prédiction du jour », sans jargon « ML »', async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 2.6, actual: null, assumedTypical: [] })
    render(<WellbeingCharts />)
    expect(await screen.findByText('Prédiction du jour')).toBeInTheDocument()
    expect(screen.queryByText(/\bML\b/)).not.toBeInTheDocument()
  })

  it("masque le graphique « Par heure » tant qu'aucune note n'a été saisie aujourd'hui", async () => {
    computeTodayPrediction.mockReturnValue(null)
    render(<WellbeingCharts />)
    expect(await screen.findByText(/Par jour/)).toBeInTheDocument()
    expect(screen.queryByText(/Par heure/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Aucune note aujourd'hui/)).not.toBeInTheDocument()
  })

  it("affiche le graphique « Par heure » dès qu'une note existe aujourd'hui", async () => {
    computeTodayPrediction.mockReturnValue(null)
    const now = new Date()
    now.setHours(9, 0, 0, 0)
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: now.toISOString(), payload: { score: 4 } },
    ])
    render(<WellbeingCharts />)
    expect(await screen.findByText(/Par heure/)).toBeInTheDocument()
  })
})
