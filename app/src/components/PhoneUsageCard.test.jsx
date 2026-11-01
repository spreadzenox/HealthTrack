import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
    expect(screen.getByText(/lit pas le contenu des apps/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Activer' })).toBeNull()
  })

  it('« Activer » sans accès : ouvre le réglage Android et affiche le guide pas à pas', async () => {
    const p = props()
    render(<PhoneUsageCard {...p} />)
    await waitFor(() => expect(p.checkAccess).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Activer' }))
    fireEvent.click(await screen.findByRole('button', { name: 'J’accepte, ouvrir le réglage' }))
    await waitFor(() => expect(p.openSettings).toHaveBeenCalled())
    expect(getPhoneUsageSettings().enabled).toBe(true)
    expect(screen.getByText('À autoriser')).toBeInTheDocument()
    expect(screen.getByText(/Autoriser les paramètres restreints/)).toBeInTheDocument()
    expect(p.sync).not.toHaveBeenCalled()
  })

  it('divulgation avant le réglage d’Android : « Pas maintenant » n’active rien', async () => {
    const p = props()
    render(<PhoneUsageCard {...p} />)
    await waitFor(() => expect(p.checkAccess).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Activer' }))
    expect((await screen.findByRole('dialog')).textContent).toMatch(/Envoyé par .* : rien/)
    fireEvent.click(screen.getByRole('button', { name: 'Pas maintenant' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(p.openSettings).not.toHaveBeenCalled()
    expect(getPhoneUsageSettings().enabled).toBe(false)
  })

  it('accès déjà accordé : « Activer » lance directement la lecture', async () => {
    const p = props({ checkAccess: vi.fn(async () => ({ granted: true, supported: true })) })
    render(<PhoneUsageCard {...p} />)
    await waitFor(() => expect(p.checkAccess).toHaveBeenCalled())
    // Laisser React appliquer `setAccess(granted)` avant le clic : sinon « Activer » part
    // vers les réglages Android (test instable en CI, PR #121).
    await act(async () => { await p.checkAccess.mock.results[0].value })
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

  it('temps par app du jour (I116) : les catégories les plus utilisées, sans jugement', async () => {
    enablePhoneUsage()
    localStorage.setItem('healthtrack_phone_usage', JSON.stringify({
      ...getPhoneUsageSettings(),
      lastSyncAt: new Date().toISOString(),
      today: { date: '2026-10-12', screenMinutes: 135, lateScreenMinutes: 0, unlocks: 31, sleepEstimate: null },
      todayApps: { date: '2026-10-12', minutes: { social: 72, video: 40, messaging: 15, other: 90, game: 5 }, byHour: {}, topApps: [] },
    }))
    const p = props({ checkAccess: vi.fn(async () => ({ granted: true, supported: true })) })
    render(<PhoneUsageCard {...p} />)
    expect(await screen.findByText(/réseaux sociaux 1 h 12 · vidéo 40 min · messageries 15 min/)).toBeInTheDocument()
    expect(screen.queryByText(/autres apps/)).not.toBeInTheDocument()
  })

  it('dit honnêtement ce qui est lu : quelles apps, jamais leur contenu', () => {
    render(<PhoneUsageCard {...props()} />)
    expect(screen.getByText(/quelles apps sont ouvertes/)).toBeInTheDocument()
    expect(screen.queryByText(/jamais vos apps/)).not.toBeInTheDocument()
  })
})
