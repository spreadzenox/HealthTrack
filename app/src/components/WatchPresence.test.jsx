import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WatchPresence from './WatchPresence'

const WATCH = { deviceId: 'AA:BB:CC:DD:EE:01', name: 'HUAWEI WATCH GT 6 Pro-A1B', type: 3, uuids: [] }

function setup({ supported = true, associations = [] } = {}) {
  window.__healthtrackFakeBtClassic = { listBonded: async () => ({ devices: [WATCH] }) }
  const state = { associations }
  window.__healthtrackFakeCompanion = {
    status: vi.fn(async () => ({ supported, associations: state.associations })),
    associate: vi.fn(async ({ deviceId }) => {
      state.associations = [{ id: 7, deviceId }]
      return { associated: true, id: 7 }
    }),
  }
  return window.__healthtrackFakeCompanion
}

describe('WatchPresence', () => {
  afterEach(() => {
    delete window.__healthtrackFakeBtClassic
    delete window.__healthtrackFakeCompanion
  })

  it('« Activer » associe la montre appairée, puis la ligne dit que c’est actif', async () => {
    const companion = setup()
    render(<WatchPresence />)
    fireEvent.click(await screen.findByRole('button', { name: 'Activer' }))
    expect(await screen.findByText(/^Synchro auto même app fermée \(reconnexion, déverrouillage, ~2 h\)$/)).toBeTruthy()
    expect(companion.associate).toHaveBeenCalledWith({ deviceId: WATCH.deviceId, name: WATCH.name })
    expect(screen.queryByRole('button', { name: 'Activer' })).toBeNull()
  })

  it('association refusée : message, bouton toujours là', async () => {
    const companion = setup()
    companion.associate.mockRejectedValueOnce(new Error('Association refusée'))
    render(<WatchPresence />)
    fireEvent.click(await screen.findByRole('button', { name: 'Activer' }))
    expect(await screen.findByText(/Non activé : Association refusée/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Activer' })).toBeTruthy()
  })

  it('Android trop ancien : rien d’affiché', async () => {
    const companion = setup({ supported: false })
    const { container } = render(<WatchPresence />)
    await vi.waitFor(() => expect(companion.status).toHaveBeenCalled())
    expect(container.textContent).toBe('')
  })
})
