import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PilouPhotoFlow, { PHOTO_NOTICE } from './PilouPhotoFlow.jsx'

const LEA = {
  cheveux: { longueur: 'mi_longs', texture: 'ondules', coiffure: 'raie_cote', couleur: 'chatain', meches: 'aucune', volume: 'moyen' },
  sourcils: { epaisseur: 'moyens', forme: 'arques' },
  yeux: { couleur: 'noisette', forme: 'amande' },
  lunettes: { type: 'rondes', couleur: 'ecaille' },
  barbe: { type: 'aucune' },
  peau: { taches_de_rousseur: 'legeres', grain_de_beaute: 'aucun' },
  oreilles: { boucles: 'puces', piercing_nez: false },
  incertains: ['yeux.couleur'],
}

function setup(props = {}) {
  const stream = { getTracks: () => [{ stop: vi.fn() }] }
  const deps = {
    onStudio: vi.fn(),
    onLater: vi.fn(),
    openCamera: vi.fn(async () => stream),
    capture: vi.fn(() => ({ mimeType: 'image/jpeg', data: 'AAAA' })),
    analyze: vi.fn(async () => ({ style: LEA, remaining: 2 })),
    remaining: 3,
    ...props,
  }
  render(<PilouPhotoFlow name="Noisette" {...deps} />)
  return deps
}

describe('Parcours photo du double numérique', () => {
  it('propose trois choix, avec le nom donné à Pilou', () => {
    const d = setup()
    expect(screen.getByRole('heading', { name: 'Et si Noisette vous ressemblait ?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }))
    expect(d.onLater).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Le faire à la main' }))
    expect(d.onStudio).toHaveBeenCalledWith(null)
    expect(d.openCamera).not.toHaveBeenCalled()
  })

  it('montre l’information mot pour mot avant la caméra, qui ne s’ouvre qu’après « J’accepte »', async () => {
    const d = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Prendre une photo' }))
    expect(screen.getByText(PHOTO_NOTICE)).toBeInTheDocument()
    expect(PHOTO_NOTICE).toContain('Halcya ne déduit jamais votre âge, votre genre, votre origine ni votre santé.')
    expect(d.openCamera).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'J’accepte, prendre la photo' }))
    await waitFor(() => expect(d.openCamera).toHaveBeenCalledTimes(1))
  })

  it('refuser le consentement mène au Studio, sans caméra ni envoi', () => {
    const d = setup({ start: 'info' })
    fireEvent.click(screen.getByRole('button', { name: 'Non merci, le faire à la main' }))
    expect(d.onStudio).toHaveBeenCalledWith(null)
    expect(d.openCamera).not.toHaveBeenCalled()
    expect(d.analyze).not.toHaveBeenCalled()
  })

  it('plus d’analyse ce mois-ci : pas de bouton photo, le Studio reste ouvert', () => {
    setup({ start: 'info', remaining: 0 })
    expect(screen.queryByRole('button', { name: 'J’accepte, prendre la photo' })).toBeNull()
    expect(screen.getByText('Plus d’analyse de photo ce mois-ci.')).toBeInTheDocument()
  })

  it('une photo, un envoi : les traits nommés, « À vérifier » sur la couleur des yeux, puis le Studio', async () => {
    const d = setup({ start: 'info' })
    fireEvent.click(screen.getByRole('button', { name: 'J’accepte, prendre la photo' }))
    await waitFor(() => expect(d.openCamera).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Prendre la photo' }))
    expect(await screen.findByRole('heading', { name: 'Voilà, c’est nous !' })).toBeInTheDocument()
    expect(d.analyze).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Yeux noisette')).toBeInTheDocument()
    expect(screen.getAllByText('À vérifier')).toHaveLength(1)
    expect(screen.getByText('Vérifiez la couleur des yeux dans le Studio.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ajuster dans le Studio' }))
    expect(d.onStudio).toHaveBeenCalledWith(LEA)
  })

  it('caméra refusée ou analyse en échec : « On le fait ensemble ? » ouvre le Studio', async () => {
    const d = setup({ start: 'info', analyze: vi.fn(async () => { throw new Error('L’analyse n’a pas abouti.') }) })
    fireEvent.click(screen.getByRole('button', { name: 'J’accepte, prendre la photo' }))
    await waitFor(() => expect(d.openCamera).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Prendre la photo' }))
    expect(await screen.findByRole('heading', { name: 'On le fait ensemble ?' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('L’analyse n’a pas abouti.')
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le Studio' }))
    expect(d.onStudio).toHaveBeenCalledWith(null)
  })
})
