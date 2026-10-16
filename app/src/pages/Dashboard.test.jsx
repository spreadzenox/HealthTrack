import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
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
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
  })

  it('renders dashboard title and, without any data, the introduction', async () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /Tableau de bord/i })).toBeInTheDocument()
    expect(await screen.findByText(/HealthTrack centralise/i)).toBeInTheDocument()
    expect(screen.getByText(/montre ou bague connectée/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Connecteurs/i })).toHaveAttribute('href', '/connectors')
  })

  it("masque l'introduction dès que des données existent (le contenu commence plus haut)", async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: new Date().toISOString(), payload: { score: 3 } },
    ])
    renderDashboard()
    await screen.findByText(/Vos derniers jours/i)
    await screen.findAllByText(/3 \/ 5/)
    expect(screen.queryByText(/HealthTrack centralise/i)).not.toBeInTheDocument()
  })

  it("n'affiche pas l'introduction pendant le chargement (pas de saut de mise en page)", () => {
    renderDashboard()
    expect(screen.queryByText(/HealthTrack centralise/i)).not.toBeInTheDocument()
  })

  it('loads the last two weeks of entries from local storage on mount', async () => {
    renderDashboard()
    await screen.findByText(/Vos derniers jours/i)
    const { listEntries } = await import('../storage/localHealthStorage')
    const [opts] = listEntries.mock.calls[0]
    expect(opts.limit).toBeGreaterThanOrEqual(1000)
    const since = new Date(opts.since)
    const days = (Date.now() - since.getTime()) / 86400000
    expect(days).toBeGreaterThan(12)
    expect(days).toBeLessThan(15)
  })

  it('falls back to the 30 latest entries when nothing is recent', async () => {
    renderDashboard()
    await screen.findByText(/Vos derniers jours/i)
    const { listEntries } = await import('../storage/localHealthStorage')
    await waitFor(() => expect(listEntries).toHaveBeenCalledWith({ limit: 30 }))
  })

  it('shows empty hint when no entries', async () => {
    renderDashboard()
    await screen.findByText(/Vos derniers jours/i)
    expect(screen.getByText(/Aucune donnée/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Enregistrez un repas/i })).toHaveAttribute('href', '/food')
  })

  async function renderEntries(entries) {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValueOnce(entries.map((e, i) => ({ id: i + 1, created_at: '', ...e })))
    renderDashboard()
    return screen.findAllByRole('listitem')
  }

  function summaryValue(label) {
    const term = screen.getByText(label, { selector: 'dt' })
    return term.nextElementSibling.textContent
  }

  it('groups entries by day, most recent first, with the date in French', async () => {
    await renderEntries([
      { type: 'cigarette', source: 'app_cigarette', at: '2026-04-11T10:00:00', payload: { count: 1 } },
      { type: 'cigarette', source: 'app_cigarette', at: '2026-04-10T15:00:00', payload: { count: 1 } },
    ])
    const titles = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)
    expect(titles[0]).toMatch(/11 avril/)
    expect(titles[1]).toMatch(/10 avril/)
    expect(titles[0]).toMatch(/^Samedi/)
  })

  it('shows food entries when returned', async () => {
    await renderEntries([
      { type: 'food', source: 'app_food', at: '2025-03-01T12:00:00Z', payload: { items: [{ ingredient: 'rice', quantity: '1 cup' }] } },
    ])
    expect(screen.getByText(/rice/)).toBeInTheDocument()
    expect(screen.getByText(/1 cup/)).toBeInTheDocument()
    expect(summaryValue('Repas')).toBe('1')
  })

  it('groups the cigarettes of a day into one row listing their times (no row per cigarette)', async () => {
    await renderEntries([
      { type: 'cigarette', source: 'app_cigarette', at: '2026-04-10T15:00:00', payload: { count: 1 } },
      { type: 'cigarette', source: 'app_cigarette', at: '2026-04-10T11:30:00', payload: { count: 1 } },
      { type: 'cigarette', source: 'app_cigarette', at: '2026-04-10T09:05:00', payload: { count: 2 } },
    ])
    expect(summaryValue('Cigarettes')).toBe('4')
    const rows = document.querySelectorAll('.entry-card[data-type="cigarette"]')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('Cigarettes')
    expect(rows[0]).toHaveTextContent('09:05 ×2 · 11:30 · 15:00')
    // Une seule action : retirer la dernière notée (celle de 15:00, id 1)
    expect(within(rows[0]).getAllByRole('button')).toHaveLength(1)
    fireEvent.click(within(rows[0]).getByRole('button', { name: 'Supprimer la dernière cigarette (15:00)' }))
    fireEvent.click(within(rows[0]).getByRole('button', { name: 'Confirmer' }))
    const { deleteEntry } = await import('../storage/localHealthStorage')
    await waitFor(() => expect(deleteEntry).toHaveBeenCalledWith(1))
  })

  it('keeps a single cigarette as a plain row with its delete button', async () => {
    await renderEntries([
      { type: 'cigarette', source: 'app_cigarette', at: '2026-04-10T15:00:00', payload: { count: 1 } },
    ])
    const rows = document.querySelectorAll('.entry-card[data-type="cigarette"]')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('15:00')
    expect(within(rows[0]).getByRole('button', { name: 'Supprimer cette cigarette' })).toBeInTheDocument()
  })

  it('ne répète pas le tag « Écran tard » un jour où le téléphone a mesuré l’écran', async () => {
    await renderEntries([
      { type: 'wellbeing', source: 'app_wellbeing', at: '2026-04-10T21:30:00', payload: { score: 3, tags: ['late_screen', 'alcohol'] } },
      { type: 'phone_usage', source: 'phone_usage', at: '2026-04-10T12:00:00', payload: { date: '2026-04-10', screenMinutes: 200 } },
    ])
    const row = document.querySelector('.entry-card[data-type="wellbeing"]')
    expect(row).not.toHaveTextContent('Écran tard')
    expect(row).toHaveTextContent('Alcool')
  })

  it('garde le tag « Écran tard » déclaré un jour sans mesure de l’écran', async () => {
    await renderEntries([
      { type: 'wellbeing', source: 'app_wellbeing', at: '2026-04-10T21:30:00', payload: { score: 3, tags: ['late_screen'] } },
    ])
    expect(document.querySelector('.entry-card[data-type="wellbeing"]')).toHaveTextContent('Écran tard')
  })

  it('shows wellbeing score in the entry and the day summary', async () => {
    await renderEntries([
      { type: 'wellbeing', source: 'app_wellbeing', at: '2026-04-10T09:00:00', payload: { score: 4 } },
    ])
    expect(screen.getByText(/Note :/)).toHaveTextContent('Note : 4 / 5')
    expect(summaryValue('Bien-être')).toBe('4 / 5')
  })

  it('shows behaviour tags of a wellbeing entry in French', async () => {
    await renderEntries([
      { type: 'wellbeing', source: 'app_wellbeing', at: '2026-04-10T21:00:00', payload: { score: 3, tags: ['alcohol', 'late_screen', 'unknown_tag'] } },
    ])
    const row = document.querySelector('.entry-card[data-type="wellbeing"]')
    expect(row).toHaveTextContent('Alcool')
    expect(row).toHaveTextContent('Écran tard')
    expect(row).not.toHaveTextContent('unknown_tag')
  })

  it('summarises the night on the wake-up day, in hours', async () => {
    await renderEntries([
      { type: 'sleep', source: 'health_connect', at: '2026-04-10T23:00:00', payload: { durationMinutes: 390, sleepState: 'asleep' } },
    ])
    expect(summaryValue('Sommeil')).toBe('6 h 30')
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('11 avril')
    expect(document.querySelector('.entry-card')).toBeNull()
  })

  it('summarises watch measurements instead of listing one card per sample', async () => {
    await renderEntries([
      { type: 'steps', source: 'health_connect', at: '2026-04-10T00:00:00', payload: { value: 8200, period: 'day' } },
      { type: 'calories', source: 'health_connect', at: '2026-04-10T00:00:00', payload: { value: 2233, period: 'day' } },
      { type: 'heart_rate', source: 'health_connect', at: '2026-04-10T09:00:00', payload: { bpm: 82 } },
      { type: 'heart_rate', source: 'health_connect', at: '2026-04-10T14:00:00', payload: { bpm: 76, subtype: 'heartRate' } },
      { type: 'heart_rate', source: 'health_connect', at: '2026-04-10T07:00:00', payload: { bpm: 58, unit: 'bpm', subtype: 'restingHeartRate' } },
      { type: 'heart_rate', source: 'health_connect', at: '2026-04-10T06:30:00', payload: { value: 46, unit: 'millisecond', subtype: 'heartRateVariability' } },
      { type: 'heart_rate', source: 'health_connect', at: '2026-04-10T06:31:00', payload: { value: 97, unit: 'percent', subtype: 'oxygenSaturation' } },
    ])
    expect(summaryValue('Pas')).toMatch(/^8\s200$/)
    expect(summaryValue('Dépense')).toMatch(/^2\s233 kcal$/)
    expect(summaryValue('FC')).toBe('76 à 82 bpm')
    expect(summaryValue('FC au repos')).toBe('58 bpm')
    expect(summaryValue('VFC')).toBe('46 ms')
    expect(summaryValue('SpO₂')).toBe('97 %')
    expect(document.querySelector('.entry-card')).toBeNull()
    expect(document.body).not.toHaveTextContent('millisecond')
    expect(document.body).not.toHaveTextContent('percent')
  })

  it('shows a Withings weight in kg instead of raw data', async () => {
    await renderEntries([{ type: 'weight', source: 'withings', at: '2026-04-10T07:30:00', payload: { valueKg: 77.2, deviceid: 'abc123', model: 'Body Scan' } }])
    const row = document.querySelector('.entry-card')
    expect(row).toHaveTextContent('Poids')
    expect(row).toHaveTextContent('77,2 kg')
    expect(row).toHaveTextContent('Withings')
    expect(row).not.toHaveTextContent('deviceid')
  })

  it('summarises a body composition measurement in French', async () => {
    await renderEntries([{ type: 'body_composition', source: 'withings', at: '2026-04-10T07:30:00', payload: { valueKg: 77.2, fatRatioPct: 24.1, muscleMassKg: 32.4, deviceid: 'abc123' } }])
    const row = document.querySelector('.entry-card')
    expect(row).toHaveTextContent('Pesée')
    expect(row).toHaveTextContent('Masse grasse 24,1 %')
    expect(row).toHaveTextContent('Muscles 32,4 kg')
    expect(row).not.toHaveTextContent('deviceid')
  })

  it('affiche une seule carte « Pesée » pour le poids et la composition d’une même pesée', async () => {
    const body = { valueKg: 77.2, fatRatioPct: 24.1 }
    await renderEntries([
      { type: 'weight', source: 'withings', at: '2026-04-10T07:30:00', payload: body },
      { type: 'body_composition', source: 'withings', at: '2026-04-10T07:30:00', payload: body },
    ])
    const rows = document.querySelectorAll('.entry-card')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('Pesée')
    expect(rows[0]).toHaveTextContent('77,2 kg · Masse grasse 24,1 %')
  })

  it('shows height in cm', async () => {
    await renderEntries([{ type: 'height', source: 'withings', at: '2026-04-10T07:30:00', payload: { valueCm: 170 } }])
    const row = document.querySelector('.entry-card')
    expect(row).toHaveTextContent('Taille')
    expect(row).toHaveTextContent('170 cm')
  })

  it('translates the workout type of an activity', async () => {
    await renderEntries([{ type: 'activity', source: 'health_connect', at: '2026-04-10T18:00:00', payload: { workoutType: 'cycling', durationSeconds: 3360, totalCalories: 329 } }])
    const row = document.querySelector('.entry-card')
    expect(row).toHaveTextContent('Vélo — 56 min — 329 kcal')
    expect(row).not.toHaveTextContent('cycling')
  })

  it('shows 3 days first, then older days on demand', async () => {
    await renderEntries(
      [10, 9, 8, 7, 6].map((d) => ({ type: 'cigarette', source: 'app_cigarette', at: `2026-04-${String(d).padStart(2, '0')}T10:00:00`, payload: { count: 1 } })),
    )
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: /Voir les jours précédents/i }))
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(5)
    expect(screen.queryByRole('button', { name: /Voir les jours précédents/i })).not.toBeInTheDocument()
  })

  it('renders the "Ajouter un bien-être" button', async () => {
    renderDashboard()
    const btn = screen.getByRole('button', { name: /Ajouter un bien-être/i })
    expect(btn).toBeInTheDocument()
  })

  it('hides the cigarette quick-add button for a non-smoker (no recent cigarette)', async () => {
    localStorage.clear()
    renderDashboard()
    await screen.findByRole('button', { name: /Ajouter un bien-être/i })
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
    const btn = screen.getByRole('button', { name: /Ajouter un bien-être/i })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the wellbeing modal when onClose is called', async () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un bien-être/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Fermer/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('reloads entries when health-entries-updated event fires', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    renderDashboard()
    await screen.findByText(/Vos derniers jours/i)
    const callsBefore = listEntries.mock.calls.length

    listEntries.mockResolvedValueOnce([
      {
        id: 3,
        type: 'wellbeing',
        source: 'app_wellbeing',
        at: '2026-04-11T10:00:00',
        payload: { score: 5 },
        created_at: '',
      },
    ])
    window.dispatchEvent(new CustomEvent('health-entries-updated'))

    await waitFor(() => {
      expect(listEntries.mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })

  it('propose de supprimer une saisie de l’app, pas une donnée synchronisée', async () => {
    const { listEntries, deleteEntry } = await import('../storage/localHealthStorage')
    deleteEntry.mockResolvedValue()
    const cig = { id: 1, type: 'cigarette', source: 'app_cigarette', at: '2026-04-11T10:00:00', payload: { count: 1 } }
    const hr = { id: 2, type: 'heart_rate', source: 'health_connect', at: '2026-04-11T09:00:00', payload: { bpm: 70 } }
    listEntries.mockResolvedValue([cig, hr])
    renderDashboard()
    const buttons = await screen.findAllByRole('button', { name: /^Supprimer/ })
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName(/cette cigarette/i)

    listEntries.mockResolvedValue([hr])
    fireEvent.click(buttons[0])
    fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }))
    await waitFor(() => expect(deleteEntry).toHaveBeenCalledWith(1))
    await waitFor(() => expect(screen.queryByText('Cigarette')).not.toBeInTheDocument())
  })

  it('affiche les ingrédients d’un repas à la française (« nom : 150 g »)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 5, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00', payload: { items: [{ ingredient: 'Riz', quantity: '150 g' }] } },
    ])
    renderDashboard()
    expect(await screen.findByText('Riz : 150 g')).toBeInTheDocument()
  })

  it('met les aliments d’un repas à la suite, comme la page Repas (D1)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 6, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00', payload: { items: [{ ingredient: 'Riz', quantity: '150 g' }, { ingredient: 'Saumon', quantity: '130 g' }] } },
    ])
    renderDashboard()
    const item = await screen.findByText('Riz : 150 g')
    expect(item.closest('ul')).toHaveClass('inline-list')
  })

  it('raccourcit les noms d’aliments Ciqual (nom complet en infobulle)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const name = "Poulet, cuisse, viande bouillie/cuite à l'eau"
    listEntries.mockResolvedValue([
      { id: 7, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00', payload: { items: [{ ingredient: name, quantity: '150 g' }] } },
    ])
    renderDashboard()
    const item = await screen.findByText('Poulet, cuisse : 150 g')
    expect(item).toHaveAttribute('title', name)
  })

  it('affiche les kcal et le nom du plat sur la ligne du repas', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      {
        id: 6, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00',
        payload: { dish: 'Riz au poulet', items: [{ ingredient: 'Riz blanc cuit', quantity: '200 g', quantity_g: 200 }] },
      },
    ])
    renderDashboard()
    const card = (await screen.findByText('Riz au poulet')).closest('.entry-card')
    expect(card.textContent).toMatch(/≈\s?\d+\s?kcal/)
  })

  it('propose de modifier une note de bien-être de l’app', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const wb = { id: 11, type: 'wellbeing', source: 'app_wellbeing', at: '2026-04-11T10:00:00', payload: { score: 3 } }
    const synced = { id: 13, type: 'wellbeing', source: 'health_connect', at: '2026-04-11T11:00:00', payload: { score: 4 } }
    listEntries.mockResolvedValue([wb, synced])
    renderDashboard()
    const buttons = await screen.findAllByRole('button', { name: /^Modifier/ })
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName(/cette note de bien-être/i)
    fireEvent.click(buttons[0])
    expect(screen.getByRole('dialog')).toHaveTextContent('Édition de l’entrée 11')
    fireEvent.click(screen.getByRole('button', { name: /Fermer/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('le bouton « Ajouter un bien-être » ouvre une note vierge', async () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un bien-être/i }))
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Édition')
  })

  it('modifie un repas sur place, sans quitter le tableau de bord', async () => {
    const { listEntries, updateEntry } = await import('../storage/localHealthStorage')
    const food = {
      id: 12, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00',
      payload: { dish: 'Riz', items: [{ ingredient: 'Riz blanc cuit', quantity: '150 g', quantity_g: 150 }] },
    }
    listEntries.mockResolvedValue([food])
    updateEntry.mockResolvedValue(undefined)
    renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier ce repas' }))
    expect(screen.getByLabelText('Heure du repas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByLabelText('Heure du repas')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Modifier ce repas' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))
    await waitFor(() => expect(updateEntry).toHaveBeenCalledWith(12, expect.objectContaining({ payload: expect.any(Object) })))
    await waitFor(() => expect(screen.queryByLabelText('Heure du repas')).not.toBeInTheDocument())
  })

  it('« Refaire » ouvre la page Repas pré-remplie avec ce repas', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const items = [{ ingredient: 'Riz blanc cuit', quantity: '150 g', quantity_g: 150 }]
    listEntries.mockResolvedValue([
      { id: 12, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00', payload: { dish: 'Riz', items } },
    ])
    navigateMock.mockClear()
    renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Refaire ce repas' }))
    expect(navigateMock).toHaveBeenCalledWith('/food', { state: { redoMeal: { dish: 'Riz', items } } })
  })

  it('pas de « Modifier » ni « Refaire » sur un repas importé d’une autre source sans aliments', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 14, type: 'food', source: 'health_connect', at: '2026-04-11T12:00:00', payload: { dish: 'Déjeuner' } },
    ])
    renderDashboard()
    await screen.findByText(/Vos derniers jours/i)
    await screen.findAllByText(/Déjeuner/)
    expect(screen.queryByRole('button', { name: 'Modifier ce repas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Refaire ce repas' })).not.toBeInTheDocument()
  })
})
