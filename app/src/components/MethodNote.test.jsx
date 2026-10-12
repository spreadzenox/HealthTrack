import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MethodNote from './MethodNote'

describe('MethodNote', () => {
  it('replie l’explication derrière « Comment c’est calculé »', () => {
    render(<MethodNote>Moyenne des 7 derniers jours.</MethodNote>)
    const details = screen.getByText('Comment c’est calculé').closest('details')
    expect(details).not.toHaveAttribute('open')
    expect(details).toHaveTextContent('Moyenne des 7 derniers jours.')
  })
})
