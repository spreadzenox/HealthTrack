import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import Food from './Food'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
  createEntry: vi.fn(),
  deleteEntry: vi.fn(),
  updateEntry: vi.fn(),
}))

/** POL-PLAY-50 : « Refaire · Modifier · Supprimer » d'un repas sont repliés derrière « ⋯ ». */
function openMealActions() {
  screen.queryAllByRole('button', { name: 'Actions pour ce repas' }).forEach((b) => fireEvent.click(b))
}
function mealAction(name) {
  openMealActions()
  return screen.getByRole('button', { name })
}
async function findMealAction(name) {
  await screen.findAllByRole('button', { name: 'Actions pour ce repas' })
  return mealAction(name)
}

describe('Food', () => {
  beforeEach(async () => {
    globalThis.fetch = vi.fn()
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
  })

  it('renders food page title', () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    // POL-PLAY-35 : le titre ne répète pas le sous-onglet « Repas », comme « Vos derniers jours » et « Vos tendances ».
    expect(screen.getByRole('heading', { name: 'Vos repas' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^Repas$/ })).not.toBeInTheDocument()
  })

  it('renders two separate file inputs: camera and gallery', () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    expect(screen.getByLabelText(/Prendre une photo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Choisir depuis la galerie/i)).toBeInTheDocument()
  })

  it('renders camera button with capture attribute', () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    const cameraInput = screen.getByLabelText(/Prendre une photo/i)
    expect(cameraInput).toHaveAttribute('capture', 'environment')
  })

  it('renders gallery input without capture attribute', () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    const galleryInput = screen.getByLabelText(/Choisir depuis la galerie/i)
    expect(galleryInput).not.toHaveAttribute('capture')
  })

  it('renders camera and gallery label buttons', () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    expect(screen.getByText('Photo du repas')).toBeInTheDocument()
    expect(screen.getByText('Galerie')).toBeInTheDocument()
  })

  it('met la photo du repas en geste principal, galerie et description en second (POL-PLAY-34)', () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    const photo = screen.getByText('Photo du repas').closest('label')
    expect(photo).toHaveClass('upload-btn', 'upload-btn--primary')
    expect(screen.getByText('Galerie').closest('label')).not.toHaveClass('upload-btn--primary')
    expect(screen.getByText('Décrire').closest('button')).not.toHaveClass('upload-btn--primary')
  })

  it('va droit aux trois façons de saisir, sans texte d’explication redondant', () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    expect(screen.queryByText(/Photographiez votre assiette/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Utilisez l'appareil photo/i)).not.toBeInTheDocument()
    const zone = document.querySelector('.upload-actions')
    expect(zone).toHaveTextContent('Photo')
    expect(zone).toHaveTextContent('Galerie')
    expect(zone).toHaveTextContent('Décrire')
  })

  it('loads recent meals from local storage on mount', async () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    await screen.findByText(/Derniers repas enregistrés/i)
    const { listEntries } = await import('../storage/localHealthStorage')
    expect(listEntries).toHaveBeenCalledWith({ type: 'food', limit: 100 })
  })

  it('shows empty hint when no meals', async () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    await screen.findByText(/Aucun repas enregistré/i)
  })

  it('analyze button is not visible until image selected', () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    expect(screen.queryByRole('button', { name: /Analyser les ingrédients/i })).not.toBeInTheDocument()
  })

  it('explique ce qui part chez Google avant l’analyse (photo sans GPS, clé gratuite)', async () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    expect(screen.queryByText(/sans position GPS/i)).not.toBeInTheDocument()
    const file = new File(['x'], 'repas.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/Choisir depuis la galerie/i), { target: { files: [file] } })
    const note = await screen.findByText(/sans position GPS/i)
    expect(note).toHaveTextContent(/Google Gemini/)
    expect(note).toHaveTextContent(/clé gratuite/i)
  })
})

describe('Food — correction avant enregistrement', () => {
  beforeEach(async () => {
    localStorage.clear()
    const { listEntries, createEntry } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
    createEntry.mockResolvedValue('id-1')
  })

  it('résultat d’une analyse photo : FODMAP par sous-groupe avant d’enregistrer, suit les grammes corrigés (N4)', async () => {
    const { setGeminiApiKey } = await import('../settings/geminiApiKey')
    const { saveOnboarding } = await import('../settings/onboarding')
    setGeminiApiKey('KEY')
    saveOnboarding({ goal: 'gut' })
    const gemini = await import('../services/geminiStandalone')
    vi.spyOn(gemini, 'analyzeWithGemini').mockResolvedValue({
      provider: 'gemini',
      dish: 'Soupe à l’oignon',
      items: [{ ingredient: 'Oignon, cru', quantity: '70 g', quantity_g: 70 }],
    })
    render(<BrowserRouter><Food /></BrowserRouter>)
    fireEvent.change(screen.getByLabelText(/Choisir depuis la galerie/i), {
      target: { files: [new File(['x'], 'repas.jpg', { type: 'image/jpeg' })] },
    })
    fireEvent.click(await screen.findByRole('button', { name: /Analyser les ingrédients/i }))
    await screen.findByRole('heading', { name: 'Soupe à l’oignon' })
    const results = document.querySelector('.results')
    expect(await within(results).findByText('Riche en fructanes')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Grammes de Oignon/i), { target: { value: '4' } })
    await vi.waitFor(() => expect(within(results).queryByTestId('meal-fodmap')).not.toBeInTheDocument())
    saveOnboarding({ goal: null })
  })

  it('enregistre les grammes corrigés par l’utilisateur, sans les ingrédients supprimés', async () => {
    const { setGeminiApiKey } = await import('../settings/geminiApiKey')
    setGeminiApiKey('KEY')
    const gemini = await import('../services/geminiStandalone')
    vi.spyOn(gemini, 'analyzeWithGemini').mockResolvedValue({
      provider: 'gemini',
      model: 'gemini-3.8-flash',
      dish: 'Plateau de fromages',
      items: [
        { ingredient: 'Abondance', quantity: '50 g', quantity_g: 50, confidence: 'low' },
        { ingredient: 'Fromage lunaire', quantity: '20 g', quantity_g: 20, unknown: true },
      ],
    })
    render(<BrowserRouter><Food /></BrowserRouter>)
    fireEvent.change(screen.getByLabelText(/Choisir depuis la galerie/i), {
      target: { files: [new File(['x'], 'repas.jpg', { type: 'image/jpeg' })] },
    })
    fireEvent.click(await screen.findByRole('button', { name: /Analyser les ingrédients/i }))
    expect(await screen.findByRole('heading', { name: 'Plateau de fromages' })).toBeInTheDocument()
    // Libellé simple pour tout le monde ; le nom technique du modèle seulement dans les détails
    expect(screen.getByText(/Analyse IA · une estimation/)).toBeInTheDocument()
    expect(screen.queryByText(/Source : gemini/)).not.toBeInTheDocument()
    expect(screen.getByText('Modèle : gemini-3.8-flash').closest('details')).not.toHaveAttribute('open')
    fireEvent.change(screen.getByLabelText(/Grammes de Abondance/i), { target: { value: '80' } })
    fireEvent.click(screen.getByRole('button', { name: /Supprimer Fromage lunaire/i }))
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer ce repas/i }))
    await screen.findByText(/Repas enregistré/)
    const { createEntry } = await import('../storage/localHealthStorage')
    expect(createEntry).toHaveBeenCalledWith({
      type: 'food',
      source: 'app_food',
      payload: {
        items: [{ ingredient: 'Abondance', quantity: '80 g', quantity_g: 80, confidence: 'low' }],
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        dish: 'Plateau de fromages',
      },
    })
    expect(screen.getByLabelText(/Grammes de Abondance/i)).toBeDisabled()
  })

  it('affiche le plat et les kcal des derniers repas', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([{
      id: 'm1', at: '2026-10-09T12:00:00Z', type: 'food',
      payload: { dish: 'Fromage', items: [{ ingredient: 'Abondance', quantity: '100 g', quantity_g: 100 }] },
    }])
    render(<BrowserRouter><Food /></BrowserRouter>)
    expect(await screen.findByText('Fromage', { selector: '.meal-dish' })).toBeInTheDocument()
    expect(screen.getByText('≈ 393 kcal', { selector: '.meal-kcal' })).toBeInTheDocument()
  })
})

describe('Food — supprimer un repas', () => {
  it('replie Refaire, Modifier et Supprimer derrière « ⋯ » (POL-PLAY-50)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([
      { id: 9, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00', payload: { dish: 'Pâtes', items: [{ ingredient: 'Pâtes', quantity: '200 g' }] } },
    ])
    render(<BrowserRouter><Food /></BrowserRouter>)
    const toggle = await screen.findByRole('button', { name: 'Actions pour ce repas' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    for (const name of [/Refaire ce repas/i, /Modifier ce repas/i, /Supprimer ce repas/i]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
    fireEvent.click(toggle)
    for (const name of [/Refaire ce repas/i, /Modifier ce repas/i, /Supprimer ce repas/i]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Fermer les actions de ce repas' }))
    expect(screen.queryByRole('button', { name: /Modifier ce repas/i })).not.toBeInTheDocument()
  })

  it('retire le repas de la liste après confirmation', async () => {
    const { listEntries, deleteEntry } = await import('../storage/localHealthStorage')
    deleteEntry.mockResolvedValue()
    listEntries.mockResolvedValue([
      { id: 9, type: 'food', source: 'app_food', at: '2026-04-11T12:00:00', payload: { dish: 'Pâtes au pesto', items: [{ ingredient: 'Pâtes', quantity: '200 g' }] } },
    ])
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    await screen.findByText('Pâtes au pesto', { selector: '.meal-dish' })
    expect(screen.getByText('Pâtes', { selector: '.meal-item-name' })).toBeInTheDocument()
    listEntries.mockResolvedValue([])
    fireEvent.click(mealAction(/Supprimer ce repas/i))
    fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }))
    await screen.findByText(/Aucun repas enregistré/i)
    expect(deleteEntry).toHaveBeenCalledWith(9)
  })
})

describe('Food — modifier un repas enregistré', () => {
  const meal = {
    id: 7, type: 'food', source: 'app_food', at: '2026-10-09T10:30:00.000Z',
    payload: {
      dish: 'Fromage', provider: 'gemini', model: 'gemini-3.8-flash',
      items: [
        { ingredient: 'Abondance', quantity: '100 g', quantity_g: 100 },
        { ingredient: 'Fromage lunaire', quantity: '20 g', quantity_g: 20 },
      ],
    },
  }

  it('corrige les grammes, retire un ingrédient et change l’heure', async () => {
    const { listEntries, updateEntry } = await import('../storage/localHealthStorage')
    updateEntry.mockResolvedValue()
    listEntries.mockResolvedValue([meal])
    const onUpdate = vi.fn()
    window.addEventListener('health-entries-updated', onUpdate)
    render(<BrowserRouter><Food /></BrowserRouter>)
    await screen.findByText('Fromage', { selector: '.meal-dish' })
    fireEvent.click(mealAction(/Modifier ce repas/i))
    fireEvent.change(screen.getByLabelText(/Grammes de Abondance/i), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: /Supprimer Fromage lunaire/i }))
    fireEvent.change(screen.getByLabelText(/Heure du repas/i), { target: { value: '2026-10-08T20:15' } })
    const updated = {
      ...meal,
      at: new Date(2026, 9, 8, 20, 15).toISOString(),
      payload: { ...meal.payload, items: [{ ingredient: 'Abondance', quantity: '50 g', quantity_g: 50 }] },
    }
    listEntries.mockResolvedValue([updated])
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer les modifications/i }))
    await vi.waitFor(() => expect(screen.queryByLabelText(/Grammes de Abondance/i)).not.toBeInTheDocument())
    expect(await screen.findByText('≈ 197 kcal', { selector: '.meal-kcal' })).toBeInTheDocument()
    expect(updateEntry).toHaveBeenCalledWith(7, { payload: updated.payload, at: updated.at })
    expect(onUpdate).toHaveBeenCalled()
    expect(screen.queryByLabelText(/Grammes de Abondance/i)).not.toBeInTheDocument()
    window.removeEventListener('health-entries-updated', onUpdate)
  })

  it('n’envoie pas l’heure si elle n’a pas changé', async () => {
    const { listEntries, updateEntry } = await import('../storage/localHealthStorage')
    updateEntry.mockClear()
    updateEntry.mockResolvedValue()
    listEntries.mockResolvedValue([meal])
    render(<BrowserRouter><Food /></BrowserRouter>)
    await screen.findByText('Fromage', { selector: '.meal-dish' })
    fireEvent.click(mealAction(/Modifier ce repas/i))
    fireEvent.change(screen.getByLabelText(/Grammes de Abondance/i), { target: { value: '120' } })
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer les modifications/i }))
    await vi.waitFor(() => expect(updateEntry).toHaveBeenCalled())
    expect(updateEntry.mock.calls[0][1].at).toBeUndefined()
  })

  it('Annuler referme l’éditeur sans rien enregistrer', async () => {
    const { listEntries, updateEntry } = await import('../storage/localHealthStorage')
    updateEntry.mockClear()
    listEntries.mockResolvedValue([meal])
    render(<BrowserRouter><Food /></BrowserRouter>)
    await screen.findByText('Fromage', { selector: '.meal-dish' })
    fireEvent.click(mealAction(/Modifier ce repas/i))
    fireEvent.change(screen.getByLabelText(/Grammes de Abondance/i), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: /^Annuler$/ }))
    expect(screen.queryByLabelText(/Grammes de Abondance/i)).not.toBeInTheDocument()
    expect(screen.getByText('≈ 393 kcal', { selector: '.meal-kcal' })).toBeInTheDocument()
    expect(updateEntry).not.toHaveBeenCalled()
  })

  it('carte d’un repas : FODMAP par sous-groupe avec l’objectif « Mon ventre », rien avec « énergie » (N4)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const { saveOnboarding } = await import('../settings/onboarding')
    const onion = { id: 2, at: '2026-10-07T12:00:00Z', type: 'food', source: 'manual',
      payload: { dish: 'Soupe', items: [{ ingredient: 'Oignon, cru', quantity: '70 g', quantity_g: 70 }] } }
    listEntries.mockResolvedValue([onion])
    saveOnboarding({ goal: 'gut' })
    const { unmount } = render(<BrowserRouter><Food /></BrowserRouter>)
    expect(await screen.findByText('Riche en fructanes')).toBeInTheDocument()
    unmount()
    saveOnboarding({ goal: 'energy' })
    render(<BrowserRouter><Food /></BrowserRouter>)
    await screen.findByText('Soupe', { selector: '.meal-dish' })
    expect(screen.queryByTestId('meal-fodmap')).not.toBeInTheDocument()
    saveOnboarding({ goal: null })
  })

  it('éditeurs d’un repas (Modifier, Refaire) : FODMAP en direct avec l’objectif « Mon ventre » (N4)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const { saveOnboarding } = await import('../settings/onboarding')
    const onion = { id: 3, at: '2026-10-07T12:00:00Z', type: 'food', source: 'app_food',
      payload: { dish: 'Soupe', items: [{ ingredient: 'Oignon, cru', quantity: '70 g', quantity_g: 70 }] } }
    listEntries.mockResolvedValue([onion])
    saveOnboarding({ goal: 'gut' })
    const { unmount } = render(<BrowserRouter><Food /></BrowserRouter>)
    await screen.findByText('Soupe', { selector: '.meal-dish' })
    fireEvent.click(mealAction(/Modifier ce repas/i))
    const editor = document.querySelector('.saved-meal-editor')
    expect(await within(editor).findByText('Riche en fructanes')).toBeInTheDocument()
    fireEvent.change(within(editor).getByLabelText(/Grammes de Oignon/i), { target: { value: '4' } })
    await vi.waitFor(() => expect(within(editor).queryByTestId('meal-fodmap')).not.toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /^Annuler$/ }))
    fireEvent.click(mealAction(/Refaire ce repas/i))
    expect(await screen.findByText('Riche en fructanes', { selector: '.new-meal *' })).toBeInTheDocument()
    unmount()
    saveOnboarding({ goal: 'energy' })
    render(<BrowserRouter><Food /></BrowserRouter>)
    await screen.findByText('Soupe', { selector: '.meal-dish' })
    fireEvent.click(mealAction(/Modifier ce repas/i))
    await screen.findByLabelText(/Grammes de Oignon/i)
    expect(screen.queryByTestId('meal-fodmap')).not.toBeInTheDocument()
    saveOnboarding({ goal: null })
  })

  it('refuse une heure dans le futur', async () => {
    const { listEntries, updateEntry } = await import('../storage/localHealthStorage')
    updateEntry.mockClear()
    listEntries.mockResolvedValue([meal])
    render(<BrowserRouter><Food /></BrowserRouter>)
    await screen.findByText('Fromage', { selector: '.meal-dish' })
    fireEvent.click(mealAction(/Modifier ce repas/i))
    fireEvent.change(screen.getByLabelText(/Heure du repas/i), { target: { value: '2999-01-01T12:00' } })
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer les modifications/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/futur/)
    expect(updateEntry).not.toHaveBeenCalled()
  })

  it('pas de bouton Modifier pour un repas venant d’une autre source', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([{ ...meal, source: 'health_connect' }])
    render(<BrowserRouter><Food /></BrowserRouter>)
    await screen.findByText('Fromage', { selector: '.meal-dish' })
    openMealActions()
    expect(screen.getByRole('button', { name: /Refaire ce repas/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Modifier ce repas/i })).not.toBeInTheDocument()
  })
})

describe('Food — saisie sans photo', () => {
  const fromage = (id, at, grams) => ({
    id, type: 'food', source: 'app_food', at,
    payload: { dish: 'Fromage', provider: 'gemini', items: [{ ingredient: 'Abondance', quantity: `${grams} g`, quantity_g: grams }] },
  })

  beforeEach(async () => {
    const { listEntries, createEntry } = await import('../storage/localHealthStorage')
    createEntry.mockReset()
    createEntry.mockResolvedValue(42)
    listEntries.mockResolvedValue([])
  })

  it('compose un repas par recherche d’ingrédients, sans clé Gemini', async () => {
    localStorage.clear()
    const onUpdate = vi.fn()
    window.addEventListener('health-entries-updated', onUpdate)
    render(<BrowserRouter><Food /></BrowserRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Saisir sans photo/i }))
    expect(screen.getByRole('heading', { name: /Nouveau repas/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enregistrer ce repas/i })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/Ajouter un ingrédient/i), { target: { value: 'abondance' } })
    fireEvent.click(screen.getByRole('option', { name: 'Abondance' }))
    fireEvent.change(screen.getByLabelText(/Grammes de Abondance/i), { target: { value: '40' } })
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer ce repas/i }))
    await screen.findByText(/Repas enregistré/)
    const { createEntry } = await import('../storage/localHealthStorage')
    const saved = createEntry.mock.calls[0][0]
    expect(saved).toMatchObject({
      type: 'food',
      source: 'app_food',
      payload: { provider: 'manual', items: [{ ingredient: 'Abondance', quantity: '40 g', quantity_g: 40 }] },
    })
    expect(saved.payload.dish).toBeUndefined()
    expect(Math.abs(new Date(saved.at).getTime() - Date.now())).toBeLessThan(60_000)
    expect(onUpdate).toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: /Nouveau repas/i })).not.toBeInTheDocument()
    window.removeEventListener('health-entries-updated', onUpdate)
  })

  it('propose les repas habituels et les refait en un tap (grammes de la dernière fois)', async () => {
    const { listEntries, createEntry } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([fromage(2, '2026-10-08T12:00:00Z', 80), fromage(1, '2026-10-07T12:00:00Z', 100)])
    render(<BrowserRouter><Food /></BrowserRouter>)
    const quick = await screen.findByRole('button', { name: /Refaire Fromage \(2 fois\)/i })
    fireEvent.click(quick)
    expect(screen.getByRole('heading', { name: 'Refaire : Fromage' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Grammes de Abondance/i)).toHaveValue(80)
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer ce repas/i }))
    await screen.findByText(/Repas enregistré/)
    expect(createEntry.mock.calls[0][0].payload).toEqual({
      items: [{ ingredient: 'Abondance', quantity: '80 g', quantity_g: 80 }],
      provider: 'manual',
      dish: 'Fromage',
    })
  })

  it('« Refaire » sur un repas de la liste, Annuler ne crée rien', async () => {
    const { listEntries, createEntry } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([fromage(1, '2026-10-07T12:00:00Z', 100)])
    render(<BrowserRouter><Food /></BrowserRouter>)
    await screen.findByText('Fromage', { selector: '.meal-dish' })
    fireEvent.click(mealAction(/Refaire ce repas/i))
    expect(screen.getByLabelText(/Grammes de Abondance/i)).toHaveValue(100)
    fireEvent.click(screen.getByRole('button', { name: /^Annuler$/ }))
    expect(screen.queryByLabelText(/Grammes de Abondance/i)).not.toBeInTheDocument()
    expect(createEntry).not.toHaveBeenCalled()
  })

  it('refuse une heure dans le futur', async () => {
    const { listEntries, createEntry } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([fromage(1, '2026-10-07T12:00:00Z', 100)])
    render(<BrowserRouter><Food /></BrowserRouter>)
    fireEvent.click(await findMealAction(/Refaire ce repas/i))
    fireEvent.change(screen.getByLabelText(/Heure du repas/i), { target: { value: '2999-01-01T12:00' } })
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer ce repas/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/futur/)
    expect(createEntry).not.toHaveBeenCalled()
  })
})

describe('Food — décrire un repas en quelques mots', () => {
  beforeEach(async () => {
    localStorage.clear()
    const { listEntries, createEntry } = await import('../storage/localHealthStorage')
    createEntry.mockReset()
    createEntry.mockResolvedValue(7)
    listEntries.mockResolvedValue([])
  })

  it('remplit le repas à partir de la description, puis enregistre après correction', async () => {
    const { setGeminiApiKey } = await import('../settings/geminiApiKey')
    setGeminiApiKey('KEY')
    const gemini = await import('../services/geminiStandalone')
    const spy = vi.spyOn(gemini, 'analyzeMealText').mockResolvedValue({
      provider: 'gemini',
      model: 'gemini-3.8-flash',
      dish: 'Fromage et pain',
      items: [{ ingredient: 'Abondance', quantity: '30 g', quantity_g: 30, confidence: 'medium' }],
    })
    render(<BrowserRouter><Food /></BrowserRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Décrire ou saisir sans photo/i }))
    expect(screen.getByText(/Seul ce texte est envoyé à Google Gemini/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Décrivez votre repas/i), { target: { value: 'un morceau d’abondance' } })
    fireEvent.click(screen.getByRole('button', { name: /Remplir avec Gemini/i }))
    expect(spy).toHaveBeenCalledWith('un morceau d’abondance', 'KEY')
    expect(await screen.findByLabelText(/Grammes de Abondance/i)).toHaveValue(30)
    expect(screen.getByRole('heading', { name: 'Fromage et pain' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Grammes de Abondance/i), { target: { value: '45' } })
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer ce repas/i }))
    await screen.findByText(/Repas enregistré/)
    const { createEntry } = await import('../storage/localHealthStorage')
    expect(createEntry.mock.calls[0][0].payload).toEqual({
      items: [{ ingredient: 'Abondance', quantity: '45 g', quantity_g: 45, confidence: 'medium' }],
      provider: 'gemini_text',
      model: 'gemini-3.8-flash',
      dish: 'Fromage et pain',
    })
    spy.mockRestore()
  })

  it('affiche l’erreur de Gemini et laisse la saisie manuelle possible', async () => {
    const { setGeminiApiKey } = await import('../settings/geminiApiKey')
    setGeminiApiKey('KEY')
    const gemini = await import('../services/geminiStandalone')
    const spy = vi.spyOn(gemini, 'analyzeMealText').mockRejectedValue(new Error('Ce texte ne décrit pas un repas.'))
    render(<BrowserRouter><Food /></BrowserRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Décrire ou saisir sans photo/i }))
    fireEvent.change(screen.getByLabelText(/Décrivez votre repas/i), { target: { value: 'bonjour' } })
    fireEvent.click(screen.getByRole('button', { name: /Remplir avec Gemini/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ce texte ne décrit pas un repas.')
    expect(screen.getByLabelText(/Ajouter un ingrédient/i)).toBeEnabled()
    spy.mockRestore()
  })

  it('sans clé Gemini : pas de champ de description, renvoi vers les Paramètres', () => {
    render(<BrowserRouter><Food /></BrowserRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Décrire ou saisir sans photo/i }))
    expect(screen.queryByLabelText(/Décrivez votre repas/i)).not.toBeInTheDocument()
    expect(screen.getByText(/clé Gemini dans Réglages \(roue en haut à droite\) → Paramètres/i)).toBeInTheDocument()
  })

  it('« Refaire » ne propose pas de description (le repas est déjà rempli)', async () => {
    const { setGeminiApiKey } = await import('../settings/geminiApiKey')
    setGeminiApiKey('KEY')
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([{
      id: 1, type: 'food', source: 'app_food', at: '2026-10-07T12:00:00Z',
      payload: { items: [{ ingredient: 'Abondance', quantity: '50 g', quantity_g: 50 }] },
    }])
    render(<BrowserRouter><Food /></BrowserRouter>)
    fireEvent.click(await findMealAction(/Refaire ce repas/i))
    expect(screen.queryByLabelText(/Décrivez votre repas/i)).not.toBeInTheDocument()
  })
})

describe('Food — derniers repas regroupés par jour', () => {
  const poulet = (id, at) => ({
    id, type: 'food', source: 'app_food', at,
    payload: { items: [{ ingredient: "Poulet, cuisse, viande bouillie/cuite à l'eau", quantity: '150 g', quantity_g: 150 }] },
  })

  it('un titre par jour avec le total estimé, l’heure seule et des noms d’aliments courts', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([poulet(1, '2026-10-05T20:15:00'), poulet(2, '2026-10-05T12:15:00'), poulet(3, '2026-10-04T12:15:00')])
    render(<BrowserRouter><Food /></BrowserRouter>)
    const days = await screen.findAllByRole('heading', { level: 4 })
    expect(days).toHaveLength(2)
    expect(days[0]).toHaveTextContent(/5 octobre/)
    expect(days[0]).toHaveTextContent(/2 repas/)
    // Un seul repas : sa carte donne déjà l'estimation, le titre du jour ne la redit pas (D1).
    expect(days[1]).not.toHaveTextContent(/repas|kcal/)
    expect(screen.getAllByText('20:15', { selector: '.meal-at' })).toHaveLength(1)
    const item = screen.getAllByText('Poulet, cuisse')[0].closest('li')
    expect(item).toHaveAttribute('title', "Poulet, cuisse, viande bouillie/cuite à l'eau")
    expect(item.closest('ul')).toHaveClass('meal-item-list')
    expect(item.querySelector('.meal-item-qty')).toHaveTextContent('150 g')
  })

  it('affiche les jours les plus récents puis « Voir les jours précédents »', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => poulet(i, `2026-09-${String(20 - i).padStart(2, '0')}T12:15:00`)),
    )
    render(<BrowserRouter><Food /></BrowserRouter>)
    expect(await screen.findAllByRole('heading', { level: 4 })).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: /Voir les jours précédents/i }))
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(10)
    expect(screen.queryByRole('button', { name: /Voir les jours précédents/i })).not.toBeInTheDocument()
  })

  it('ouvre le formulaire « Refaire » quand on arrive du tableau de bord', async () => {
    const redoMeal = { dish: 'Riz au poulet', items: [{ ingredient: 'Riz blanc cuit', quantity: '150 g', quantity_g: 150 }] }
    render(
      <MemoryRouter initialEntries={[{ pathname: '/food', state: { redoMeal } }]}>
        <Food />
      </MemoryRouter>
    )
    expect(await screen.findByText(/Refaire : Riz au poulet/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Décrire ou saisir sans photo/ })).not.toBeInTheDocument()
  })
})
