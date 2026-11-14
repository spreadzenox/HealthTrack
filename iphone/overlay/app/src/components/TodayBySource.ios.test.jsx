import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TodayBySource from './TodayBySource'
import { defaultTrendsView } from '../services/trendsData'

// Version iOS (HealthTrack-iOS), correctif 56 : sur l'Accueil, la ligne « Variabilité cardiaque (SDNN) » (la VFC de l'app Santé, que
// le correctif 30 range sous la clé `hrv`) ouvre sa courbe SDNN dans Tendances, pas la « Variabilité cardiaque » vide sur iPhone.
const NOW = new Date(2026, 10, 9, 10)
const wrap = (tiles, readNorms = async () => []) => render(
  <BrowserRouter>
    <TodayBySource now={NOW} entries={[]} summary={null} tiles={tiles} readNorms={readNorms} />
  </BrowserRouter>,
)

describe('Accueil : la VFC de l’app Santé ouvre sa courbe (iPhone)', () => {
  it('« Variabilité cardiaque (SDNN) » mène à /tendances?mesure=hrvSdnn, en rose comme la VFC', () => {
    wrap([
      { key: 'sleep', label: 'Sommeil', value: '6 h 30', when: 'cette nuit', sources: ['Santé · Apple Watch'] },
      { key: 'hrv', label: 'Variabilité cardiaque (SDNN)', value: '51 ms', when: 'hier', sources: ['Santé · Apple Watch'] },
    ])
    const link = screen.getByRole('link', { name: /Variabilité cardiaque \(SDNN\).*51 ms/ })
    expect(link).toHaveAttribute('href', '/tendances?mesure=hrvSdnn')
    expect(link.closest('li')).toHaveAttribute('data-tone', 'rose')
    expect(screen.getByRole('link', { name: /Sommeil.*6 h 30/ })).toHaveAttribute('href', '/tendances?mesure=sleep')
    expect(defaultTrendsView({ asked: 'hrvSdnn' })).toEqual({ period: 'week', keys: ['hrvSdnn'] })
  })

  it('la VFC nuit (RMSSD) garde sa courbe', () => {
    wrap([{ key: 'hrv', label: 'Variabilité cardiaque', value: '42 ms', when: 'cette nuit', sources: ['Santé'] }])
    expect(screen.getByRole('link', { name: /Variabilité cardiaque.*42 ms/ })).toHaveAttribute('href', '/tendances?mesure=hrv')
  })

  // Correctif 57 (Android v937, POLISH-SIM-22 : la VFC d'hier a son « d'habitude ») : sur iPhone, la VFC de l'app
  // Santé (SDNN) est comparée à sa propre habitude en SDNN, jamais à la RMSSD
  it('« Variabilité cardiaque (SDNN) » d’hier : « d’habitude » en SDNN', async () => {
    const hist = []
    for (let d = 24; d <= 31; d++) {
      hist.push({ type: 'heart_rate', at: new Date(2026, 9, d, 4).toISOString(), payload: { subtype: 'heartRateVariabilitySdnn', value: 46 + (d % 3) * 2 } })
    }
    for (let d = 1; d <= 8; d++) {
      const v = d === 8 ? 70 : 46 + (d % 3) * 2
      hist.push({ type: 'heart_rate', at: new Date(2026, 10, d, 4).toISOString(), payload: { subtype: 'heartRateVariabilitySdnn', value: v } })
      // Une RMSSD très différente le même jour ne compte jamais dans l'habitude de la SDNN
      hist.push({ type: 'heart_rate', at: new Date(2026, 10, d, 5).toISOString(), payload: { subtype: 'heartRateVariability', value: 20 } })
    }
    wrap([{ key: 'hrv', label: 'Variabilité cardiaque (SDNN)', value: '70 ms', when: 'hier', sources: ['Santé · Apple Watch'] }], async () => hist)
    // Android v960 (MONO-CHIFFRES) découpe la valeur (chiffres en mono) : on la retrouve par son texte complet
    const row = screen.getByText((_, el) => el?.classList?.contains('today-data-value') && el.textContent.replace(/\s+/g, ' ') === '70 ms').closest('li')
    await waitFor(() => expect(row).toHaveTextContent('d’habitude 48 ms'))
    expect(within(row).getByLabelText('Variabilité cardiaque plus haute')).toHaveTextContent('↑')
  })
})
