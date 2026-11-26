import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Objectives from './Objectives'
import { fromDisplay } from '../services/mood/wellbeingScale'
import { createTrial } from '../services/trials'
const ONBOARDING_KEY = 'healthtrack_onboarding'

const NOW = new Date(2026, 10, 15, 12)
const DAY = 86_400_000
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const band = (v) => ({ mean: fromDisplay(v), low: fromDisplay(v - 0.3), high: fromDisplay(v + 0.3), sd: 0.1 })
const states = (wellbeing, digestion = wellbeing.map(() => null)) => ({
  showDigestiveCurve: true,
  days: wellbeing.map((v, i) => ({
    date: key(new Date(NOW.getTime() - (wellbeing.length - 1 - i) * DAY)),
    future: false,
    observed: { wellbeing: v != null, digestion: digestion[i] != null },
    wellbeing: band(v ?? 3),
    digestion: band(digestion[i] ?? 3),
    digestionOwn: band(digestion[i] ?? 3),
  })),
})

const show = (s) => render(<MemoryRouter><Objectives read={() => Promise.resolve(s)} now={NOW} /></MemoryRouter>)
const goals = (list) => localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ done: true, goals: list, goalsVersion: 2 }))

describe('Objectifs, vue d’ensemble (refonte « Compagnon », étape 6a)', () => {
  beforeEach(() => localStorage.clear())

  it('après 7 jours notés : le score sur 5, la tendance en mots, et la carte mène au détail', async () => {
    goals([])
    show(states([3, 3, 3, 3, 4, 4, 4]))
    const card = await screen.findByTestId('objective-wellbeing')
    expect(card).toHaveTextContent('Bien-être')
    expect(card).toHaveTextContent('3,4 / 5')
    expect(card).toHaveTextContent('Plutôt en hausse cette semaine')
    expect(card).toHaveAttribute('href', '/recommendations/bien-etre')
  })

  it('UPG-6 : le score dit que c’est la moyenne des 7 derniers jours (l’Accueil montre la note du jour)', async () => {
    goals([])
    show(states([3, 3, 3, 3, 4, 4, 4]))
    const card = await screen.findByTestId('objective-wellbeing')
    expect(card).toHaveTextContent('Moyenne de vos 7 derniers jours')
  })

  it('le lien « Ce qui va avec » finit par l’icône chevron, pas un « › » texte que Nunito rapetisse (7d-4)', async () => {
    goals([])
    show(states([3, 3, 3, 3, 4, 4, 4]))
    const card = await screen.findByTestId('objective-wellbeing')
    expect(card.querySelector('.objective-more svg.objective-chevron')).not.toBeNull()
    expect(card.textContent).not.toContain('›')
  })

  it('avant 7 jours notés : aucun score, ce qu’il reste et le compte des jours notés', async () => {
    goals([])
    show(states([4, null, 4, 4]))
    const card = await screen.findByTestId('objective-wellbeing')
    expect(card).toHaveTextContent('Premier score dans 4 jours notés')
    expect(card).toHaveTextContent('3 sur 7 jours notés')
    expect(card).not.toHaveTextContent('/ 5')
  })

  it('sans aucune donnée : la carte du bien-être attend ses 7 jours', async () => {
    goals([])
    show(null)
    expect(await screen.findByTestId('objective-wellbeing')).toHaveTextContent('Premier score dans 7 jours notés')
  })

  it('sans l’objectif digestion : pas de carte Confort digestif', async () => {
    goals(['stress'])
    show(states([4, 4, 4]))
    await screen.findByTestId('objective-wellbeing')
    expect(screen.queryByTestId('objective-digestion')).toBeNull()
  })

  it('POLISH-SIM-76 et 93 : sans l’objectif digestion mais avec des jours notés, une ligne dit où les retrouver', async () => {
    goals(['wellbeing'])
    show(states([4, 4, 4, 4], [3, null, 2, 3]))
    const line = await screen.findByTestId('objectives-gut-hidden')
    expect(line).toHaveTextContent('Vos notes de digestion (3 jours) sont gardées.')
    expect(line).toHaveTextContent('Paramètres › Vos objectifs')
    expect(line.querySelector('a')).toHaveAttribute('href', '/settings')
    expect(screen.queryByTestId('objective-digestion')).toBeNull()
  })

  it('sans l’objectif digestion ni aucun jour noté : pas de ligne', async () => {
    goals(['wellbeing'])
    show(states([4, 4, 4]))
    await screen.findByTestId('objective-wellbeing')
    expect(screen.queryByTestId('objectives-gut-hidden')).toBeNull()
  })

  it('avec l’objectif digestion : la carte attend 14 jours notés, sans le mot « ventre »', async () => {
    goals(['gut'])
    show(states(new Array(13).fill(4), new Array(13).fill(3)))
    const card = await screen.findByTestId('objective-digestion')
    expect(card).toHaveTextContent('Confort digestif')
    expect(card).toHaveTextContent('Premier score dans 1 jour noté')
    expect(card).toHaveTextContent('13 sur 14 jours notés')
    // POLISH-SIM-102, UPG-7 : les deux paliers nommés, comme dans Ma journée
    expect(card).toHaveTextContent('Pistes au 28e jour noté. 13 sur 14 jours notés')
    expect(card).not.toHaveTextContent('plus de recul')
    expect(card).toHaveAttribute('href', '/recommendations/ventre')
    expect(document.body.textContent).not.toMatch(/ventre/i)
  })
})

describe('POLISH-SIM-136 : l’essai en cours se retrouve en haut d’Objectifs', () => {
  beforeEach(() => localStorage.clear())
  const sleepFactor = { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', outcome: 'wellbeing', effect: 0.4, center: 420, usualChange: { amount: 30 } }
  const trialRow = (id, outcome = 'wellbeing') => {
    const payload = createTrial({ ...sleepFactor, outcome }, { now: new Date(NOW.getTime() - 3 * DAY) })
    return { id, type: 'trial', at: payload.startedAt, payload }
  }
  const showWith = (readTrials) => render(
    <MemoryRouter><Objectives read={() => Promise.resolve(states([3, 3, 3, 3, 4, 4, 4]))} readTrials={readTrials} now={NOW} /></MemoryRouter>,
  )

  it('un essai en cours : une ligne au-dessus des objectifs, qui ouvre l’essai', async () => {
    goals([])
    showWith(async () => [trialRow(4)])
    const link = await screen.findByTestId('objectives-trial')
    expect(link).toHaveAttribute('href', '/agir/essai/4')
    expect(link).toHaveTextContent(/^Essai en cours : Dormir au moins 7 h 30jour 4 sur 10 · aujourd’hui, jour (avec|sans)$/)
    const card = await screen.findByTestId('objective-wellbeing')
    expect(link.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('un essai du confort digestif compte aussi ; sans essai ou si la lecture échoue, rien', async () => {
    goals([])
    const { unmount } = showWith(async () => [trialRow(9, 'digestion')])
    expect(await screen.findByTestId('objectives-trial')).toHaveAttribute('href', '/agir/essai/9')
    unmount()
    const r = showWith(async () => [])
    await screen.findByTestId('objective-wellbeing')
    expect(screen.queryByTestId('objectives-trial')).toBeNull()
    r.unmount()
    showWith(async () => { throw new Error('x') })
    await screen.findByTestId('objective-wellbeing')
    expect(screen.queryByTestId('objectives-trial')).toBeNull()
  })
})
