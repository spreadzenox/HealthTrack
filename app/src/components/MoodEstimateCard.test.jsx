import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MoodEstimateCard from './MoodEstimateCard'

const NOW = new Date(2026, 9, 21, 12)
const estimate = {
  moment: { at: new Date(2026, 9, 21, 9).toISOString(), note: 3.4, low: 1.8, high: 5, label: 'plutôt bonne', today: true },
  day: { date: '2026-10-21', note: 3.4, low: 2.9, high: 3.9, label: 'plutôt bonne', readings: 4, quality: 0.9, framing: 6, spread: 0.4 },
  confidence: 'moyenne', model: 'va', baselineDays: 3, calibrationDays: 0, signals: ['visage'],
}
const days = [
  { date: '2026-10-17', note: 3 },
  { date: '2026-10-18', note: 2.8 },
  { date: '2026-10-19', note: 3.2 },
]

function renderCard(props) {
  return render(<BrowserRouter><MoodEstimateCard now={NOW} {...props} /></BrowserRouter>)
}

describe('MoodEstimateCard', () => {
  it('montre le bien-être estimé du jour en grand, l’écart à la moyenne, la courbe et la phrase simple', () => {
    renderCard({ data: { est: estimate, days } })
    expect(screen.getByText('Bien-être estimé')).toBeInTheDocument()
    expect(screen.getByText('3,4')).toBeInTheDocument()
    expect(screen.getByText('+0,4 vs moy.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /4 derniers jours estimés/ })).toBeInTheDocument()
    expect(screen.getByText('Un peu mieux que votre moyenne des 14 derniers jours. Une estimation, pas un diagnostic.')).toBeInTheDocument()
  })

  it('« détails » remplace la phrase par la fourchette, n, la moyenne et le modèle', () => {
    const toggle = vi.fn()
    const { rerender } = renderCard({ data: { est: estimate, days }, onToggleDetails: toggle })
    fireEvent.click(screen.getByRole('button', { name: 'détails' }))
    expect(toggle).toHaveBeenCalled()
    rerender(<BrowserRouter><MoodEstimateCard now={NOW} data={{ est: estimate, days }} details onToggleDetails={toggle} /></BrowserRouter>)
    expect(screen.getByText('2,9 – 3,9')).toBeInTheDocument()
    expect(screen.getByText('n = 4 aujourd’hui')).toBeInTheDocument()
    expect(screen.getByText('3,0 (3 j)')).toBeInTheDocument()
    expect(screen.getByText('deux modèles valence / éveil (HSEmotion)')).toBeInTheDocument()
    expect(screen.queryByText(/Un peu mieux/)).not.toBeInTheDocument()
  })

  it('sans lecture aujourd’hui, montre la dernière lecture sans la comparer', () => {
    renderCard({ data: { est: { ...estimate, day: null, moment: { ...estimate.moment, today: false } }, days } })
    expect(screen.getByText(/dernière lecture ·/)).toBeInTheDocument()
    expect(screen.queryByText(/vs moy\./)).not.toBeInTheDocument()
    expect(screen.getByText('Pas encore de lecture aujourd’hui. Une estimation, pas un diagnostic.')).toBeInTheDocument()
  })

  it('sans aucune lecture du visage, invite à l’activer dans Sources', () => {
    renderCard({ data: null })
    expect(screen.getByRole('link', { name: 'L’activer dans Sources' })).toHaveAttribute('href', '/connectors')
  })

  it('ne montre rien pendant la lecture', () => {
    const { container } = renderCard({ data: undefined })
    expect(container).toBeEmptyDOMElement()
  })
})
