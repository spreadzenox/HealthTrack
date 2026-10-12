import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WithingsSetup from './WithingsSetup'
import {
  hasWithingsCredentials,
  setWithingsCredentials,
  setWithingsTokens,
  hasWithingsTokens,
} from '../settings/withingsSettings'

describe('WithingsSetup (identifiants Withings dans la carte Connecteurs)', () => {
  beforeEach(() => localStorage.clear())

  it('sans identifiants : affiche le formulaire ouvert et les enregistre', () => {
    const onChange = vi.fn()
    render(<WithingsSetup onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Client ID'), { target: { value: 'id' } })
    fireEvent.change(screen.getByLabelText('Client Secret'), { target: { value: 'sec' } })
    fireEvent.change(screen.getByLabelText(/URL de redirection/i), { target: { value: 'http://x/cb' } })
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer les identifiants/i }))
    expect(hasWithingsCredentials()).toBe(true)
    expect(onChange).toHaveBeenCalled()
    expect(screen.getByText(/Enregistré/)).toBeInTheDocument()
  })

  it('avec identifiants : le formulaire est replié derrière « Identifiants API Withings »', () => {
    setWithingsCredentials({ clientId: 'id', clientSecret: 'sec', redirectUri: 'http://x/cb' })
    render(<WithingsSetup />)
    const details = screen.getByText(/Identifiants API Withings/i).closest('details')
    expect(details).not.toHaveAttribute('open')
    expect(screen.getByLabelText('Client ID')).toHaveValue('id')
  })

  it('n’affiche « Déconnecter Withings » que si un compte est connecté, et déconnecte', () => {
    const { unmount } = render(<WithingsSetup />)
    expect(screen.queryByRole('button', { name: /Déconnecter Withings/i })).not.toBeInTheDocument()
    unmount()
    setWithingsTokens({ accessToken: 'a', refreshToken: 'r', expiresAt: Date.now() + 1000 })
    const onChange = vi.fn()
    render(<WithingsSetup onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /Déconnecter Withings/i }))
    expect(hasWithingsTokens()).toBe(false)
    expect(onChange).toHaveBeenCalled()
    expect(screen.getByText(/Compte Withings déconnecté/i)).toBeInTheDocument()
  })
})
