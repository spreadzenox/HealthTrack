import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Journal from './Journal'

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

function renderJournal() {
  return render(
    <BrowserRouter>
      <Journal />
    </BrowserRouter>
  )
}

/** Déplie le « ⋯ » de chaque saisie (POL-PLAY-27). */
function openActions() {
  screen.queryAllByRole('button', { name: /^Actions pour/ }).forEach((b) => fireEvent.click(b))
}

describe('Journal — « Vos derniers jours » (déplacé de l’accueil, jalon 2c-2)', () => {
  beforeEach(async () => {
    const { listEntries, countEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
    countEntries.mockResolvedValue(0)
  })

  function sinceDays(opts) {
    return (Date.now() - new Date(opts.since).getTime()) / 86400000
  }

  it("ne lit d'emblée que les 3 jours affichés (pas les 14 jours de mesures de la montre)", async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockClear()
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: new Date().toISOString(), payload: { score: 3 } },
    ])
    renderJournal()
    await screen.findByText(/Vos derniers jours/i)
    await waitFor(() => expect(document.querySelector('.entry-score')).toBeInTheDocument())
    // Les autres lectures de la page (cartes de forme) visent un type ; celle du journal non
    const journalReads = listEntries.mock.calls.filter(([o]) => !o?.type)
    expect(journalReads).toHaveLength(1)
    const [opts] = journalReads[0]
    expect(opts.limit).toBeGreaterThanOrEqual(1000)
    expect(sinceDays(opts)).toBeGreaterThan(3)
    expect(sinceDays(opts)).toBeLessThan(4)
    expect(screen.queryByRole('button', { name: /Voir les jours précédents/i })).not.toBeInTheDocument()
  })

  it('lit aussi la veille du premier jour affiché : sa nuit commencée la veille au soir y figure, pas la veille elle-même', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockClear()
    const d = new Date()
    const at = (back, h) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - back, h).toISOString()
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 2, 7).toISOString()
    listEntries.mockResolvedValue([
      { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: at(0, 1), payload: { score: 3 } },
      { id: 2, type: 'sleep', source: 'huawei_watch', at: at(3, 23), payload: { durationMinutes: 480, endDate: end } },
      { id: 3, type: 'wellbeing', source: 'app_wellbeing', at: at(3, 12), payload: { score: 4 } },
    ])
    renderJournal()
    await screen.findByText(/Vos derniers jours/i)
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(2))
    const [opts] = listEntries.mock.calls.filter(([o]) => !o?.type)[0]
    expect(sinceDays(opts)).toBeGreaterThan(3)
    expect(sinceDays(opts)).toBeLessThan(4)
    expect(screen.getByText('8 h', { exact: false })).toBeInTheDocument()
    expect(document.querySelectorAll('.entry-score')).toHaveLength(1)
  })

  it('charge les deux semaines au premier « Voir les jours précédents » quand des jours plus anciens existent', async () => {
    const { listEntries, countEntries } = await import('../storage/localHealthStorage')
    const today = { id: 1, type: 'wellbeing', source: 'app_wellbeing', at: new Date().toISOString(), payload: { score: 3 } }
    const old = { id: 2, type: 'wellbeing', source: 'app_wellbeing', at: new Date(Date.now() - 6 * 86400000).toISOString(), payload: { score: 4 } }
    listEntries.mockClear()
    countEntries.mockClear()
    listEntries.mockResolvedValueOnce([today]).mockResolvedValue([today, old])
    countEntries.mockResolvedValue(5)
    renderJournal()
    const more = await screen.findByRole('button', { name: /Voir les jours précédents/i })
    const [countOpts] = countEntries.mock.calls[0]
    expect(sinceDays(countOpts)).toBeGreaterThan(14)
    expect(sinceDays(countOpts)).toBeLessThan(15)
    // Jusqu'à la veille du premier jour affiché (incluse)
    expect(sinceDays({ since: countOpts.until })).toBeGreaterThan(2)
    expect(sinceDays({ since: countOpts.until })).toBeLessThan(3)
    const journalReads = () => listEntries.mock.calls.filter(([o]) => !o?.type)
    fireEvent.click(more)
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(2))
    const [opts] = journalReads()[1]
    expect(sinceDays(opts)).toBeGreaterThan(14)
    expect(sinceDays(opts)).toBeLessThan(15)
    expect(screen.queryByRole('button', { name: /Voir les jours précédents/i })).not.toBeInTheDocument()
  })

  it('sans rien depuis 3 jours : lit les deux semaines, puis les 30 dernières entrées', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockClear()
    renderJournal()
    await screen.findByText(/Vos derniers jours/i)
    await waitFor(() => expect(listEntries).toHaveBeenCalledWith({ limit: 30 }))
    expect(sinceDays(listEntries.mock.calls.filter(([o]) => !o?.type)[1][0])).toBeGreaterThan(13)
  })

  it('falls back to the 30 latest entries when nothing is recent', async () => {
    renderJournal()
    await screen.findByText(/Vos derniers jours/i)
    const { listEntries } = await import('../storage/localHealthStorage')
    await waitFor(() => expect(listEntries).toHaveBeenCalledWith({ limit: 30 }))
  })

  it('shows empty hint when no entries', async () => {
    renderJournal()
    await screen.findByText(/Vos derniers jours/i)
    expect(await screen.findByText('Rien de noté pour l’instant')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Photographier un repas/i })).toHaveAttribute('href', '/food')
  })

  async function renderEntries(entries) {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValueOnce(entries.map((e, i) => ({ id: i + 1, created_at: '', ...e })))
    renderJournal()
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

  it('liste une note du ventre avec son niveau, supprimable', async () => {
    await renderEntries([{ type: 'gut', source: 'app_gut', at: '2026-04-11T10:00:00', payload: { level: 'discomfort' } }])
    expect(screen.getByText('Ventre')).toBeInTheDocument()
    expect(screen.getByText('Gêne')).toBeInTheDocument()
    openActions()
    expect(screen.getByRole('button', { name: /Supprimer cette note du ventre/i })).toBeInTheDocument()
  })

  it('liste une note des selles avec sa forme (et son type), supprimable (I176)', async () => {
    await renderEntries([{ type: 'stool', source: 'app_stool', at: '2026-04-11T10:00:00', payload: { form: 'hard', bristol: 2 } }])
    expect(screen.getByText('Selles')).toBeInTheDocument()
    expect(screen.getByText('Dures · type 2')).toBeInTheDocument()
    openActions()
    expect(screen.getByRole('button', { name: /Supprimer cette note des selles/i })).toBeInTheDocument()
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
    // Le total est dans l'en-tête de la ligne, plus dans une tuile du résumé qui le répétait
    expect(screen.queryByText('Cigarettes', { selector: 'dt' })).not.toBeInTheDocument()
    const rows = document.querySelectorAll('.entry-card[data-type="cigarette"]')
    expect(rows).toHaveLength(1)
    expect(rows[0].querySelector('.entry-card-header')).toHaveTextContent('Cigarettes4')
    expect(rows[0]).toHaveTextContent('09:05 ×2 · 11:30 · 15:00')
    // Une seule action, repliée derrière « ⋯ » : retirer la dernière notée (celle de 15:00, id 1)
    expect(within(rows[0]).getAllByRole('button')).toHaveLength(1)
    fireEvent.click(within(rows[0]).getByRole('button', { name: 'Actions pour ces cigarettes' }))
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
    openActions()
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

  it('shows a single wellbeing score once, in the entry header (no repeated summary tile)', async () => {
    await renderEntries([
      { type: 'wellbeing', source: 'app_wellbeing', at: '2026-04-10T09:00:00', payload: { score: 4 } },
    ])
    const row = document.querySelector('.entry-card[data-type="wellbeing"]')
    expect(row.querySelector('.entry-card-header')).toHaveTextContent('09:00Bien-être4 / 5')
    expect(row).not.toHaveTextContent('Note :')
    openActions()
    expect(within(row).getByRole('button', { name: /Modifier/ })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: /Supprimer/ })).toBeInTheDocument()
    expect(screen.queryByText('Bien-être', { selector: 'dt' })).not.toBeInTheDocument()
  })

  it('keeps the wellbeing average tile when a day has several notes', async () => {
    await renderEntries([
      { type: 'wellbeing', source: 'app_wellbeing', at: '2026-04-10T09:00:00', payload: { score: 4 } },
      { type: 'wellbeing', source: 'app_wellbeing', at: '2026-04-10T21:00:00', payload: { score: 2 } },
    ])
    expect(summaryValue('Bien-être')).toBe('3 / 5')
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
    expect(summaryValue('VFC nuit')).toBe('46 ms')
    expect(summaryValue('SpO₂')).toBe('97 %')
    expect(document.querySelector('.entry-card')).toBeNull()
    expect(document.body).not.toHaveTextContent('millisecond')
    expect(document.body).not.toHaveTextContent('percent')
  })

  it('colore chaque mesure du jour selon son thème (POL-6) : corps en menthe, repas en pêche, activité en lilas', async () => {
    await renderEntries([
      { type: 'steps', source: 'health_connect', at: '2026-04-10T00:00:00', payload: { value: 8200, period: 'day' } },
      { type: 'sleep', source: 'health_connect', at: '2026-04-09T23:00:00', payload: { durationMinutes: 420, sleepState: 'asleep' } },
      { type: 'food', source: 'app_food', at: '2026-04-10T12:00:00', payload: { dish: 'Salade', items: [] } },
      { type: 'phone_usage', source: 'phone', at: '2026-04-10T23:00:00', payload: { screenMinutes: 120 } },
    ])
    const themeOf = (label) => screen.getByText(label, { selector: 'dt' }).parentElement.dataset.theme
    expect(themeOf('Sommeil')).toBe('mint')
    expect(themeOf('Pas')).toBe('lilac')
    expect(themeOf('Repas')).toBe('peach')
    expect(document.querySelector('.entry-card[data-type="food"]')).toBeInTheDocument()
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
    expect(row).toHaveTextContent('Vélo · 56 min · 329 kcal')
    expect(row).not.toHaveTextContent('cycling')
  })

  it('séance de la montre : FC moyenne, allure et courbe de FC (M7)', async () => {
    await renderEntries([{ type: 'activity', source: 'huawei_watch', at: '2026-04-10T18:00:00', payload: { workoutType: 'running', durationSeconds: 1800, avgHeartRate: 142, heartRateCurve: { stepSeconds: 60, bpm: [120, null, 150, 148] }, paceSplitsSecPerKm: [330, 318] } }])
    const row = document.querySelector('.entry-card')
    expect(row).toHaveTextContent('FC moy. 142 bpm · 5:24 /km')
    expect(row.querySelector('svg[aria-label="Fréquence cardiaque de 120 à 150 bpm"]')).not.toBeNull()
  })

  it('shows 3 days first, then older days on demand', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue(
      [10, 9, 8, 7, 6].map((d, i) => ({ id: i + 1, created_at: '', type: 'cigarette', source: 'app_cigarette', at: `2026-04-${String(d).padStart(2, '0')}T10:00:00`, payload: { count: 1 } })),
    )
    await renderEntries(
      [10, 9, 8, 7, 6].map((d) => ({ type: 'cigarette', source: 'app_cigarette', at: `2026-04-${String(d).padStart(2, '0')}T10:00:00`, payload: { count: 1 } })),
    )
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: /Voir les jours précédents/i }))
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(5)
    expect(screen.queryByRole('button', { name: /Voir les jours précédents/i })).not.toBeInTheDocument()
  })

  it('reloads entries when health-entries-updated event fires', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    renderJournal()
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
    renderJournal()
    await screen.findAllByRole('button', { name: /^Actions pour/ })
    expect(screen.getAllByRole('button', { name: /^Actions pour/ })).toHaveLength(1)
    openActions()
    const buttons = screen.getAllByRole('button', { name: /^Supprimer/ })
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
    renderJournal()
    const item = (await screen.findByText('Riz')).closest('li')
    expect(item).toHaveTextContent('Riz150 g')
    expect(item.querySelector('.meal-item-qty')).toHaveTextContent('150 g')
  })

  it('un aliment par ligne, quantité à droite : plus de « · » orphelin en fin de ligne (comme la page Repas)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 6, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00', payload: { items: [{ ingredient: 'Riz', quantity: '150 g' }, { ingredient: 'Saumon', quantity: '130 g' }] } },
    ])
    renderJournal()
    const list = (await screen.findByText('Riz')).closest('ul')
    expect(list).toHaveClass('meal-item-list')
    expect(list).not.toHaveClass('inline-list')
    expect(list.querySelectorAll('li')).toHaveLength(2)
  })

  it('raccourcit les noms d’aliments Ciqual (nom complet en infobulle)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const name = "Poulet, cuisse, viande bouillie/cuite à l'eau"
    listEntries.mockResolvedValue([
      { id: 7, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00', payload: { items: [{ ingredient: name, quantity: '150 g' }] } },
    ])
    renderJournal()
    const item = (await screen.findByText('Poulet, cuisse')).closest('li')
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
    renderJournal()
    const card = (await screen.findByText('Riz au poulet')).closest('.entry-card')
    expect(card.textContent).toMatch(/≈\s?\d+\s?kcal/)
  })

  it('propose de modifier une note de bien-être de l’app', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const wb = { id: 11, type: 'wellbeing', source: 'app_wellbeing', at: '2026-04-11T10:00:00', payload: { score: 3 } }
    const synced = { id: 13, type: 'wellbeing', source: 'health_connect', at: '2026-04-11T11:00:00', payload: { score: 4 } }
    listEntries.mockResolvedValue([wb, synced])
    renderJournal()
    await screen.findAllByRole('button', { name: /^Actions pour/ })
    openActions()
    const buttons = screen.getAllByRole('button', { name: /^Modifier/ })
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName(/cette note de bien-être/i)
    fireEvent.click(buttons[0])
    expect(screen.getByRole('dialog')).toHaveTextContent('Édition de l’entrée 11')
    fireEvent.click(screen.getByRole('button', { name: /Fermer/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('modifie un repas sur place, sans quitter le journal', async () => {
    const { listEntries, updateEntry } = await import('../storage/localHealthStorage')
    const food = {
      id: 12, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00',
      payload: { dish: 'Riz', items: [{ ingredient: 'Riz blanc cuit', quantity: '150 g', quantity_g: 150 }] },
    }
    listEntries.mockResolvedValue([food])
    updateEntry.mockResolvedValue(undefined)
    renderJournal()
    fireEvent.click(await screen.findByRole('button', { name: 'Actions pour ce repas' }))
    fireEvent.click(screen.getByRole('button', { name: 'Modifier ce repas' }))
    expect(screen.getByLabelText('Heure du repas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByLabelText('Heure du repas')).not.toBeInTheDocument()
    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'Modifier ce repas' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
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
    renderJournal()
    fireEvent.click(await screen.findByRole('button', { name: 'Actions pour ce repas' }))
    fireEvent.click(screen.getByRole('button', { name: 'Refaire ce repas' }))
    expect(navigateMock).toHaveBeenCalledWith('/food', { state: { redoMeal: { dish: 'Riz', items } } })
  })

  it('pas de « Modifier » ni « Refaire » sur un repas importé d’une autre source sans aliments', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 14, type: 'food', source: 'health_connect', at: '2026-04-11T12:00:00', payload: { dish: 'Déjeuner' } },
    ])
    renderJournal()
    await screen.findByText(/Vos derniers jours/i)
    await screen.findAllByText(/Déjeuner/)
    expect(screen.queryByRole('button', { name: 'Modifier ce repas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Refaire ce repas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Actions pour/ })).not.toBeInTheDocument()
  })

  it('replie Refaire · Modifier · Supprimer derrière un seul « ⋯ » par saisie (POL-PLAY-27)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 12, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00', payload: { dish: 'Riz', items: [{ ingredient: 'Riz blanc cuit', quantity: '150 g' }] } },
      { id: 13, type: 'gut', source: 'app_gut', at: '2026-04-11T15:00:00', payload: { level: 'calm' } },
    ])
    renderJournal()
    const toggle = await screen.findByRole('button', { name: 'Actions pour ce repas' })
    expect(screen.queryByRole('button', { name: /^(Refaire|Modifier|Supprimer) / })).not.toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Refaire ce repas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supprimer ce repas' })).toBeInTheDocument()
    // Seule la saisie touchée s'ouvre
    expect(screen.queryByRole('button', { name: /Supprimer cette note du ventre/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fermer les actions de ce repas' }))
    expect(screen.queryByRole('button', { name: 'Refaire ce repas' })).not.toBeInTheDocument()
  })
})
