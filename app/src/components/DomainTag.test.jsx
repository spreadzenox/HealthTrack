import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DomainTag from './DomainTag'

describe('DomainTag (VENTRE-BE-1, retour (3) du 04/11)', () => {
  it('dit en toutes lettres « Ventre », en pêche', () => {
    render(<DomainTag domain="gut" />)
    const tag = screen.getByText('Digestion')
    expect(tag).toHaveClass('domain-tag', 'domain-tag--gut')
  })

  it('dit en toutes lettres « Bien-être », en menthe', () => {
    render(<DomainTag domain="wellbeing" />)
    expect(screen.getByText('Bien-être')).toHaveClass('domain-tag', 'domain-tag--wellbeing')
  })
})
