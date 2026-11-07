import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DayStatusCard from './DayStatusCard'

const now = new Date(2026, 10, 7, 12, 0)
const at = (h) => new Date(2026, 10, 7, h).toISOString()
const est = (note, extra = {}) => ({ est: { day: { note, readings: 3, gut: null }, confidence: 'bonne', ...extra } })
const view = (props) => render(<MemoryRouter><DayStatusCard now={now} {...props} /></MemoryRouter>)

describe('DayStatusCard (TESTEUR-1c)', () => {
  it('rien pendant la lecture', () => {
    const { container } = view({ data: undefined })
    expect(container).toBeEmptyDOMElement()
  })

  it('« Votre journée » et le titre ; toucher le haut ouvre l’historique ; un segment de l’échelle allumé', () => {
    view({ data: est(3.4), onAddManual: () => {} })
    const h = screen.getByRole('heading', { level: 2 })
    expect(h).toHaveTextContent('Votre journée')
    expect(h).toHaveTextContent('Plutôt bonne')
    expect(screen.getByRole('link', { name: /Votre journée/ })).toHaveAttribute('href', '/bien-etre')
    const on = document.querySelectorAll('.day-status-segments .is-on')
    expect(on).toHaveLength(1)
    expect([...on[0].parentElement.children].indexOf(on[0])).toBe(3) // 4 sur 5
    expect(screen.getByText('D’après votre visage aujourd’hui.')).toBeInTheDocument()
    expect(screen.getByText('3 lectures du visage')).toBeInTheDocument()
    expect(screen.queryByText(/ventre/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Noter moi-même' })).toBeInTheDocument()
  })

  it('le ventre n’apparaît que s’il a été compté (VENTRE-BE-2)', () => {
    view({ data: { est: { day: { note: 1.5, readings: 2, gut: { level: 'discomfort' } }, confidence: 'moyenne' } } })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Plus difficile')
    expect(screen.getByText('ventre : gêne comptée')).toBeInTheDocument()
  })

  it('sans lecture du jour : la note du jour fait le statut', () => {
    const entries = [{ type: 'wellbeing', at: at(9), payload: { score: 2.5 } }]
    view({ data: { est: { day: null, moment: { note: 4 } } }, entries })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Plutôt moyenne')
    expect(screen.getByText(/^D’après votre note de 09:00\.$/)).toBeInTheDocument()
  })

  it('pas encore d’avis : une phrase, un seul bouton, pas de lien vers l’historique', () => {
    const onAddManual = vi.fn()
    view({ data: null, onAddManual })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Pas encore d’avis')
    expect(screen.getAllByRole('button')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Noter comment je me sens' }))
    expect(onAddManual).toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'à activer dans Sources' })).toHaveAttribute('href', '/connectors')
    expect(screen.queryByRole('link', { name: /Votre journée/ })).not.toBeInTheDocument()
  })

  it('pas encore d’avis avec la lecture déjà active : rien sur la caméra', () => {
    view({ data: { est: { day: null, moment: { note: 3 } } }, onAddManual: () => {} })
    expect(screen.getByText(/Pas encore de lecture du visage aujourd’hui/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('le rappel discret de la lecture au déverrouillage remplace la phrase', () => {
    view({ data: null, onAddManual: () => {}, unlockReminder: true, onDismissReminder: () => {} })
    expect(screen.getByRole('note')).toHaveTextContent(/À chaque déverrouillage/)
    expect(screen.queryByText(/Dites comment/)).not.toBeInTheDocument()
  })
})
