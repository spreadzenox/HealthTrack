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

const ex = (sad) => ({ exHappiness: 0.2, exNeutral: 0.4, exSurprise: 0.05, exSadness: sad, exAnger: 0.05, exFear: 0.05, exDisgust: 0.05, exContempt: 0.2 - sad + 0.05 })
const burst = (d, h, sad, arousal) => ({ type: 'face_burst', at: new Date(2026, 10, d, h).toISOString(), payload: { trigger: 'unlock', valid: 3, values: { valence: 0, arousal, ...ex(sad) } } })
const face = [
  ...[1, 2, 3, 4].flatMap((d) => [burst(d, 9, 0.05, 0.1), burst(d, 17, 0.05, 0.2)]),
  burst(5, 9, 0.15, -0.3), burst(5, 13, 0.15, -0.2),
  { type: 'wellbeing', at: new Date(2026, 10, 5, 21).toISOString(), payload: { score: 2.5 } },
]
const contributions = { wellbeing: { '2026-11-05': [
  { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', horizon: 'short', points: -0.4, value: 300, usual: 420 },
  { key: 'steps', label: 'Pas', theme: 'activity', horizon: 'short', points: 0.2, value: 9000, usual: 7000 },
] } }

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Trends now={NOW} readDays={async () => days} readDayStates={async () => states}
      readFaceEntries={async () => face} readDayContributions={async () => contributions} />
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

  it('ORG-3c : un jour passé dit ses lectures et sa note, l’étoile des expressions, humeur et éveil, et ce qui a pu peser', async () => {
    renderAt('/tendances')
    await screen.findByRole('img', { name: /Courbe/ })
    fireEvent.click(screen.getByRole('button', { name: 'jeudi 5 novembre' }))
    const detail = screen.getByRole('group', { name: /Détail du jeudi 5 novembre/ })
    expect(detail).toHaveTextContent('2 lectures du visage')
    expect(detail).toHaveTextContent('note 3 /5')
    expect(within(detail).getByRole('img', { name: /Expressions du visage : .*Tristesse 15 %/ })).toBeInTheDocument()
    expect(detail).toHaveTextContent('Plus de tristesse')
    expect(within(detail).getByRole('img', { name: 'Humeur et éveil : 2 lectures' })).toBeInTheDocument()
    expect(detail).toHaveTextContent('Éveil plutôt calme, moins que d’habitude')
    const weigh = within(detail).getByRole('region', { name: 'Ce qui a pu peser ce jour-là' })
    expect(within(weigh).getByText('Sommeil').closest('li')).toHaveAttribute('data-tone', 'night')
    expect(weigh).toHaveTextContent('−0,4')
    expect(detail.textContent).not.toMatch(/diagnostic|cause/i)
  })

  it('?mesure=sommeil inconnue → bien-être ; ?vue=jour ouvre l’historique du jour (ORG-3b)', async () => {
    renderAt('/tendances?vue=jour')
    const day = await screen.findByTestId('wb-day')
    expect(day).toHaveAttribute('data-embedded', 'true')
    expect(day).toHaveAttribute('data-period', 'day')
    expect(screen.getByRole('button', { name: 'Jour' })).toHaveAttribute('aria-pressed', 'true')
  })
})
