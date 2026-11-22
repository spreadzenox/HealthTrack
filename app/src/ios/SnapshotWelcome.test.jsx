import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SnapshotWelcome from './SnapshotWelcome'

// Version iOS (HealthTrack-iOS) : si iOS a repris la base faute de place, la copie de secours reste sur l'iPhone ;
// l'onboarding revient et la propose d'emblée (ni la base ni la copie ne sont dans la sauvegarde iCloud)
const copie = { text: '{"entries":[1,2,3]}', savedAt: '2026-10-27T10:00:00Z' }
const parse = () => ({ entries: [1, 2, 3] })
const now = new Date('2026-10-27T13:00:00Z')

function setup(overrides = {}) {
  const props = {
    read: vi.fn(async () => copie),
    count: vi.fn(async () => 0),
    parse,
    importBackup: vi.fn(async () => ({ imported: 3, skipped: 0, invalid: 0, profileRestored: true })),
    restoreSettings: vi.fn(() => []),
    now,
    ...overrides,
  }
  return { props, ...render(<SnapshotWelcome {...props} />) }
}

describe('copie de secours proposée au premier écran de l’onboarding', () => {
  it('base vide et copie présente : la propose, datée, avec son nombre de mesures', async () => {
    setup()
    expect(await screen.findByText(/Une copie de secours de vos données est sur ce téléphone/)).toBeInTheDocument()
    expect(screen.getByText(/3 mesures, enregistrée il y a 3 h/)).toBeInTheDocument()
  })

  it('« Reprendre mes données » : même import que « Ajouter » de Vos données, puis l’onboarding continue', async () => {
    const onEntries = vi.fn()
    window.addEventListener('health-entries-updated', onEntries)
    const { props } = setup()
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre mes données' }))
    expect(await screen.findByRole('status')).toHaveTextContent('3 mesures reprises, avec votre profil.')
    expect(props.importBackup).toHaveBeenCalledWith(copie.text, { merge: true })
    expect(onEntries).toHaveBeenCalled()
    window.removeEventListener('health-entries-updated', onEntries)
  })

  it('« Commencer sans » : la carte disparaît, rien n’est importé', async () => {
    const { props, container } = setup()
    fireEvent.click(await screen.findByRole('button', { name: 'Commencer sans' }))
    expect(container).toBeEmptyDOMElement()
    expect(props.importBackup).not.toHaveBeenCalled()
  })

  it('base déjà remplie, pas de copie ou copie vide : rien', async () => {
    for (const overrides of [{ count: vi.fn(async () => 12) }, { read: vi.fn(async () => null) }, { parse: () => ({ entries: [] }) }]) {
      const { props, container, unmount } = setup(overrides)
      await waitFor(() => expect(props.read).toHaveBeenCalled())
      await Promise.resolve()
      expect(container).toBeEmptyDOMElement()
      unmount()
    }
  })

  it('un import qui échoue le dit, sans bloquer l’onboarding', async () => {
    setup({ importBackup: vi.fn(async () => { throw new Error('fichier illisible') }) })
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre mes données' }))
    expect(await screen.findByRole('status')).toHaveTextContent('La copie n’a pas pu être reprise (fichier illisible)')
  })
})

describe('réglages repris avec la copie', () => {
  it('« Reprendre » rétablit aussi les réglages gardés dans la copie, et le dit', async () => {
    const { props } = setup({ restoreSettings: vi.fn(() => ['healthtrack_theme', 'healthtrack_evening_note']) })
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre mes données' }))
    expect(await screen.findByRole('status')).toHaveTextContent('3 mesures reprises, avec votre profil et vos réglages.')
    expect(props.restoreSettings).toHaveBeenCalledWith(copie.text)
  })
})
