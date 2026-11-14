import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TrendsDayDetail, { MoodMap, ContributionBars } from './TrendsDayDetail'

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

describe('TrendsDayDetail, « Ce qui a pu peser ce jour-là » (POLISH-SIM-71)', () => {
  const c = (key, points, extra = {}) => ({ key, label: key, theme: 'sleep', horizon: 'short', points, value: 300, usual: 420, ...extra })
  const region = () => screen.getByRole('region', { name: 'Ce qui a pu peser ce jour-là' })

  it('dit sur quelle note portent les points', () => {
    const { unmount } = render(<TrendsDayDetail face={null} contributions={[c('sleepMinutes', -0.4)]} outcome="wellbeing" value={3.1} />)
    expect(region()).toHaveTextContent('Sur votre bien-être, en points sur 5.')
    unmount()
    render(<TrendsDayDetail face={null} contributions={[c('sleepMinutes', -0.4)]} outcome="digestion" value={3.1} />)
    expect(region()).toHaveTextContent('Sur votre confort digestif, en points sur 5.')
  })

  it('n’affiche pas un effet de moins de 0,05 pt', () => {
    render(<TrendsDayDetail face={null} contributions={[c('sleepMinutes', -0.4), c('restingHR', -0.02), c('hrv_ms', 0.01)]} outcome="digestion" value={3} />)
    expect(within(region()).getAllByRole('listitem')).toHaveLength(1)
    expect(region().textContent).not.toMatch(/0,0[12] pt/)
  })

  it('tous les effets sont négligeables : une phrase, aucune barre', () => {
    render(<TrendsDayDetail face={null} contributions={[c('restingHR', -0.02), c('hrv_ms', -0.01)]} outcome="digestion" value={2} />)
    expect(within(region()).queryAllByRole('listitem')).toHaveLength(0)
    expect(region()).toHaveTextContent('Rien de marquant ce jour-là parmi ce que Halcya compare.')
  })

  it('note basse et seulement des « + » : dit que rien ne l’explique', () => {
    render(<TrendsDayDetail face={null} contributions={[c('steps', 0.39), c('sleepMinutes', 0.11)]} outcome="wellbeing" value={1.4} />)
    expect(region()).toHaveTextContent('Rien de ce que Halcya compare n’explique cette note basse.')
  })

  it('note basse avec un « − » affiché, ou note ordinaire : pas de phrase en plus', () => {
    const { unmount } = render(<TrendsDayDetail face={null} contributions={[c('steps', 0.39), c('sleepMinutes', -0.3)]} outcome="wellbeing" value={1.4} />)
    expect(region().textContent).not.toMatch(/explique|marquant/)
    unmount()
    render(<TrendsDayDetail face={null} contributions={[c('steps', 0.39)]} outcome="wellbeing" value={3.6} />)
    expect(region().textContent).not.toMatch(/explique|marquant/)
  })

  it('sans contribution calculée, le bloc reste absent', () => {
    render(<TrendsDayDetail face={null} contributions={[]} outcome="wellbeing" value={1.4} />)
    expect(screen.queryByRole('region', { name: 'Ce qui a pu peser ce jour-là' })).toBeNull()
  })
})
