import { describe, it, expect, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { render, waitFor } from '@testing-library/react'

// Seule la table des routes est en jeu : les écrans sont remplacés par leur nom
vi.mock('./components/Layout', async () => {
  const { Outlet } = await import('react-router-dom')
  return { default: () => <Outlet /> }
})
vi.mock('./pages/Trends', () => ({ default: () => <p>Tendances</p> }))
vi.mock('./pages/Dashboard', () => ({ default: () => <p>Accueil</p> }))

import App from './App'

describe('anciennes adresses (refonte « Compagnon »)', () => {
  it.each(['/journal', '/bien-etre'])('%s mène à Tendances, vue Jour (étape 7b : plus de Journal jour par jour)', async (path) => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true }))
    window.history.pushState({}, '', path)
    const { findByText } = render(<App />)
    expect(await findByText('Tendances')).toBeInTheDocument()
    await waitFor(() => expect(window.location.pathname + window.location.search).toBe('/tendances?vue=jour'))
  })
})
