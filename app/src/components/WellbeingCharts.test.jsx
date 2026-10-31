import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WellbeingCharts from './WellbeingCharts'
import { computeTodayPrediction } from '../services/analysisEngine'
import { listEntries, countEntries } from '../storage/localHealthStorage'
import { _resetAnalysisRunner } from '../services/analysisRunner'
import { bumpDataRevision } from '../storage/dataRevision'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn().mockResolvedValue([]),
  countEntries: vi.fn().mockResolvedValue(0),
  listEntriesForAnalysis: vi.fn().mockResolvedValue([]),
}))

vi.mock('../services/analysisEngine', () => ({
  computeTodayPrediction: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  _resetAnalysisRunner()
})

describe('WellbeingCharts — prédiction du jour', () => {
  beforeEach(() => {
    computeTodayPrediction.mockReset()
  })

  it('signale que la journée en cours est complétée par une journée habituelle', async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 2.6, actual: null, assumedTypical: ['steps'] })
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText('2,6 / 5')).toBeInTheDocument()
    expect(screen.getByText(/compte comme une journée\s+habituelle/)).toBeInTheDocument()
  })

  it("n'affiche pas la mention quand tout est déjà connu", async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 3.1, actual: 3, assumedTypical: [] })
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText('3,1 / 5')).toBeInTheDocument()
    expect(screen.queryByText(/journée\s+habituelle/)).not.toBeInTheDocument()
  })
})

describe('WellbeingCharts — une seule mention de la prédiction (nettoyage D1)', () => {
  beforeEach(() => {
    computeTodayPrediction.mockReset()
    listEntries.mockResolvedValue([])
  })

  it("n'affiche plus de grande carte au-dessus du graphique : la valeur est dans la légende du point", async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: 'x', predicted: 1.6, actual: null, assumedTypical: ['steps'] })
    const { container } = render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText('1,6 / 5')).toBeInTheDocument()
    expect(container.querySelector('.wellbeing-prediction-badge')).toBeNull()
    expect(screen.getAllByText(/Attendu d’après vos habitudes/)).toHaveLength(1)
    // La valeur suit le graphique, l'explication est repliée
    const legend = container.querySelector('.wellbeing-chart-pred-legend')
    expect(legend).toHaveTextContent('1,6 / 5')
    expect(legend.closest('details')).not.toBeNull()
    expect(legend.closest('details').open).toBe(false)
  })

  it('une fois la note du jour saisie : prédiction et réel sur une ligne, sans point orange', async () => {
    const now = new Date()
    now.setHours(9, 0, 0, 0)
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: now.toISOString(), payload: { score: 3 } },
    ])
    computeTodayPrediction.mockReturnValue({ dateKey: 'x', predicted: 3.1, actual: 3, assumedTypical: [] })
    const { container } = render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText('3,1 / 5')).toBeInTheDocument()
    expect(container.querySelector('.wellbeing-chart-pred-dot')).toBeNull()
    expect(container.querySelector('.wellbeing-chart-pred-legend')).toHaveTextContent(/réel : 3,0/)
    expect(screen.getAllByText(/Attendu d’après vos habitudes/)).toHaveLength(1)
  })
})

describe('WellbeingCharts — libellés et bloc « Par heure »', () => {
  beforeEach(() => {
    computeTodayPrediction.mockReset()
    listEntries.mockResolvedValue([])
  })

  it('parle d’« Attendu d’après vos habitudes » (ni « ML » ni « prédiction », jalon 2e)', async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 2.6, actual: null, assumedTypical: [] })
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText(/Attendu d’après vos habitudes/)).toBeInTheDocument()
    expect(screen.queryByText(/\bML\b/)).not.toBeInTheDocument()
    expect(screen.queryByText(/prédiction/i)).not.toBeInTheDocument()
  })

  it("masque le graphique « Par heure » tant qu'aucune note n'a été saisie aujourd'hui", async () => {
    computeTodayPrediction.mockReturnValue(null)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    listEntries.mockResolvedValueOnce([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: yesterday.toISOString(), payload: { score: 3 } },
    ])
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
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
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
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
    const { container } = render(<WellbeingCharts />, { wrapper: MemoryRouter })
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
    const { container } = render(<WellbeingCharts />, { wrapper: MemoryRouter })
    await screen.findByText(/Par jour/)
    const d = container.querySelector('.wellbeing-chart-line').getAttribute('d')
    // Un seul segment (13 → 12 jours) ; le point d'hier reste un point isolé
    expect(d.match(/M/g)).toHaveLength(1)
    expect(d.match(/L/g)).toHaveLength(1)
  })

  it("dit qu'il n'y a pas de note récente au lieu d'afficher d'anciennes notes comme si elles dataient d'hier", async () => {
    // Seules les notes des 14 jours sont lues ; les plus anciennes ne sont que comptées
    listEntries.mockResolvedValue([])
    countEntries.mockResolvedValue(2)
    const { container } = render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText(/Aucune note ces 14 derniers jours/)).toBeInTheDocument()
    expect(container.querySelectorAll('.wellbeing-chart-dot')).toHaveLength(0)
  })

  it("place la prédiction du jour à aujourd'hui, sans la relier à une note vieille de plusieurs jours", async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: 'x', predicted: 3, actual: null, assumedTypical: [] })
    listEntries.mockResolvedValue([wb(1, 6, 3), wb(2, 5, 4)])
    const { container } = render(<WellbeingCharts />, { wrapper: MemoryRouter })
    await screen.findByText(/Par jour/)
    const xs = [...container.querySelectorAll('.wellbeing-chart-dot')].map((c) => Number(c.getAttribute('cx')))
    const pred = Number(container.querySelector('.wellbeing-chart-pred-dot').getAttribute('cx'))
    expect((pred - xs[1]) / (xs[1] - xs[0])).toBeCloseTo(5, 1)
    expect(container.querySelector('.wellbeing-chart-pred-line')).toBeNull()
  })

  it("relie la prédiction à la note d'hier", async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: 'x', predicted: 3, actual: null, assumedTypical: [] })
    listEntries.mockResolvedValue([wb(1, 2, 3), wb(2, 1, 4)])
    const { container } = render(<WellbeingCharts />, { wrapper: MemoryRouter })
    await screen.findByText(/Par jour/)
    expect(container.querySelector('.wellbeing-chart-pred-line')).not.toBeNull()
  })
})

describe('WellbeingCharts — ne lit que les 14 jours affichés (perf D2)', () => {
  beforeEach(() => {
    computeTodayPrediction.mockReset()
    computeTodayPrediction.mockReturnValue(null)
    listEntries.mockClear()
    countEntries.mockClear()
  })

  it('lit les notes de bien-être depuis le premier jour affiché, par plage', async () => {
    listEntries.mockResolvedValue([])
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    await screen.findByText(/Pas encore de bien-être noté|Aucune note ces/)
    const [opts] = listEntries.mock.calls[0]
    expect(opts.type).toBe('wellbeing')
    const first = new Date()
    first.setDate(first.getDate() - 13)
    first.setHours(0, 0, 0, 0)
    // Au plus un jour de marge avant le premier jour affiché, jamais tout l'historique
    expect(new Date(opts.since).getTime()).toBeLessThanOrEqual(first.getTime())
    expect(first.getTime() - new Date(opts.since).getTime()).toBeLessThanOrEqual(24 * 3600e3)
  })

  it("ne compte les notes plus anciennes que s'il n'y en a aucune dans la fenêtre", async () => {
    const now = new Date()
    now.setHours(9, 0, 0, 0)
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: now.toISOString(), payload: { score: 4 } },
    ])
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    await screen.findByText(/Par heure/)
    expect(countEntries).not.toHaveBeenCalled()
  })

  it('sans aucune note : invite à noter son bien-être', async () => {
    listEntries.mockResolvedValue([])
    countEntries.mockResolvedValue(0)
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText(/Pas encore de bien-être noté/)).toBeInTheDocument()
    expect(countEntries.mock.calls[0][0]).toMatchObject({ type: 'wellbeing' })
  })

  it('sans note dans les 14 jours : une ligne discrète, pas un grand cadre de graphique vide (POL-PLAY-38)', async () => {
    listEntries.mockResolvedValue([])
    countEntries.mockResolvedValue(0)
    const { container } = render(<WellbeingCharts />, { wrapper: MemoryRouter })
    const hint = await screen.findByText(/Pas encore de bien-être noté/)
    expect(hint.closest('.wellbeing-charts-empty')).not.toBeNull()
    expect(container.querySelector('.wellbeing-chart-empty')).toBeNull()
    expect(container.querySelector('.wellbeing-chart-block')).toBeNull()
    expect(screen.queryByText(/Par jour/)).toBeNull()
    const note = screen.getByRole('button', { name: /Noter votre bien-être/ })
    expect(note).toHaveAttribute('data-theme', 'mint')
  })

  it('« Noter votre bien-être » ouvre la note sur place, au lieu de renvoyer à l’Accueil (POL-PLAY-87)', async () => {
    listEntries.mockResolvedValue([])
    countEntries.mockResolvedValue(0)
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    const note = await screen.findByRole('button', { name: /Noter votre bien-être/ })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(note)
    expect(await screen.findByRole('dialog', { name: /Comment vous sentez-vous/ })).toBeInTheDocument()
  })

  it('sans note : la lecture du visage et la note manuelle en tuiles menthe, pas une phrase grise (POL-PLAY-48)', async () => {
    listEntries.mockResolvedValue([])
    countEntries.mockResolvedValue(0)
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    const face = await screen.findByRole('link', { name: /Activer la lecture du visage/ })
    expect(face).toHaveAttribute('href', '/connectors')
    expect(face).toHaveAttribute('data-theme', 'mint')
    expect(screen.queryByText(/notez-le vous-même/)).toBeNull()
  })

  it('titre en mots simples, comme « Votre forme » (POL-PLAY-38)', async () => {
    listEntries.mockResolvedValue([])
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByRole('heading', { level: 3, name: 'Votre bien-être' })).toBeInTheDocument()
    expect(screen.queryByText(/Bien-être \(0–5\)/)).toBeNull()
  })
})

describe('WellbeingCharts — prédiction en cache (perf D2)', () => {
  beforeEach(() => {
    computeTodayPrediction.mockReset()
    listEntries.mockResolvedValue([])
  })

  it('ne recalcule pas la prédiction tant que les données ne changent pas', async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 2.6, actual: null, assumedTypical: [] })
    const first = render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText('2,6 / 5')).toBeInTheDocument()
    first.unmount()
    _resetAnalysisRunner() // relance de l'app : seul le cache persistant reste

    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    // Servie par le cache, sans recalcul
    expect(await screen.findByText('2,6 / 5')).toBeInTheDocument()
    expect(computeTodayPrediction).toHaveBeenCalledTimes(1)
  })

  it('recalcule après une écriture dans la base', async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 2.6, actual: null, assumedTypical: [] })
    const first = render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText('2,6 / 5')).toBeInTheDocument()
    first.unmount()

    bumpDataRevision()
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 3.4, actual: null, assumedTypical: [] })
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText('3,4 / 5')).toBeInTheDocument()
    expect(computeTodayPrediction).toHaveBeenCalledTimes(2)
  })
})
