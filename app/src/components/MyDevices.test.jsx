import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MyDevices from './MyDevices'
import { formatAgo } from '../utils/timeAgo'
import WatchGuides from './WatchGuides'
import { HEALTH_APPS } from '../devices/healthApps'

const NOW = new Date('2026-10-12T08:00:00Z')
const app = (id) => ({ ...HEALTH_APPS.find((a) => a.id === id), package: HEALTH_APPS.find((a) => a.id === id).packages[0] })
const hc = (sourceName, at, type) => ({ source: 'health_connect', at, type, payload: { sourceName } })

describe('MyDevices', () => {
  it('Huawei Health détecté sans passerelle : « À brancher », le guide Huawei s’ouvre, l’app s’ouvre', async () => {
    const openApp = vi.fn().mockResolvedValue()
    render(
      <>
        <MyDevices detect={async () => [app('huawei_health')]} loadEntries={async () => []} openApp={openApp} now={NOW} />
        <WatchGuides />
      </>,
    )
    expect(await screen.findByText('Huawei Health')).toBeInTheDocument()
    expect(screen.getByText('À brancher')).toBeInTheDocument()
    expect(screen.getByText(/Connecter ma montre/)).toBeInTheDocument()

    const guide = document.getElementById('guide-huawei')
    expect(guide.open).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Voir le guide' }))
    expect(guide.open).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir Huawei Health' }))
    expect(openApp).toHaveBeenCalledWith('com.huawei.health')
  })

  it('Gadgetbridge qui envoie : « Reçu » avec date et types, Huawei relayé, pas de bouton', async () => {
    render(
      <MyDevices
        detect={async () => [app('huawei_health'), app('gadgetbridge')]}
        loadEntries={async () => [hc('Gadgetbridge', '2026-10-12T05:00:00Z', 'sleep'), hc('Gadgetbridge', '2026-10-12T04:00:00Z', 'heart_rate')]}
        now={NOW}
      />,
    )
    expect(await screen.findByText('Reçu')).toBeInTheDocument()
    expect(screen.getByText('Relayé')).toBeInTheDocument()
    expect(screen.getByText(/Vos données passent par Gadgetbridge/)).toBeInTheDocument()
    expect(screen.getByText(/Dernières mesures il y a 3 h · cœur, sommeil/)).toBeInTheDocument()
    // Le badge « Reçu » suffit : pas de phrase qui le redit (D1).
    expect(screen.queryByText('Envoie ses données')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('qui envoie quoi : FC, VFC… détaillées, VFC arrêtée signalée, mesures de montre jamais reçues', async () => {
    const day = (i) => new Date(NOW.getTime() - i * 86400000 - 3600000).toISOString()
    const gb = (at, subtype) => ({ source: 'health_connect', at, type: 'heart_rate', payload: { sourceName: 'Gadgetbridge', subtype } })
    const entries = [
      ...Array.from({ length: 20 }, (_, i) => gb(day(i), 'heartRate')),
      ...Array.from({ length: 15 }, (_, i) => gb(day(i + 5), 'heartRateVariability')),
      hc('Gadgetbridge', day(0), 'sleep'),
    ]
    render(<MyDevices detect={async () => [app('gadgetbridge')]} loadEntries={async () => entries} now={NOW} />)
    expect(await screen.findByText(/Dernières mesures il y a 1 h · cœur, VFC, sommeil/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('VFC : plus rien depuis 5 jours')
    expect(screen.getByText(/Jamais reçu en 30 jours : FC repos, SpO₂, pas\./)).toBeInTheDocument()
  })

  it('navigateur (pas de détection) : sources réelles seulement, sans bouton « Ouvrir »', async () => {
    render(<MyDevices detect={async () => null} loadEntries={async () => [hc('Samsung Health', '2026-10-01T05:00:00Z', 'steps')]} now={NOW} />)
    expect(await screen.findByText('En pause')).toBeInTheDocument()
    expect(screen.getByText(/Apps qui ont envoyé des mesures/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ouvrir/ })).not.toBeInTheDocument()
  })

  it('rien du tout : explique ce que fera l’app Android', async () => {
    render(<MyDevices detect={async () => null} loadEntries={async () => []} now={NOW} />)
    expect(await screen.findByText(/repère tout seul vos apps de montre/)).toBeInTheDocument()
  })

  it('détection possible mais aucune app connue : renvoie vers les guides', async () => {
    render(<MyDevices detect={async () => []} loadEntries={async () => []} now={NOW} />)
    expect(await screen.findByText(/Aucune app de montre ou de santé connue/)).toBeInTheDocument()
  })

  it('une erreur de chargement ne casse pas la carte', async () => {
    render(<MyDevices detect={() => Promise.reject(new Error('x'))} loadEntries={() => Promise.reject(new Error('y'))} now={NOW} />)
    expect(await screen.findByText(/repère tout seul/)).toBeInTheDocument()
  })
})

describe('formatAgo', () => {
  it('formule en français', () => {
    expect(formatAgo('2026-10-12T07:30:00Z', NOW)).toBe('il y a moins d’une heure')
    expect(formatAgo('2026-10-12T03:00:00Z', NOW)).toBe('il y a 5 h')
    expect(formatAgo('2026-10-11T06:00:00Z', NOW)).toBe('hier')
    expect(formatAgo('2026-10-08T08:00:00Z', NOW)).toBe('il y a 4 jours')
  })
})
