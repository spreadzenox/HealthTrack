import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Studio from './Studio'
import StudioSetting from './StudioSetting'
import { studioEnabled } from './flag'
import { loadFiche, saveFiche, __resetFicheCacheForTests } from './fiche'
import { normaliser } from './traits'
import { bus, EVENTS } from '../bus'

function monter() {
  return render(<MemoryRouter><Studio /></MemoryRouter>)
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  __resetFicheCacheForTests()
  bus.clear()
  localStorage.clear()
})

describe('Studio Pilou', () => {
  it('part du Pilou d’origine, sans rien de sélectionné', async () => {
    monter()
    expect(await screen.findByRole('heading', { name: 'Studio Pilou' })).toBeInTheDocument()
    expect(await screen.findByText(/Touchez un réglage/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
    for (const r of screen.getAllByRole('radio')) expect(r).toHaveAttribute('aria-checked', 'false')
  })

  it('choisir un trait, valider : la fiche est gardée et émise sur le bus', async () => {
    const vus = []
    bus.on(EVENTS.TRAITS_CHANGED, (p) => vus.push(p.fiche))
    monter()
    fireEvent.click(await screen.findByRole('radio', { name: 'Mi-longs' }))
    expect(screen.getByRole('radio', { name: 'Mi-longs, sélectionné' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('tab', { name: /Yeux/ }))
    fireEvent.click(screen.getByRole('radio', { name: 'Noisette' }))
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(await screen.findByText('Pilou est prêt. Fiche gardée sur ce téléphone.')).toBeInTheDocument()
    const f = await loadFiche()
    expect(f.cheveux.longueur).toBe('mi_longs')
    expect(f.yeux.couleur).toBe('noisette')
    expect(vus.at(-1)).toEqual(f)
  })

  it('grise les valeurs impossibles avec leur raison', async () => {
    await saveFiche(normaliser({ cheveux: { longueur: 'rases' } }).fiche)
    __resetFicheCacheForTests()
    monter()
    const frange = await screen.findByRole('radio', { name: /^Frange, indisponible/ })
    expect(frange).toBeDisabled()
    expect(screen.getAllByText(/Grisé : Sans cheveux ou rasés/).length).toBeGreaterThan(0)
  })

  it('ouvre l’onglet du premier champ à vérifier, et toucher la valeur la confirme', async () => {
    await saveFiche(normaliser({ yeux: { couleur: 'vert', forme: 'ronds' }, incertains: ['yeux.couleur'] }).fiche)
    __resetFicheCacheForTests()
    monter()
    expect(await screen.findByText('À vérifier : la couleur des yeux')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Yeux/ })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Vert, sélectionné, à vérifier' }))
    expect(screen.getByText('La couleur des yeux : vérifié, merci !')).toBeInTheDocument()
    expect(screen.queryByText('À vérifier : la couleur des yeux')).not.toBeInTheDocument()
  })

  it('le couvre-chef est proposé à tout le monde, choisi seulement à la main', async () => {
    monter()
    fireEvent.click(await screen.findByRole('tab', { name: /Accessoires/ }))
    expect(screen.getByText('Choisi par vous seulement.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Foulard' })).toBeEnabled()
  })

  it('« Surprenez-moi » propose une fiche, « Revenir au Pilou d’origine » efface la fiche', async () => {
    await saveFiche(normaliser({ cheveux: { longueur: 'longs' } }).fiche)
    __resetFicheCacheForTests()
    monter()
    fireEvent.click(await screen.findByRole('button', { name: 'Surprenez-moi' }))
    expect(screen.getByRole('button', { name: 'Valider' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: "Revenir au Pilou d'origine" }))
    await waitFor(() => expect(screen.getByText("Pilou est revenu à son apparence d'origine.")).toBeInTheDocument())
    __resetFicheCacheForTests()
    expect(await loadFiche()).toBeNull()
  })

  it('prend le nom choisi pour Pilou', async () => {
    const { setCompanionName } = await import('../life/companionState')
    setCompanionName('Galet')
    monter()
    expect(await screen.findByRole('heading', { name: 'Studio Galet' })).toBeInTheDocument()
  })

  it('aucun texte ne commente l’apparence', async () => {
    const { container } = monter()
    await screen.findByRole('heading', { name: 'Studio Pilou' })
    expect(container.textContent).not.toMatch(/joli|beau|belle|jeune|vieux|mignon/i)
  })
})

describe('entrée dans Réglages', () => {
  it('suit l’interrupteur du compagnon (caché sans lui), et se cache quand il est éteint', () => {
    const mods = import.meta.glob('../flags.js', { eager: true })
    const f = mods['../flags.js']
    expect(studioEnabled()).toBe(f ? !!f.companionSceneEnabled() : false)
    const { container } = render(<MemoryRouter><StudioSetting enabled={false} /></MemoryRouter>)
    expect(container).toBeEmptyDOMElement()
  })
  it('ouvre le Studio quand le compagnon est là', () => {
    render(<MemoryRouter><StudioSetting enabled /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Ouvrir le Studio Pilou' })).toHaveAttribute('href', '/pilou/studio')
  })
})
