import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import FormeSection from './FormeSection'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn().mockResolvedValue([]),
}))

describe('FormeSection', () => {
  it('un seul titre « Votre forme » et une seule explication de méthode pour radar, cœur et sommeil', async () => {
    render(<BrowserRouter><FormeSection /></BrowserRouter>)
    expect(screen.getByRole('heading', { name: 'Votre forme' })).toBeInTheDocument()
    // Le bloc cœur s'affiche (état vide) une fois chargé.
    expect(await screen.findByText(/Ajoutez une montre/)).toBeInTheDocument()
    expect(screen.getAllByText('Comment c’est calculé')).toHaveLength(1)
    expect(screen.getByText(/pas un diagnostic/i)).toBeInTheDocument()
    expect(screen.queryByText('Votre cœur vs votre norme')).not.toBeInTheDocument()
    expect(screen.queryByText('Régularité du sommeil')).not.toBeInTheDocument()
  })
})
