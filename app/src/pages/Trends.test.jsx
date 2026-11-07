import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Trends from './Trends'

vi.mock('./WellbeingHistory', () => ({ default: ({ embedded, initialPeriod }) => <section data-testid="wb-day" data-embedded={String(embedded)} data-period={initialPeriod} /> }))

const NOW = new Date(2026, 10, 7, 20)
const band = (mean) => ({ mean, low: mean - 0.4, high: mean + 0.4, sd: 0.3 })
const states = {
  showDigestiveCurve: false,
  days: ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'].map((date, i) => ({
    date, future: false, observed: { wellbeing: i === 1, digestion: false }, wellbeing: band(3), digestion: band(3), digestionOwn: band(3),
  })).concat([{ date: '2026-11-08', future: true, observed: { wellbeing: false, digestion: false }, wellbeing: band(3), digestion: band(3), digestionOwn: band(3) }]),
}
const days = [4, 5, 6, 7].map((d) => ({ dateKey: `2026-11-0${d}`, summary: { sleepMinutes: 400 + d, steps: 6000 + d } }))

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Trends now={NOW} readDays={async () => days} readDayStates={async () => states} />
  </MemoryRouter>,
)

describe('Journal › Tendances (ORG-3)', () => {
  it('sous les onglets du Journal, une carte avec les mesures, « + » et Jour / Semaine / Mois', async () => {
    renderAt('/tendances')
    expect(screen.getByRole('navigation', { name: 'Journal' })).toBeInTheDocument()
    const chips = await screen.findByRole('list', { name: 'Mesures affichées' })
    expect(within(chips).getByText('Bien-être').closest('li')).toHaveAttribute('data-tone', 'mint')
    expect(screen.getByRole('button', { name: 'Semaine' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('img', { name: /Courbe de Bien-être/ })).toBeInTheDocument()
    expect(screen.queryByText('Votre forme')).toBeNull()
  })

  it('« + » ajoute une mesure qui a au moins 3 points ; un axe par unité', async () => {
    renderAt('/tendances')
    fireEvent.click(await screen.findByRole('button', { name: 'Ajouter une mesure' }))
    const menu = screen.getByRole('list', { name: 'Mesures à ajouter' })
    fireEvent.click(within(menu).getByRole('button', { name: /Sommeil/ }))
    expect(screen.getByRole('img', { name: 'Courbe de Bien-être, Sommeil' })).toBeInTheDocument()
  })

  it('toucher un jour passé montre sa valeur, jamais un « attendu » ; un jour futur, l’attendu et sa fourchette', async () => {
    renderAt('/tendances')
    await screen.findByRole('img', { name: /Courbe/ })
    fireEvent.click(screen.getByRole('button', { name: 'jeudi 5 novembre' }))
    const past = screen.getByRole('group', { name: /Détail du jeudi 5 novembre/ })
    expect(past).toHaveTextContent('noté')
    expect(past.textContent).not.toMatch(/attendu|habitudes/i)
    fireEvent.click(screen.getByRole('button', { name: 'dimanche 8 novembre' }))
    const future = screen.getByRole('group', { name: /Détail du dimanche 8 novembre/ })
    expect(future).toHaveTextContent('D’après vos habitudes')
    expect(future).toHaveTextContent(/à/)
  })

  it('?mesure=sommeil inconnue → bien-être ; ?vue=jour ouvre l’historique du jour (ORG-3b)', async () => {
    renderAt('/tendances?vue=jour')
    const day = await screen.findByTestId('wb-day')
    expect(day).toHaveAttribute('data-embedded', 'true')
    expect(day).toHaveAttribute('data-period', 'day')
    expect(screen.getByRole('button', { name: 'Jour' })).toHaveAttribute('aria-pressed', 'true')
  })
})
