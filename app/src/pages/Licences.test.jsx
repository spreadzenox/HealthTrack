import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Licences from './Licences'
import More from './More'
import { featuresFor } from '../config/distribution'

describe('page Licences (LICENCES-TIERCES)', () => {
  it('liste les sections et relie chaque licence à son texte', () => {
    render(<Licences features={featuresFor('play')} />)
    expect(screen.getByRole('heading', { name: 'Licences' })).toBeInTheDocument()
    for (const t of ['Bibliothèques', 'Lecture du visage', 'Données sur les aliments']) {
      expect(screen.getByRole('heading', { name: t })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('link', { name: 'OFL-1.1' })[0]).toHaveAttribute('href', 'https://openfontlicense.org')
    expect(screen.queryByText(/HSEmotion/)).toBeNull()
  })

  it('est accessible depuis Réglages', () => {
    render(<MemoryRouter><More changelog={[]} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Licences/ })).toHaveAttribute('href', '/licences')
  })
})
