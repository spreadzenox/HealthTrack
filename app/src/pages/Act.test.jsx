import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Act from './Act'

const wrap = (data) => render(<MemoryRouter><Act read={async () => ({ trialsData: null, results: null, ...data })} /></MemoryRouter>)

describe('Agir (ORG-1, ORG-1b)', () => {
  it('au départ : un état vide simple, et la phrase du rapport médecin', async () => {
    wrap({ challenges: [], gut: [], pistes: null })
    expect(await screen.findByText('Rien en cours pour l’instant')).toBeInTheDocument()
    expect(screen.getByText('Tous vos essais, vérifiés ou non, figurent dans votre rapport médecin.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
    // POLISH-SIM-5 : ce qui remplira l'écran, ce qu'est un essai, et où voir l'avancement
    expect(screen.getByText(/l’essayer ici quelques jours/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Où en sont vos analyses' })).toHaveAttribute('href', '/recommendations')
  })

  it('un groupe FODMAP repéré par une analyse digestive est proposé, avec « Commencer »', async () => {
    wrap({ challenges: [], gut: [], pistes: { gut: ['Fructanes → digestion'], levers: [] } })
    const section = await screen.findByRole('region', { name: 'Proposés par vos analyses' })
    const link = screen.getByRole('link', { name: /Tester les fructanes/ })
    expect(section).toContainElement(link)
    expect(link).toHaveAttribute('href', '/reintroduction')
    expect(link).toHaveTextContent('Commencer')
    expect(screen.queryByText('Rien en cours pour l’instant')).toBeNull()
  })

  it('ORG-8 : une piste d’Analyses se propose avec « Commencer » ; un essai en cours dit sa consigne du jour', async () => {
    const f = { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', actionable: true, net: true, outcome: 'wellbeing', horizon: 'short', effect: 0.4, low: 0.2, high: 0.6, center: 420, usualChange: { amount: 30, text: '30 min de sommeil de plus' } }
    const results = { outcomes: { wellbeing: { status: 'ready', beatsPersistence: true, horizons: { short: { id: 'short', label: 'Court terme', status: 'ready', daysHave: 30, daysNeeded: 14, factors: [f] } } } } }
    const { unmount } = wrap({ challenges: [], gut: [], pistes: null, results })
    const section = await screen.findByRole('region', { name: 'Proposés par vos analyses' })
    expect(section).toHaveTextContent('Tester : sommeil')
    expect(screen.getByRole('button', { name: 'Commencer' })).toBeInTheDocument()
    unmount()
  })
})
