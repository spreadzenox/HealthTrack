import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const store = vi.hoisted(() => ({ id: 'play' }))
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'play', FEATURES: actual.featuresFor('play'), get STORE() { return actual.storeFor(store.id) } }
})

import LaunchEndCard from './LaunchEndCard'
import { launchEndNotice, dismissLaunchEndNotice, refreshEntitlement, lastLaunchUntil } from '../services/entitlement'

const UNTIL = '2026-11-27T23:00:00Z'
const END = Date.parse(UNTIL)
const DAY = 86_400_000
const launchEnt = { premium: true, source: 'launch', state: 'active', tier: 'gold', launchUntil: UNTIL }
const storeEnt = (ent) => localStorage.setItem('halcya_entitlement', JSON.stringify({ checkedAt: new Date().toISOString(), ...ent }))
const renderCard = (now) => render(<MemoryRouter><LaunchEndCard now={now} /></MemoryRouter>)

describe('launchEndNotice — fin de Gold offert (FIN-LANCEMENT-1)', () => {
  beforeEach(() => localStorage.clear())

  it('rien plus de 3 jours avant la fin', () => {
    expect(launchEndNotice(launchEnt, { now: END - 3 * DAY - 1000, seen: null })).toBeNull()
  })

  it('la date du dernier jour offert dans les 3 derniers jours', () => {
    const n = launchEndNotice(launchEnt, { now: END - 2 * DAY, seen: null })
    expect(n).toEqual({ until: UNTIL, lastDay: expect.stringMatching(/^27 nov\.? 2026$/) })
  })

  it('rien après la fin, ni sans période de lancement', () => {
    expect(launchEndNotice(launchEnt, { now: END, seen: null })).toBeNull()
    expect(launchEndNotice({ ...launchEnt, source: 'play' }, { now: END - DAY, seen: null })).toBeNull()
    expect(launchEndNotice({ ...launchEnt, premium: false }, { now: END - DAY, seen: null })).toBeNull()
    expect(launchEndNotice({ ...launchEnt, launchUntil: null }, { now: END - DAY, seen: null })).toBeNull()
  })

  it('fermée pour cette date seulement : revient si le relais recale la fin', () => {
    expect(launchEndNotice(launchEnt, { now: END - DAY, seen: UNTIL })).toBeNull()
    const later = '2026-12-11T23:00:00Z'
    expect(launchEndNotice({ ...launchEnt, launchUntil: later }, { now: Date.parse(later) - DAY, seen: UNTIL })).not.toBeNull()
  })

  it('lit la fermeture dans le stockage par défaut', () => {
    dismissLaunchEndNotice(UNTIL)
    expect(launchEndNotice(launchEnt, { now: END - DAY })).toBeNull()
  })
})

describe('refreshEntitlement garde la dernière fin de période (pour FIN-LANCEMENT-2)', () => {
  beforeEach(() => localStorage.clear())

  it('retient launchUntil, et le garde quand le relais ne le renvoie plus', async () => {
    const reply = (body) => () => Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
    await refreshEntitlement({ fetchImpl: reply({ premium: true, source: 'launch', tier: 'gold', launchUntil: UNTIL }) })
    expect(lastLaunchUntil()).toBe(UNTIL)
    await refreshEntitlement({ fetchImpl: reply({ premium: false, source: null }) })
    expect(lastLaunchUntil()).toBe(UNTIL)
  })
})

// Carte : fin de période dans 20 jours (getEntitlement lit l'horloge réelle)
const FUTURE = new Date(Date.now() + 20 * DAY).toISOString()
const FEND = Date.parse(FUTURE)
const futureEnt = { ...launchEnt, launchUntil: FUTURE }

describe('LaunchEndCard — carte de l’Accueil', () => {
  beforeEach(() => {
    localStorage.clear()
    store.id = 'play'
  })

  it('dit la date et ce qui reste gratuit, avec un lien vers Gold', () => {
    storeEnt(futureEnt)
    renderCard(FEND - DAY)
    expect(screen.getByRole('heading', { name: /^Gold offert jusqu’au \d+/ })).toBeInTheDocument()
    expect(screen.getByText(/restent gratuits/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir ce que comprend Gold' })).toHaveAttribute('href', '/premium')
  })

  it('la croix la ferme pour de bon', () => {
    storeEnt(futureEnt)
    const { unmount } = renderCard(FEND - DAY)
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('heading')).toBeNull()
    unmount()
    renderCard(FEND - DAY)
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('rien trop tôt', () => {
    storeEnt(futureEnt)
    renderCard(FEND - 10 * DAY)
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('jamais dans l’app iPhone', () => {
    store.id = 'appstore'
    storeEnt(futureEnt)
    renderCard(FEND - DAY)
    expect(screen.queryByRole('heading')).toBeNull()
  })
})
