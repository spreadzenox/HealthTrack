import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
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

// Fin du chargement : sans mesure du jour, il n'y a plus de bloc « Vos données du jour » à attendre (testeur du 06/11)
const loaded = () => waitFor(() => expect(screen.queryByText('Chargement des données…')).not.toBeInTheDocument())

describe('Dashboard', () => {
  beforeEach(async () => {
    const { listEntries, countEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
    countEntries.mockResolvedValue(0)
  })

  it('renders the « Aujourd’hui » header and, without any data, no filler sentence (AUJ-2, leçon 2)', async () => {
    renderDashboard()
    // Nouvel écran du 07/11 : la date seule, sans « Bonjour », puis le bandeau d'ajout juste dessous
    const date = screen.getByRole('heading', { level: 1 })
    expect(date.textContent).not.toMatch(/·|Bonjour/)
    expect(screen.queryByText(/Bonjour/)).toBeNull()
    const strip = screen.getByRole('region', { name: 'Ajouter' })
    expect(date.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // AUJ-2 : sans lecture ni note, le bloc « Bien-être aujourd'hui » renvoie au bandeau, sans verdict
    expect(await screen.findByRole('heading', { level: 2, name: 'Bien-être aujourd’hui' })).toBeInTheDocument()
    expect(screen.queryByText(/Pas encore d’avis|Votre journée/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Noter comment je me sens' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Noter' })).toBeNull()
    fireEvent.click(within(strip).getByRole('button', { name: 'Bien-être' }))
    expect(screen.getByRole('dialog', { name: 'wellbeing-prompt-stub' })).toBeInTheDocument()
    // Plus de phrase de présentation (leçon 2 : aucun texte de remplissage)
    expect(screen.queryByText(/ce qui va avec vos bons et mauvais jours/i)).toBeNull()
    expect(screen.queryByText(/Pas et nuits/)).not.toBeInTheDocument()
  })

  it('sans aucune donnée : pas de liens « … dans le Journal » (VC-26)', async () => {
    renderDashboard()
    await screen.findByRole('heading', { level: 2, name: 'Bien-être aujourd’hui' })
    expect(screen.queryByRole('link', { name: /dans le Journal/ })).not.toBeInTheDocument()
  })

  it('montre les données du jour par source, la carte pistes, et « Repas » ouvre l’appareil photo puis les repas', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'steps', source: 'health_connect', at: new Date().toISOString(), payload: { value: 4321, period: 'day' } },
    ])
    renderDashboard()
    // TESTEUR-1d-b : les données du jour par source ; une source sans chiffre (montre) ne s'affiche pas
    expect(await screen.findByRole('heading', { name: 'Vos données du jour' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Téléphone' })).toHaveTextContent('Pas')
    expect(screen.queryByRole('region', { name: 'Montre' })).toBeNull()
    expect(screen.getByRole('link', { name: /Ajouter une montre/ })).toHaveAttribute('href', '/connectors')
    expect(screen.getByTestId('pistes-card')).toBeInTheDocument()
    // TESTEUR-4b : le bouton est le libellé d'un champ photo arrière ; la photo prise part vers Repas.
    const photo = screen.getByRole('button', { name: 'Repas' })
    const input = document.getElementById(photo.getAttribute('for'))
    expect(input).toHaveAttribute('capture', 'environment')
    expect(navigateMock).not.toHaveBeenCalled()
    const file = new File(['x'], 'repas.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(navigateMock).toHaveBeenCalledWith('/food')
    const { takePendingMealPhoto } = await import('../services/mealPhotoHandoff')
    expect(takePendingMealPhoto()).toBe(file)
  })

  it('objectif « énergie et sommeil » : la carte des pistes parle sommeil (I155) ; la digestion reste dans le bandeau', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'energy' }))
    renderDashboard()
    const pistes = await screen.findByTestId('pistes-card')
    expect(pistes).toHaveAttribute('data-focus', 'energy')
    expect(screen.queryByTestId('gut-card')).not.toBeInTheDocument()
    localStorage.removeItem('healthtrack_onboarding')
  })

  it('« Digestion » (bandeau) ouvre « Ma digestion » dans une fenêtre, sans carte « Mon ventre » sur l’écran (07/11)', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'gut' }))
    renderDashboard()
    await screen.findByTestId('pistes-card')
    expect(screen.queryByTestId('gut-card')).not.toBeInTheDocument()
    expect(screen.queryByText('Mon ventre')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Digestion' }))
    const dialog = screen.getByRole('dialog', { name: 'Ma digestion' })
    expect(within(dialog).getByTestId('gut-card')).toBeInTheDocument()
    localStorage.removeItem('healthtrack_onboarding')
  })

  it("masque l'introduction dès que des données existent (le contenu commence plus haut)", async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: new Date().toISOString(), payload: { score: 3 } },
    ])
    renderDashboard()
    await loaded()
    expect(screen.queryByText(/ce qui va avec vos bons et mauvais jours/i)).not.toBeInTheDocument()
  })

  it('ne double plus la barre d’onglets par des boutons Journal / Tendances (POL-PLAY-21)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: new Date().toISOString(), payload: { score: 3 } },
    ])
    renderDashboard()
    await loaded()
    expect(screen.queryByRole('link', { name: /dans le Journal/ })).not.toBeInTheDocument()
    expect(document.querySelector('.day-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('wellbeing-charts')).not.toBeInTheDocument()
  })

  it('relit les tuiles du jour quand une saisie arrive', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    renderDashboard()
    await loaded()
    const reads = () => listEntries.mock.calls.filter(([o]) => !o?.type).length
    const before = reads()
    window.dispatchEvent(new CustomEvent('health-entries-updated'))
    await waitFor(() => expect(reads()).toBeGreaterThan(before))
  })

  it("n'affiche pas l'introduction pendant le chargement (pas de saut de mise en page)", () => {
    renderDashboard()
    expect(screen.queryByText(/ce qui va avec vos bons et mauvais jours/i)).not.toBeInTheDocument()
  })

  it('un seul endroit pour ajouter : le bandeau, plus de section « Noter » ni de « Photo du repas » en bas', async () => {
    renderDashboard()
    expect(screen.getByRole('button', { name: 'Repas' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Photo du repas' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ajouter une note' })).not.toBeInTheDocument()
  })

  it('« Bien-être » (bandeau) ouvre la note manuelle', async () => {
    renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Bien-être' }))
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
    fireEvent.click(await screen.findByRole('button', { name: 'Bien-être' }))
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
      await screen.findByRole('heading', { level: 2, name: 'Bien-être aujourd’hui' })
      await waitFor(() => expect(screen.queryByRole('note')).toBeNull())
    })
  })
})
