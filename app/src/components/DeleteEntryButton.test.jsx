import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DeleteEntryButton from './DeleteEntryButton'
import { isDeletableEntry } from '../utils/entries'

vi.mock('../storage/localHealthStorage', () => ({
  deleteEntry: vi.fn(),
}))

describe('isDeletableEntry', () => {
  it('autorise les saisies faites dans l’app', () => {
    expect(isDeletableEntry({ source: 'app_food' })).toBe(true)
    expect(isDeletableEntry({ source: 'app_cigarette' })).toBe(true)
    expect(isDeletableEntry({ source: 'app_wellbeing' })).toBe(true)
  })

  it('refuse les données synchronisées (elles reviendraient à la prochaine synchro)', () => {
    expect(isDeletableEntry({ source: 'health_connect' })).toBe(false)
    expect(isDeletableEntry({ source: 'withings' })).toBe(false)
    expect(isDeletableEntry({})).toBe(false)
  })
})

describe('DeleteEntryButton', () => {
  let deleteEntry
  beforeEach(async () => {
    ;({ deleteEntry } = await import('../storage/localHealthStorage'))
    deleteEntry.mockReset()
    deleteEntry.mockResolvedValue()
  })

  it('demande une confirmation avant de supprimer', () => {
    render(<DeleteEntryButton entryId={7} label="ce repas" />)
    fireEvent.click(screen.getByRole('button', { name: /Supprimer ce repas/i }))
    expect(deleteEntry).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Confirmer/i })).toBeInTheDocument()
  })

  it('« Annuler » ne supprime rien', () => {
    render(<DeleteEntryButton entryId={7} label="ce repas" />)
    fireEvent.click(screen.getByRole('button', { name: /Supprimer ce repas/i }))
    fireEvent.click(screen.getByRole('button', { name: /Annuler/i }))
    expect(deleteEntry).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Supprimer ce repas/i })).toBeInTheDocument()
  })

  it('supprime après confirmation, prévient les autres écrans et le parent', async () => {
    const onDeleted = vi.fn()
    const events = []
    const listener = () => events.push('updated')
    window.addEventListener('health-entries-updated', listener)
    render(<DeleteEntryButton entryId={7} label="ce repas" onDeleted={onDeleted} />)
    fireEvent.click(screen.getByRole('button', { name: /Supprimer ce repas/i }))
    fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }))
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(7))
    expect(deleteEntry).toHaveBeenCalledWith(7)
    expect(events).toEqual(['updated'])
    window.removeEventListener('health-entries-updated', listener)
  })

  it('affiche une erreur si la suppression échoue', async () => {
    deleteEntry.mockRejectedValue(new Error('boom'))
    const onDeleted = vi.fn()
    render(<DeleteEntryButton entryId={7} label="ce repas" onDeleted={onDeleted} />)
    fireEvent.click(screen.getByRole('button', { name: /Supprimer ce repas/i }))
    fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Suppression impossible/i)
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
