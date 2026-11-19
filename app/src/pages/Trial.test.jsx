import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Trial from './Trial'
import { createTrial } from '../services/trials'

vi.mock('../services/trialsData', async (orig) => ({ ...(await orig()), saveTrial: vi.fn(async () => {}) }))
import { saveTrial } from '../services/trialsData'

const sleep = { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', outcome: 'wellbeing', effect: 0.4, center: 420, usualChange: { amount: 30 } }
const payload = { ...createTrial(sleep, { now: new Date(2026, 10, 1, 9) }), schedule: [...Array(14)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }

const line = (text) => (_, el) => el.tagName === 'P' && el.textContent.trim().replace(/\s+/g, ' ') === text

const renderTrial = (now, extra = {}, changes = null, wellbeing = new Map([['2026-11-02', 3.5], ['2026-11-03', 2]]), state) => render(
  <MemoryRouter initialEntries={[{ pathname: '/agir/essai/7', state }]}>
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
    expect(screen.getByLabelText(/14 novembre : comme d’habitude/)).toHaveTextContent('14')
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

  it('POLISH-SIM-108 : un jour « comme d’habitude » n’est jamais marqué tenu ou pas tenu (rien à tenir)', async () => {
    // jours sans : le 2 répondu « Non », le 4 répondu « Oui » ; le 1 (avec) : tenu d'après le sommeil
    renderTrial(new Date(2026, 10, 6, 10), { answers: { '2026-11-02': false, '2026-11-04': true } })
    const sans = await screen.findByLabelText(/^2 novembre : comme d’habitude$/)
    expect(sans).toHaveTextContent(/^2$/)
    expect(screen.getByLabelText(/^4 novembre : comme d’habitude$/)).toHaveTextContent(/^4$/)
    expect(screen.queryByLabelText(/novembre : sans/)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/1 novembre : avec, tenu/)).toHaveTextContent('1✓')
  })

  it('POLISH-SIM-108 : le lien retour mène à l’objectif suivi, sous l’onglet Objectifs (plus « ← Agir »)', async () => {
    renderTrial(new Date(2026, 10, 3, 10))
    const back = await screen.findByRole('link', { name: '← Votre bien-être' })
    expect(back).toHaveAttribute('href', '/recommendations/bien-etre')
    expect(screen.queryByRole('link', { name: '← Agir' })).not.toBeInTheDocument()
  })

  it('POLISH-SIM-108 : un essai sur le ventre revient à « Votre confort digestif »', async () => {
    renderTrial(new Date(2026, 10, 3, 10), { factor: { ...payload.factor, outcome: 'digestion' } })
    const back = await screen.findByRole('link', { name: '← Votre confort digestif' })
    expect(back).toHaveAttribute('href', '/recommendations/ventre')
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

  it('REFONTE-6c-2 : un essai de 10 jours dit son jour sur 10 et ses jours avec tenus sur 5', async () => {
    const ten = { schedule: payload.schedule.slice(0, 10) }
    renderTrial(new Date(2026, 10, 3, 10), ten)
    expect(await screen.findByText(line('Jour 3 sur 10'))).toBeInTheDocument()
    expect(screen.getByText(line('1 jour avec tenu sur 5'))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Les 10 jours' })).toBeInTheDocument()
    expect(screen.queryByText(/n’annule rien/)).toBeNull()
  })

  it('LANT-1 : les lanternes des jours avec, allumées quand le jour est tenu', async () => {
    renderTrial(new Date(2026, 10, 5, 10), { schedule: payload.schedule.slice(0, 10), answers: { '2026-11-01': true, '2026-11-03': false } })
    const row = await screen.findByRole('list', { name: 'Lanternes des jours avec' })
    const items = row.querySelectorAll('li')
    expect(items).toHaveLength(5)
    expect([...items].map((li) => li.className)).toEqual([
      'trial-lantern is-lit', 'trial-lantern is-out', 'trial-lantern is-pending', 'trial-lantern is-pending', 'trial-lantern is-pending',
    ])
    expect(items[0]).toHaveAccessibleName('1 novembre : tenu')
    expect(items[1]).toHaveAccessibleName('3 novembre : pas tenu')
  })

  it('REFONTE-6c-2 : un jour avec manqué est dit sans reproche', async () => {
    renderTrial(new Date(2026, 10, 5, 10), { schedule: payload.schedule.slice(0, 10), answers: { '2026-11-03': false } })
    expect(await screen.findByText(line('1 jour avec tenu sur 5'))).toBeInTheDocument()
    expect(screen.getByText('Un jour manqué n’annule rien : l’essai continue.')).toBeInTheDocument()
  })

  it('REFONTE-6c-2 : à la fin, le bilan en mots et sa réserve', async () => {
    const wellbeing = new Map()
    for (let d = 2; d <= 11; d += 1) wellbeing.set(`2026-11-${String(d).padStart(2, '0')}`, (d % 2 === 0 ? 4 : 2.5) + (d % 4) * 0.05)
    renderTrial(new Date(2026, 10, 12, 10), { schedule: payload.schedule.slice(0, 10) }, null, wellbeing)
    expect(await screen.findByRole('heading', { name: 'Plutôt oui' })).toBeInTheDocument()
    expect(screen.getByText('À confirmer sur plus de jours : 5 lendemains mesurés, c’est encore peu.')).toBeInTheDocument()
    expect(screen.queryByText(/Vérifié/)).toBeNull()
    expect(screen.queryByText(/^Jour \d+ sur/)).toBeNull()
  })

  it('à la fin : le bilan et « Garder cette habitude »', async () => {
    renderTrial(new Date(2026, 10, 20, 10))
    expect(await screen.findByRole('heading', { name: 'Trop peu de jours pour conclure' })).toBeInTheDocument()
    expect(screen.getByText('Vous pouvez réessayer quand vous voulez.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Garder cette habitude' }))
    expect(saveTrial).toHaveBeenCalledWith(7, expect.objectContaining({ kept: true }))
  })

  it('TS-2 : un changement durable pendant l’essai est signalé', async () => {
    renderTrial(new Date(2026, 10, 9, 10), {}, { wellbeing: [{ date: '2026-11-06', before: 3, after: 2 }] })
    expect(await screen.findByRole('note')).toHaveTextContent('Votre bien-être a changé de niveau pendant l’essai')
  })

  it('LANT-2 : juste après « Commencer », Pilou saute et annonce les lanternes ; ensuite il attend sans rien dire', async () => {
    const ten = { schedule: payload.schedule.slice(0, 10) }
    const { container, unmount } = renderTrial(new Date(2026, 10, 1, 10), ten, null, undefined, { started: true })
    expect(await screen.findByText('C’est parti ! Chaque jour avec tenu allume une lanterne.')).toBeInTheDocument()
    expect(container.querySelector('.trial-today .pilou-figure')).toHaveClass('pilou-move-hop')
    unmount()
    const again = renderTrial(new Date(2026, 10, 3, 10), ten)
    await screen.findByText(line('Jour 3 sur 10'))
    expect(again.container.querySelector('.trial-today .pilou-figure')).toHaveClass('pilou-move-none')
    expect(screen.queryByText(/C’est parti/)).toBeNull()
  })

  it('LANT-2 : au bilan, Pilou hoche la tête et salue l’effort, sans fête', async () => {
    const wellbeing = new Map()
    for (let d = 2; d <= 11; d += 1) wellbeing.set(`2026-11-${String(d).padStart(2, '0')}`, (d % 2 === 0 ? 4 : 2.5) + (d % 4) * 0.05)
    const { container } = renderTrial(new Date(2026, 10, 12, 10), { schedule: payload.schedule.slice(0, 10) }, null, wellbeing)
    await screen.findByRole('heading', { name: 'Plutôt oui' })
    const card = container.querySelector('.trial-result')
    expect(card.querySelector('.pilou-figure')).toHaveClass('pilou-move-nod')
    expect(card).toHaveTextContent(/Bravo pour (vos \d jours|votre jour) avec\./)
    expect(card.querySelector('.confetti, .pilou-move-party')).toBeNull()
  })
})

