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
  GutCard: ({ onlyIfUsed }) => <section data-testid="gut-card" data-only-if-used={String(onlyIfUsed)} />,
  PistesTeaser: ({ focus }) => <section data-testid="pistes-card" data-focus={focus} />,
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

const faceStatus = { value: null }
vi.mock('../services/faceSense', async (orig) => ({
  ...(await orig()),
  getFaceSenseStatus: vi.fn(async () => faceStatus.value),
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
    const intro = await screen.findByText(/ce qui va avec vos bons et mauvais jours/i)
    // Une seule phrase (VC-26) : la ligne des mesures propose déjà « Ajouter une source »
    expect(intro.textContent.match(/[.!?](\s|$)/g)).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Ajouter une source' })).toHaveAttribute('href', '/connectors')
  })

  it('sans aucune donnée : pas de liens « … dans le Journal » (VC-26)', async () => {
    renderDashboard()
    await screen.findByText(/ce qui va avec vos bons et mauvais jours/i)
    expect(screen.queryByRole('link', { name: /dans le Journal/ })).not.toBeInTheDocument()
  })

  it('montre les tuiles du jour, la carte ventre, la carte pistes et « Photo du repas » mène aux repas', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'steps', source: 'health_connect', at: new Date().toISOString(), payload: { value: 4321, period: 'day' } },
    ])
    renderDashboard()
    expect(await screen.findByRole('region', { name: 'Mesures du jour' })).toBeInTheDocument()
    expect(screen.getByText('Sommeil')).toBeInTheDocument()
    expect(screen.getByText('VFC nuit')).toBeInTheDocument()
    expect(screen.getByTestId('gut-card')).toBeInTheDocument()
    expect(screen.getByTestId('pistes-card')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Photo du repas' }))
    expect(navigateMock).toHaveBeenCalledWith('/food')
  })

  it('objectif « énergie et sommeil » : pas de carte ventre (POL-4), la carte des pistes parle sommeil (I155)', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'energy' }))
    renderDashboard()
    const pistes = await screen.findByTestId('pistes-card')
    expect(pistes).toHaveAttribute('data-focus', 'energy')
    expect(screen.queryByTestId('gut-card')).not.toBeInTheDocument()
    localStorage.removeItem('healthtrack_onboarding')
  })

  it('objectif « tout comprendre » : pas de carte ventre (POL-4)', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'all' }))
    renderDashboard()
    await screen.findByTestId('pistes-card')
    expect(screen.queryByTestId('gut-card')).not.toBeInTheDocument()
    localStorage.removeItem('healthtrack_onboarding')
  })

  it('objectif « Mon ventre » : la carte ventre, toujours, avant les pistes', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'gut' }))
    renderDashboard()
    const pistes = await screen.findByTestId('pistes-card')
    const gut = screen.getByTestId('gut-card')
    expect(pistes).toHaveAttribute('data-focus', 'gut')
    expect(gut).toHaveAttribute('data-only-if-used', 'false')
    expect(pistes.compareDocumentPosition(gut) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
    localStorage.removeItem('healthtrack_onboarding')
  })

  it('aucun objectif (installation d’avant l’onboarding) : la carte ventre seulement si le ventre est noté', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, endedBy: 'existing', goal: null }))
    renderDashboard()
    await screen.findByTestId('pistes-card')
    expect(screen.getByTestId('gut-card')).toHaveAttribute('data-only-if-used', 'true')
    localStorage.removeItem('healthtrack_onboarding')
  })

  it("masque l'introduction dès que des données existent (le contenu commence plus haut)", async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: new Date().toISOString(), payload: { score: 3 } },
    ])
    renderDashboard()
    await screen.findByRole('region', { name: 'Mesures du jour' })
    expect(screen.queryByText(/ce qui va avec vos bons et mauvais jours/i)).not.toBeInTheDocument()
  })

  it('ne double plus la barre d’onglets par des boutons Journal / Tendances (POL-PLAY-21)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: new Date().toISOString(), payload: { score: 3 } },
    ])
    renderDashboard()
    await screen.findByRole('region', { name: 'Mesures du jour' })
    expect(screen.queryByRole('link', { name: /dans le Journal/ })).not.toBeInTheDocument()
    expect(document.querySelector('.day-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('wellbeing-charts')).not.toBeInTheDocument()
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

  it('un seul geste sous les cartes : « Photo du repas » (la note manuelle est dans la carte bien-être, POL-3)', async () => {
    renderDashboard()
    expect(screen.getByRole('button', { name: 'Photo du repas' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ajouter une note' })).not.toBeInTheDocument()
  })

  it('« Noter moi-même » de la carte bien-être ouvre la note manuelle', async () => {
    renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Noter moi-même' }))
    expect(screen.getByRole('dialog', { name: 'wellbeing-prompt-stub' })).toBeInTheDocument()
  })

  it('hides the cigarette quick-add button for a non-smoker (no recent cigarette)', async () => {
    localStorage.clear()
    renderDashboard()
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

  it('la note manuelle s’ouvre vierge et se ferme', async () => {
    renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Noter moi-même' }))
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Édition')
    fireEvent.click(screen.getByRole('button', { name: /Fermer/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  describe('rappel de la lecture au déverrouillage (POL-PLAY-84)', () => {
    const doneAt = new Date(Date.now() - 3 * 86_400_000).toISOString()
    beforeEach(() => {
      localStorage.clear()
      faceStatus.value = { mode: 'app_open', unlockAvailable: true, unlock: false }
    })

    it('après « Plus tard » : un rappel, fermé pour de bon', async () => {
      const { saveOnboarding, loadOnboarding } = await import('../settings/onboarding')
      saveOnboarding({ done: true, doneAt, face: 'later', unlockLater: true })
      renderDashboard()
      fireEvent.click(await screen.findByRole('button', { name: 'Ne plus afficher ce rappel' }))
      expect(screen.queryByRole('note')).toBeNull()
      expect(loadOnboarding().unlockReminderDone).toBe(true)
    })

    it('déjà activée : aucun rappel', async () => {
      const { saveOnboarding } = await import('../settings/onboarding')
      saveOnboarding({ done: true, doneAt, face: 'later', unlockLater: true })
      faceStatus.value = { mode: 'app_open', unlockAvailable: true, unlock: true, running: true }
      renderDashboard()
      await screen.findByText(/ce qui va avec vos bons et mauvais jours/i)
      await waitFor(() => expect(screen.queryByRole('note')).toBeNull())
    })
  })
})
