import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MoodEstimateCard from './MoodEstimateCard'

const estimate = {
  moment: { at: new Date().toISOString(), note: 3.4, low: 1.8, high: 5, label: 'plutôt bonne', today: true },
  day: { date: '2026-10-19', note: 3.4, low: 1.8, high: 5, label: 'plutôt bonne', readings: 4, quality: 0.9, framing: 6, spread: 0.4 },
  confidence: 'faible', model: 'prior', baselineDays: 3, calibrationDays: 0, signals: ['visage'],
}

describe('MoodEstimateCard', () => {
  it('shows the estimated well-being of the day with its range and confidence, as an estimate', async () => {
    render(<MoodEstimateCard load={async () => estimate} />)
    expect(await screen.findByText('Bien-être estimé')).toBeInTheDocument()
    expect(screen.getByText('Confiance faible')).toBeInTheDocument()
    expect(screen.getByText(/Bien-être estimé aujourd’hui : plutôt bonne, ≈ 3,4 \/ 5 \(entre 1,8 et 5,0\)/)).toBeInTheDocument()
    expect(screen.getByText(/4 lectures aujourd’hui, visage bien cadré, lectures concordantes/)).toBeInTheDocument()
    expect(screen.getByText(/vos notes, facultatives, l’affineront\. Une estimation, pas un diagnostic/)).toBeInTheDocument()
  })

  it('renders nothing without any reading (no lock message either)', async () => {
    const { container } = render(<MoodEstimateCard load={async () => null} />)
    await new Promise((r) => setTimeout(r, 0))
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing if the history cannot be read', async () => {
    const { container } = render(<MoodEstimateCard load={async () => { throw new Error('idb') }} />)
    await new Promise((r) => setTimeout(r, 0))
    expect(container).toBeEmptyDOMElement()
  })
})
