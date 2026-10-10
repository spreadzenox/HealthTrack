import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Food from './Food'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
  createEntry: vi.fn(),
  deleteEntry: vi.fn(),
  updateEntry: vi.fn(),
}))

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
    expect(screen.getByRole('heading', { name: /Alimentation/i })).toBeInTheDocument()
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
    expect(screen.getByText(/Prendre une photo/i)).toBeInTheDocument()
    expect(screen.getByText(/Choisir depuis la galerie/i)).toBeInTheDocument()
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
    expect(screen.getByText('Pâtes : 200 g')).toBeInTheDocument()
    listEntries.mockResolvedValue([])
    fireEvent.click(screen.getByRole('button', { name: /Supprimer ce repas/i }))
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
    fireEvent.click(screen.getByRole('button', { name: /Modifier ce repas/i }))
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
    fireEvent.click(screen.getByRole('button', { name: /Modifier ce repas/i }))
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
    fireEvent.click(screen.getByRole('button', { name: /Modifier ce repas/i }))
    fireEvent.change(screen.getByLabelText(/Grammes de Abondance/i), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: /^Annuler$/ }))
    expect(screen.queryByLabelText(/Grammes de Abondance/i)).not.toBeInTheDocument()
    expect(screen.getByText('≈ 393 kcal', { selector: '.meal-kcal' })).toBeInTheDocument()
    expect(updateEntry).not.toHaveBeenCalled()
  })

  it('refuse une heure dans le futur', async () => {
    const { listEntries, updateEntry } = await import('../storage/localHealthStorage')
    updateEntry.mockClear()
    listEntries.mockResolvedValue([meal])
    render(<BrowserRouter><Food /></BrowserRouter>)
    await screen.findByText('Fromage', { selector: '.meal-dish' })
    fireEvent.click(screen.getByRole('button', { name: /Modifier ce repas/i }))
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
    fireEvent.click(screen.getByRole('button', { name: /Refaire ce repas/i }))
    expect(screen.getByLabelText(/Grammes de Abondance/i)).toHaveValue(100)
    fireEvent.click(screen.getByRole('button', { name: /^Annuler$/ }))
    expect(screen.queryByLabelText(/Grammes de Abondance/i)).not.toBeInTheDocument()
    expect(createEntry).not.toHaveBeenCalled()
  })

  it('refuse une heure dans le futur', async () => {
    const { listEntries, createEntry } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([fromage(1, '2026-10-07T12:00:00Z', 100)])
    render(<BrowserRouter><Food /></BrowserRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /Refaire ce repas/i }))
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
    expect(screen.getByText(/clé Gemini dans Plus → Paramètres/i)).toBeInTheDocument()
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
    fireEvent.click(await screen.findByRole('button', { name: /Refaire ce repas/i }))
    expect(screen.queryByLabelText(/Décrivez votre repas/i)).not.toBeInTheDocument()
  })
})
