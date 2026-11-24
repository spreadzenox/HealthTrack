import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Version iOS : tant que la lecture du visage n'existe pas sur iPhone (étape I7), la carte le dit simplement
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

import FaceSenseCard from './FaceSenseCard'

describe('Carte « Lecture du visage » sur iPhone', () => {
  it('sans module natif : « Bientôt sur iPhone », pas d’erreur ni de renvoi vers Android', () => {
    render(<FaceSenseCard plugin={null} />)
    expect(screen.getByText('Bientôt sur iPhone.')).toBeInTheDocument()
    expect(screen.queryByText(/app Android/)).not.toBeInTheDocument()
  })
})
