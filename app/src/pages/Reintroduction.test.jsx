import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

const dist = vi.hoisted(() => ({ play: false }))
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, get FEATURES() { return actual.featuresFor(dist.play ? 'play' : 'sideload') } }
})
vi.mock('../components/TodayCards', () => ({ GutCard: () => <div>carte ventre</div> }))

import Reintroduction from './Reintroduction'
import { ENTITLEMENT_EVENT } from '../services/entitlement'
import { startChallenge } from '../services/fodmapChallenge'

const NOW = new Date(2026, 9, 26, 20)
const at = (daysAgo, h) => new Date(2026, 9, 26 - daysAgo, h).toISOString()
const gut = (daysAgo, level, h = 21) => ({ id: 1000 + daysAgo * 10 + h, type: 'gut', at: at(daysAgo, h), payload: { level, scope: 'day' } })
const calm = (...days) => days.map((d) => gut(d, 'calm'))
const challengeEntry = (payload, id = 7) => ({ id, type: 'fodmap_challenge', at: payload.startedAt, payload })

function makeStore({ challenges = [], gutEntries = [] } = {}) {
  return {
    read: vi.fn(async () => ({ challenges, gut: gutEntries })),
    create: vi.fn(async () => 1),
    update: vi.fn(async () => {}),
  }
}

const renderPage = (store) => render(<BrowserRouter><Reintroduction now={NOW} store={store} /></BrowserRouter>)

describe('Réintroduction guidée — écrans (jalon 7b)', () => {
  beforeEach(() => {
    dist.play = false
    localStorage.clear()
    delete window.__healthtrackFakePortionReminder
  })

  it('① liste les groupes avec leur état et la mise en garde, sans mot interdit', async () => {
    renderPage(makeStore())
    expect(await screen.findByRole('button', { name: /Lactose/ })).toHaveTextContent('pas testé')
    expect(screen.getByRole('button', { name: 'Blé' })).toBeInTheDocument()
    expect(screen.getByText(/Combinaisons/).closest('[aria-disabled]')).toHaveTextContent('après 2 groupes bien tolérés')
    expect(screen.getByText(/parlez-en d’abord à votre médecin/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/intolérance|allergie|traitement/i)
  })

  it('② « Commencer » attend 3 jours de ventre calme', async () => {
    renderPage(makeStore({ gutEntries: [...calm(2, 1), gut(3, 'pain')] }))
    fireEvent.click(await screen.findByRole('button', { name: /Lactose/ }))
    expect(screen.getByRole('status')).toHaveTextContent('2/3 jours calmes')
    expect(screen.getByRole('button', { name: 'Commencer aujourd’hui' })).toBeDisabled()
  })

  it('② crée le test avec les portions modifiées', async () => {
    const store = makeStore({ gutEntries: calm(3, 2, 1) })
    renderPage(store)
    fireEvent.click(await screen.findByRole('button', { name: 'Blé' }))
    expect(screen.getByText(/repère général, à adapter avec votre diététicienne/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Portion du jour 3'), { target: { value: '2,5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Commencer aujourd’hui' }))
    await waitFor(() => expect(store.create).toHaveBeenCalledTimes(1))
    const payload = store.create.mock.calls[0][0]
    expect(payload).toMatchObject({ group: 'fructans', food: 'wheat', doses: [] })
    expect(payload.plan.amounts).toEqual([1, 2, 2.5])
  })

  it('③ note la portion du jour en un geste', async () => {
    const c = startChallenge({ group: 'lactose', food: 'milk' }, new Date(2026, 9, 26, 8))
    const store = makeStore({ challenges: [challengeEntry(c)], gutEntries: calm(3, 2, 1) })
    renderPage(store)
    expect(await screen.findByText('Lait · jour 1')).toBeInTheDocument()
    expect(screen.getByText('carte ventre')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'J’ai mangé ma portion (125 ml)' }))
    await waitFor(() => expect(store.update).toHaveBeenCalledTimes(1))
    const [id, payload] = store.update.mock.calls[0]
    expect(id).toBe(7)
    expect(payload.doses).toHaveLength(1)
    expect(payload.doses[0]).toMatchObject({ day: 1, amount: 125, unit: 'ml' })
  })

  it('③ une gêne dans les 24 h pose « C’est supportable ? » et garde la réponse', async () => {
    const c = { ...startChallenge({ group: 'lactose', food: 'milk' }, new Date(2026, 9, 25, 8)), doses: [{ day: 1, amount: 125, unit: 'ml', at: at(1, 12) }] }
    const store = makeStore({ challenges: [challengeEntry(c)], gutEntries: [...calm(4, 3, 2), gut(1, 'discomfort', 18)] })
    renderPage(store)
    expect(await screen.findByText(/C’est supportable/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /J’ai mangé ma portion/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Non, j’arrête' }))
    await waitFor(() => expect(store.update).toHaveBeenCalledTimes(1))
    expect(store.update.mock.calls[0][1].answers).toEqual([expect.objectContaining({ day: 1, tolerable: false })])
  })

  it('③ après deux jours sautés, propose de reprendre au jour 1', async () => {
    const c = { ...startChallenge({ group: 'lactose', food: 'milk' }, new Date(2026, 9, 21, 8)), doses: [{ day: 1, amount: 125, unit: 'ml', at: at(5, 12) }] }
    const store = makeStore({ challenges: [challengeEntry(c)], gutEntries: calm(8, 7, 6, 5, 4) })
    renderPage(store)
    expect(await screen.findByText('Lait : test en pause')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre au jour 1' }))
    await waitFor(() => expect(store.update).toHaveBeenCalledTimes(1))
    expect(store.update.mock.calls[0][1]).toMatchObject({ doses: [], restarts: 1 })
  })

  it('④ montre le résultat en une phrase, puis la pause avant le test suivant', async () => {
    const doses = [3, 2, 1].map((d, i) => ({ day: i + 1, amount: [1, 2, 3][i], unit: 'tranche', at: at(d, 12) }))
    const c = { ...startChallenge({ group: 'fructans', food: 'wheat' }, new Date(2026, 9, 23, 8)), doses }
    renderPage(makeStore({ challenges: [challengeEntry(c)], gutEntries: [...calm(6, 5, 4, 3, 2, 1)] }))
    expect(await screen.findByText(/Blé : bien toléré jusqu’à 3 tranches/)).toBeInTheDocument()
    expect(screen.getByText(/pas un diagnostic/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('0/3 jours calmes')
    expect(screen.getByText('carte ventre')).toBeInTheDocument()
  })

  it('un test terminé apparaît dans « Vos résultats » et en étiquette', async () => {
    const doses = [9, 8].map((d, i) => ({ day: i + 1, amount: [125, 250][i], unit: 'ml', at: at(d, 12) }))
    const c = { ...startChallenge({ group: 'lactose', food: 'milk' }, new Date(2026, 9, 17, 8)), doses, answers: [{ day: 2, tolerable: false, at: at(8, 20) }] }
    renderPage(makeStore({ challenges: [challengeEntry(c)], gutEntries: [...calm(12, 11, 10, 9, 7, 6, 5, 4, 3, 2, 1), gut(8, 'pain', 19)] }))
    expect(await screen.findByText(/Lait : une petite portion passe \(125 ml\)/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lactose/ })).toHaveTextContent('petite portion')
  })

  it('variante play sans premium : « Débloquer », mais un test commencé se termine', async () => {
    dist.play = true
    const { unmount } = renderPage(makeStore({ gutEntries: calm(3, 2, 1) }))
    expect(await screen.findByRole('link', { name: 'Débloquer' })).toHaveAttribute('href', '/premium')
    expect(screen.queryByRole('button', { name: /Lactose/ })).not.toBeInTheDocument()
    unmount()

    const c = startChallenge({ group: 'lactose', food: 'milk' }, new Date(2026, 9, 26, 8))
    renderPage(makeStore({ challenges: [challengeEntry(c)], gutEntries: calm(3, 2, 1) }))
    expect(await screen.findByRole('button', { name: /J’ai mangé ma portion/ })).toBeInTheDocument()
  })

  it('variante play en premium (période de lancement) : le choix des groupes', async () => {
    dist.play = true
    renderPage(makeStore())
    window.dispatchEvent(new CustomEvent(ENTITLEMENT_EVENT, { detail: { premium: true, source: 'launch' } }))
    expect(await screen.findByRole('button', { name: /Lactose/ })).toBeInTheDocument()
  })

  it('7b-2 : rappel de la portion, absent hors de l’app, programmé à l’heure choisie pendant le test', async () => {
    const store = makeStore({ challenges: [challengeEntry(startChallenge({ group: 'lactose', food: 'milk' }, new Date(2026, 9, 26, 9)))] })
    const first = renderPage(store)
    expect(await screen.findByText('Lait · jour 1')).toBeInTheDocument()
    expect(screen.queryByText(/Me rappeler ma portion/)).toBeNull()
    first.unmount()

    const plugin = {
      schedule: vi.fn(async (o) => ({ count: o.items.length, notifications: true })),
      requestNotifications: vi.fn(async () => ({ asked: true, notifications: true })),
    }
    window.__healthtrackFakePortionReminder = plugin
    renderPage(store)
    fireEvent.click(await screen.findByRole('checkbox', { name: /Me rappeler ma portion/ }))
    await waitFor(() => expect(plugin.requestNotifications).toHaveBeenCalledTimes(1))
    expect(JSON.parse(localStorage.getItem('halcya_portion_reminder'))).toEqual({ enabled: true, minute: 720 })
    fireEvent.change(screen.getByLabelText('Heure du rappel'), { target: { value: '08:30' } })
    await waitFor(() => expect(JSON.parse(localStorage.getItem('halcya_portion_reminder')).minute).toBe(510))
  })

  it('7b-2 : notifications bloquées → explication', async () => {
    window.__healthtrackFakePortionReminder = {
      schedule: vi.fn(async () => ({ notifications: false })),
      requestNotifications: vi.fn(async () => ({ asked: false, notifications: false })),
    }
    renderPage(makeStore({ gutEntries: calm(3, 2, 1) }))
    fireEvent.click(await screen.findByRole('button', { name: /Lactose/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Me rappeler ma portion/ }))
    expect(await screen.findByText(/Les notifications sont bloquées/)).toBeInTheDocument()
  })
})
