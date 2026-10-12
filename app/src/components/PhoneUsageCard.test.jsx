import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PhoneUsageCard from './PhoneUsageCard'
import { getPhoneUsageSettings, enablePhoneUsage } from '../services/phoneUsageSync'

beforeEach(() => {
  localStorage.clear()
})

function props(over = {}) {
  return {
    available: true,
    sync: vi.fn(async () => ({ ran: true })),
    checkAccess: vi.fn(async () => ({ granted: false, supported: true })),
    openSettings: vi.fn(async () => {}),
    ...over,
  }
}

describe('PhoneUsageCard', () => {
  it('hors Android : explique sans bouton', () => {
    render(<PhoneUsageCard {...props({ available: false })} />)
    expect(screen.getByText('Temps d’écran et sommeil')).toBeInTheDocument()
    expect(screen.getByText(/rien ne quitte le téléphone/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Activer' })).toBeNull()
  })

  it('« Activer » sans accès : ouvre le réglage Android et affiche le guide pas à pas', async () => {
    const p = props()
    render(<PhoneUsageCard {...p} />)
    await waitFor(() => expect(p.checkAccess).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Activer' }))
    await waitFor(() => expect(p.openSettings).toHaveBeenCalled())
    expect(getPhoneUsageSettings().enabled).toBe(true)
    expect(screen.getByText('À autoriser')).toBeInTheDocument()
    expect(screen.getByText(/Autoriser les paramètres restreints/)).toBeInTheDocument()
    expect(p.sync).not.toHaveBeenCalled()
  })

  it('accès déjà accordé : « Activer » lance directement la lecture', async () => {
    const p = props({ checkAccess: vi.fn(async () => ({ granted: true, supported: true })) })
    render(<PhoneUsageCard {...p} />)
    await waitFor(() => expect(p.checkAccess).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Activer' }))
    await waitFor(() => expect(p.sync).toHaveBeenCalledWith({ force: true }))
    expect(p.openSettings).not.toHaveBeenCalled()
  })

  it('activé et autorisé : temps d’écran du jour et nuit estimée', async () => {
    enablePhoneUsage()
    localStorage.setItem('healthtrack_phone_usage', JSON.stringify({
      ...getPhoneUsageSettings(),
      lastSyncAt: new Date().toISOString(),
      today: {
        date: '2026-10-12', screenMinutes: 135, lateScreenMinutes: 50, unlocks: 31,
        sleepEstimate: { start: new Date(2026, 9, 11, 23, 40).toISOString(), end: new Date(2026, 9, 12, 7, 5).toISOString(), minutes: 445 },
      },
    }))
    const p = props({ checkAccess: vi.fn(async () => ({ granted: true, supported: true })) })
    render(<PhoneUsageCard {...p} />)
    expect(await screen.findByText('Automatique')).toBeInTheDocument()
    expect(screen.getByText(/2 h 15 d’écran · 50 min hier soir après 22 h · 31 déverrouillages/)).toBeInTheDocument()
    expect(screen.getByText(/23:40 → 07:05/)).toBeInTheDocument()
    expect(screen.getByText(/7 h 25 sans écran/)).toBeInTheDocument()
  })
})
