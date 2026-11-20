import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const platform = vi.hoisted(() => ({ id: 'android' }))
vi.mock('@capacitor/core', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, Capacitor: { ...actual.Capacitor, getPlatform: () => platform.id } }
})

import BodyProfileCard from './BodyProfileCard'

// Un poids lu dans Health Connect (Santé sur iPhone) n'est pas « saisi » par la personne (DEM-IOS-10).
const profile = (weightOrigin, extra = {}) => ({
  weightKg: 77.2,
  heightCm: 178,
  sex: 'M',
  age: 40,
  activity: 'moderate',
  weightAt: new Date(2026, 9, 28, 7).toISOString(),
  origins: { weight: weightOrigin, height: 'manual', sex: 'manual', age: 'manual', activity: 'manual' },
  ...extra,
})

function hintOf(weightOrigin, composition) {
  render(<MemoryRouter><BodyProfileCard profile={profile(weightOrigin)} composition={composition} onSaved={() => {}} /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: /77,2\s*kg/ }))
}

describe('BodyProfileCard : d’où vient le poids', () => {
  beforeEach(() => {
    localStorage.clear()
    platform.id = 'android'
  })

  it('un poids de Health Connect le dit, avec sa date', () => {
    hintOf('health')
    expect(screen.getByText('(Health Connect, 28/10)')).toBeTruthy()
    expect(screen.queryByText(/saisi le/)).toBeNull()
  })

  it('sur iPhone, il vient de l’app Santé', () => {
    platform.id = 'ios'
    hintOf('health')
    expect(screen.getByText('(app Santé, 28/10)')).toBeTruthy()
  })

  it('un poids tapé dans l’app reste « saisi le »', () => {
    hintOf('manual')
    expect(screen.getByText('(saisi le 28/10)')).toBeTruthy()
  })

  it('la masse grasse de Health Connect le dit aussi', () => {
    render(<MemoryRouter><BodyProfileCard profile={profile('health')} composition={{ fatRatioPct: 21.2, source: 'health_connect' }} onSaved={() => {}} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Masse grasse/ }))
    expect(screen.getByText('(Health Connect)')).toBeTruthy()
  })
})
