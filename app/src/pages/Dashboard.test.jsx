import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

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

vi.mock('../components/BaselineCards', () => ({
  default: () => <div data-testid="baseline-cards" />,
}))

// Cartes ventre et pistes : testées dans TodayCards.test.jsx (elles lisent IndexedDB de leur côté)
vi.mock('../components/TodayCards', async (importOriginal) => ({
  ...(await importOriginal()),
  GutCard: () => <section data-testid="gut-card" />,
  PistesTeaser: () => <section data-testid="pistes-card" />,
}))

vi.mock('../components/WellbeingCharts', () => ({
  default: () => <div data-testid="wellbeing-charts" />,
}))

// Stub WellbeingPrompt to make controlled-mode testing simple
vi.mock('../components/WellbeingPrompt', () => ({
  default: ({ open, onClose, entry }) =>
    open ? (
      <div role="dialog" aria-label="wellbeing-prompt-stub">
        {entry && <p>Édition de l’entrée {entry.id}</p>}
        <button type="button" onClick={onClose}>Fermer</button>
      </div>
    ) : null,
}))

vi.mock('../components/CigaretteQuickAdd', () => ({
  default: () => (
    <button type="button" aria-label="Ajouter une cigarette">
      + 1 cigarette
    </button>
  ),
}))

function renderDashboard() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(async () => {
    const { listEntries, countEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
    countEntries.mockResolvedValue(0)
  })

  it('renders the « Aujourd’hui » header and, without any data, the introduction', async () => {
    renderDashboard()
    expect(screen.getByText(/· Bonjour$/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Votre journée' })).toBeInTheDocument()
    expect(await screen.findByText(/ce qui va avec vos bons et mauvais jours/i)).toBeInTheDocument()
    expect(screen.getByText(/l’IA seulement si vous le voulez/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Sources' })[0]).toHaveAttribute('href', '/connectors')
  })

  it('montre les tuiles du jour, la carte ventre, la carte pistes et « Photo du repas » mène aux repas', async () => {
    renderDashboard()
    expect(await screen.findByRole('region', { name: 'Mesures du jour' })).toBeInTheDocument()
    expect(screen.getByText('Sommeil')).toBeInTheDocument()
    expect(screen.getByText('VFC')).toBeInTheDocument()
    expect(screen.getByTestId('gut-card')).toBeInTheDocument()
    expect(screen.getByTestId('pistes-card')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Photo du repas' }))
    expect(navigateMock).toHaveBeenCalledWith('/food')
  })

  it("masque l'introduction dès que des données existent (le contenu commence plus haut)", async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: new Date().toISOString(), payload: { score: 3 } },
    ])
    renderDashboard()
    await screen.findByRole('link', { name: /Vos derniers jours, dans le Journal/ })
    expect(screen.queryByText(/ce qui va avec vos bons et mauvais jours/i)).not.toBeInTheDocument()
  })

  it('renvoie « Vos derniers jours » vers l’onglet Journal au lieu de les lister (jalon 2c-2)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: new Date().toISOString(), payload: { score: 3 } },
    ])
    renderDashboard()
    const link = await screen.findByRole('link', { name: 'Vos derniers jours, dans le Journal' })
    expect(link).toHaveAttribute('href', '/journal')
    expect(document.querySelector('.day-list')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Voir les jours précédents/i })).not.toBeInTheDocument()
  })

  it('relit les tuiles du jour quand une saisie arrive', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    renderDashboard()
    await screen.findByRole('region', { name: 'Mesures du jour' })
    const reads = () => listEntries.mock.calls.filter(([o]) => !o?.type).length
    const before = reads()
    window.dispatchEvent(new CustomEvent('health-entries-updated'))
    await waitFor(() => expect(reads()).toBeGreaterThan(before))
  })

  it("n'affiche pas l'introduction pendant le chargement (pas de saut de mise en page)", () => {
    renderDashboard()
    expect(screen.queryByText(/ce qui va avec vos bons et mauvais jours/i)).not.toBeInTheDocument()
  })

  it('renders the « Une note » button', async () => {
    renderDashboard()
    const btn = screen.getByRole('button', { name: 'Une note' })
    expect(btn).toBeInTheDocument()
  })

  it('hides the cigarette quick-add button for a non-smoker (no recent cigarette)', async () => {
    localStorage.clear()
    renderDashboard()
    await screen.findByRole('button', { name: 'Une note' })
    await waitFor(() => expect(screen.queryByText(/Chargement des données/i)).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /Ajouter une cigarette/i })).not.toBeInTheDocument()
  })

  it('shows the cigarette quick-add button once a recent cigarette is logged', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'cigarette', source: 'app_cigarette', at: new Date().toISOString(), payload: { count: 1 } },
    ])
    renderDashboard()
    expect(await screen.findByRole('button', { name: /Ajouter une cigarette/i })).toBeInTheDocument()
  })

  it('shows the cigarette quick-add button when pinned in Settings', async () => {
    localStorage.setItem('healthtrack_cigarette_counter', 'on')
    renderDashboard()
    expect(await screen.findByRole('button', { name: /Ajouter une cigarette/i })).toBeInTheDocument()
    localStorage.clear()
  })

  it('opens the wellbeing modal when the button is clicked', async () => {
    renderDashboard()
    const btn = screen.getByRole('button', { name: 'Une note' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the wellbeing modal when onClose is called', async () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: 'Une note' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Fermer/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('le bouton « Une note » ouvre une note vierge', async () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: 'Une note' }))
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Édition')
  })
})
