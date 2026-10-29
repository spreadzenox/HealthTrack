import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nutrition from './Nutrition'

vi.mock('../storage/localHealthStorage', () => ({
  createEntry: vi.fn().mockResolvedValue(1),
}))
vi.mock('../services/nutritionData', () => ({
  loadNutritionEntries: vi.fn().mockResolvedValue([]),
}))

import { createEntry } from '../storage/localHealthStorage'
import { loadNutritionEntries } from '../services/nutritionData'

const yesterdayNoon = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

// Profil complet : Homme 30 ans, 170 cm (saisis), 70 kg (pesée d'hier).
const completeProfile = () => {
  localStorage.setItem('healthtrack_body_profile', JSON.stringify({ sex: 'M', birthYear: new Date().getFullYear() - 30, heightCm: 170 }))
  return [{ type: 'weight', source: 'app_weight', at: yesterdayNoon(), payload: { valueKg: 70 } }]
}

describe('Nutrition page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Un test qui échoue avant de remettre le mock à zéro ne doit pas faire échouer les suivants.
    loadNutritionEntries.mockResolvedValue([])
    localStorage.clear()
  })

  it('renders title and profile section', async () => {
    render(
      <MemoryRouter>
        <Nutrition />
      </MemoryRouter>,
    )
    await waitFor(() => {
      // POL-PLAY-35 : le titre ne répète pas le sous-onglet « Nutrition ».
      expect(screen.getByRole('heading', { name: 'Vos apports' })).toBeInTheDocument()
    })
    expect(screen.queryByRole('heading', { name: /^Nutrition$/ })).not.toBeInTheDocument()
    // VC-3 : aucune valeur par défaut affichée comme si elle était vraie.
    expect(screen.getByText(/Complétez votre profil pour voir vos repères/)).toBeInTheDocument()
    const card = document.querySelector('.nutrition-profile-card')
    expect(card.textContent).not.toMatch(/70 kg|170 cm|Homme|30 ans|kcal|IMC|par défaut/)
    expect(card.querySelector('.details-toggle')).toBeNull()
  })

  it('résume le profil en deux lignes, sans paragraphe d’introduction (D1)', async () => {
    loadNutritionEntries.mockResolvedValueOnce(completeProfile())
    const { container } = render(<MemoryRouter><Nutrition /></MemoryRouter>)
    await screen.findByText('70 kg')
    expect(container.querySelectorAll('.nutrition-profile-line')).toHaveLength(2)
    expect(container.textContent).not.toMatch(/Poids :|Taille :|Sexe :|Âge :/)
    expect(container.textContent).not.toMatch(/repères officiels/)
  })

  it('shows per-day averages vs daily targets, sodium as a limit', async () => {
    loadNutritionEntries.mockResolvedValueOnce([
      {
        type: 'food',
        at: yesterdayNoon(),
        payload: { items: [{ ingredient: 'Abat, cuit (aliment moyen)', quantity_g: 200 }] },
      },
    ])
    render(
      <MemoryRouter>
        <Nutrition />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/1\s*jour\b/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'À limiter' })).toBeInTheDocument()
    expect(screen.getByText(/max 2 000 mg/)).toBeInTheDocument()
    expect(screen.getByText(/obj\. 30 g/)).toBeInTheDocument()
    expect(screen.getByText(/pas un diagnostic/i)).toBeInTheDocument()
    // Attribution exigée par la licence de Ciqual (CC BY 4.0)
    expect(screen.getByText(/Anses\. Ciqual 2025.*CC BY 4\.0/)).toBeInTheDocument()
  })

  it('teneur non mesurée par Ciqual : « au moins » et étiquette « partiel », jamais un faux zéro (N2b)', async () => {
    loadNutritionEntries.mockResolvedValueOnce([
      {
        type: 'food',
        at: yesterdayNoon(),
        payload: { items: [
          { ingredient: 'Abat, cuit (aliment moyen)', quantity_g: 100 },
          { ingredient: 'Agneau, collier braisé ou bouilli', quantity_g: 100 },
        ] },
      },
    ])
    const { container } = render(<MemoryRouter><Nutrition /></MemoryRouter>)
    await screen.findByText(/1\s*jour\b/)
    const sodium = [...container.querySelectorAll('.nutrition-bar-row')]
      .find((r) => r.querySelector('.nutrition-bar-label').textContent.startsWith('Sodium'))
    expect(sodium.querySelector('.nutrition-bar-value').textContent).toMatch(/^≥\s/)
    expect(sodium.querySelector('.nutrition-partial-tag').textContent).toBe('partiel')
    expect(sodium.querySelector('[role="progressbar"]').getAttribute('aria-label')).toMatch(/au moins/)
    const protein = [...container.querySelectorAll('.nutrition-bar-row')]
      .find((r) => r.querySelector('.nutrition-bar-label').textContent.startsWith('Protéines'))
    expect(protein.querySelector('.nutrition-partial-tag')).toBeNull()
    expect(container.querySelector('.nutrition-source').textContent).toMatch(/«\u00a0partiel\u00a0»/)
  })

  it('jours incomplets : une seule ligne d’avertissement, sans compte de repères trompeur (D1)', async () => {
    loadNutritionEntries.mockResolvedValueOnce([
      { type: 'food', at: yesterdayNoon(), payload: { items: [{ ingredient: 'Abat, cuit (aliment moyen)', quantity_g: 200 }] } },
    ])
    const { container } = render(<MemoryRouter><Nutrition /></MemoryRouter>)
    await screen.findByText(/1\s*jour\b/)
    const warning = container.querySelector('.nutrition-warning')
    // « par jour saisi » est déjà dans la ligne au-dessus : l'avertissement ne le redit pas (D1).
    // Pas d'objectif calorique affiché (I152) : seulement l'apport moyen.
    expect(warning.textContent).toMatch(/kcal\/j en moyenne/)
    expect(warning.textContent).not.toMatch(/visées/)
    expect(warning.textContent).not.toMatch(/par jour saisi/)
    expect(warning.textContent).toMatch(/des repas manquent sans doute/)
    expect(warning.textContent.length).toBeLessThan(110)
    expect(container.textContent).not.toMatch(/repères? atteints? sur/)
  })

  it('composition Withings dans « Votre profil », plus de section « Dernière mesure Withings » (D1)', async () => {
    loadNutritionEntries.mockResolvedValueOnce([
      ...completeProfile(),
      { type: 'body_composition', source: 'withings', at: '2026-10-14T07:30:00', payload: { valueKg: 77.2, fatRatioPct: 21.2, muscleMassKg: 32.4 } },
    ])
    const { container } = render(<MemoryRouter><Nutrition /></MemoryRouter>)
    await screen.findByRole('heading', { name: /Votre profil/ })
    expect(screen.queryByRole('heading', { name: /Dernière mesure Withings/ })).not.toBeInTheDocument()
    const lines = container.querySelectorAll('.nutrition-profile-line')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toHaveTextContent('Masse grasse 21,2 %')
    expect(lines[1]).toHaveTextContent('Muscles 32,4 kg')
  })

  it('shows empty state when no meals this week', async () => {
    render(
      <MemoryRouter>
        <Nutrition />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText(/aucun repas/i)).toBeInTheDocument()
    })
  })

  it('profil vide : invite à le compléter, repères annoncés comme non ajustés', async () => {
    loadNutritionEntries.mockResolvedValueOnce([
      { type: 'food', at: yesterdayNoon(), payload: { items: [{ ingredient: 'Abat, cuit (aliment moyen)', quantity_g: 200 }] } },
    ])
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
    expect(await screen.findByRole('button', { name: /compléter mon profil/i })).toBeInTheDocument()
    expect(screen.queryByText(/70 kg/)).not.toBeInTheDocument()
    expect(screen.getByText(/complétez votre profil pour les ajuster/)).toBeInTheDocument()
  })

  it('profil partiel : seules les valeurs connues, la liste de ce qui manque, ni IMC ni kcal', async () => {
    localStorage.setItem('healthtrack_body_profile', JSON.stringify({ heightCm: 165 }))
    const { container } = render(<MemoryRouter><Nutrition /></MemoryRouter>)
    expect(await screen.findByText('165 cm')).toBeInTheDocument()
    const card = container.querySelector('.nutrition-profile-card')
    expect(card.textContent).toMatch(/À compléter pour ajuster vos repères : poids, sexe, âge/)
    expect(card.textContent).not.toMatch(/70 kg|Homme|30 ans|kcal|IMC/)
    expect(card.querySelector('.details-toggle')).toBeNull()
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
  })

  it('profil complet : IMC et besoin en énergie seulement en mode détails (I152)', async () => {
    loadNutritionEntries.mockResolvedValueOnce(completeProfile())
    const { container } = render(<MemoryRouter><Nutrition /></MemoryRouter>)
    expect(await screen.findByText('70 kg')).toBeInTheDocument()
    const card = container.querySelector('.nutrition-profile-card')
    expect(card.textContent).not.toMatch(/kcal|IMC|À compléter/)
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les détails' }))
    expect(card.textContent).toMatch(/IMC\s24,2/)
    expect(card.textContent).toMatch(/~2\s507 kcal\/jour/)
  })

  it('enregistre le profil saisi et une pesée, puis recalcule les repères', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /compléter mon profil/i }))
    fireEvent.click(screen.getByRole('radio', { name: 'Femme' }))
    fireEvent.change(screen.getByLabelText(/année de naissance/i), { target: { value: '1990' } })
    fireEvent.change(screen.getByLabelText(/taille/i), { target: { value: '165' } })
    fireEvent.change(screen.getByLabelText(/poids/i), { target: { value: '60,5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(createEntry).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'weight', source: 'app_weight', payload: { valueKg: 60.5 } }),
    ))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'health-entries-updated' }))
    expect(JSON.parse(localStorage.getItem('healthtrack_body_profile'))).toEqual({ sex: 'F', birthYear: 1990, heightCm: 165 })
    // Le formulaire contient aussi un libellé « Femme » : attendre sa fermeture, sinon on peut trouver
    // ce libellé juste avant qu'il disparaisse (échec intermittent sur la CI). Le profil affiché n'est mis à
    // jour qu'après le rechargement asynchrone qui suit la fermeture : findBy, pas getBy.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Enregistrer' })).toBeNull())
    expect(await screen.findByText('Femme')).toBeInTheDocument()
    expect(await screen.findByText(/165 cm/)).toBeInTheDocument()
    expect(screen.queryByText('Chargement…')).not.toBeInTheDocument()
    dispatchSpy.mockRestore()
  })

  it('n\'ajoute pas de pesée si le poids n\'a pas changé', async () => {
    loadNutritionEntries.mockResolvedValue([
      { type: 'weight', source: 'withings', at: yesterdayNoon(), payload: { valueKg: 77.2 } },
    ])
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /modifier/i }))
    expect(screen.getByLabelText(/poids/i)).toHaveValue('77,2')
    fireEvent.click(screen.getByRole('radio', { name: 'Homme' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Enregistrer' })).toBeNull())
    expect(await screen.findByText('Homme')).toBeInTheDocument()
    expect(createEntry).not.toHaveBeenCalled()
    loadNutritionEntries.mockResolvedValue([])
  })

  it('refuse un poids invalide sans rien enregistrer', async () => {
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /compléter mon profil/i }))
    fireEvent.change(screen.getByLabelText(/poids/i), { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/poids/i)
    expect(createEntry).not.toHaveBeenCalled()
  })

  it('indique le niveau d\'activité utilisé (par défaut sans pas mesurés)', async () => {
    localStorage.setItem('healthtrack_body_profile', JSON.stringify({ heightCm: 165 }))
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
        expect(await screen.findByText('Modérément actif')).toBeInTheDocument()
    expect(screen.getByText(/\(par défaut\)/, { selector: '.nutrition-profile-activity *' })).toBeInTheDocument()
  })

  it('estime le niveau d\'activité d\'après les pas des 14 derniers jours', async () => {
    const days = Array.from({ length: 10 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (i + 1))
      d.setHours(0, 0, 0, 0)
      return { type: 'steps', source: 'health_connect', at: d.toISOString(), payload: { value: 11000, period: 'day' } }
    })
    loadNutritionEntries.mockResolvedValue(days)
    localStorage.setItem('healthtrack_body_profile', JSON.stringify({ heightCm: 165 }))
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
    expect(await screen.findByText('Très actif')).toBeInTheDocument()
    expect(screen.getByText(/11\s000 pas\/jour sur 10 jours/)).toBeInTheDocument()
    loadNutritionEntries.mockResolvedValue([])
  })

  it('enregistre le niveau d\'activité choisi et recalcule l\'énergie', async () => {
    loadNutritionEntries.mockResolvedValue(completeProfile())
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Afficher les détails' }))
    // Homme 30 ans, 70 kg, 170 cm : 1 617,5 kcal × 1,55 ≈ 2 507
    expect(await screen.findByText(/~2\s507 kcal\/jour/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Sédentaire' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText(/~2\s265 kcal\/jour/)).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('healthtrack_body_profile'))).toMatchObject({ activity: 'sedentary' })
    expect(screen.getByText('Sédentaire')).toBeInTheDocument()
    loadNutritionEntries.mockResolvedValue([])
  })
})
