import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const dist = vi.hoisted(() => ({ play: false }))
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, get FEATURES() { return actual.featuresFor(dist.play ? 'play' : 'sideload') } }
})

import DoctorReportCard from './DoctorReportCard'

const pdf = { bytes: new Uint8Array([1]), fileName: 'Halcya-rapport-2026-10-27.pdf' }
const renderCard = (props) => render(<MemoryRouter><DoctorReportCard {...props} /></MemoryRouter>)

describe('DoctorReportCard', () => {
  beforeEach(() => {
    dist.play = false
    localStorage.clear()
  })

  it('sideload : préparer, choisir 12 semaines et le bien-être, puis créer et ranger dans Documents', async () => {
    const create = vi.fn(async () => pdf)
    const save = vi.fn(async () => ({ saved: 'documents', shared: true }))
    renderCard({ create, save })
    expect(screen.getByText('Rapport PDF pour mon médecin')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Préparer le rapport' }))

    // 4 semaines par défaut, bien-être décoché
    expect(screen.getByRole('radio', { name: '4 sem.' })).toBeChecked()
    const wellbeing = screen.getByRole('checkbox', { name: /bien-être estimé/ })
    expect(wellbeing).not.toBeChecked()

    fireEvent.click(screen.getByRole('radio', { name: '12 sem.' }))
    fireEvent.click(wellbeing)
    fireEvent.click(screen.getByRole('button', { name: 'Créer le PDF' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Halcya-rapport-2026-10-27.pdf est dans Documents'))
    expect(create).toHaveBeenCalledWith({ weeks: 12, includeWellbeing: true })
    expect(save).toHaveBeenCalledWith(pdf)
  })

  it('par défaut, le bien-être estimé n’est pas inclus', async () => {
    const create = vi.fn(async () => pdf)
    renderCard({ create, save: async () => ({ saved: 'download' }) })
    fireEvent.click(screen.getByRole('button', { name: 'Préparer le rapport' }))
    fireEvent.click(screen.getByRole('button', { name: 'Créer le PDF' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('téléchargé'))
    expect(create).toHaveBeenCalledWith({ weeks: 4, includeWellbeing: false })
  })

  it('erreur : message simple, rien de cassé', async () => {
    renderCard({ create: async () => { throw new Error('police introuvable') }, save: vi.fn() })
    fireEvent.click(screen.getByRole('button', { name: 'Préparer le rapport' }))
    fireEvent.click(screen.getByRole('button', { name: 'Créer le PDF' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('n’a pas pu être créé : police introuvable'))
  })

  it('play sans premium : « Débloquer » vers la page Premium, pas de création', () => {
    dist.play = true
    const create = vi.fn()
    renderCard({ create })
    expect(screen.getByRole('link', { name: 'Débloquer' })).toHaveAttribute('href', '/premium')
    expect(screen.queryByRole('button', { name: 'Préparer le rapport' })).not.toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })
})
