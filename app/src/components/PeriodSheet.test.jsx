import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PeriodSheet from './PeriodSheet'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
  createEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
}))

const now = () => new Date(2026, 10, 10, 18, 0)
const noon = (d) => new Date(2026, 10, d, 12, 0).toISOString()

describe('PeriodSheet : noter ses règles en un geste (CYCLE-2)', () => {
  let store
  beforeEach(async () => {
    store = await import('../storage/localHealthStorage')
    vi.clearAllMocks()
    store.listEntries.mockResolvedValue([])
    store.createEntry.mockResolvedValue(1)
  })

  it('un flux touché enregistre le jour de règles d’aujourd’hui, à midi, sur le téléphone', async () => {
    const events = vi.fn()
    window.addEventListener('health-entries-updated', events)
    render(<PeriodSheet now={now} />)
    const moyen = await screen.findByRole('button', { name: 'Moyen' })
    await waitFor(() => expect(moyen).toBeEnabled())
    fireEvent.click(moyen)
    await waitFor(() => expect(store.createEntry).toHaveBeenCalledTimes(1))
    expect(store.createEntry).toHaveBeenCalledWith({
      type: 'cycle', source: 'app_cycle', at: noon(10), payload: { subtype: 'period', flow: 'medium' },
    })
    await waitFor(() => expect(events).toHaveBeenCalled())
    window.removeEventListener('health-entries-updated', events)
  })

  it('« Sans préciser le flux » enregistre un flux inconnu', async () => {
    render(<PeriodSheet now={now} />)
    const btn = await screen.findByRole('button', { name: 'Sans préciser le flux' })
    await waitFor(() => expect(btn).toBeEnabled())
    fireEvent.click(btn)
    await waitFor(() => expect(store.createEntry).toHaveBeenCalledWith(expect.objectContaining({
      payload: { subtype: 'period', flow: 'unknown' },
    })))
  })

  it('déjà noté : le flux est coché, le jour des règles affiché, un autre flux corrige sans doublon, « Retirer » efface', async () => {
    store.listEntries.mockResolvedValue([
      { id: 7, type: 'cycle', source: 'app_cycle', at: noon(9), payload: { subtype: 'period', flow: 'heavy' } },
      { id: 8, type: 'cycle', source: 'app_cycle', at: noon(10), payload: { subtype: 'period', flow: 'light' } },
    ])
    render(<PeriodSheet now={now} />)
    expect(await screen.findByText(/jour des règles/)).toHaveTextContent('Aujourd’hui, 2e jour des règles')
    expect(screen.getByRole('button', { name: 'Léger' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Sans préciser le flux' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Abondant' }))
    await waitFor(() => expect(store.updateEntry).toHaveBeenCalledWith(8, { payload: { subtype: 'period', flow: 'heavy' } }))
    expect(store.createEntry).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Retirer' }))
    await waitFor(() => expect(store.deleteEntry).toHaveBeenCalledWith(8))
  })

  it('règles lues ailleurs (Health Connect) : affichées, pas modifiables ici', async () => {
    store.listEntries.mockResolvedValue([
      { id: 9, type: 'cycle', source: 'health_connect', at: noon(10), payload: { subtype: 'period', flow: 'medium' } },
    ])
    render(<PeriodSheet now={now} />)
    expect(await screen.findByText(/jour des règles/)).toHaveTextContent('Aujourd’hui, 1er jour des règles')
    expect(screen.getByRole('button', { name: 'Moyen' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Retirer' })).toBeNull()
  })

  it('erreur d’enregistrement : un message, rien d’autre', async () => {
    store.createEntry.mockRejectedValue(new Error('x'))
    render(<PeriodSheet now={now} />)
    const btn = await screen.findByRole('button', { name: 'Léger' })
    await waitFor(() => expect(btn).toBeEnabled())
    fireEvent.click(btn)
    expect(await screen.findByRole('alert')).toHaveTextContent('Enregistrement impossible. Réessayez.')
  })

  it('un jour passé (Journal, CYCLE-2b) : son flux se corrige, « Annuler » referme, et rien ne s’ajoute pour aujourd’hui', async () => {
    store.listEntries.mockResolvedValue([
      { id: 7, type: 'cycle', source: 'app_cycle', at: noon(8), payload: { subtype: 'period', flow: 'heavy' } },
      { id: 8, type: 'cycle', source: 'app_cycle', at: noon(9), payload: { subtype: 'period', flow: 'light' } },
    ])
    const done = vi.fn()
    render(<PeriodSheet now={now} dateKey="2026-11-09" onDone={done} />)
    expect(await screen.findByText(/jour des règles/)).toHaveTextContent('2e jour des règles, flux :')
    expect(screen.getByRole('button', { name: 'Léger' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Retirer' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Moyen' }))
    await waitFor(() => expect(store.updateEntry).toHaveBeenCalledWith(8, { payload: { subtype: 'period', flow: 'medium' } }))
    await waitFor(() => expect(done).toHaveBeenCalled())
    expect(store.createEntry).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(done).toHaveBeenCalledTimes(2)
  })

  it('symptômes (CYCLE-2c) : un geste note un symptôme du jour, un second le retire, ceux d’une autre source restent', async () => {
    store.listEntries.mockResolvedValue([
      { id: 11, type: 'cycle', source: 'app_cycle', at: new Date(2026, 10, 10, 12, 3).toISOString(), payload: { subtype: 'symptom', symptom: 'pelvic_pain' } },
      { id: 12, type: 'cycle', source: 'health_connect', at: noon(10), payload: { subtype: 'symptom', symptom: 'fatigue' } },
      { id: 13, type: 'cycle', source: 'app_cycle', at: noon(9), payload: { subtype: 'symptom', symptom: 'cramps' } },
    ])
    render(<PeriodSheet now={now} />)
    const group = await screen.findByRole('group', { name: 'Symptômes' })
    const crampes = screen.getByRole('button', { name: 'Crampes' })
    await waitFor(() => expect(crampes).toBeEnabled())
    expect(group).toContainElement(crampes)
    expect(crampes).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Douleur pelvienne' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Fatigue' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Fatigue' })).toBeDisabled()
    fireEvent.click(crampes)
    await waitFor(() => expect(store.createEntry).toHaveBeenCalledWith({
      type: 'cycle', source: 'app_cycle', at: new Date(2026, 10, 10, 12, 2).toISOString(),
      payload: { subtype: 'symptom', symptom: 'cramps' },
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Douleur pelvienne' }))
    await waitFor(() => expect(store.deleteEntry).toHaveBeenCalledWith(11))
  })

  it('symptôme touché (POLISH-SIM-46) : coche visible et retour court « Noté » puis « Retiré »', async () => {
    store.listEntries.mockResolvedValue([])
    render(<PeriodSheet now={now} />)
    const crampes = await screen.findByRole('button', { name: 'Crampes' })
    await waitFor(() => expect(crampes).toBeEnabled())
    expect(crampes.querySelector('.period-symptom-check')).toBeNull()
    store.listEntries.mockResolvedValue([
      { id: 31, type: 'cycle', source: 'app_cycle', at: noon(10), payload: { subtype: 'symptom', symptom: 'cramps' } },
    ])
    fireEvent.click(crampes)
    expect(await screen.findByRole('status')).toHaveTextContent('Noté : Crampes')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Crampes' })).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.getByRole('button', { name: 'Crampes' }).querySelector('.period-symptom-check')).not.toBeNull()
    store.listEntries.mockResolvedValue([])
    fireEvent.click(screen.getByRole('button', { name: 'Crampes' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Retiré : Crampes'))
  })

  it('un jour passé (Journal) : seulement le flux, pas les symptômes', async () => {
    store.listEntries.mockResolvedValue([
      { id: 8, type: 'cycle', source: 'app_cycle', at: noon(9), payload: { subtype: 'period', flow: 'light' } },
    ])
    render(<PeriodSheet now={now} dateKey="2026-11-09" onDone={vi.fn()} />)
    await screen.findByText(/jour des règles/)
    expect(screen.queryByRole('group', { name: 'Symptômes' })).toBeNull()
  })

  it('« Hier » (CYCLE-2d) : flux et symptômes d’hier, sans quitter Aujourd’hui', async () => {
    store.listEntries.mockResolvedValue([
      { id: 7, type: 'cycle', source: 'app_cycle', at: noon(8), payload: { subtype: 'period', flow: 'heavy' } },
      { id: 21, type: 'cycle', source: 'app_cycle', at: noon(9), payload: { subtype: 'symptom', symptom: 'fatigue' } },
    ])
    render(<PeriodSheet now={now} />)
    const days = await screen.findByRole('group', { name: 'Jour' })
    const hier = screen.getByRole('button', { name: 'Hier' })
    expect(days).toContainElement(hier)
    expect(screen.getByRole('button', { name: 'Aujourd’hui' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Fatigue' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(hier)
    expect(hier).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByText('Règles hier, flux :')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fatigue' })).toHaveAttribute('aria-pressed', 'true'))
    fireEvent.click(screen.getByRole('button', { name: 'Moyen' }))
    await waitFor(() => expect(store.createEntry).toHaveBeenCalledWith({
      type: 'cycle', source: 'app_cycle', at: noon(9), payload: { subtype: 'period', flow: 'medium' },
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Crampes' }))
    await waitFor(() => expect(store.createEntry).toHaveBeenCalledWith(expect.objectContaining({
      payload: { subtype: 'symptom', symptom: 'cramps' },
    })))
    expect(store.createEntry.mock.calls[1][0].at.slice(0, 10)).toBe(noon(9).slice(0, 10))
  })

  it('« Hier » déjà noté : « Hier, 2e jour des règles » et « Retirer »', async () => {
    store.listEntries.mockResolvedValue([
      { id: 7, type: 'cycle', source: 'app_cycle', at: noon(8), payload: { subtype: 'period', flow: 'heavy' } },
      { id: 8, type: 'cycle', source: 'app_cycle', at: noon(9), payload: { subtype: 'period', flow: 'light' } },
    ])
    render(<PeriodSheet now={now} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Hier' }))
    await waitFor(() => expect(screen.getByText(/jour des règles/)).toHaveTextContent('Hier, 2e jour des règles'))
    fireEvent.click(screen.getByRole('button', { name: 'Retirer' }))
    await waitFor(() => expect(store.deleteEntry).toHaveBeenCalledWith(8))
  })

  it('un jour passé (Journal) : pas de choix Aujourd’hui / Hier', async () => {
    render(<PeriodSheet now={now} dateKey="2026-11-09" onDone={vi.fn()} />)
    await screen.findByRole('button', { name: 'Léger' })
    expect(screen.queryByRole('group', { name: 'Jour' })).toBeNull()
  })
})
