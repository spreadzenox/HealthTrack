import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomeGutObjective from './HomeGutObjective'
import { fromDisplay } from '../services/mood/wellbeingScale'

const NOW = new Date(2026, 10, 15, 12)
const DAY = 86_400_000
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const band = (v) => ({ mean: fromDisplay(v), low: fromDisplay(v - 0.3), high: fromDisplay(v + 0.3), sd: 0.1 })
const states = (digestion) => ({
  showDigestiveCurve: true,
  days: digestion.map((v, i) => ({
    date: key(new Date(NOW.getTime() - (digestion.length - 1 - i) * DAY)),
    future: false,
    observed: { wellbeing: false, digestion: v != null },
    wellbeing: band(3),
    digestion: band(v ?? 3),
    digestionOwn: band(v ?? 3),
  })),
})
const show = (s) => render(<MemoryRouter><HomeGutObjective read={() => Promise.resolve(s)} now={NOW} /></MemoryRouter>)

describe('Accueil : la carte Confort digestif sous l’île (brief § 4, constat du 25/11)', () => {
  it('après 14 jours notés : le score des 7 derniers jours et la tendance, comme dans Objectifs', async () => {
    show(states([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4]))
    const card = await screen.findByTestId('objective-digestion')
    expect(card).toHaveTextContent('Confort digestif')
    expect(card).toHaveTextContent('/ 5')
    expect(card).toHaveTextContent('Moyenne de vos 7 derniers jours')
    expect(card).toHaveAttribute('href', '/recommendations/ventre')
  })

  it('avant 14 jours : ce qu’il reste avant le premier score', async () => {
    show(states([3, null, 4, 4]))
    const card = await screen.findByTestId('objective-digestion')
    expect(card).toHaveTextContent('Premier score dans 11 jours notés')
    expect(card).not.toHaveTextContent('/ 5')
  })

  it('sans aucune donnée : la carte attend ses 14 jours, comme dans Objectifs', async () => {
    show(null)
    expect(await screen.findByTestId('objective-digestion')).toHaveTextContent('Premier score dans 14 jours notés')
  })
})
