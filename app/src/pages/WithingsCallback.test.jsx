import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../services/withingsApi', () => ({
  exchangeWithingsCode: vi.fn(async () => {}),
  fetchAndCacheWithingsUser: vi.fn(async () => {}),
}))

import WithingsCallback from './WithingsCallback'
import { exchangeWithingsCode } from '../services/withingsApi'

function renderAt(url) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/cb" element={<WithingsCallback />} />
        <Route path="/connectors" element={<p>connecteurs</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('WithingsCallback', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('affiche une erreur sans appeler Withings quand le code manque', () => {
    renderAt('/cb')
    expect(screen.getByRole('alert').textContent).toMatch(/Code d’autorisation manquant/)
    expect(exchangeWithingsCode).not.toHaveBeenCalled()
  })

  it('refuse un état OAuth différent de celui enregistré', () => {
    sessionStorage.setItem('withings_oauth_state', 'attendu')
    renderAt('/cb?code=abc&state=autre')
    expect(screen.getByRole('alert').textContent).toMatch(/État OAuth invalide/)
    expect(exchangeWithingsCode).not.toHaveBeenCalled()
  })

  it('échange le code et confirme la connexion', async () => {
    sessionStorage.setItem('withings_oauth_state', 's1')
    renderAt('/cb?code=abc&state=s1')
    await waitFor(() => expect(screen.getByText(/Compte Withings connecté/)).toBeTruthy())
    expect(exchangeWithingsCode).toHaveBeenCalledWith('abc')
    expect(sessionStorage.getItem('withings_oauth_state')).toBeNull()
  })
})
