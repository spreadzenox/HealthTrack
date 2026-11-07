import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Act from './Act'

const wrap = (data) => render(<MemoryRouter><Act read={async () => data} /></MemoryRouter>)

describe('Agir (ORG-1, ORG-1b)', () => {
  it('au départ : un état vide simple, et la phrase du rapport médecin', async () => {
    wrap({ challenges: [], gut: [], pistes: null })
    expect(await screen.findByText('Rien en cours pour l’instant')).toBeInTheDocument()
    expect(screen.getByText('Tous vos essais, vérifiés ou non, figurent dans votre rapport médecin.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
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
})
