import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import DayBreath from './DayBreath'
import { BREATH_CURVES } from './dayBreathCurves'
import DayStatusCard from './DayStatusCard'

const css = readFileSync('src/components/DayBreath.css', 'utf8')
const now = new Date(2026, 10, 7, 12, 0)

describe('DayBreath (TESTEUR-1e, horizon qui respire)', () => {
  it('décoratif : aria-hidden, aucun texte lisible', () => {
    const { container } = render(<DayBreath level="good" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(container.textContent).toBe('')
  })

  it('la pente suit le statut : monte, plate, descend', () => {
    const endY = (lvl) => {
      const nums = BREATH_CURVES[lvl].match(/-?\d+(\.\d+)?/g).map(Number)
      return { start: nums[1], end: nums[nums.length - 1] }
    }
    // en SVG, y plus petit = plus haut
    expect(endY('good').end).toBeLessThan(endY('good').start)
    expect(endY('medium').end).toBe(endY('medium').start)
    expect(endY('hard').end).toBeGreaterThan(endY('hard').start)
    const { container } = render(<DayBreath level="hard" />)
    expect(container.querySelector('.day-breath-curve')).toHaveAttribute('d', BREATH_CURVES.hard)
    expect(container.querySelector('.day-breath')).toHaveAttribute('data-level', 'hard')
  })

  it('rien sans statut', () => {
    const { container } = render(<DayBreath level={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('immobile avec « réduire les animations »', () => {
    const block = css.split('@media (prefers-reduced-motion: reduce)')[1]
    expect(block).toBeTruthy()
    for (const cls of ['.day-breath-disc', '.day-breath-dot']) expect(block).toContain(cls)
    expect(block).toMatch(/animation:\s*none/)
  })

  it('le point ambre est un accent graphique, jamais du texte ; les disques sont menthe', () => {
    expect(css).toMatch(/\.day-breath-dot[^}]*fill:\s*var\(--accent-amber\)/)
    expect(css).toMatch(/\.day-breath-disc[^}]*fill:\s*var\(--mint-label\)/)
  })

  it('présent dans la carte « Votre journée » quand il y a un statut, absent sinon', () => {
    const est = { est: { day: { note: 3.4, readings: 3, gut: null }, confidence: 'bonne' } }
    const { container, unmount } = render(<MemoryRouter><DayStatusCard now={now} data={est} /></MemoryRouter>)
    expect(container.querySelector('.day-breath[data-level="good"]')).toBeInTheDocument()
    unmount()
    const empty = render(<MemoryRouter><DayStatusCard now={now} data={null} /></MemoryRouter>)
    expect(empty.container.querySelector('.day-breath')).not.toBeInTheDocument()
  })
})
