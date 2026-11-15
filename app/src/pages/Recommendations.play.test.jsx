import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'play', FEATURES: actual.featuresFor('play') }
})

import Recommendations from './Recommendations'

const f = (key, label, effect, theme) => ({
  key, label, theme, actionable: true, outcome: 'wellbeing', horizon: 'short', effect, low: effect - 0.15, high: effect + 0.15, net: true,
  usualChange: { amount: 50, unit: 'min', text: '50 min de sommeil de plus' }, perUnit: 0.01, center: 400, days: 30,
})
const results = {
  outcomes: {
    wellbeing: {
      status: 'partial', beatsPersistence: true, daysToFirst: 0,
      horizons: { short: { id: 'short', label: 'Court terme', window: 'le jour même et la veille', status: 'ready', daysHave: 30, daysNeeded: 14, factors: [f('sleepMinutes', 'Sommeil', 0.6, 'sleep')] } },
    },
  },
}

describe('Détail d’un objectif, variante play sans abonnement (REFONTE-6b)', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, premium: false, source: null }) }))
  })

  it('les familles ne disent rien de plus que les pistes floutées', async () => {
    render(<MemoryRouter><Recommendations read={async () => results} /></MemoryRouter>)
    expect(await screen.findByRole('link', { name: 'Débloquer' })).toHaveAttribute('href', '/premium')
    expect(screen.queryByRole('region', { name: 'Par famille' })).toBeNull()
    expect(document.body.textContent).not.toMatch(/Lien fort/)
  })
})
