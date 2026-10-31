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
    expect(screen.getByText('Un peu mieux que votre moyenne des 14 derniers jours.')).toBeInTheDocument()
  })

  it('le chevron ouvre des détails visuels : fourchette, badge de confiance, lectures, moyenne, modèle', () => {
    const toggle = vi.fn()
    const { rerender, container } = renderCard({ data: { est: estimate, days }, onToggleDetails: toggle })
    const chevron = screen.getByRole('button', { name: 'Afficher les détails' })
    expect(chevron).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(chevron)
    expect(toggle).toHaveBeenCalled()
    rerender(<BrowserRouter><MoodEstimateCard now={NOW} data={{ est: estimate, days }} details onToggleDetails={toggle} /></BrowserRouter>)
    expect(screen.getByRole('button', { name: 'Masquer les détails' })).toHaveAttribute('aria-expanded', 'true')
    expect(container.querySelector('.mood-range-band')).not.toBeNull()
    expect(screen.getByText('entre 2,9 et 3,9')).toBeInTheDocument()
    expect(screen.getByText('confiance moyenne')).toBeInTheDocument()
    expect(container.querySelectorAll('.mood-confidence-dots .is-on')).toHaveLength(2)
    expect(screen.getByText('4 lectures auj.')).toBeInTheDocument()
    expect(screen.getByText('moy. 3,0 · 3 j')).toBeInTheDocument()
    expect(screen.getByText('deux modèles valence / éveil (HSEmotion)')).toBeInTheDocument()
    // la phrase simple reste : les détails s'ajoutent, ils ne remplacent plus
    expect(screen.getByText(/Un peu mieux/)).toBeInTheDocument()
  })

  it('« Noter moi-même » ouvre la note manuelle, aussi sans lecture du visage', () => {
    const add = vi.fn()
    const { rerender } = renderCard({ data: { est: estimate, days }, onAddManual: add })
    fireEvent.click(screen.getByRole('button', { name: 'Noter moi-même' }))
    expect(add).toHaveBeenCalledTimes(1)
    rerender(<BrowserRouter><MoodEstimateCard now={NOW} data={null} onAddManual={add} /></BrowserRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Noter moi-même' }))
    expect(add).toHaveBeenCalledTimes(2)
  })

  it('« Historique » ouvre l’historique du bien-être (POL-2)', () => {
    renderCard({ data: { est: estimate, days } })
    expect(screen.getByRole('link', { name: 'Historique' })).toHaveAttribute('href', '/bien-etre')
  })

  it('sans lecture aujourd’hui, montre la dernière lecture sans la comparer', () => {
    renderCard({ data: { est: { ...estimate, day: null, moment: { ...estimate.moment, today: false } }, days } })
    expect(screen.getByText(/dernière lecture ·/)).toBeInTheDocument()
    expect(screen.queryByText(/vs moy\./)).not.toBeInTheDocument()
    expect(screen.getByText('Pas encore de lecture aujourd’hui.')).toBeInTheDocument()
  })

  it('sans aucune lecture du visage, invite à l’activer dans Sources', () => {
    renderCard({ data: null })
    expect(screen.getByRole('link', { name: 'L’activer dans Sources' })).toHaveAttribute('href', '/connectors')
  })

  it('ne montre rien pendant la lecture', () => {
    const { container } = renderCard({ data: undefined })
    expect(container).toBeEmptyDOMElement()
  })

  describe('rappel de la lecture au déverrouillage (POL-PLAY-84)', () => {
    it('absent par défaut', () => {
      renderCard({ data: { est: estimate, days } })
      expect(screen.queryByRole('note')).toBeNull()
    })

    it('une ligne discrète vers Sources, fermable ; aucun chiffre de précision', () => {
      const dismiss = vi.fn()
      renderCard({ data: { est: estimate, days }, unlockReminder: true, onDismissReminder: dismiss })
      const note = screen.getByRole('note')
      expect(note).toHaveTextContent('À chaque déverrouillage, bien plus de lectures')
      expect(note.textContent).not.toMatch(/%/)
      expect(screen.getByRole('link', { name: 'Voir dans Sources' })).toHaveAttribute('href', '/connectors')
      fireEvent.click(screen.getByRole('button', { name: 'Ne plus afficher ce rappel' }))
      expect(dismiss).toHaveBeenCalledTimes(1)
      fireEvent.click(screen.getByRole('link', { name: 'Voir dans Sources' }))
      expect(dismiss).toHaveBeenCalledTimes(2)
    })

    it('sans lecture : le rappel remplace l’invitation générique (pas deux fois la même chose)', () => {
      renderCard({ data: null, unlockReminder: true, onDismissReminder: () => {} })
      expect(screen.getByRole('note')).toBeInTheDocument()
      expect(screen.queryByText('L’activer dans Sources')).toBeNull()
    })
  })
})
