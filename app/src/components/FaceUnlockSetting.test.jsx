import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FaceUnlockSetting from './FaceUnlockSetting'

const fake = (status) => ({
  status: vi.fn(async () => status),
  stopUnlock: vi.fn(async () => { status.unlock = false }),
})
const play = { enabled: true, running: true, mode: 'app_open', unlockAvailable: true }
const renderIt = (plugin) => render(<MemoryRouter><FaceUnlockSetting plugin={plugin} /></MemoryRouter>)

describe('FaceUnlockSetting (Paramètres, POL-1c)', () => {
  it('rien sans plugin, en sideload ou sans l’interrupteur de build', async () => {
    const { container, rerender } = renderIt(null)
    expect(container).toBeEmptyDOMElement()
    const sideload = fake({ enabled: true, running: true, mode: 'unlock' })
    rerender(<MemoryRouter><FaceUnlockSetting plugin={sideload} /></MemoryRouter>)
    await waitFor(() => expect(sideload.status).toHaveBeenCalled())
    expect(screen.queryByText('Lecture au déverrouillage')).toBeNull()
    const noSwitch = fake({ ...play, unlockAvailable: false, unlock: true })
    rerender(<MemoryRouter><FaceUnlockSetting plugin={noSwitch} /></MemoryRouter>)
    await waitFor(() => expect(noSwitch.status).toHaveBeenCalled())
    expect(screen.queryByText('Lecture au déverrouillage')).toBeNull()
  })

  it('active : l’interrupteur la coupe (stopUnlock seul), sans rien effacer', async () => {
    const plugin = fake({ ...play, unlock: true })
    renderIt(plugin)
    const sw = await screen.findByRole('switch', { name: /chaque déverrouillage/ })
    expect(sw).toBeChecked()
    expect(screen.getByText('Active à chaque déverrouillage')).toBeInTheDocument()
    fireEvent.click(sw)
    await waitFor(() => expect(plugin.stopUnlock).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(/Coupée/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Sources/ })).toHaveAttribute('href', '/connectors')
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('en pause : se coupe aussi d’ici', async () => {
    const plugin = fake({ ...play, running: false, unlock: true })
    renderIt(plugin)
    expect(await screen.findByText('En pause (arrêtée par Android)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch'))
    await waitFor(() => expect(plugin.stopUnlock).toHaveBeenCalled())
  })

  it('coupée : on ne peut pas l’allumer d’ici (divulgation dans Sources)', async () => {
    const plugin = { ...fake({ ...play, unlock: false }), start: vi.fn() }
    renderIt(plugin)
    expect(await screen.findByText(/Coupée/)).toBeInTheDocument()
    expect(screen.queryByRole('switch')).toBeNull()
    expect(plugin.start).not.toHaveBeenCalled()
  })
})
