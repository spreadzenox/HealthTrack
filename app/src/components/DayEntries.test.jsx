import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DayEntries from './DayEntries'
import { habitEntry } from '../services/habits'
import { periodEntry, symptomEntry } from '../services/cycle'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
  countEntries: vi.fn(),
  deleteEntry: vi.fn(),
  updateEntry: vi.fn(),
}))

const navigateMock = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}))

vi.mock('./WellbeingPrompt', () => ({
  default: ({ open, entry }) => (open ? <div role="dialog" aria-label="note">{entry && `Édition de ${entry.id}`}</div> : null),
}))

const ONBOARDING_KEY = 'healthtrack_onboarding'
const key = (daysAgo) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const at = (daysAgo, h) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, 0, 0, 0)
  return d.toISOString()
}

/** listEntries simulé : filtre type, since et until comme le stockage. */
async function withEntries(entries) {
  const { listEntries } = await import('../storage/localHealthStorage')
  listEntries.mockImplementation(async (o = {}) => entries
    .filter((e) => !o.type || e.type === o.type)
    .filter((e) => !o.since || e.at >= o.since)
    .filter((e) => !o.until || e.at <= o.until))
  return listEntries
}

function renderDay(dateKey) {
  return render(<MemoryRouter><DayEntries dateKey={dateKey} /></MemoryRouter>)
}

const openActions = () => screen.queryAllByRole('button', { name: /^Actions pour/ }).forEach((b) => fireEvent.click(b))

describe('DayEntries : « Vos saisies » d’un jour passé (refonte, étape 7a)', () => {
  beforeEach(async () => {
    localStorage.clear()
    const { updateEntry, deleteEntry } = await import('../storage/localHealthStorage')
    updateEntry.mockReset()
    updateEntry.mockResolvedValue(undefined)
    deleteEntry.mockReset()
    deleteEntry.mockResolvedValue(undefined)
  })

  it('ne lit que le jour demandé et ne montre rien sans saisie', async () => {
    const listEntries = await withEntries([
      { id: 1, type: 'steps', source: 'health_connect', at: at(3, 10), payload: { count: 5000 } },
      { id: 2, type: 'wellbeing', source: 'app_wellbeing', at: at(2, 21), payload: { score: 4 } },
    ])
    const { container } = renderDay(key(3))
    await waitFor(() => expect(listEntries).toHaveBeenCalled())
    const day = listEntries.mock.calls.find(([o]) => !o?.type)[0]
    expect(new Date(day.since).getDate()).toBe(new Date(at(3, 0)).getDate())
    expect(new Date(day.until).getDate()).toBe(new Date(at(3, 0)).getDate())
    await new Promise((r) => setTimeout(r, 20))
    expect(container.querySelector('.day-entries')).toBeNull()
  })

  it('une note de bien-être passée se modifie (même fenêtre de note) et se supprime', async () => {
    await withEntries([{ id: 7, type: 'wellbeing', source: 'app_wellbeing', at: at(4, 21), payload: { score: 2 } }])
    renderDay(key(4))
    const region = await screen.findByRole('region', { name: 'Vos saisies' })
    expect(within(region).getByText('Bien-être')).toBeInTheDocument()
    openActions()
    expect(screen.getByRole('button', { name: 'Supprimer cette note de bien-être' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Modifier cette note de bien-être' }))
    expect(screen.getByRole('dialog', { name: 'note' })).toHaveTextContent('Édition de 7')
  })

  it('une note digestive passée change de niveau sur place', async () => {
    const { updateEntry } = await import('../storage/localHealthStorage')
    await withEntries([{ id: 3, type: 'gut', source: 'app_gut', at: at(2, 20), payload: { level: 'discomfort', scope: 'day' } }])
    renderDay(key(2))
    await screen.findByText('Gêne')
    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'Modifier cette note digestive' }))
    fireEvent.click(screen.getByRole('button', { name: 'Calme' }))
    await waitFor(() => expect(updateEntry).toHaveBeenCalledWith(3, { payload: { level: 'calm', scope: 'day' } }))
  })

  it('une habitude s’affiche « Méditation : Oui », une seule réponse par jour, et se corrige en « Non »', async () => {
    const { updateEntry } = await import('../storage/localHealthStorage')
    const habit = { id: 'meditation', label: 'Méditation' }
    await withEntries([
      { id: 10, ...habitEntry(habit, key(1), false), created_at: at(1, 20) },
      { id: 11, ...habitEntry(habit, key(1), true), created_at: at(1, 21) },
    ])
    renderDay(key(1))
    const region = await screen.findByRole('region', { name: 'Vos saisies' })
    expect(within(region).getAllByText('Méditation')).toHaveLength(1)
    expect(within(region).getByText('Oui')).toBeInTheDocument()
    expect(region.querySelector('.entry-payload')).toBeNull()
    openActions()
    expect(screen.getByRole('button', { name: 'Supprimer cette réponse' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Modifier Méditation' }))
    const group = screen.getByRole('group', { name: 'Méditation' })
    expect(within(group).getByRole('button', { name: 'Oui' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(group).getByRole('button', { name: 'Non' }))
    await waitFor(() => expect(updateEntry).toHaveBeenCalledWith(11, { payload: { habit: 'meditation', label: 'Méditation', done: false } }))
  })

  it('une habitude n’a pas d’heure inventée et vient après les saisies horodatées (POLISH-SIM-125)', async () => {
    const habit = { id: 'cafe', label: 'Café' }
    await withEntries([
      { id: 20, ...habitEntry(habit, key(1), true), created_at: at(1, 8) },
      { id: 21, type: 'food', source: 'app_food', at: at(1, 9), payload: { dish: 'Tartines' } },
      { id: 22, type: 'food', source: 'app_food', at: at(1, 19), payload: { dish: 'Soupe' } },
    ])
    renderDay(key(1))
    const region = await screen.findByRole('region', { name: 'Vos saisies' })
    const cards = [...region.querySelectorAll('.entry-card')]
    const habitCard = cards.find((c) => c.dataset.type === 'habit')
    expect(habitCard.querySelector('time')).toBeNull()
    expect(habitCard.textContent).not.toMatch(/\d{1,2}[:h]\d{2}/)
    expect(cards.indexOf(habitCard)).toBe(cards.length - 1)
  })

  it('un repas passé garde Refaire, Modifier et Supprimer', async () => {
    await withEntries([{ id: 5, type: 'food', source: 'app_food', at: at(2, 12), payload: { dish: 'Salade', items: [{ name: 'Tomate, crue', grams: 100 }] } }])
    renderDay(key(2))
    await screen.findByText('Salade')
    openActions()
    expect(screen.getByRole('button', { name: 'Modifier ce repas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supprimer ce repas' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Refaire ce repas' }))
    expect(navigateMock).toHaveBeenCalledWith('/food', { state: { redoMeal: { dish: 'Salade', items: [{ name: 'Tomate, crue', grams: 100 }] } } })
  })

  it('une séance venue de la montre est listée avec sa source, sans geste', async () => {
    await withEntries([{ id: 6, type: 'activity', source: 'huawei_watch', at: at(3, 18), payload: { workoutType: 'running', durationSeconds: 1800 } }])
    renderDay(key(3))
    const region = await screen.findByRole('region', { name: 'Vos saisies' })
    expect(within(region).getByText('Séance')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Actions pour/ })).toBeNull()
  })

  it('les règles d’un jour passé : « Règles · 2e jour · flux moyen », modifiables', async () => {
    const entries = [
      { id: 1, ...periodEntry(key(3), 'heavy') },
      { id: 2, ...periodEntry(key(2), 'medium') },
      { id: 3, ...symptomEntry(key(2), 'cramps') },
    ]
    await withEntries(entries)
    renderDay(key(2))
    const line = await screen.findByText((_, el) => el?.classList?.contains('day-cycle') && /Règles · 2e jour · flux moyen/.test(el.textContent))
    expect(line.textContent).toMatch(/Crampes/)
    fireEvent.click(screen.getByRole('button', { name: 'Actions pour ces règles' }))
    expect(screen.getByRole('button', { name: 'Modifier ces règles' })).toBeInTheDocument()
  })

  it('base d’avant la refonte (objectifs sport et cycle, aucune habitude) : chaque saisie du jour est listée', async () => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ done: true, goals: ['sport', 'cycle', 'gut'] }))
    await withEntries([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: at(5, 21), payload: { score: 3, tags: ['late_screen'] } },
      { id: 2, type: 'gut', source: 'app_gut', at: at(5, 20), payload: { level: 'pain', scope: 'day' } },
      { id: 3, type: 'food', source: 'app_food', at: at(5, 12), payload: { dish: 'Pâtes', items: [] } },
      { id: 4, type: 'cigarette', source: 'app_cigarette', at: at(5, 10), payload: {} },
      { id: 5, ...periodEntry(key(5), 'light') },
    ])
    renderDay(key(5))
    const region = await screen.findByRole('region', { name: 'Vos saisies' })
    for (const t of ['Bien-être', /^Digestion/, 'Pâtes', 'Cigarette']) expect(within(region).getByText(t)).toBeInTheDocument()
    expect(region.querySelector('.day-cycle')).not.toBeNull()
    expect(region.querySelector('.entry-payload')).toBeNull()
  })
})
