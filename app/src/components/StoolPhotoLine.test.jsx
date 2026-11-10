import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const createEntry = vi.fn().mockResolvedValue(1)
const listEntries = vi.fn().mockResolvedValue([])
vi.mock('../storage/localHealthStorage', () => ({ createEntry: (...a) => createEntry(...a), listEntries: (...a) => listEntries(...a) }))
const analyzeStoolPhoto = vi.fn()
vi.mock('../services/stoolPhoto', () => ({ analyzeStoolPhoto: (...a) => analyzeStoolPhoto(...a) }))

import StoolPhotoLine from './StoolPhotoLine'

// « type 4 » : le chiffre seul en mono (leçon 11), le texte est donc en deux nœuds
const findEstimated = (t) => screen.findByText((_, el) => el?.classList?.contains('stool-estimated-type') && el.textContent === t)

const PLAY = { aiRelay: true }
const SIDELOAD = { aiRelay: false }
const photo = () => new File(['x'], 'p.jpg', { type: 'image/jpeg' })

async function takePhoto(features = PLAY) {
  const { container } = render(<StoolPhotoLine features={features} />)
  fireEvent.click(screen.getByRole('button', { name: /Selles : estimer la forme avec une photo/ }))
  if (features.aiRelay && localStorage.getItem('halcya_ai_stool_consent') !== '1') {
    fireEvent.click(await screen.findByRole('button', { name: 'J’accepte, prendre la photo' }))
  }
  const input = container.querySelector('input[type="file"]')
  await waitFor(() => expect(input).not.toBeNull())
  fireEvent.change(input, { target: { files: [photo()] } })
  return { container, input }
}

describe('forme des selles estimée par photo, dans le Journal (SELLES-PHOTO-2)', () => {
  beforeEach(() => {
    localStorage.clear()
    createEntry.mockClear()
    analyzeStoolPhoto.mockReset()
  })

  it('appareil photo direct (pas la galerie) ; accord demandé une fois avant le premier envoi en play', async () => {
    analyzeStoolPhoto.mockResolvedValue({ readable: true, bristol: 4, form: 'normal', confidence: 'high' })
    const { input } = await takePhoto()
    expect(input.getAttribute('capture')).toBe('environment')
    await findEstimated('type 4')
    expect(localStorage.getItem('halcya_ai_stool_consent')).toBe('1')
  })

  it('« Pas maintenant » : rien ne part', async () => {
    render(<StoolPhotoLine features={PLAY} />)
    fireEvent.click(screen.getByRole('button', { name: /Selles : estimer la forme avec une photo/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Pas maintenant' }))
    expect(analyzeStoolPhoto).not.toHaveBeenCalled()
    expect(localStorage.getItem('halcya_ai_stool_consent')).toBeNull()
  })

  it('la forme estimée est présélectionnée ; rien n’est enregistré avant « Enregistrer »', async () => {
    analyzeStoolPhoto.mockResolvedValue({ readable: true, bristol: 4, form: 'normal', confidence: 'high' })
    await takePhoto()
    await findEstimated('type 4')
    expect(screen.getByRole('button', { name: 'Normales' })).toHaveAttribute('aria-pressed', 'true')
    expect(createEntry).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(createEntry).toHaveBeenCalledTimes(1))
    expect(createEntry.mock.calls[0][0]).toMatchObject({
      type: 'stool',
      source: 'app_stool',
      payload: { form: 'normal', bristol: 4, estimated: true, estimate: { bristol: 4, form: 'normal' } },
    })
    expect(await screen.findByText(/Selles notées : Normales · type 4/)).toBeInTheDocument()
  })

  it('corrigée par la personne : sa forme est enregistrée, la proposition reste à côté', async () => {
    analyzeStoolPhoto.mockResolvedValue({ readable: true, bristol: 6, form: 'loose', confidence: 'medium' })
    await takePhoto()
    await findEstimated('type 6')
    fireEvent.click(screen.getByRole('button', { name: 'Dures' }))
    expect(screen.getByRole('button', { name: 'Dures' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(createEntry).toHaveBeenCalledTimes(1))
    expect(createEntry.mock.calls[0][0].payload).toEqual({ form: 'hard', estimated: true, estimate: { bristol: 6, form: 'loose' } })
  })

  it('photo illisible : la personne choisit elle-même, sans estimation gardée', async () => {
    analyzeStoolPhoto.mockResolvedValue({ readable: false, bristol: null, form: null, confidence: 'low' })
    await takePhoto()
    expect(await screen.findByText('Photo difficile à lire. Choisissez vous-même.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Liquides' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(createEntry).toHaveBeenCalledTimes(1))
    expect(createEntry.mock.calls[0][0].payload).toEqual({ form: 'loose' })
  })

  it('une erreur du service s’affiche, rien n’est enregistré', async () => {
    analyzeStoolPhoto.mockRejectedValue(new Error('Plus d’analyse aujourd’hui.'))
    await takePhoto()
    expect(await screen.findByRole('alert')).toHaveTextContent('Plus d’analyse aujourd’hui.')
    expect(createEntry).not.toHaveBeenCalled()
  })

  it('sideload sans clé Gemini : on le dit, sans ouvrir l’appareil photo', () => {
    render(<StoolPhotoLine features={SIDELOAD} />)
    fireEvent.click(screen.getByRole('button', { name: /Selles : estimer la forme avec une photo/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/clé API Gemini/)
    expect(analyzeStoolPhoto).not.toHaveBeenCalled()
  })

  it('sideload avec clé : pas de feuille d’accord, la photo part avec la clé', async () => {
    localStorage.setItem('healthtrack_gemini_api_key', 'cle')
    analyzeStoolPhoto.mockResolvedValue({ readable: true, bristol: 2, form: 'hard', confidence: 'low' })
    await takePhoto(SIDELOAD)
    await findEstimated('type 2')
    expect(analyzeStoolPhoto.mock.calls[0][1]).toBe(SIDELOAD)
  })

  describe('fiabilité chez la personne (SELLES-PHOTO-3)', () => {
    const photoEntry = (estimated, chosen) => ({
      type: 'stool',
      source: 'app_stool',
      at: '2026-10-02T09:00:00',
      payload: { form: chosen, estimated: true, estimate: { bristol: estimated, form: 'normal' } },
    })
    const fiveWithTwoCorrected = [
      photoEntry(4, 'hard'), photoEntry(4, 'loose'), photoEntry(4, 'normal'), photoEntry(4, 'normal'), photoEntry(4, 'normal'),
    ]

    it('rien sous la ligne avant 5 photos ; seules les notes de selles sont lues', async () => {
      listEntries.mockResolvedValueOnce(fiveWithTwoCorrected.slice(0, 4))
      render(<StoolPhotoLine features={SIDELOAD} />)
      await waitFor(() => expect(listEntries).toHaveBeenCalledWith(expect.objectContaining({ type: 'stool' })))
      expect(screen.queryByText(/corrigé/)).toBeNull()
    })

    it('dès 5 photos : nombre de corrections, et « souvent corrigée » au résultat si plus d’une sur trois', async () => {
      localStorage.setItem('healthtrack_gemini_api_key', 'k')
      analyzeStoolPhoto.mockResolvedValue({ readable: true, bristol: 4, form: 'normal', confidence: 'high' })
      listEntries.mockResolvedValueOnce(fiveWithTwoCorrected)
      const { container } = render(<StoolPhotoLine features={SIDELOAD} />)
      expect(await screen.findByText('Vous avez corrigé 2 estimations sur 5.')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /Selles : estimer la forme avec une photo/ }))
      fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [photo()] } })
      await findEstimated('type 4')
      expect(screen.getByText('Souvent corrigée chez vous : vérifiez la forme.')).toBeInTheDocument()
    })
  })
})
