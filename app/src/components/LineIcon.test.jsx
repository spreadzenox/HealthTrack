import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LineIcon from './LineIcon'

describe('LineIcon', () => {
  it('dessine chaque icône en trait, cachée aux lecteurs d’écran', () => {
    for (const name of LineIcon.names) {
      const { container, unmount } = render(<LineIcon name={name} />)
      const svg = container.querySelector('svg')
      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(svg.querySelector('path, circle, rect')).not.toBeNull()
      unmount()
    }
  })
})
