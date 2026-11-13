import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SnapshotRestore from './SnapshotRestore'
import { SNAPSHOT_FILE } from './snapshot.js'

// Version iOS (HealthTrack-iOS) : la copie de secours se restaure par le même aperçu que « Importer »
describe('Restaurer la copie de secours', () => {
  it('copie présente : un bouton daté, qui la passe à l’import comme un fichier choisi', async () => {
    const read = vi.fn(async () => ({ text: '{"entries":[]}', savedAt: '2026-10-27T10:00:00Z' }))
    const onChoose = vi.fn()
    render(<SnapshotRestore read={read} onChoose={onChoose} now={new Date('2026-10-27T13:00:00Z')} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Restaurer la copie de secours (il y a 3 h)' }))
    const file = onChoose.mock.calls[0][0]
    expect(file.name).toBe(SNAPSHOT_FILE)
    expect(await file.text()).toBe('{"entries":[]}')
  })

  it('pas de copie : rien', async () => {
    const read = vi.fn(async () => null)
    const { container } = render(<SnapshotRestore read={read} onChoose={vi.fn()} />)
    await Promise.resolve()
    expect(read).toHaveBeenCalled()
    expect(container).toBeEmptyDOMElement()
  })
})
