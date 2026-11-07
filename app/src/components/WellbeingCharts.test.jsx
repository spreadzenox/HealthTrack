import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WellbeingCharts from './WellbeingCharts'
import { computeTodayPrediction } from '../services/analysisEngine'
import { listEntries } from '../storage/localHealthStorage'
import { _resetAnalysisRunner } from '../services/analysisRunner'
import { bumpDataRevision } from '../storage/dataRevision'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn().mockResolvedValue([]),
  countEntries: vi.fn().mockResolvedValue(0),
  listEntriesForAnalysis: vi.fn().mockResolvedValue([]),
}))

vi.mock('../services/analysisEngine', async (importOriginal) => ({
  ...(await importOriginal()),
  computeTodayPrediction: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  _resetAnalysisRunner()
})

const NEUTRAL = { smile: 0.1, duchenne: 0.05, mouthFrown: 0.05, browDown: 0.15, browInnerUp: 0.1, yaw: 4 }
const EX = { exHappiness: 0.3, exNeutral: 0.4, exSurprise: 0.05, exSadness: 0.1, exAnger: 0.05, exFear: 0.03, exDisgust: 0.02, exContempt: 0.05 }
const burst = (at, values = {}) => ({
  type: 'face_burst', source: 'face_sense', at: at.toISOString(),
  payload: { v: 1, trigger: 'unlock', frames: 3, valid: 3, values: { ...NEUTRAL, ...EX, ...values }, rejected: {} },
})
const note = (at, score) => ({ type: 'wellbeing', source: 'app_wellbeing', at: at.toISOString(), payload: { score } })
const NOW = new Date(2026, 10, 5, 18, 0)
const at = (daysAgo, h, m = 0) => new Date(2026, 10, 5 - daysAgo, h, m)
/** Base factice : `listEntries` filtre par type et par date comme IndexedDB. */
function seed(entries) {
  listEntries.mockImplementation(async ({ type, since } = {}) => entries.filter((e) => e.type === type && (!since || e.at >= since)))
}
const renderAt = () => render(<WellbeingCharts now={NOW} />, { wrapper: MemoryRouter })

describe('WellbeingCharts — bien-être estimé (signalement du 05/11)', () => {
  beforeEach(() => {
    computeTodayPrediction.mockReset()
    computeTodayPrediction.mockReturnValue(null)
  })

  it('montre les lectures du visage même sans aucune note à la main', async () => {
    const entries = []
    for (let d = 0; d < 10; d++) for (const h of [8, 12, 17]) entries.push(burst(at(d, h), { valence: 0.2 }))
    seed(entries)
    const { container } = renderAt()
    const chart = await screen.findByRole('img', { name: /Bien-être estimé ces 14 jours : 10 jours/ })
    expect(chart.querySelectorAll('.wbh-dot')).toHaveLength(10)
    expect(container.querySelector('.wbh-note')).toBeNull()
    expect(screen.getAllByText('estimé (visage)').length).toBeGreaterThan(0)
    // Aujourd'hui : chaque lecture du jour
    expect(screen.getByRole('img', { name: /Bien-être estimé aujourd’hui : 3 lectures/ })).toBeInTheDocument()
  })

  it('les notes à la main sont des losanges à part, pas mêlées à l’estimation', async () => {
    seed([burst(at(1, 9)), burst(at(0, 9)), note(at(1, 20), 4)])
    const { container } = renderAt()
    await screen.findByText('noté à la main')
    const days = screen.getByRole('img', { name: /ces 14 jours/ })
    expect(days.querySelectorAll('.wbh-dot')).toHaveLength(2)
    expect(days.querySelectorAll('.wbh-note')).toHaveLength(1)
    expect(container.querySelectorAll('.wellbeing-chart-block')).toHaveLength(2)
  })

  it('toucher un point ouvre ce que les modèles ont lu ce jour-là', async () => {
    seed([burst(at(2, 9), { valence: 0.4, arousal: 0.1 }), burst(at(0, 9))])
    renderAt()
    const hit = await screen.findByRole('button', { name: /mardi 3 novembre/ })
    fireEvent.click(hit)
    const detail = screen.getByRole('region', { name: /mardi 3 novembre/ })
    expect(detail).toHaveTextContent('Valence')
    expect(detail).toHaveTextContent('Joie')
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la lecture' }))
    expect(screen.queryByRole('region', { name: /mardi 3 novembre/ })).toBeNull()
  })

  it('sans lecture ni note aujourd’hui : pas de bloc « Aujourd’hui » vide', async () => {
    seed([burst(at(2, 9)), burst(at(1, 9))])
    renderAt()
    await screen.findByRole('img', { name: /ces 14 jours/ })
    expect(screen.queryByText('Aujourd’hui')).toBeNull()
  })

  it('« Attendu d’après vos habitudes » dit à quoi il se compare : la note du jour', async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: 'x', predicted: 3.1, actual: 3, assumedTypical: ['steps'] })
    seed([burst(at(0, 9)), note(at(0, 10), 3)])
    const { container } = renderAt()
    expect(await screen.findByText('3,5 / 5')).toBeInTheDocument()
    expect(container.querySelector('.wellbeing-chart-pred-legend')).toHaveTextContent(/votre note du jour : 3,4/)
    expect(screen.getByText(/jours notés à la main laissent attendre/)).toBeInTheDocument()
    expect(screen.getByText(/compte comme une journée habituelle/)).toBeInTheDocument()
    expect(screen.queryByText(/réel/)).toBeNull()
  })

  it('sans note du jour : invite à noter pour comparer', async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: 'x', predicted: 2.6, actual: null, assumedTypical: [] })
    seed([burst(at(0, 9))])
    renderAt()
    expect(await screen.findByText('3,1 / 5')).toBeInTheDocument()
    expect(screen.getByText(/Notez votre journée pour comparer/)).toBeInTheDocument()
  })
})

describe('WellbeingCharts — rien à montrer', () => {
  beforeEach(() => {
    computeTodayPrediction.mockReset()
    computeTodayPrediction.mockReturnValue(null)
    seed([])
  })

  it('une ligne discrète, pas un grand cadre de graphique vide (POL-PLAY-38)', async () => {
    const { container } = renderAt()
    const hint = await screen.findByText(/Pas encore de bien-être noté ni estimé/)
    expect(hint.closest('.wellbeing-charts-empty')).not.toBeNull()
    expect(container.querySelector('.wellbeing-chart-block')).toBeNull()
    expect(screen.queryByText(/Par jour/)).toBeNull()
    expect(screen.getByRole('button', { name: /Noter votre bien-être/ })).toHaveAttribute('data-theme', 'mint')
  })

  it('des notes plus anciennes que 14 jours : le dit, sans les montrer comme récentes', async () => {
    seed([note(at(20, 9), 4)])
    renderAt()
    expect(await screen.findByText('Rien ces 14 derniers jours.')).toBeInTheDocument()
  })

  it('« Noter votre bien-être » ouvre la note sur place (POL-PLAY-87)', async () => {
    renderAt()
    const btn = await screen.findByRole('button', { name: /Noter votre bien-être/ })
    fireEvent.click(btn)
    expect(await screen.findByRole('dialog', { name: /Comment vous sentez-vous/ })).toBeInTheDocument()
  })

  it('la lecture du visage en tuile menthe vers Sources (POL-PLAY-48)', async () => {
    renderAt()
    const face = await screen.findByRole('link', { name: /Activer la lecture du visage/ })
    expect(face).toHaveAttribute('href', '/connectors')
    expect(face).toHaveAttribute('data-theme', 'mint')
  })

  it('titre en mots simples (POL-PLAY-38)', async () => {
    renderAt()
    expect(await screen.findByRole('heading', { level: 3, name: 'Votre bien-être' })).toBeInTheDocument()
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
    expect(await screen.findByText('3,1 / 5')).toBeInTheDocument()
    first.unmount()
    _resetAnalysisRunner() // relance de l'app : seul le cache persistant reste

    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    // Servie par le cache, sans recalcul
    expect(await screen.findByText('3,1 / 5')).toBeInTheDocument()
    expect(computeTodayPrediction).toHaveBeenCalledTimes(1)
  })

  it('recalcule après une écriture dans la base', async () => {
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 2.6, actual: null, assumedTypical: [] })
    const first = render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText('3,1 / 5')).toBeInTheDocument()
    first.unmount()

    bumpDataRevision()
    computeTodayPrediction.mockReturnValue({ dateKey: '2026-10-10', predicted: 3.4, actual: null, assumedTypical: [] })
    render(<WellbeingCharts />, { wrapper: MemoryRouter })
    expect(await screen.findByText('3,7 / 5')).toBeInTheDocument()
    expect(computeTodayPrediction).toHaveBeenCalledTimes(2)
  })
})
