import { describe, it, expect } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TodayBySource from './TodayBySource'
import { sourcesSentence } from '../services/today'

// MONO-CHIFFRES : la valeur est découpée (chiffres en mono) ; on la retrouve par son texte complet.
const valueEl = (t) => screen.getByText((_, el) => el?.classList?.contains('today-data-value') && el.textContent === t)

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
  { key: 'hrv', label: 'Variabilité cardiaque', value: null, sources: [] },
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
    const sleep = valueEl('7 h 32').closest('li')
    expect(sleep).toHaveAttribute('data-tone', 'night')
    expect(sleep.querySelector('[data-icon="moon"]')).not.toBeNull()
    expect(valueEl('3 456').closest('li')).toHaveAttribute('data-tone', 'lilac')
    expect(valueEl('45 min').closest('li')).toHaveAttribute('data-tone', 'stone')
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

  it('notes du jour : digestion en pêche seulement avec « Ma digestion » ; le bien-être reste dans sa carte (POLISH-SIM-40)', () => {
    const entries = [
      { type: 'wellbeing', at: at(9), payload: { score: 5 } },
      { type: 'gut', at: at(10), payload: { level: 'pain' } },
    ]
    const { unmount } = wrap({ entries, summary: { meals: 1 }, showGut: true })
    expect(screen.queryByText('5/5')).toBeNull()
    expect(screen.queryByText('Bien-être')).toBeNull()
    expect(screen.getByText('Douleur').closest('li')).toHaveAttribute('data-tone', 'peach')
    unmount()
    wrap({ entries, summary: { meals: 1 }, showGut: false })
    expect(screen.queryByText('Douleur')).toBeNull()
  })

  it('seulement une note de bien-être : pas de bloc (POLISH-SIM-40, doublon de la carte du dessus)', () => {
    const { container } = wrap({ entries: [{ type: 'wellbeing', at: at(9), payload: { score: 4 } }] })
    expect(container).toBeEmptyDOMElement()
  })

  it('dès 7 jours d’historique, l’écart à votre norme sur la mesure (flèche seulement si net)', async () => {
    wrap({ tiles: [{ ...tiles[0], value: '5 h 30' }], readNorms: async () => sleepHistory(330) })
    const row = valueEl('5 h 30').closest('li')
    await waitFor(() => expect(row).toHaveTextContent('d’habitude 7 h 10'))
    expect(within(row).getByLabelText('Nuit plus courte')).toHaveTextContent('↓')
  })

  it('mono pour les chiffres seulement : « h » et « ms » dans la police du texte (leçon 11, MONO-CHIFFRES)', async () => {
    wrap({ tiles: [{ ...tiles[0], value: '5 h 30' }], readNorms: async () => sleepHistory(330) })
    const row = valueEl('5 h 30').closest('li')
    await waitFor(() => expect(row).toHaveTextContent('d’habitude 7 h 10'))
    expect([...row.querySelectorAll('.mono:not(.today-data-arrow)')].map((s) => s.textContent)).toEqual(['5', '30', '7', '10'])
  })

  it('VFC reprise d’hier : son « d’habitude » aussi, comparé à la nuit d’hier (POLISH-SIM-22)', async () => {
    // 14 nuits de VFC vers 48 ms jusqu’au 20/10 ; rien encore pour la nuit du 21 (montre pas synchronisée)
    const hist = []
    for (let d = 6; d <= 20; d++) {
      const v = d === 20 ? 62 : 46 + (d % 3) * 2
      hist.push({ type: 'heart_rate', at: new Date(2026, 9, d, 4).toISOString(), payload: { subtype: 'heartRateVariability', value: v } })
    }
    wrap({ tiles: [{ key: 'hrv', label: 'Variabilité cardiaque', value: '62 ms', when: 'hier', sources: [] }], readNorms: async () => hist })
    const row = valueEl('62 ms').closest('li')
    await waitFor(() => expect(row).toHaveTextContent('d’habitude 48 ms'))
    expect(within(row).getByLabelText('Variabilité cardiaque de la nuit plus haute')).toHaveTextContent('↑')
  })

  it('une pesée du jour : ligne « Poids », couleur du corps, qui ouvre sa courbe (POLISH-SIM-84)', () => {
    wrap({ entries: [{ type: 'weight', source: 'health_connect', at: at(8), payload: { valueKg: 72.4 } }] })
    const row = valueEl('72,4 kg').closest('li')
    expect(row).toHaveAttribute('data-tone', 'rose')
    expect(within(row).getByText('Poids')).toBeInTheDocument()
    expect(within(row).getByRole('link')).toHaveAttribute('href', '/tendances?mesure=weight')
    expect(screen.getByText('D’après votre balance.')).toBeInTheDocument()
  })

  it('rien du jour : rien du tout (premier jour)', () => {
    const { container } = wrap({ tiles: tiles.map((t) => ({ ...t, value: null })) })
    expect(container).toBeEmptyDOMElement()
  })
})
