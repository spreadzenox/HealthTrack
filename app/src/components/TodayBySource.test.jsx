import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TodayBySource from './TodayBySource'

const NOW = new Date(2026, 9, 21, 12)
const at = (h) => new Date(2026, 9, 21, h).toISOString()
const wrap = (props) => render(<BrowserRouter><TodayBySource now={NOW} entries={[]} summary={null} tiles={[]} {...props} /></BrowserRouter>)

const tiles = [
  { key: 'sleep', label: 'Sommeil', value: '7 h 32', when: 'cette nuit', sources: ['Health Connect · Garmin'] },
  { key: 'hrv', label: 'VFC nuit', value: null, sources: [] },
  { key: 'steps', label: 'Pas', value: '3 456', when: null, sources: ['Health Connect'] },
]

describe('TodayBySource (TESTEUR-1d-b)', () => {
  it('une carte par source, avec l’appareil d’où viennent les chiffres', () => {
    wrap({ tiles, summary: { screenMinutes: 45 } })
    expect(screen.getByRole('heading', { name: 'Vos données du jour' })).toBeInTheDocument()
    const watch = screen.getByRole('region', { name: 'Montre' })
    expect(within(watch).getByText('7 h 32')).toBeInTheDocument()
    expect(within(watch).getByText('Garmin')).toBeInTheDocument()
    expect(within(watch).queryByText('—')).toBeNull()
    const phone = screen.getByRole('region', { name: 'Téléphone' })
    expect(within(phone).getByText('3 456')).toBeInTheDocument()
    expect(within(phone).getByText('45 min')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Ajouter une montre/ })).toBeNull()
  })

  it('sans montre : pas de carte Montre, un lien discret vers Sources', () => {
    wrap({ tiles: [tiles[2]] })
    expect(screen.queryByRole('region', { name: 'Montre' })).toBeNull()
    expect(screen.getByRole('link', { name: /Ajouter une montre/ })).toHaveAttribute('href', '/connectors')
  })

  it('« Noté par vous » : bien-être en menthe, ventre en pêche seulement avec « Ma digestion »', () => {
    const entries = [
      { type: 'wellbeing', at: at(9), payload: { score: 5 } },
      { type: 'gut', at: at(10), payload: { level: 'pain' } },
    ]
    const { unmount } = wrap({ entries, summary: { meals: 1 }, showGut: true })
    const noted = screen.getByRole('region', { name: 'Noté par vous' })
    expect(within(noted).getByText('5/5').closest('li')).toHaveAttribute('data-theme', 'mint')
    expect(within(noted).getByText('Douleur').closest('li')).toHaveAttribute('data-theme', 'peach')
    expect(within(noted).getByText('Repas').closest('li')).not.toHaveAttribute('data-theme')
    unmount()
    wrap({ entries, summary: { meals: 1 }, showGut: false })
    expect(screen.queryByText('Douleur')).toBeNull()
  })

  it('rien du jour : rien du tout (premier jour)', () => {
    const { container } = wrap({ tiles: tiles.map((t) => ({ ...t, value: null })) })
    expect(container).toBeEmptyDOMElement()
  })
})
