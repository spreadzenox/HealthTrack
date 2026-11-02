import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Ordinal from './Ordinal'

describe('Ordinal (POL-PLAY-101)', () => {
  it('écrit « 1er » avec l’exposant', () => {
    const { container } = render(<Ordinal n={1} />)
    expect(container.textContent).toBe('1er')
    expect(container.querySelector('sup').textContent).toBe('er')
  })

  it('écrit « 21e » avec l’exposant', () => {
    const { container } = render(<Ordinal n={21} />)
    expect(container.textContent).toBe('21e')
    expect(container.querySelector('sup').textContent).toBe('e')
  })
})
