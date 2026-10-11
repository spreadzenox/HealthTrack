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

describe('WellbeingCharts — axe du calendrier (« 14 derniers jours » = 14 jours du calendrier)', () => {
  const daysAgo = (n, hour = 21) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    d.setHours(hour, 30, 0, 0)
    return d.toISOString()
  }
  const wb = (id, n, score) => ({ id, type: 'wellbeing', source: 'app_wellbeing', at: daysAgo(n), payload: { score } })

  beforeEach(() => {
    computeTodayPrediction.mockReset()
    computeTodayPrediction.mockReturnValue(null)
  })

  it('place les points selon leur date : un trou de saisie reste visible', async () => {
    // Notes 13, 12 et 1 jour(s) avant aujourd'hui : avant, les trois points étaient régulièrement espacés
    listEntries.mockResolvedValue([wb(1, 13, 3), wb(2, 12, 4), wb(3, 1, 2)])
    const { container } = render(<WellbeingCharts />)
    await screen.findByText(/Par jour/)
    const xs = [...container.querySelectorAll('.wellbeing-chart-dot')].map((c) => Number(c.getAttribute('cx')))
    expect(xs).toHaveLength(3)
    const step = xs[1] - xs[0]
    expect(step).toBeGreaterThan(0)
    // 11 jours entre le 2e et le 3e point → 11 pas (à l'arrondi près)
    expect((xs[2] - xs[1]) / step).toBeCloseTo(11, 1)
  })

  it('ne relie pas deux notes séparées par des jours sans note', async () => {
    listEntries.mockResolvedValue([wb(1, 13, 3), wb(2, 12, 4), wb(3, 1, 2)])
    const { container } = render(<WellbeingCharts />)
    await screen.findByText(/Par jour/)
    const d = container.querySelector('.wellbeing-chart-line').getAttribute('d')
    // Un seul segment (13 → 12 jours) ; le point d'hier reste un point isolé
    expect(d.match(/M/g)).toHaveLength(1)
    expect(d.match(/L/g)).toHaveLength(1)
  })

  it("dit qu'il n'y a pas de note récente au lieu d'afficher d'anciennes notes comme si elles dataient d'hier", async () => {
    listEntries.mockResolvedValue([wb(1, 40, 3), wb(2, 39, 4)])
    const { container } = render(<WellbeingCharts />)
    expect(await screen.findByText(/Aucune note ces 14 derniers jours/)).toBeInTheDocument()
    expect(container.querySelectorAll('.wellbeing-chart-dot')).toHaveLength(0)
  })

  it("place la prédiction du jour à aujourd'hui, sans la relier à une note vieille de plusieurs jours", async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: 'x', predicted: 3, actual: null, assumedTypical: [] })
    listEntries.mockResolvedValue([wb(1, 6, 3), wb(2, 5, 4)])
    const { container } = render(<WellbeingCharts />)
    await screen.findByText(/Par jour/)
    const xs = [...container.querySelectorAll('.wellbeing-chart-dot')].map((c) => Number(c.getAttribute('cx')))
    const pred = Number(container.querySelector('.wellbeing-chart-pred-dot').getAttribute('cx'))
    expect((pred - xs[1]) / (xs[1] - xs[0])).toBeCloseTo(5, 1)
    expect(container.querySelector('.wellbeing-chart-pred-line')).toBeNull()
  })

  it("relie la prédiction à la note d'hier", async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: 'x', predicted: 3, actual: null, assumedTypical: [] })
    listEntries.mockResolvedValue([wb(1, 2, 3), wb(2, 1, 4)])
    const { container } = render(<WellbeingCharts />)
    await screen.findByText(/Par jour/)
    expect(container.querySelector('.wellbeing-chart-pred-line')).not.toBeNull()
  })
})
