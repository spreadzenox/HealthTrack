import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'play', FEATURES: actual.featuresFor('play') }
})

import More from './More'

describe('More page — variante play', () => {
  it('ne parle ni de cigarettes ni de diagnostic dans la ligne Paramètres (VC-14)', () => {
    render(<MemoryRouter><More changelog={[]} /></MemoryRouter>)
    const link = screen.getByRole('link', { name: /Paramètres/ })
    expect(link).not.toHaveTextContent(/cigarette/i)
    expect(link).not.toHaveTextContent(/diagnostic/i)
    expect(link).toHaveTextContent(/Apparence/)
  })
})
