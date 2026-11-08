import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MoodMap } from './TrendsDayDetail'

describe('MoodMap', () => {
  const points = [{ v: 0.2, a: -0.1 }, { v: -0.3, a: 0.4 }]

  it('écrit « désagréable » et « agréable » à l’horizontale, de part et d’autre du carré (maquette)', () => {
    const { container } = render(<MoodMap points={points} day={{ v: 0, a: 0.1 }} habit={null} />)
    const edges = [...container.querySelectorAll('.tdd-map-edge')]
    const left = edges.find((t) => t.textContent === 'désagréable')
    const right = edges.find((t) => t.textContent === 'agréable')
    expect(left.getAttribute('transform')).toBeNull()
    expect(right.getAttribute('transform')).toBeNull()
    expect(left.getAttribute('text-anchor')).toBe('end')
    expect(right.getAttribute('text-anchor')).toBe('start')
    const frame = container.querySelector('.tdd-map-frame')
    const fx = Number(frame.getAttribute('x'))
    const fw = Number(frame.getAttribute('width'))
    expect(Number(left.getAttribute('x'))).toBeLessThan(fx)
    expect(Number(right.getAttribute('x'))).toBeGreaterThan(fx + fw)
    // la place des libellés à gauche et à droite reste dans le dessin
    const [, , vw] = container.querySelector('svg').getAttribute('viewBox').split(' ').map(Number)
    expect(fx).toBeGreaterThanOrEqual(56)
    expect(vw - (fx + fw)).toBeGreaterThanOrEqual(46)
  })

  it('garde un point par lecture et la moyenne du jour', () => {
    const { container } = render(<MoodMap points={points} day={{ v: 0, a: 0 }} habit={{ v: 0, a: 0, sv: 0.2, sa: 0.2 }} />)
    expect(container.querySelectorAll('.tdd-map-dot')).toHaveLength(2)
    expect(container.querySelectorAll('.tdd-map-mean')).toHaveLength(1)
    expect(container.querySelectorAll('.tdd-map-habit')).toHaveLength(1)
  })
})
