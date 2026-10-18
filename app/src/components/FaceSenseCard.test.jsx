import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FaceSenseCard from './FaceSenseCard'

const base = { models: true, enabled: true, permission: true, running: true, batteryExempt: true, dayUnlocks: 3, dayBursts: 3, dayFaces: 2 }

function fake(initial) {
  let state = { ...initial }
  return {
    status: vi.fn(async () => ({ ...state })),
    start: vi.fn(async () => {
      state = { ...state, enabled: true, running: true, permission: true }
      return { started: true, permission: true }
    }),
    stop: vi.fn(async () => {
      state = { ...state, enabled: false, running: false }
    }),
    test: vi.fn(async () => {}),
    requestBatteryExemption: vi.fn(async () => {}),
  }
}

describe('FaceSenseCard', () => {
  beforeEach(() => localStorage.clear())

  it('hors de l’app Android : explication seule', () => {
    render(<FaceSenseCard plugin={null} />)
    expect(screen.getByText('Lecture du visage')).toBeInTheDocument()
    expect(screen.getByText('Disponible dans l’app Android.')).toBeInTheDocument()
    expect(screen.getByText(/puis les efface/)).toBeInTheDocument()
  })

  it('désactivée → Activer démarre le service', async () => {
    const plugin = fake({ ...base, enabled: false, running: false })
    render(<FaceSenseCard plugin={plugin} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Activer la lecture du visage' }))
    await waitFor(() => expect(plugin.start).toHaveBeenCalled())
    expect(await screen.findByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Aujourd’hui : 3 déverrouillages, 3 lectures, visage lu 2 fois.')).toBeInTheDocument()
  })

  it('active : comptes, jamais de score ; diagnostic et désactivation', async () => {
    const plugin = fake({ ...base, values: { smile: 0.42 }, lastOutcome: 'face' })
    const save = vi.fn(async () => 'ok enregistré')
    render(<FaceSenseCard plugin={plugin} save={save} />)
    expect(await screen.findByText('Active')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/0[.,]42/)
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le diagnostic' }))
    await waitFor(() => expect(save).toHaveBeenCalled())
    const [json, filename] = save.mock.calls[0]
    expect(filename).toMatch(/^healthtrack-visage-.*\.json$/)
    expect(JSON.parse(json).kind).toBe('healthtrack-face-diagnostic')
    expect(json).not.toMatch(/smile/)
    fireEvent.click(screen.getByRole('button', { name: 'Désactiver' }))
    await waitFor(() => expect(plugin.stop).toHaveBeenCalled())
    expect(await screen.findByRole('button', { name: 'Activer la lecture du visage' })).toBeInTheDocument()
  })

  it('arrêtée par Android : Relancer en un geste', async () => {
    const plugin = fake({ ...base, running: false })
    render(<FaceSenseCard plugin={plugin} />)
    expect(await screen.findByText('Arrêtée')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Relancer' }))
    await waitFor(() => expect(plugin.start).toHaveBeenCalled())
    expect(await screen.findByText('Active')).toBeInTheDocument()
  })

  it('batterie optimisée : bouton « Sans restriction »', async () => {
    const plugin = fake({ ...base, batteryExempt: false })
    render(<FaceSenseCard plugin={plugin} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Sans restriction' }))
    expect(plugin.requestBatteryExemption).toHaveBeenCalled()
  })

  it('caméra refusée à l’activation : message, rien d’activé', async () => {
    const plugin = fake({ ...base, enabled: false, running: false })
    plugin.start = vi.fn(async () => ({ started: false, permission: false }))
    render(<FaceSenseCard plugin={plugin} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Activer la lecture du visage' }))
    expect(await screen.findByText('Accès à la caméra refusé : rien n’a été activé.')).toBeInTheDocument()
  })
})
