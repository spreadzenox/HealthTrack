import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DayChanges from './DayChanges'

// Mercredi 21 octobre 2026, 12 h (heure locale)
const NOW = new Date(2026, 9, 21, 12)
const at = (d, h = 7) => new Date(2026, 9, d, h).toISOString()

/** Nuits (fin le jour d) et VFC sur `days` jours passés, puis aujourd'hui. */
function entries(days, todaySleep) {
  const out = []
  for (let i = 1; i <= days; i++) {
    const d = 21 - i
    out.push({ type: 'sleep', source: 'health_connect', at: at(d - 1, 23), payload: { durationMinutes: 420 + (i % 3) * 10, endDate: at(d) } })
  }
  if (todaySleep) out.push({ type: 'sleep', source: 'health_connect', at: at(20, 23), payload: { durationMinutes: todaySleep, endDate: at(21) } })
  return out
}

const wrap = (list) => render(<DayChanges now={NOW} read={async () => list} />)

describe('DayChanges (TESTEUR-1d-2)', () => {
  it('masquée avant 7 jours de mesures', async () => {
    const { container } = wrap(entries(5, 300))
    await new Promise((r) => setTimeout(r, 20))
    expect(container).toBeEmptyDOMElement()
  })

  it('une ligne par écart, avec « d’habitude » en mono, sans couleur de jugement', async () => {
    wrap(entries(14, 330))
    expect(await screen.findByRole('heading', { name: 'Ce qui change aujourd’hui' })).toBeInTheDocument()
    expect(screen.getByText('Nuit plus courte')).toBeInTheDocument()
    expect(screen.getByText('5 h 30')).toBeInTheDocument()
    expect(screen.getByText('d’habitude 7 h 10')).toBeInTheDocument()
    const html = document.body.innerHTML
    expect(html).not.toMatch(/success|danger|warning|is-good|is-bad|color-(red|green)/)
  })

  it('rien d’inhabituel : une phrase calme', async () => {
    wrap(entries(14, 430))
    expect(await screen.findByText('Une journée comme les autres pour vos mesures.')).toBeInTheDocument()
  })
})
