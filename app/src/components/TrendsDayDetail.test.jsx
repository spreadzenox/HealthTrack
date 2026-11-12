import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MoodMap, ContributionBars } from './TrendsDayDetail'

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

describe('ContributionBars', () => {
  it('POLISH-SIM-34 : un lien pas assez net dans Analyses est hachuré, chiffre en gris, et la légende le dit', () => {
    const items = [
      { key: 'weather_sunshine_h', label: 'Soleil', theme: 'context', horizon: 'short', points: -1.43, value: 8, usual: 3, net: false },
      { key: 'steps', label: 'Pas', theme: 'activity', horizon: 'short', points: 0.3, value: 9000, usual: 7000, net: true },
    ]
    const { container, getByText } = render(<ContributionBars items={items} />)
    const [sun, steps] = container.querySelectorAll('.tdd-contrib li')
    expect(sun).toHaveClass('is-unsure')
    expect(steps).not.toHaveClass('is-unsure')
    expect(sun.querySelector('.tdd-contrib-value')).toHaveAttribute('aria-label', '−1,43 pt, pas assez net')
    expect(getByText('hachuré, chiffre en gris : pas assez net')).toBeInTheDocument()
  })

  it('sans lien incertain, pas de légende ; un ancien calcul sans « net » reste plein', () => {
    const items = [{ key: 'steps', label: 'Pas', theme: 'activity', horizon: 'short', points: 0.3, value: 9000, usual: 7000 }]
    const { container } = render(<ContributionBars items={items} />)
    expect(container.querySelector('.is-unsure')).toBeNull()
    expect(container.textContent).not.toMatch(/pas assez net/)
  })
})
