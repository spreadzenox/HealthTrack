import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
  countEntries: vi.fn(),
  deleteEntry: vi.fn(),
  updateEntry: vi.fn(),
  createEntry: vi.fn(),
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
}))

// Bloc digestif (AUJ-4) : testé dans DigestBlock.test.jsx
vi.mock('../components/DigestBlock', () => ({
  default: ({ onNote }) => <section data-testid="digest-block"><button type="button" onClick={onNote}>Noter ma digestion</button></section>,
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

function renderDashboard(view = 'home') {
  return render(
    <BrowserRouter>
      <Dashboard view={view} />
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

  it('Accueil : la date, le bien-être du jour et le lien vers Agir, sans bandeau d’ajout (refonte étape 2)', async () => {
    renderDashboard()
    const date = screen.getByRole('heading', { level: 1 })
    expect(date.textContent).not.toMatch(/·|Bonjour|Ma journée/)
    expect(screen.queryByText(/Bonjour/)).toBeNull()
    expect(screen.queryByRole('region', { name: 'Ajouter' })).toBeNull()
    // AUJ-2 : sans lecture ni note, le bloc « Bien-être aujourd'hui », sans verdict
    expect(await screen.findByRole('heading', { level: 2, name: 'Bien-être aujourd’hui' })).toBeInTheDocument()
    expect(screen.queryByText(/Pas encore d’avis|Votre journée/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Noter comment je me sens' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Noter' })).toBeNull()
    await loaded()
    expect(screen.getByRole('link', { name: /Agir/ })).toHaveAttribute('href', '/agir')
    // Plus de phrase de présentation (leçon 2 : aucun texte de remplissage)
    expect(screen.queryByText(/ce qui va avec vos bons et mauvais jours/i)).toBeNull()
    expect(screen.queryByText(/Pas et nuits/)).not.toBeInTheDocument()
  })

  it('Ma journée : le titre, puis le bandeau d’ajout ; ni bien-être du jour ni mesures (refonte étape 2)', async () => {
    renderDashboard('day')
    const title = screen.getByRole('heading', { level: 1, name: 'Ma journée' })
    const strip = screen.getByRole('region', { name: 'Ajouter' })
    expect(title.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await loaded()
    expect(screen.queryByRole('heading', { name: 'Bien-être aujourd’hui' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Vos données du jour' })).toBeNull()
    expect(screen.queryByRole('link', { name: /Agir/ })).toBeNull()
    fireEvent.click(within(strip).getByRole('button', { name: 'Bien-être' }))
    expect(screen.getByRole('dialog', { name: 'wellbeing-prompt-stub' })).toBeInTheDocument()
  })

  it('Ma journée : la checklist du jour avant le bandeau ; « Déjà noté » rouvre la note de bien-être (refonte étape 3)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const now = new Date()
    listEntries.mockResolvedValue([
      { id: 7, type: 'wellbeing', source: 'app_wellbeing', at: now.toISOString(), payload: { score: 3.75 } },
    ])
    renderDashboard('day')
    const list = await screen.findByRole('region', { name: 'À noter aujourd’hui' })
    const strip = screen.getByRole('region', { name: 'Ajouter' })
    expect(list.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Sans l'objectif digestion : les repas seulement, le bien-être est déjà noté, le ventre n'est pas demandé
    expect(within(list).getByText('Encore 1 chose aujourd’hui')).toBeInTheDocument()
    expect(within(list).getByRole('group', { name: 'Repas' })).toBeInTheDocument()
    expect(within(list).queryByRole('group', { name: 'Bien-être' })).toBeNull()
    expect(within(list).queryByRole('group', { name: /digestion/ })).toBeNull()
    expect(screen.queryByText('Mes repas du jour')).toBeNull()
    fireEvent.click(within(list).getByRole('button', { name: 'Déjà noté (1)' }))
    fireEvent.click(within(list).getByRole('button', { name: /Bien-être · 4 sur 5/ }))
    expect(screen.getByText('Édition de l’entrée 7')).toBeInTheDocument()
  })

  it('Ma journée : une habitude suivie se note par oui ou non, et la réponse se retire (refonte étape 4)', async () => {
    const { listEntries, createEntry, deleteEntry } = await import('../storage/localHealthStorage')
    localStorage.setItem('healthtrack_habits', JSON.stringify([{ id: 'reading' }]))
    const today = new Date()
    today.setHours(12, 1, 0, 0)
    const answered = { id: 9, type: 'habit', source: 'app_habit', at: today.toISOString(), payload: { habit: 'meditation', label: 'Méditation', done: true } }
    listEntries.mockResolvedValue([])
    createEntry.mockResolvedValue(1)
    deleteEntry.mockResolvedValue()
    try {
      const { unmount } = renderDashboard('day')
      const list = await screen.findByRole('region', { name: 'À noter aujourd’hui' })
      expect(screen.queryByRole('link', { name: 'Suivre une habitude' })).toBeNull()
      fireEvent.click(within(within(list).getByRole('group', { name: 'Lecture' })).getByRole('button', { name: 'Non' }))
      await waitFor(() => expect(createEntry).toHaveBeenCalled())
      expect(createEntry.mock.calls[0][0]).toMatchObject({ type: 'habit', source: 'app_habit', payload: { habit: 'reading', label: 'Lecture', done: false } })
      unmount()

      localStorage.setItem('healthtrack_habits', JSON.stringify([{ id: 'meditation' }]))
      listEntries.mockResolvedValue([answered])
      renderDashboard('day')
      const again = await screen.findByRole('region', { name: 'À noter aujourd’hui' })
      fireEvent.click(within(again).getByRole('button', { name: 'Déjà noté (1)' }))
      fireEvent.click(within(again).getByRole('button', { name: 'Méditation · oui, changer la réponse' }))
      await waitFor(() => expect(deleteEntry).toHaveBeenCalledWith(9))
    } finally {
      localStorage.removeItem('healthtrack_habits')
    }
  })

  it('Ma journée : « Hier » repose les habitudes d’hier sans réponse et les note pour la veille (REFONTE-7c-2)', async () => {
    const { listEntries, createEntry } = await import('../storage/localHealthStorage')
    localStorage.setItem('healthtrack_habits', JSON.stringify([{ id: 'reading' }]))
    const d = new Date()
    const before = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 2, 12, 4)
    listEntries.mockResolvedValue([{ id: 3, type: 'habit', source: 'app_habit', at: before.toISOString(), payload: { habit: 'reading', label: 'Lecture', done: true } }])
    createEntry.mockResolvedValue(1)
    try {
      renderDashboard('day')
      const card = await screen.findByRole('region', { name: /^Hier, / })
      expect(within(card).getByText('Une question, si vous voulez.')).toBeInTheDocument()
      fireEvent.click(within(card).getByRole('button', { name: 'Oui' }))
      await waitFor(() => expect(createEntry).toHaveBeenCalled())
      const y = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
      const at = new Date(createEntry.mock.calls.at(-1)[0].at)
      expect([at.getFullYear(), at.getMonth(), at.getDate()]).toEqual([y.getFullYear(), y.getMonth(), y.getDate()])
      expect(createEntry.mock.calls.at(-1)[0].payload).toMatchObject({ habit: 'reading', done: true })
    } finally {
      localStorage.removeItem('healthtrack_habits')
      localStorage.removeItem('healthtrack_yesterday_skipped')
    }
  })

  it('Ma journée : sans habitude suivie, un lien discret mène aux Réglages (refonte étape 4)', async () => {
    renderDashboard('day')
    expect(await screen.findByRole('link', { name: 'Suivre une habitude' })).toHaveAttribute('href', '/settings')
  })

  it('sans aucune donnée : pas de liens « … dans le Journal » (VC-26)', async () => {
    renderDashboard()
    await screen.findByRole('heading', { level: 2, name: 'Bien-être aujourd’hui' })
    expect(screen.queryByRole('link', { name: /dans le Journal/ })).not.toBeInTheDocument()
  })

  it('Accueil : les données du jour ; Ma journée : le bloc digestif, et « Repas » ouvre l’appareil photo puis les repas', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'gut' }))
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'steps', source: 'health_connect', at: new Date().toISOString(), payload: { value: 4321, period: 'day' } },
    ])
    const { unmount } = renderDashboard()
    // AUJ-3 : les données du jour en un bloc ; les sources une fois, en bas (ici, le téléphone seul)
    expect(await screen.findByRole('heading', { name: 'Vos données du jour' })).toBeInTheDocument()
    expect(screen.getByText('Pas').closest('li')).toHaveAttribute('data-tone', 'lilac')
    expect(screen.getByText('D’après votre téléphone.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ajouter un appareil/ })).toHaveAttribute('href', '/connectors')
    expect(screen.queryByTestId('digest-block')).toBeNull()
    expect(screen.queryByTestId('pistes-card')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Repas' })).toBeNull()
    unmount()
    renderDashboard('day')
    expect(await screen.findByTestId('digest-block')).toBeInTheDocument()
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

  it('objectif « énergie et sommeil » : ni bloc digestif ni « Digestion » dans le bandeau (refonte étape 1)', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'energy' }))
    renderDashboard()
    await screen.findByRole('heading', { name: 'Bien-être aujourd’hui' })
    expect(screen.queryByTestId('digest-block')).toBeNull()
    expect(screen.queryByTestId('gut-card')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Digestion' })).toBeNull()
    localStorage.removeItem('healthtrack_onboarding')
  })

  it('sans objectif : le ventre n’est pas demandé, sauf à qui l’a noté ces 7 derniers jours (refonte étape 1)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, endedBy: 'skipped' }))
    listEntries.mockResolvedValue([
      { id: 1, type: 'gut', source: 'app_gut', at: new Date(Date.now() - 9 * 86_400_000).toISOString(), payload: { level: 'calm' } },
    ])
    const { unmount } = renderDashboard('day')
    await loaded()
    await loaded()
    expect(screen.queryByTestId('digest-block')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Digestion' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Selles' })).toBeNull()
    unmount()
    listEntries.mockResolvedValue([
      { id: 1, type: 'gut', source: 'app_gut', at: new Date(Date.now() - 2 * 86_400_000).toISOString(), payload: { level: 'calm' } },
    ])
    renderDashboard('day')
    expect(await screen.findByTestId('digest-block')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Digestion' })).toBeInTheDocument()
    localStorage.removeItem('healthtrack_onboarding')
  })

  it('« Digestion » (bandeau) ouvre « Ma digestion » dans une fenêtre, sans carte « Ma digestion » sur l’écran (07/11)', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'gut' }))
    renderDashboard('day')
    await screen.findByTestId('digest-block')
    expect(screen.queryByTestId('gut-card')).not.toBeInTheDocument()
    expect(screen.queryByText('Ma digestion')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Digestion' }))
    const dialog = screen.getByRole('dialog', { name: 'Ma digestion' })
    expect(within(dialog).getByTestId('gut-card')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fermer' }))
    // AUJ-4 : « Noter ma digestion » du bloc ouvre la même fenêtre
    fireEvent.click(screen.getByRole('button', { name: 'Noter ma digestion' }))
    expect(screen.getByRole('dialog', { name: 'Ma digestion' })).toBeInTheDocument()
    localStorage.removeItem('healthtrack_onboarding')
  })

  it('AUJ-1b : « Selles » (bandeau) ouvre la photo des selles avec l’objectif digestion, jamais ailleurs', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'gut' }))
    const { unmount } = renderDashboard('day')
    fireEvent.click(await screen.findByRole('button', { name: 'Selles' }))
    const dialog = screen.getByRole('dialog', { name: 'Photo des selles' })
    expect(within(dialog).getByRole('button', { name: /Selles : estimer la forme avec une photo/ })).toBeInTheDocument()
    unmount()
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'energy' }))
    renderDashboard('day')
    await loaded()
    expect(screen.queryByRole('button', { name: 'Selles' })).toBeNull()
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
    renderDashboard('day')
    expect(screen.getByRole('button', { name: 'Repas' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Photo du repas' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ajouter une note' })).not.toBeInTheDocument()
  })

  it('« Bien-être » (bandeau) ouvre la note manuelle', async () => {
    renderDashboard('day')
    fireEvent.click(await screen.findByRole('button', { name: 'Bien-être' }))
    expect(screen.getByRole('dialog', { name: 'wellbeing-prompt-stub' })).toBeInTheDocument()
  })

  it('hides the cigarette quick-add button for a non-smoker (no recent cigarette)', async () => {
    localStorage.clear()
    renderDashboard('day')
    await waitFor(() => expect(screen.queryByText(/Chargement des données/i)).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /Ajouter une cigarette/i })).not.toBeInTheDocument()
  })

  it('shows the cigarette quick-add button once a recent cigarette is logged', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'cigarette', source: 'app_cigarette', at: new Date().toISOString(), payload: { count: 1 } },
    ])
    renderDashboard('day')
    expect(await screen.findByRole('button', { name: /Ajouter une cigarette/i })).toBeInTheDocument()
  })

  it('shows the cigarette quick-add button when pinned in Settings', async () => {
    localStorage.setItem('healthtrack_cigarette_counter', 'on')
    renderDashboard('day')
    expect(await screen.findByRole('button', { name: /Ajouter une cigarette/i })).toBeInTheDocument()
    localStorage.clear()
  })

  it('la note manuelle s’ouvre vierge et se ferme', async () => {
    renderDashboard('day')
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

  it('CYCLE-2 : « Règles » dans le bandeau avec « Mon cycle », ou dès qu’une donnée de cycle existe', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const { unmount } = renderDashboard('day')
    await loaded()
    expect(screen.queryByRole('button', { name: 'Règles' })).toBeNull()
    unmount()
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['cycle'] }))
    const second = renderDashboard('day')
    expect(await screen.findByRole('button', { name: 'Règles' })).toBeInTheDocument()
    second.unmount()
    localStorage.removeItem('healthtrack_onboarding')
    listEntries.mockImplementation(async (opts = {}) => (opts.type === 'cycle'
      ? [{ id: 1, type: 'cycle', source: 'app_cycle', at: new Date().toISOString(), payload: { subtype: 'period', flow: 'light' } }]
      : []))
    renderDashboard('day')
    expect(await screen.findByRole('button', { name: 'Règles' })).toBeInTheDocument()
  })
})
