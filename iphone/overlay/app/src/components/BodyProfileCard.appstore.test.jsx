import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Version iOS (HealthTrack-iOS) : un poids et une masse grasse venus de l'app Santé sont dits « (app Santé, …) »,
// jamais « saisi le … » (correctif 35). Depuis Android v852 (TESTEUR-4d), la provenance s'affiche au toucher de la valeur
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

import BodyProfileCard from './BodyProfileCard'
import { DEFAULT_ACTIVITY } from '../services/nutrientReferenceIntakes'

function profile(origins) {
  return {
    weightKg: 77.2, heightCm: 178, activity: DEFAULT_ACTIVITY, stepsDays: 0,
    weightAt: new Date(2026, 9, 28, 7).toISOString(),
    origins: { weight: 'default', height: 'default', sex: 'default', age: 'default', activity: 'default', ...origins },
  }
}

const show = (p, composition = null) => render(
  <MemoryRouter><BodyProfileCard profile={p} composition={composition} onSaved={() => {}} /></MemoryRouter>,
)

describe('profil de Nutrition sur iPhone : poids et masse grasse de l’app Santé', () => {
  beforeEach(() => localStorage.clear())

  it('poids de l’app Santé : « (app Santé, 28/10) », pas « saisi »', () => {
    show(profile({ weight: 'health' }))
    fireEvent.click(screen.getByRole('button', { name: '77,2 kg' }))
    expect(screen.getByText('(app Santé, 28/10)')).toBeInTheDocument()
    expect(screen.queryByText(/saisi le/)).toBeNull()
  })

  it('poids saisi : toujours « (saisi le 28/10) »', () => {
    show(profile({ weight: 'manual' }))
    fireEvent.click(screen.getByRole('button', { name: '77,2 kg' }))
    expect(screen.getByText('(saisi le 28/10)')).toBeInTheDocument()
  })

  it('masse grasse de l’app Santé : « (app Santé) », pas « (Withings) »', () => {
    show(profile({ weight: 'health' }), { fatRatioPct: 21.2, source: 'health_connect' })
    fireEvent.click(screen.getByRole('button', { name: /Masse grasse/ }))
    expect(screen.getByText('(app Santé)')).toBeInTheDocument()
    expect(screen.queryByText('(Withings)')).toBeNull()
  })
})
