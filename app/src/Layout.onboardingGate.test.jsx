import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Premier lancement (C4) : l'Accueil ne se monte pas tant qu'on ne sait pas s'il faut l'onboarding,
// sinon il calcule pour rien et s'affiche un instant avant de laisser la place à « Bienvenue ».
let resolveNeeded
vi.mock('./settings/onboarding', async (importOriginal) => ({
  ...(await importOriginal()),
  needsOnboarding: vi.fn(
    () =>
      new Promise((resolve) => {
        resolveNeeded = resolve
      }),
  ),
}))
vi.mock('./services/updateCheck', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchLatestRelease: vi.fn(async () => null),
}))

const { default: App } = await import('./App')

describe('Layout — attente de la décision d’onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('nouvelle installation : ni Accueil ni calcul avant la réponse, puis l’onboarding', async () => {
    const { container } = render(<App />)
    expect(screen.queryByRole('button', { name: /Photo du repas/ })).not.toBeInTheDocument()
    expect(container.querySelector('main .loading')).toBeInTheDocument()
    resolveNeeded(true)
    await waitFor(() => expect(window.location.pathname).toBe('/bienvenue'))
  })

  it('base déjà remplie : l’Accueil s’affiche dès la réponse', async () => {
    render(<App />)
    resolveNeeded(false)
    expect(await screen.findByRole('button', { name: /Photo du repas/ })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('onboarding déjà fait : l’Accueil s’affiche tout de suite, sans attendre', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true }))
    render(<App />)
    expect(screen.getByRole('button', { name: /Photo du repas/ })).toBeInTheDocument()
  })
})
