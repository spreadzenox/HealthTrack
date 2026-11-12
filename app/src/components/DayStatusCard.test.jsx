import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DayStatusCard from './DayStatusCard'

const now = new Date(2026, 10, 7, 12, 0)
const at = (h) => new Date(2026, 10, 7, h).toISOString()
const face = (note, extra = {}) => ({
  est: { day: { note, readings: 3, gut: null }, confidence: 'faible', ...extra },
  today: {
    points: [{ at: at(8), note: 2 }, { at: at(10), note: 3 }, { at: at(11), note: 4 }],
    trend: [{ at: at(8), note: 2.5 }, { at: at(10), note: 3 }, { at: at(11), note: 3.4 }],
  },
})
const view = (props) => render(<MemoryRouter><DayStatusCard now={now} {...props} /></MemoryRouter>)

describe('Bloc bien-être du jour (AUJ-2)', () => {
  it('rien pendant la lecture', () => {
    const { container } = view({ data: undefined })
    expect(container).toBeEmptyDOMElement()
  })

  it('la donnée, pas un verdict : valeur sur 5, nombre de lectures, courbe du jour ; toucher ouvre l’historique', () => {
    view({ data: face(3.25) })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Bien-être aujourd’hui')
    expect(document.querySelector('.day-status-number')).toHaveTextContent('3,6')
    expect(document.querySelector('.day-status-max')).toHaveTextContent('/5')
    expect(screen.getByText('D’après 3 lectures du visage')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Bien-être aujourd’hui/ })).toHaveAttribute('href', '/tendances?mesure=wellbeing&vue=jour')
    expect(document.querySelectorAll('.day-curve-dot')).toHaveLength(3)
    expect(document.querySelector('.day-curve-trend')).not.toBeNull()
    // Plus de verdict, d’échelle à segments, d’« estimation prudente » ni d’horizon qui respire
    expect(screen.queryByText(/Plutôt|difficile|prudente|Votre journée/)).not.toBeInTheDocument()
    expect(document.querySelector('.day-breath')).toBeNull()
    // AUJ-6 : un seul bouton, le petit « + » qui remonte au bandeau
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Ajouter une note de bien-être'])
  })

  it('MONO-VIRGULE : seuls les chiffres de la note sont en mono (« 3,6 », pas « 3 , 6 »)', () => {
    view({ data: face(3.25) })
    const monos = [...document.querySelectorAll('.day-status-value .mono')].map((m) => m.textContent)
    expect(monos).toEqual(['3', '6', '5'])
    expect(document.querySelector('.day-status-value').textContent).toBe('3,6/5')
  })

  it('VENTRE-BE-2 retiré : la digestion n’est plus citée dans la provenance', () => {
    view({ data: face(1.5, { day: { note: 1.5, readings: 2, gut: { level: 'discomfort' } } }) })
    expect(screen.getByText('D’après 2 lectures du visage')).toBeInTheDocument()
    expect(screen.queryByText(/digestive/)).toBeNull()
  })

  it('sans lecture du jour : les notes du jour en points et la dernière en valeur', () => {
    const entries = [
      { type: 'wellbeing', at: at(9), payload: { score: 2.5 } },
      { type: 'wellbeing', at: at(10), payload: { score: 1.25 } },
      { type: 'wellbeing', at: at(11), payload: { score: 3.75 } },
    ]
    view({ data: { est: { day: null } }, entries })
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText(/^Votre dernière note, à 11:00$/)).toBeInTheDocument()
    // POLISH-SIM-31 : les notes du jour se retrouvent aussi dans Tendances › Jour
    expect(screen.getByRole('link', { name: /Bien-être aujourd’hui/ })).toHaveAttribute('href', '/tendances?mesure=wellbeing&vue=jour')
    expect(document.querySelectorAll('.day-curve-dot')).toHaveLength(3)
    expect(document.querySelector('.day-curve-trend')).toBeNull()
  })

  it('moins de 3 points : pas de courbe (leçon 17)', () => {
    const data = face(3)
    data.today.points = data.today.points.slice(0, 2)
    data.today.trend = []
    view({ data })
    expect(document.querySelector('.day-curve')).toBeNull()
  })

  it('rien aujourd’hui : une phrase qui renvoie vers le bandeau, pas de lien vers l’historique', () => {
    view({ data: null, onAddManual: vi.fn() })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Bien-être aujourd’hui')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText(/Notez votre bien-être en haut/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'à activer dans Sources' })).toHaveAttribute('href', '/connectors')
    expect(screen.queryByRole('link', { name: /Bien-être aujourd’hui/ })).not.toBeInTheDocument()
  })

  it('lecture déjà active mais rien aujourd’hui : rien sur la caméra', () => {
    view({ data: { est: { day: null } }, onAddManual: () => {} })
    expect(screen.getByText(/Pas encore de lecture du visage aujourd’hui/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('le rappel discret de la lecture au déverrouillage remplace la phrase', () => {
    view({ data: null, onAddManual: () => {}, unlockReminder: true, onDismissReminder: () => {} })
    expect(screen.getByRole('note')).toHaveTextContent(/À chaque déverrouillage/)
    expect(screen.queryByText(/Notez votre bien-être/)).not.toBeInTheDocument()
  })
})
