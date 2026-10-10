import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import WellbeingCharts from './WellbeingCharts'
import { computeTodayPrediction } from '../services/analysisEngine'

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
