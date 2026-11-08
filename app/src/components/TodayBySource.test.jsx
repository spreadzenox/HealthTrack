import { describe, it, expect } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TodayBySource from './TodayBySource'
import { sourcesSentence } from '../services/today'

const NOW = new Date(2026, 9, 21, 12)
const at = (h) => new Date(2026, 9, 21, h).toISOString()
const noHistory = async () => []
const wrap = (props) => render(
  <BrowserRouter>
    <TodayBySource now={NOW} entries={[]} summary={null} tiles={[]} readNorms={noHistory} {...props} />
  </BrowserRouter>,
)

const tiles = [
  { key: 'sleep', label: 'Sommeil', value: '7 h 32', when: 'cette nuit', sources: ['Health Connect · Garmin'] },
  { key: 'hrv', label: 'VFC nuit', value: null, sources: [] },
  { key: 'steps', label: 'Pas', value: '3 456', when: null, sources: ['Health Connect'] },
]

/** 14 nuits de 7 h 10 environ, puis la nuit du jour (21/10), en entrées `sleep`. */
function sleepHistory(todayMinutes) {
  const out = []
  for (let d = 7; d <= 21; d++) {
    const min = d === 21 ? todayMinutes : 420 + (d % 3) * 10
    const end = new Date(2026, 9, d, 7)
    out.push({ type: 'sleep', at: new Date(end.getTime() - min * 60000).toISOString(), payload: { durationMinutes: min, endAt: end.toISOString() } })
  }
  return out
}

describe('TodayBySource — « Vos données du jour » (AUJ-3)', () => {
  it('un seul bloc, une ligne par mesure avec son icône et la couleur de son thème', () => {
    wrap({ tiles, summary: { screenMinutes: 45 } })
    expect(screen.getByRole('heading', { name: 'Vos données du jour' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Montre' })).toBeNull()
    const sleep = screen.getByText('7 h 32').closest('li')
    expect(sleep).toHaveAttribute('data-tone', 'night')
    expect(sleep.querySelector('[data-icon="moon"]')).not.toBeNull()
    expect(screen.getByText('3 456').closest('li')).toHaveAttribute('data-tone', 'lilac')
    expect(screen.getByText('45 min').closest('li')).toHaveAttribute('data-tone', 'stone')
  })

  it('chaque ligne ouvre sa courbe dans Tendances (POLISH-SIM-2)', () => {
    wrap({ tiles, summary: { screenMinutes: 45 } })
    expect(screen.getByRole('link', { name: /Sommeil.*7 h 32/ })).toHaveAttribute('href', '/tendances?mesure=sleep')
    expect(screen.getByRole('link', { name: /Pas.*3 456/ })).toHaveAttribute('href', '/tendances?mesure=steps')
    expect(screen.getByRole('link', { name: /Temps d’écran.*45 min/ })).toHaveAttribute('href', '/tendances?mesure=screen')
  })

  it('le confort digestif ouvre la courbe « digestion »', () => {
    wrap({ entries: [{ type: 'gut', at: at(10), payload: { level: 'pain' } }], showGut: true })
    const link = screen.getAllByRole('link').find((l) => l.getAttribute('href')?.startsWith('/tendances'))
    expect(link).toHaveAttribute('href', '/tendances?mesure=digestion')
  })

  it('les sources une fois, en bas, sans nom d’appareil ni d’app', () => {
    wrap({ tiles, summary: { screenMinutes: 45 } })
    expect(screen.getByText('D’après votre montre et votre téléphone.')).toBeInTheDocument()
    expect(screen.queryByText(/Garmin|Health Connect/)).toBeNull()
    expect(sourcesSentence(['watch', 'phone', 'noted'])).toBe('D’après votre montre, votre téléphone et vos notes.')
  })

  it('sans montre : un lien discret vers Sources', () => {
    wrap({ tiles: [tiles[2]] })
    expect(screen.getByRole('link', { name: /Ajouter une montre/ })).toHaveAttribute('href', '/connectors')
  })

  it('notes du jour : bien-être en menthe, digestion en pêche seulement avec « Ma digestion »', () => {
    const entries = [
      { type: 'wellbeing', at: at(9), payload: { score: 5 } },
      { type: 'gut', at: at(10), payload: { level: 'pain' } },
    ]
    const { unmount } = wrap({ entries, summary: { meals: 1 }, showGut: true })
    expect(screen.getByText('5/5').closest('li')).toHaveAttribute('data-tone', 'mint')
    expect(screen.getByText('Douleur').closest('li')).toHaveAttribute('data-tone', 'peach')
    unmount()
    wrap({ entries, summary: { meals: 1 }, showGut: false })
    expect(screen.queryByText('Douleur')).toBeNull()
  })

  it('dès 7 jours d’historique, l’écart à votre norme sur la mesure (flèche seulement si net)', async () => {
    wrap({ tiles: [{ ...tiles[0], value: '5 h 30' }], readNorms: async () => sleepHistory(330) })
    const row = screen.getByText('5 h 30').closest('li')
    await waitFor(() => expect(row).toHaveTextContent('d’habitude 7 h 10'))
    expect(within(row).getByLabelText('Nuit plus courte')).toHaveTextContent('↓')
  })

  it('rien du jour : rien du tout (premier jour)', () => {
    const { container } = wrap({ tiles: tiles.map((t) => ({ ...t, value: null })) })
    expect(container).toBeEmptyDOMElement()
  })
})
