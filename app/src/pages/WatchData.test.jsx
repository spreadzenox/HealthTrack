import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WatchData from './WatchData'

// Entrées synthétiques de la montre en direct (aucune mesure réelle)
const NOW = new Date(2026, 9, 22, 14, 0).getTime()
const at = (h) => new Date(2026, 9, 22, h).toISOString()
const ENTRIES = [
  { type: 'heart_rate', source: 'huawei_watch', at: at(10), payload: { value: 35, unit: 'ms', subtype: 'heartRateVariability', during: 'day' } },
  { type: 'body_temperature', source: 'huawei_watch', at: at(4), payload: { valueC: 33.6, subtype: 'skin' } },
]

const renderPage = (load) =>
  render(
    <MemoryRouter>
      <WatchData load={load} now={() => NOW} />
    </MemoryRouter>,
  )

describe('WatchData (écran « Montre », M5)', () => {
  beforeEach(() => localStorage.clear())

  it('liste chaque type : dernière valeur, nombre sur 7 jours, ou « rien »', async () => {
    const load = vi.fn(async () => ENTRIES)
    renderPage(load)
    expect(await screen.findByText('2 types sur 12 reçus ces 7 derniers jours')).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Données de la montre' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(13)
    expect(within(list).getByText('35 ms')).toBeInTheDocument()
    expect(within(list).getByText('33,6 °C')).toBeInTheDocument()
    expect(within(list).getAllByText('Rien reçu depuis 30 jours.').length).toBe(10)
    expect(within(list).getByText(/prévu dans une prochaine version/)).toBeInTheDocument()
    // Une seule lecture de la base, sur 30 jours
    expect(load).toHaveBeenCalledTimes(1)
    expect(load).toHaveBeenCalledWith(NOW)
  })

  it('montre l’issue de la dernière lecture de la synchro', async () => {
    localStorage.setItem(
      'healthtrack_watch_autosync',
      JSON.stringify({ readsAt: new Date(NOW - 2 * 3600_000).toISOString(), reads: [{ id: 'sleepFile', outcome: 'timeout', count: 0 }, { id: 'sleep', outcome: 'empty', count: 0 }] }),
    )
    renderPage(async () => [])
    expect(await screen.findByText('0 type sur 12 reçu ces 7 derniers jours')).toBeInTheDocument()
    expect(screen.getByText(/Dernière lecture par l’app/)).toBeInTheDocument()
    expect(screen.getAllByText(/dernière lecture : sans réponse/).length).toBeGreaterThan(0)
    expect(screen.getByText(/dernière lecture : vide/)).toBeInTheDocument()
  })

  it('dit quand la base ne peut pas être lue', async () => {
    renderPage(async () => {
      throw new Error('base fermée')
    })
    expect(await screen.findByText('Lecture impossible : base fermée')).toBeInTheDocument()
  })
})
