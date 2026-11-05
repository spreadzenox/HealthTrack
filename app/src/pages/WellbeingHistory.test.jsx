import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

const loadWellbeingHistory = vi.fn()
vi.mock('../services/mood/faceMoodData', () => ({ loadWellbeingHistory: (...a) => loadWellbeingHistory(...a) }))
vi.mock('../components/WellbeingPrompt', () => ({ default: ({ open }) => (open ? <div>note manuelle ouverte</div> : null) }))

import WellbeingHistory from './WellbeingHistory'

const NOW = new Date(2026, 9, 24, 20)
const history = (over = {}) => ({
  period: 'week',
  from: new Date(2026, 9, 18).toISOString(),
  points: [
    { at: new Date(2026, 9, 22, 19).toISOString(), date: '2026-10-22', note: 3.1, readings: 5, few: false },
    { at: new Date(2026, 9, 23, 9).toISOString(), date: '2026-10-23', note: 3.6, readings: 2, few: true },
  ],
  notes: [{ at: new Date(2026, 9, 23, 21).toISOString(), score: 4 }],
  readings: 7, days: 2, mean: 3.35, valence: 0.21, arousal: -0.12,
  expressions: { readings: 3, items: [
    { key: 'exHappiness', label: 'Joie', p: 0.42 }, { key: 'exNeutral', label: 'Neutre', p: 0.38 },
    { key: 'exSurprise', label: 'Surprise', p: 0.06 }, { key: 'exSadness', label: 'Tristesse', p: 0.05 },
    { key: 'exAnger', label: 'Colère', p: 0.03 }, { key: 'exFear', label: 'Peur', p: 0.02 },
    { key: 'exDisgust', label: 'Dégoût', p: 0.02 }, { key: 'exContempt', label: 'Mépris', p: 0.02 },
  ] },
  ...over,
})

const renderPage = () => render(<BrowserRouter><WellbeingHistory now={NOW} /></BrowserRouter>)

describe('WellbeingHistory — historique du bien-être (POL-2)', () => {
  beforeEach(() => {
    loadWellbeingHistory.mockReset()
    loadWellbeingHistory.mockImplementation(({ period }) => Promise.resolve(history({ period })))
  })

  it('jour très lu : la courbe et la légende disent « un point par heure » (I83)', async () => {
    const hourly = (h, note) => ({ at: new Date(2026, 9, 24, h, 30).toISOString(), date: '2026-10-24', note, low: note - 0.5, high: note + 0.5, readings: 12, hourly: true })
    loadWellbeingHistory.mockImplementation(({ period }) => Promise.resolve(history({
      period, from: new Date(2026, 9, 24).toISOString(), points: [hourly(8, 2.6), hourly(9, 3.2)], notes: [], readings: 24, days: 1, mean: 2.9,
    })))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Jour' }))
    expect(await screen.findByRole('img', { name: /aujourd’hui : 24 lectures, un point par heure/ })).toBeInTheDocument()
    expect(screen.getByText('estimé (visage), par heure')).toBeInTheDocument()
  })

  it('montre la moyenne, la courbe, la légende et le détail des modèles comme des estimations', async () => {
    renderPage()
    expect(await screen.findByText('3,4')).toBeInTheDocument()
    expect(screen.getByText(/7 lectures · 2 jours · 1 note à la main/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Bien-être estimé ces 7 jours : 2 jours/ })).toBeInTheDocument()
    expect(screen.getByText('peu de lectures')).toBeInTheDocument()
    expect(screen.getByText('noté à la main')).toBeInTheDocument()
    expect(screen.getByText('Valence')).toBeInTheDocument()
    expect(screen.getByText('+0,21')).toBeInTheDocument()
    expect(screen.getByText('−0,12')).toBeInTheDocument()
    expect(screen.getByText('Joie')).toBeInTheDocument()
    expect(screen.getByText('42 %')).toBeInTheDocument()
    expect(screen.getByText(/pas de ce que vous ressentez, ni un diagnostic/)).toBeInTheDocument()
    expect(screen.getByText(/aucune image/)).toBeInTheDocument()
  })

  it('ne nomme le modèle (HSEmotion) qu’en sideload, jamais dans la variante play (POL-PLAY-100)', async () => {
    const { unmount } = render(<BrowserRouter><WellbeingHistory now={NOW} features={{ aiModelName: false }} /></BrowserRouter>)
    expect(await screen.findByText(/Deux modèles embarqués, sur le téléphone/)).toBeInTheDocument()
    expect(screen.queryByText(/HSEmotion/)).toBeNull()
    unmount()
    render(<BrowserRouter><WellbeingHistory now={NOW} features={{ aiModelName: true }} /></BrowserRouter>)
    expect(await screen.findByText(/Deux modèles embarqués \(HSEmotion\)/)).toBeInTheDocument()
  })

  it('étiquette les 7 jours de la semaine sans ambiguïté (deux lettres, aucun doublon) (POL-PLAY-18)', async () => {
    const { container } = renderPage()
    await screen.findByText('3,4')
    const labels = [...container.querySelectorAll('svg.wbh-chart text.wbh-axis')]
      .map((t) => t.textContent).filter((t) => !/^\d/.test(t))
    expect(labels).toEqual(['di', 'lu', 'ma', 'me', 'je', 've', 'sa'])
  })

  it('change de période : jour, semaine, mois', async () => {
    renderPage()
    await screen.findByText('3,4')
    expect(loadWellbeingHistory).toHaveBeenLastCalledWith({ period: 'week', now: NOW })
    fireEvent.click(screen.getByRole('button', { name: 'Mois' }))
    await waitFor(() => expect(loadWellbeingHistory).toHaveBeenLastCalledWith({ period: 'month', now: NOW }))
    expect(screen.getByRole('button', { name: 'Mois' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Jour' }))
    await waitFor(() => expect(loadWellbeingHistory).toHaveBeenLastCalledWith({ period: 'day', now: NOW }))
  })

  it('sans lecture : un état vide qui renvoie vers Sources, et « Noter moi-même » reste là', async () => {
    loadWellbeingHistory.mockResolvedValue(history({ points: [], notes: [], readings: 0, days: 0, mean: null, valence: null, arousal: null, expressions: null }))
    renderPage()
    expect(await screen.findByText(/Aucune lecture ces 7 jours/)).toBeInTheDocument()
    expect(screen.queryByText('Ce que lisent les modèles')).not.toBeInTheDocument()
    expect(screen.queryByText(/0 lecture/)).not.toBeInTheDocument()
    expect(screen.queryByText('estimé (visage)')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Noter moi-même' }))
    expect(screen.getByText('note manuelle ouverte')).toBeInTheDocument()
  })

  it('légende : la ligne pointillée est la moyenne ; en vue Jour, la fourchette de chaque lecture (POL-PLAY-85)', async () => {
    renderPage()
    await screen.findByText('3,4')
    expect(screen.getByText('moyenne')).toBeInTheDocument()
    expect(screen.queryByText('fourchette')).not.toBeInTheDocument()
    loadWellbeingHistory.mockResolvedValue(history({
      period: 'day', from: new Date(2026, 9, 24).toISOString(), days: 1, readings: 2, notes: [],
      points: [
        { at: new Date(2026, 9, 24, 9).toISOString(), date: '2026-10-24', note: 3, low: 2, high: 4 },
        { at: new Date(2026, 9, 24, 13).toISOString(), date: '2026-10-24', note: 3.4, low: 2.6, high: 4.2 },
      ],
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Jour' }))
    expect(await screen.findByText('fourchette')).toBeInTheDocument()
    // « 1 jour » ne dit rien de plus en vue Jour.
    expect(screen.getByText('2 lectures')).toBeInTheDocument()
    expect(screen.queryByText(/· 1 jour/)).not.toBeInTheDocument()
  })

  it('expressions lues sur une partie des lectures seulement : le dit (« 3 des 7 lectures ») (POL-PLAY-85)', async () => {
    renderPage()
    expect(await screen.findByText('sur 3 des 7 lectures')).toBeInTheDocument()
    loadWellbeingHistory.mockResolvedValue(history({ readings: 3 }))
    fireEvent.click(screen.getByRole('button', { name: 'Mois' }))
    expect(await screen.findByText('sur 3 lectures')).toBeInTheDocument()
  })

  it('lectures sans expressions (anciennes) : le dit simplement', async () => {
    loadWellbeingHistory.mockResolvedValue(history({ expressions: null }))
    renderPage()
    expect(await screen.findByText(/apparaîtront avec les prochaines lectures/)).toBeInTheDocument()
  })

  describe('toucher un point ouvre sa lecture (BE-HISTO-DETAIL, retour (6) du 04/11)', () => {
    const MIX = { readings: 1, items: [
      { key: 'exNeutral', label: 'Neutre', p: 0.61 }, { key: 'exSadness', label: 'Tristesse', p: 0.2 },
      { key: 'exHappiness', label: 'Joie', p: 0.1 }, { key: 'exSurprise', label: 'Surprise', p: 0.03 },
      { key: 'exAnger', label: 'Colère', p: 0.02 }, { key: 'exFear', label: 'Peur', p: 0.02 },
      { key: 'exDisgust', label: 'Dégoût', p: 0.01 }, { key: 'exContempt', label: 'Mépris', p: 0.01 },
    ] }
    const dayHistory = () => history({
      period: 'day', from: new Date(2026, 9, 24).toISOString(), days: 1, readings: 2, notes: [],
      points: [
        { at: new Date(2026, 9, 24, 8, 5).toISOString(), date: '2026-10-24', note: 2.8, low: 2.1, high: 3.5, readings: 1,
          detail: { readings: 1, poor: 1, valence: -0.18, arousal: 0.07, expressions: MIX } },
        { at: new Date(2026, 9, 24, 12, 40).toISOString(), date: '2026-10-24', note: 3.6, low: 3, high: 4.2, readings: 1,
          detail: { readings: 1, poor: 0, valence: 0.3, arousal: null, expressions: null } },
      ],
    })

    it('vue Jour : la lecture touchée montre sa note, sa fourchette, valence, éveil, expressions et netteté', async () => {
      loadWellbeingHistory.mockImplementation(() => Promise.resolve(dayHistory()))
      renderPage()
      const dot = await screen.findByRole('button', { name: /Lecture de 8 h 05 : 2,8 sur 5/ })
      expect(screen.getByText('Touchez un point pour voir sa lecture.')).toBeInTheDocument()
      fireEvent.click(dot)
      const card = screen.getByRole('region', { name: 'Lecture de 8 h 05' })
      expect(dot).toHaveAttribute('aria-pressed', 'true')
      expect(card).toHaveTextContent('2,8')
      expect(card).toHaveTextContent('entre 2,1 et 3,5')
      expect(card).toHaveTextContent('lecture peu nette')
      expect(card).toHaveTextContent('−0,18')
      expect(card).toHaveTextContent('+0,07')
      const cells = card.querySelectorAll('.wbh-matrix li')
      expect(cells).toHaveLength(8)
      expect(cells[0]).toHaveTextContent('Neutre')
      expect(cells[0]).toHaveTextContent('61 %')
      expect(screen.queryByText('Touchez un point pour voir sa lecture.')).toBeNull()
    })

    it('un autre point remplace le détail ; « Fermer » ou un second toucher le referme', async () => {
      loadWellbeingHistory.mockImplementation(() => Promise.resolve(dayHistory()))
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: /Lecture de 8 h 05/ }))
      const noon = screen.getByRole('button', { name: /Lecture de 12 h 40 : 3,6 sur 5/ })
      fireEvent.click(noon)
      const card = screen.getByRole('region', { name: 'Lecture de 12 h 40' })
      expect(card).toHaveTextContent('lecture nette')
      expect(card).toHaveTextContent('+0,30')
      expect(card).not.toHaveTextContent('Éveil')
      expect(card).toHaveTextContent('Pas d’expressions pour cette lecture.')
      fireEvent.click(noon)
      expect(screen.queryByRole('region', { name: /Lecture de/ })).toBeNull()
      fireEvent.keyDown(noon, { key: 'Enter' })
      fireEvent.click(screen.getByRole('button', { name: 'Fermer la lecture' }))
      expect(screen.queryByRole('region', { name: /Lecture de/ })).toBeNull()
    })

    it('vue Semaine : le point d’un jour résume ses lectures ; changer de période referme le détail', async () => {
      const pts = history().points.map((p, i) => ({ ...p, detail: { readings: p.readings, poor: i, valence: 0.12, arousal: -0.05, expressions: null } }))
      loadWellbeingHistory.mockImplementation(({ period }) => Promise.resolve(history({ period, points: pts })))
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: /jeudi 22 octobre : 3,1 sur 5/ }))
      const card = screen.getByRole('region', { name: 'jeudi 22 octobre' })
      expect(card).toHaveTextContent('5 lectures')
      expect(card).not.toHaveTextContent('peu nette')
      fireEvent.click(screen.getByRole('button', { name: /vendredi 23 octobre/ }))
      expect(screen.getByRole('region', { name: 'vendredi 23 octobre' })).toHaveTextContent('2 lectures, dont 1 peu nette')
      fireEvent.click(screen.getByRole('button', { name: 'Mois' }))
      await waitFor(() => expect(screen.queryByRole('region', { name: /octobre/ })).toBeNull())
    })
  })

  describe('remonter le temps (BE-HISTO-DETAIL-2, retour (6) du 04/11)', () => {
    const EARLY = new Date(2026, 8, 1).toISOString()
    beforeEach(() => {
      loadWellbeingHistory.mockImplementation(({ period, now }) => {
        const end = new Date(now)
        const from = new Date(end)
        from.setHours(0, 0, 0, 0)
        from.setDate(from.getDate() - ({ day: 1, week: 7, month: 30 }[period] - 1))
        return Promise.resolve(history({ period, from: from.toISOString(), earliest: EARLY }))
      })
    })

    it('flèche « précédente » : la semaine d’avant, datée ; « suivante » revient, puis se grise', async () => {
      renderPage()
      await screen.findByText('3,4')
      expect(screen.getByText('Ces 7 jours')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Semaine suivante' })).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: 'Semaine précédente' }))
      await waitFor(() => expect(loadWellbeingHistory).toHaveBeenLastCalledWith({ period: 'week', now: new Date(2026, 9, 17, 23, 59, 59, 999) }))
      expect(await screen.findByText('du 11 au 17 octobre')).toBeInTheDocument()
      expect(screen.getByRole('img', { name: /Bien-être estimé du 11 au 17 octobre/ })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Semaine précédente' }))
      expect(await screen.findByText('du 4 au 10 octobre')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Semaine suivante' }))
      fireEvent.click(screen.getByRole('button', { name: 'Semaine suivante' }))
      await waitFor(() => expect(loadWellbeingHistory).toHaveBeenLastCalledWith({ period: 'week', now: NOW }))
      expect(screen.getByRole('button', { name: 'Semaine suivante' })).toBeDisabled()
    })

    it('vue Jour : la veille porte son nom ; changer de période revient au présent', async () => {
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Jour' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Jour précédent' }))
      expect(await screen.findByText('vendredi 23 octobre')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Mois' }))
      await waitFor(() => expect(loadWellbeingHistory).toHaveBeenLastCalledWith({ period: 'month', now: NOW }))
      expect(await screen.findByText('Ces 30 jours')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Mois précédent' }))
      expect(await screen.findByText('du 26 août au 24 septembre')).toBeInTheDocument()
    })

    it('balayer la courbe vers la droite remonte le temps ; on ne descend pas avant la première lecture', async () => {
      loadWellbeingHistory.mockImplementation(({ period, now }) => Promise.resolve(history({
        period, from: new Date(new Date(now).getTime() - 6 * 86400000).toISOString(), earliest: new Date(2026, 9, 12).toISOString(),
      })))
      const { container } = renderPage()
      await screen.findByText('3,4')
      const card = container.querySelector('.wbh-card')
      fireEvent.touchStart(card, { touches: [{ clientX: 40, clientY: 100 }] })
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 200, clientY: 110 }] })
      await waitFor(() => expect(loadWellbeingHistory).toHaveBeenLastCalledWith({ period: 'week', now: new Date(2026, 9, 17, 23, 59, 59, 999) }))
      await waitFor(() => expect(screen.getByRole('button', { name: 'Semaine précédente' })).toBeDisabled())
    })
  })
})
