import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const stored = vi.hoisted(() => ({ entries: [], created: [] }))
vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(async () => stored.entries),
  upsertEntries: vi.fn(async () => {}),
  countAllEntries: vi.fn(async () => 0),
  createEntry: vi.fn(async (e) => {
    stored.created.push(e)
    return stored.created.length
  }),
  updateEntry: vi.fn(async () => {}),
}))
// Sans Health Connect (navigateur) : l'accueil ne doit jamais rester bloqué
vi.mock('../connectors/connectorRegistry', () => ({ getConnector: () => undefined, CONNECTORS: [] }))

import Onboarding from './Onboarding'
import { FLOW_VERSION, loadOnboarding, saveOnboarding } from '../settings/onboarding'
import { CHANGELOG } from '../data/changelog'
import { getLastSeenId } from '../services/whatsNew'

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/bienvenue']}>
      <Routes>
        <Route path="/bienvenue" element={<Onboarding />} />
        <Route path="/" element={<p>Page Aujourd’hui</p>} />
        <Route path="/connectors" element={<p>Page Sources</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const btn = (name) => screen.getByRole('button', { name })
const heading = (name) => screen.getByRole('heading', { name })

describe('Nouvel accueil (ACC-1, ACC-2) : tuto en trois cartes', () => {
  beforeEach(() => {
    localStorage.clear()
    stored.created = []
  })

  it('carte 1 : bienvenue, « Suivant », « Passer », pas de retour ; compteur fixe 01/05 (sideload, sans visage)', () => {
    renderAt()
    expect(heading('Bienvenue dans Halcya')).toBeInTheDocument()
    expect(screen.getByText('Vos repas, votre sommeil, votre montre et votre ressenti, au même endroit.')).toBeInTheDocument()
    expect(screen.getByText('01/05')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retour' })).not.toBeInTheDocument()
    expect(btn('Suivant')).toBeEnabled()
    expect(btn('Passer')).toBeInTheDocument()
  })

  it('carte 2 : les trois onglets ; « Suivant » mène à la carte 3, qui finit par « Commencer »', () => {
    renderAt()
    fireEvent.click(btn('Suivant'))
    expect(heading('Halcya cherche ce qui va avec vos bons et mauvais jours')).toBeInTheDocument()
    expect(screen.getByText('vérifier une piste par un essai de deux semaines')).toBeInTheDocument()
    expect(btn('Retour')).toBeInTheDocument()
    fireEvent.click(btn('Suivant'))
    expect(heading('Vos données restent sur votre téléphone')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Passer' })).not.toBeInTheDocument()
    expect(btn('Commencer')).toBeInTheDocument()
  })

  it('« Passer » mène à la carte confidentialité, jamais au-delà', () => {
    renderAt()
    fireEvent.click(btn('Passer'))
    expect(heading('Vos données restent sur votre téléphone')).toBeInTheDocument()
    expect(loadOnboarding().done).toBe(false)
  })

  it('carte 3 : la liste des cas où les données sortent, en deux groupes, et les 18 ans', () => {
    saveOnboarding({ flow: FLOW_VERSION, card: 2 })
    renderAt()
    expect(screen.getByText('Quand vous le demandez')).toBeInTheDocument()
    expect(screen.getByText('Si vous l’activez')).toBeInTheDocument()
    for (const t of ['Analyser un repas ou une photo de selles', 'Exporter vos données, partager le rapport pour votre médecin', 'Envoyer votre avis', 'Météo', 'Sauvegarde du téléphone']) {
      expect(screen.getByText(t)).toBeInTheDocument()
    }
    expect(screen.getByText(/18 ans ou plus/)).toBeInTheDocument()
    expect(screen.getByText(/ne pose pas de diagnostic/)).toBeInTheDocument()
  })

  it('glisser vers la gauche passe à la carte suivante', () => {
    renderAt()
    const card = heading('Bienvenue dans Halcya').closest('.onb-tuto')
    fireEvent.touchStart(card, { touches: [{ clientX: 300 }] })
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 100 }] })
    expect(heading('Halcya cherche ce qui va avec vos bons et mauvais jours')).toBeInTheDocument()
  })

  it('installation neuve : l’historique des nouveautés est déjà « lu » (VC-5)', () => {
    renderAt()
    expect(getLastSeenId()).toBe(CHANGELOG[0].id)
  })
})

describe('Nouvel accueil (ACC-3) : objectifs à choix multiple', () => {
  beforeEach(() => localStorage.clear())

  it('six cases, rien de coché, « Continuer » jamais grisé ; plusieurs choix gardés', () => {
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'goal' })
    renderAt()
    expect(heading('Qu’est-ce qui vous amène ?')).toBeInTheDocument()
    expect(screen.getByText('02/05')).toBeInTheDocument()
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes.map((b) => b.closest('label').querySelector('.onb-choice-label').textContent)).toEqual([
      'Ma digestion', 'Mon cycle', 'Mon stress et mon sommeil', 'Mon sport et ma récupération', 'Prendre soin de moi', 'Tout mesurer',
    ])
    boxes.forEach((b) => expect(b).not.toBeChecked())
    expect(btn('Continuer')).toBeEnabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /Mon cycle/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Mon sport/ }))
    fireEvent.click(btn('Continuer'))
    expect(loadOnboarding()).toMatchObject({ goals: ['cycle', 'sport'], tracks: expect.arrayContaining(['gut', 'activity']) })
    expect(heading('Branchez vos sources')).toBeInTheDocument()
  })

  it('l’ancien objectif reste lu (goal: energy → Mon stress et mon sommeil coché)', () => {
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'goal', goal: 'energy' })
    renderAt()
    expect(screen.getByRole('checkbox', { name: /Mon stress et mon sommeil/ })).toBeChecked()
  })

  it('le retour du premier écran après le tuto ramène à la carte 3', () => {
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'goal', step: 1 })
    renderAt()
    fireEvent.click(btn('Retour'))
    expect(heading('Vos données restent sur votre téléphone')).toBeInTheDocument()
  })
})

describe('Nouvel accueil : parcours complet sans Health Connect', () => {
  beforeEach(() => {
    localStorage.clear()
    stored.created = []
  })

  it('aucun écran ne bloque ; « Que voulez-vous suivre ? » et « Avez-vous une montre ? » ont disparu', async () => {
    renderAt()
    fireEvent.click(btn('Suivant'))
    fireEvent.click(btn('Suivant'))
    fireEvent.click(btn('Commencer'))
    fireEvent.click(screen.getByRole('checkbox', { name: /Ma digestion/ }))
    fireEvent.click(btn('Continuer'))
    expect(heading('Branchez vos sources')).toBeInTheDocument()
    expect(screen.getByText(/Health Connect n’est pas sur ce téléphone/)).toBeInTheDocument()
    expect(screen.queryByText(/Que voulez-vous suivre/)).not.toBeInTheDocument()
    fireEvent.click(btn('Continuer'))
    expect(heading('Votre téléphone suffit pour commencer')).toBeInTheDocument()
    fireEvent.click(btn('Continuer sans'))
    expect(heading('Comment vous sentez-vous maintenant ?')).toBeInTheDocument()
    expect(screen.getByText('05/05')).toBeInTheDocument()
    fireEvent.click(btn('Continuer'))
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(loadOnboarding()).toMatchObject({ done: true, endedBy: 'completed', goals: ['gut'] })
    expect(stored.created).toEqual([])
  })

  it('un accueil de l’ancien parcours, commencé, repart du tuto en gardant les réponses', () => {
    saveOnboarding({ goal: 'gut', watch: 'none', step: 4 })
    renderAt()
    expect(heading('Bienvenue dans Halcya')).toBeInTheDocument()
    expect(loadOnboarding()).toMatchObject({ flow: FLOW_VERSION, goal: 'gut', step: 0 })
  })

  it('note les écrans vus pour le diagnostic local (I156)', () => {
    renderAt()
    expect(loadOnboarding()).toMatchObject({ seen: ['tuto'], lastScreen: 'tuto', screens: 5 })
  })
})

describe('Nouvel accueil (ACC-7) : première note', () => {
  beforeEach(() => {
    localStorage.clear()
    stored.created = []
  })

  it('cinq visages ; « Enregistrer » crée une vraie note de bien-être', async () => {
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'first', goals: ['stress'] })
    renderAt()
    for (const l of ['Mal', 'Bof', 'Neutre', 'Bien', 'Très bien']) expect(btn(l)).toBeInTheDocument()
    expect(screen.queryByText('Et votre ventre ?')).not.toBeInTheDocument()
    fireEvent.click(btn('Bien'))
    fireEvent.click(btn('Enregistrer'))
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(stored.created).toEqual([{ type: 'wellbeing', source: 'app_wellbeing', payload: { score: expect.any(Number) } }])
  })

  it('avec « Mon cycle » : aussi « Et votre ventre ? » (Calme, Gêné, Douloureux)', async () => {
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'first', goals: ['cycle'] })
    renderAt()
    expect(heading('Et votre ventre ?')).toBeInTheDocument()
    fireEvent.click(btn('Gêné'))
    fireEvent.click(btn('Enregistrer'))
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(stored.created).toEqual([expect.objectContaining({ type: 'gut', payload: { level: 'discomfort' } })])
  })
})
