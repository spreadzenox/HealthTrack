import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Trial from './Trial'
import { createTrial } from '../services/trials'

vi.mock('../services/trialsData', async (orig) => ({ ...(await orig()), saveTrial: vi.fn(async () => {}) }))
import { saveTrial } from '../services/trialsData'

const sleep = { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', outcome: 'wellbeing', effect: 0.4, center: 420, usualChange: { amount: 30 } }
const payload = { ...createTrial(sleep, { now: new Date(2026, 10, 1, 9) }), schedule: [...Array(14)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }

const renderTrial = (now, extra = {}, changes = null, wellbeing = new Map([['2026-11-02', 3.5], ['2026-11-03', 2]])) => render(
  <MemoryRouter initialEntries={['/agir/essai/7']}>
    <Routes>
      <Route path="/agir/essai/:id" element={<Trial now={now} readTrialChanges={async () => changes} read={async () => ({
        trials: [{ id: 7, type: 'trial', payload: { ...payload, ...extra } }],
        summaries: new Map([['2026-11-01', { sleepMinutes: 470 }]]),
        outcomes: { wellbeing, digestion: new Map() },
      })} />} />
    </Routes>
  </MemoryRouter>,
)

describe('Un essai (ORG-8)', () => {
  it('la consigne du jour, le calendrier, la question seulement si les données manquent', async () => {
    renderTrial(new Date(2026, 10, 3, 10))
    // POLISH-AGIR-TITRES : la consigne est le titre ; la carte du jour ne la répète pas
    expect(await screen.findByRole('heading', { level: 1, name: 'Dormir au moins 7 h 30' })).toBeInTheDocument()
    expect(screen.getByText('Aujourd’hui, jour avec.')).toBeInTheDocument()
    expect(screen.getByLabelText(/1 novembre : avec, tenu/)).toHaveTextContent('✓')
    expect(screen.getByText('Nous n’avons pas reçu vos données de sommeil pour hier soir.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Oui' }))
    expect(saveTrial).toHaveBeenCalledWith(7, expect.objectContaining({ answers: { '2026-11-02': true } }))
    expect(screen.getByText('Résultat en cours')).toBeInTheDocument()
    expect(screen.getByText(/dès 3 lendemains de chaque sorte/)).toBeInTheDocument()
    expect(screen.getByText('Pourquoi des jours tirés au sort ?')).toBeInTheDocument()
  })

  it('POLISH-ESSAI-GRILLE : « Les 14 jours » en deux semaines de 7, numérotées', async () => {
    renderTrial(new Date(2026, 10, 3, 10))
    expect(await screen.findByRole('heading', { name: 'Les 14 jours' })).toBeInTheDocument()
    const weeks = screen.getAllByRole('list', { name: /^Semaine \d/ })
    expect(weeks).toHaveLength(2)
    expect(weeks.map((w) => w.querySelectorAll('li').length)).toEqual([7, 7])
    expect(screen.getByLabelText(/1 novembre : avec, tenu/)).toHaveTextContent('1✓')
    expect(screen.getByLabelText(/14 novembre : sans/)).toHaveTextContent('14')
  })

  it('POLISH-ESSAI-ORDRE : « Résultat en cours » avant « Les 14 jours », légende avec la consigne', async () => {
    renderTrial(new Date(2026, 10, 3, 10))
    const result = await screen.findByRole('heading', { name: 'Résultat en cours' })
    const days = screen.getByRole('heading', { name: 'Les 14 jours' })
    expect(result.compareDocumentPosition(days) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const legend = screen.getByRole('list', { name: 'Légende' })
    expect(legend).toHaveTextContent('dormir au moins 7 h 30')
    expect(legend).toHaveTextContent('comme d’habitude')
    expect(legend).toHaveTextContent('✓ tenu · – pas tenu')
    expect(screen.queryByText(/Pleine : jour avec/)).not.toBeInTheDocument()
  })

  it('POLISH-ESSAI-VIDE : sans point, le graphique vide avec ses axes et une seule phrase', async () => {
    renderTrial(new Date(2026, 10, 1, 10))
    const card = (await screen.findByRole('heading', { name: 'Résultat en cours' })).closest('article')
    const chart = card.querySelector('svg.trial-chart')
    expect(chart).not.toBeNull()
    expect(chart).toHaveTextContent('Avec')
    expect(chart).toHaveTextContent('Sans')
    expect(chart.querySelectorAll('.trial-pt')).toHaveLength(0)
    // POLISH-ESSAI-AXES : un axe horizontal commun, gradué
    expect(chart.querySelectorAll('.trial-chart-line').length).toBeGreaterThanOrEqual(3)
    expect(card.querySelector('.trial-diff')).toHaveTextContent('Écart')
    expect(card.querySelector('.trial-diff-dot')).toBeNull()
    expect(card.querySelectorAll('p.act-card-detail')).toHaveLength(1)
    expect(screen.queryByText(/Le premier point arrive/)).not.toBeInTheDocument()
    expect(screen.queryByText(/dès 3 lendemains/)).not.toBeInTheDocument()
  })

  it('POLISH-ESSAI-AXES : Avec et Sans en lignes sur un axe commun, Écart gradué, phrase de l’écart', async () => {
    const wb = new Map([['2026-11-02', 3.5], ['2026-11-04', 3.6], ['2026-11-06', 3.7], ['2026-11-03', 3.0], ['2026-11-05', 3.1], ['2026-11-07', 3.2]])
    renderTrial(new Date(2026, 10, 8, 10), {}, null, wb)
    const card = (await screen.findByRole('heading', { name: 'Résultat en cours' })).closest('article')
    const chart = card.querySelector('svg.trial-chart')
    // Les points d'une même ligne partagent la même hauteur ; Avec au-dessus de Sans
    const ys = (k) => [...chart.querySelectorAll(`.trial-col.is-${k} .trial-pt`)].map((c) => Number(c.getAttribute('cy')))
    expect(ys('with')).toHaveLength(3)
    expect(new Set(ys('with')).size).toBe(1)
    expect(new Set(ys('without')).size).toBe(1)
    expect(ys('with')[0]).toBeLessThan(ys('without')[0])
    // Avec (mieux) plus à droite que Sans
    const xs = (k) => [...chart.querySelectorAll(`.trial-col.is-${k} .trial-pt`)].map((c) => Number(c.getAttribute('cx')))
    expect(Math.min(...xs('with'))).toBeGreaterThan(Math.max(...xs('without')))
    // Graduations en demi-points, à la française
    expect(chart).toHaveTextContent('3,5')
    // Écart gradué −1 / 0 / +1, dans le même dessin
    const diff = chart.querySelector('.trial-diff')
    expect(diff).toHaveTextContent('Écart')
    expect(diff).toHaveTextContent('−1')
    expect(diff).toHaveTextContent('+1')
    expect(diff.querySelector('.trial-diff-dot')).not.toBeNull()
    expect(screen.getByText(/^Après 6 lendemains : \+0,\d points?, entre [−+]?\d,\d et [−+]?\d,\d\.$/)).toBeInTheDocument()
  })

  it('à la fin : le verdict et « Garder cette habitude »', async () => {
    renderTrial(new Date(2026, 10, 20, 10))
    expect(await screen.findByRole('heading', { name: 'Pas d’effet net' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Garder cette habitude' }))
    expect(saveTrial).toHaveBeenCalledWith(7, expect.objectContaining({ kept: true }))
  })

  it('TS-2 : un changement durable pendant l’essai est signalé', async () => {
    renderTrial(new Date(2026, 10, 9, 10), {}, { wellbeing: [{ date: '2026-11-06', before: 3, after: 2 }] })
    expect(await screen.findByRole('note')).toHaveTextContent('Votre bien-être a changé de niveau pendant l’essai')
  })
})
