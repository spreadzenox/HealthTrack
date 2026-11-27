import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const store = vi.hoisted(() => ({ id: 'play' }))
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'play', FEATURES: actual.featuresFor('play'), get STORE() { return actual.storeFor(store.id) } }
})

import LaunchEndCard from './LaunchEndCard'
import {
  launchEndNotice, dismissLaunchEndNotice, refreshEntitlement, lastLaunchUntil,
  launchEndedNotice, dismissLaunchEndedNotice, LAUNCH_ENDED_NOTICE_MS,
  launchExtension, launchExtendedNotice, dismissLaunchExtendedNotice,
} from '../services/entitlement'

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
    // Le Journal n'existe plus depuis la refonte (POLISH-LAUNCH-JOURNAL)
    expect(screen.getByText(/vos notes et vos repas/)).toBeInTheDocument()
    expect(screen.queryByText(/journal/i)).not.toBeInTheDocument()
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

describe('launchEndedNotice — le test est terminé (FIN-LANCEMENT-2)', () => {
  beforeEach(() => localStorage.clear())
  const free = { premium: false, source: null }

  it('après la fin, une fois, avec la dernière date vue', () => {
    expect(launchEndedNotice(free, { now: END + DAY, last: UNTIL, seen: null })).toEqual({ until: UNTIL })
    expect(launchEndedNotice(free, { now: END + DAY, last: UNTIL, seen: UNTIL })).toBeNull()
  })

  it('rien avant la fin, sans période vue, ni bien après', () => {
    expect(launchEndedNotice(free, { now: END - 1000, last: UNTIL, seen: null })).toBeNull()
    expect(launchEndedNotice(free, { now: END + DAY, last: null, seen: null })).toBeNull()
    expect(launchEndedNotice(free, { now: END + LAUNCH_ENDED_NOTICE_MS + 1000, last: UNTIL, seen: null })).toBeNull()
  })

  it('rien pour qui a Gold ou Silver (achat, ou période recalée)', () => {
    expect(launchEndedNotice({ premium: true, source: 'play' }, { now: END + DAY, last: UNTIL, seen: null })).toBeNull()
    expect(launchEndedNotice({ premium: true, source: 'launch' }, { now: END + DAY, last: UNTIL, seen: null })).toBeNull()
  })

  it('lit le stockage par défaut, et la fermeture tient', () => {
    localStorage.setItem('halcya_launch_last_until', UNTIL)
    expect(launchEndedNotice(free, { now: END + DAY })).toEqual({ until: UNTIL })
    dismissLaunchEndedNotice(UNTIL)
    expect(launchEndedNotice(free, { now: END + DAY })).toBeNull()
  })
})

describe('LaunchEndCard — après la fin', () => {
  const PAST = new Date(Date.now() - 2 * DAY).toISOString()
  beforeEach(() => {
    localStorage.clear()
    store.id = 'play'
    localStorage.setItem('halcya_launch_last_until', PAST)
    storeEnt({ premium: false, source: null })
  })

  it('remercie, rassure sur les données et mène aux formules', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Le test est terminé. Merci !' })).toBeInTheDocument()
    expect(screen.getByText(/Rien n’est effacé/)).toBeInTheDocument()
    expect(screen.getByText(/vos notes, vos repas et vos mesures/)).toBeInTheDocument()
    expect(screen.queryByText(/journal/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir les formules' })).toHaveAttribute('href', '/premium')
  })

  it('une seule fois', () => {
    const { unmount } = renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('heading')).toBeNull()
    unmount()
    renderCard()
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('le lien compte comme vu', () => {
    const { unmount } = renderCard()
    fireEvent.click(screen.getByRole('link', { name: 'Voir les formules' }))
    unmount()
    renderCard()
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('jamais dans l’app iPhone', () => {
    store.id = 'appstore'
    renderCard()
    expect(screen.queryByRole('heading')).toBeNull()
  })
})

describe('Gold offert prolongé (P44-3b)', () => {
  const LATER = '2026-12-27T23:00:00Z'
  const LEND = Date.parse(LATER)
  const reply = (body) => () => Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
  const launch = (launchUntil) => reply({ premium: true, source: 'launch', tier: 'gold', launchUntil })
  beforeEach(() => localStorage.clear())

  it('refreshEntitlement retient la date quand le relais la recule', async () => {
    await refreshEntitlement({ fetchImpl: launch(UNTIL) })
    expect(launchExtension()).toBeNull()
    await refreshEntitlement({ fetchImpl: launch(UNTIL) })
    expect(launchExtension()).toBeNull()
    await refreshEntitlement({ fetchImpl: launch(LATER) })
    expect(launchExtension()).toBe(LATER)
    expect(lastLaunchUntil()).toBe(LATER)
  })

  it('pas de prolongation à la première date vue, ni si la date avance', async () => {
    await refreshEntitlement({ fetchImpl: launch(LATER) })
    await refreshEntitlement({ fetchImpl: launch(UNTIL) })
    expect(launchExtension()).toBeNull()
  })

  it('une fin qui bouge de moins d’un jour n’est pas une prolongation (UPG-9 : « prolongé » au 1er jour)', async () => {
    await refreshEntitlement({ fetchImpl: launch(UNTIL) })
    await refreshEntitlement({ fetchImpl: launch(new Date(Date.parse(UNTIL) + 5_000).toISOString()) })
    await refreshEntitlement({ fetchImpl: launch(new Date(Date.parse(UNTIL) + 23 * 3_600_000).toISOString()) })
    expect(launchExtension()).toBeNull()
    await refreshEntitlement({ fetchImpl: launch(new Date(Date.parse(UNTIL) + 23 * 3_600_000 + DAY).toISOString()) })
    expect(launchExtension()).not.toBeNull()
  })

  it('prolongation vue après la fin de la première période (relais muet entre-temps)', async () => {
    await refreshEntitlement({ fetchImpl: launch(UNTIL) })
    await refreshEntitlement({ fetchImpl: reply({ premium: false, source: null }) })
    await refreshEntitlement({ fetchImpl: launch(LATER) })
    expect(launchExtension()).toBe(LATER)
  })

  it('la carte dit la nouvelle date, une fois', () => {
    const ent = { ...launchEnt, launchUntil: LATER }
    const n = launchExtendedNotice(ent, { now: END, extended: LATER, seen: null })
    expect(n).toEqual({ until: LATER, lastDay: expect.stringMatching(/^27 déc\.? 2026$/) })
    expect(launchExtendedNotice(ent, { now: END, extended: LATER, seen: LATER })).toBeNull()
  })

  it('rien sans prolongation, après la fin, sans Gold offert, ni pour une autre date', () => {
    const ent = { ...launchEnt, launchUntil: LATER }
    expect(launchExtendedNotice(ent, { now: END, extended: null, seen: null })).toBeNull()
    expect(launchExtendedNotice(ent, { now: LEND, extended: LATER, seen: null })).toBeNull()
    expect(launchExtendedNotice({ ...ent, premium: false }, { now: END, extended: LATER, seen: null })).toBeNull()
    expect(launchExtendedNotice({ ...ent, source: 'play' }, { now: END, extended: LATER, seen: null })).toBeNull()
    expect(launchExtendedNotice(launchEnt, { now: END - DAY, extended: LATER, seen: null })).toBeNull()
  })

  it('la fermeture tient dans le stockage', () => {
    const ent = { ...launchEnt, launchUntil: LATER }
    localStorage.setItem('halcya_launch_extended', LATER)
    expect(launchExtendedNotice(ent, { now: END })).not.toBeNull()
    dismissLaunchExtendedNotice(LATER)
    expect(launchExtendedNotice(ent, { now: END })).toBeNull()
  })

  it('« Le test est terminé » attend la vérification d’après la fin', () => {
    // dernier état connu : encore la période de lancement, pas revérifié depuis sa fin (hors connexion le lendemain)
    const stale = { premium: false, source: 'launch', launchUntil: UNTIL }
    expect(launchEndedNotice(stale, { now: END + DAY, last: UNTIL, seen: null })).toBeNull()
    expect(launchEndedNotice({ premium: false, source: null }, { now: END + DAY, last: UNTIL, seen: null })).toEqual({ until: UNTIL })
  })
})

describe('LaunchEndCard — Gold prolongé', () => {
  const FAR = new Date(Date.now() + 25 * DAY).toISOString()
  beforeEach(() => {
    localStorage.clear()
    store.id = 'play'
    storeEnt({ ...launchEnt, launchUntil: FAR })
    localStorage.setItem('halcya_launch_extended', FAR)
  })

  it('dit la nouvelle date et que rien n’est à payer', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: /^Gold offert jusqu’au \d+/ })).toBeInTheDocument()
    expect(screen.getByText('Gold est prolongé : vous n’avez rien à payer.')).toBeInTheDocument()
    expect(screen.queryByText(/restent gratuits/)).toBeNull()
    expect(screen.getByRole('link', { name: 'Voir ce que comprend Gold' })).toHaveAttribute('href', '/premium')
  })

  it('une seule fois', () => {
    const { unmount } = renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('heading')).toBeNull()
    unmount()
    renderCard()
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('dans les 3 derniers jours, la carte de fin prend le relais', () => {
    renderCard(Date.parse(FAR) - DAY)
    expect(screen.getByText(/restent gratuits/)).toBeInTheDocument()
  })

  it('jamais dans l’app iPhone', () => {
    store.id = 'appstore'
    renderCard()
    expect(screen.queryByRole('heading')).toBeNull()
  })
})
