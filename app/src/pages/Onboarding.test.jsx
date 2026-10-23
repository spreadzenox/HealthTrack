import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Onboarding from './Onboarding'
import { loadOnboarding, saveOnboarding } from '../settings/onboarding'

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

const cont = () => screen.getByRole('button', { name: 'Continuer' })

describe('Onboarding (jalon 4a)', () => {
  beforeEach(() => localStorage.clear())

  it('premier écran de la maquette : titre, tuiles, trois objectifs, 18 ans, pas de « Passer »', () => {
    renderAt()
    expect(screen.getByRole('heading', { name: /Comprenez ce qui va avec vos bons et mauvais jours/ })).toBeInTheDocument()
    expect(screen.getByText(/envoyé sans votre accord/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Mon ventre/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Mon énergie et mon sommeil/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Tout comprendre de mes données/ })).toBeInTheDocument()
    expect(screen.getByText(/18 ans ou plus/)).toBeInTheDocument()
    expect(screen.getByText(/Local par défaut/)).toBeInTheDocument()
    expect(screen.getByText('01/04')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Passer' })).not.toBeInTheDocument()
    expect(cont()).toBeDisabled()
  })

  it('note les écrans vus pour le diagnostic local (I156)', () => {
    renderAt()
    expect(loadOnboarding()).toMatchObject({ seen: ['goal'], lastScreen: 'goal', screens: 4 })
    fireEvent.click(screen.getByRole('radio', { name: /Mon ventre/ }))
    fireEvent.click(cont())
    expect(loadOnboarding()).toMatchObject({ seen: ['goal', 'tracks'], lastScreen: 'tracks' })
    fireEvent.click(screen.getByRole('button', { name: 'Retour' }))
    expect(loadOnboarding()).toMatchObject({ seen: ['goal', 'tracks'], lastScreen: 'goal' })
  })

  it('l’objectif coche d’avance les suivis, que l’on peut changer', () => {
    renderAt()
    fireEvent.click(screen.getByRole('radio', { name: /Mon énergie et mon sommeil/ }))
    fireEvent.click(cont())
    expect(screen.getByRole('heading', { name: 'Que voulez-vous suivre ?' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Mon sommeil/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Mon ventre/ })).not.toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: /Mon ventre/ }))
    expect(screen.getByRole('checkbox', { name: /Mon ventre/ })).toBeChecked()
    expect(loadOnboarding().tracks).toContain('gut')
  })

  it('parcours complet sans montre → Aujourd’hui, onboarding fait', async () => {
    renderAt()
    fireEvent.click(screen.getByRole('radio', { name: /Mon ventre/ }))
    fireEvent.click(cont())
    fireEvent.click(cont())
    expect(screen.getByRole('heading', { name: 'Avez-vous une montre ?' })).toBeInTheDocument()
    expect(cont()).toBeDisabled()
    fireEvent.click(screen.getByRole('radio', { name: /Pas de montre/ }))
    fireEvent.click(cont())
    expect(screen.getByRole('heading', { name: 'Comment va votre ventre ?' })).toBeInTheDocument()
    fireEvent.click(cont())
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(loadOnboarding()).toMatchObject({
      done: true,
      endedBy: 'completed',
      goal: 'gut',
      watch: 'none',
      tracks: ['gut', 'meals', 'sleep', 'wellbeing'],
      maxStep: 3,
    })
  })

  it('montre Huawei → Sources après l’onboarding (l’appairage se fait là)', async () => {
    saveOnboarding({ goal: 'all', step: 2 })
    renderAt()
    fireEvent.click(screen.getByRole('radio', { name: /compatible Huawei/ }))
    fireEvent.click(cont())
    fireEvent.click(cont())
    expect(await screen.findByText('Page Sources')).toBeInTheDocument()
  })

  it('reprend à l’écran où l’on s’était arrêté ; « Retour » revient en arrière', () => {
    saveOnboarding({ goal: 'gut', step: 1 })
    renderAt()
    expect(screen.getByRole('heading', { name: 'Que voulez-vous suivre ?' })).toBeInTheDocument()
    expect(screen.getByText('02/04')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retour' }))
    expect(screen.getByRole('radio', { name: /Mon ventre/ })).toBeChecked()
  })

  it('« Passer » termine l’onboarding sans rien demander', async () => {
    saveOnboarding({ goal: 'gut', step: 1 })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Passer' }))
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(loadOnboarding()).toMatchObject({ done: true, endedBy: 'skipped' })
  })
})

describe('redirection vers /bienvenue (Layout)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  async function renderApp(count) {
    vi.doMock('../storage/localHealthStorage', async (orig) => ({
      ...(await orig()),
      countAllEntries: vi.fn(async () => count),
    }))
    vi.doMock('../hooks/useAutoSync', () => ({ useAutoSync: () => {} }))
    vi.doMock('../services/updateCheck', async (orig) => ({ ...(await orig()), fetchLatestRelease: vi.fn(async () => null) }))
    const { default: Layout } = await import('../Layout')
    const { default: Page } = await import('./Onboarding')
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/bienvenue" element={<Page />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<p>Page Aujourd’hui</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
  }

  it('installation vierge → onboarding', async () => {
    await renderApp(0)
    expect(await screen.findByRole('heading', { name: /Comprenez ce qui va avec/ })).toBeInTheDocument()
  })

  it('mise à jour chez un utilisateur qui a des données → jamais d’onboarding', async () => {
    await renderApp(40)
    await waitFor(() => expect(loadOnboarding()).toMatchObject({ done: true, endedBy: 'existing' }))
    expect(screen.getByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Comprenez ce qui va avec/ })).not.toBeInTheDocument()
  })
})
