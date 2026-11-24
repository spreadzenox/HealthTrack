import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Version iOS (HealthTrack-iOS) : sans le plugin natif, la carte dit que ce n'est pas encore sur iPhone (correctif 07) ;
// avec, elle demande l'autorisation Temps d'écran (Face ID ou code), pas l'accès aux données d'utilisation d'Android,
// et compte des prises en main (correctif 34)
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

import PhoneUsageCard from './PhoneUsageCard'
import { enablePhoneUsage, getPhoneUsageSettings } from '../services/phoneUsageSync'

const ANDROID = /Android|données d’utilisation|Paramètre restreint|déverrouillage/

function props(over = {}) {
  return {
    available: true,
    sync: vi.fn(async () => ({ ran: true })),
    checkAccess: vi.fn(async () => ({ granted: false, supported: true })),
    openSettings: vi.fn(async () => {}),
    ...over,
  }
}

describe('Temps d’écran et sommeil sur iPhone', () => {
  beforeEach(() => localStorage.clear())

  it('sans le plugin natif : pas encore sur iPhone, sans renvoi vers l’app Android', () => {
    render(<PhoneUsageCard available={false} />)
    expect(screen.getByText('Pas encore disponible sur iPhone.')).toBeInTheDocument()
    expect(screen.queryByText(/app Android/)).not.toBeInTheDocument()
  })

  it('« Activer » : accord propre à l’iPhone, puis demande d’autorisation Temps d’écran, sans mot d’Android', async () => {
    const p = props()
    const { container } = render(<PhoneUsageCard {...p} />)
    await waitFor(() => expect(p.checkAccess).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Activer' }))
    expect(await screen.findByText('Avant d’autoriser l’accès au temps d’écran')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(ANDROID)
    fireEvent.click(screen.getByRole('button', { name: 'J’accepte, continuer' }))
    await waitFor(() => expect(p.openSettings).toHaveBeenCalled())
    expect(getPhoneUsageSettings().enabled).toBe(true)
    expect(screen.getByText(/Face ID ou code/)).toBeInTheDocument()
    expect(screen.getByText(/Union européenne/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Autoriser' })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(ANDROID)
  })

  it('avant iOS 26.4, pas encore activée : la carte n’est pas proposée (retours du premier testeur, 06/11)', async () => {
    const p = props({ checkAccess: vi.fn(async () => ({ granted: false, supported: false })) })
    const { container } = render(<PhoneUsageCard {...p} />)
    await waitFor(() => expect(p.checkAccess).toHaveBeenCalled())
    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(screen.queryByRole('button', { name: 'Activer' })).toBeNull()
  })

  it('avant iOS 26.4 : dit de mettre l’iPhone à jour, sans bouton « Autoriser »', async () => {
    enablePhoneUsage()
    const p = props({ checkAccess: vi.fn(async () => ({ granted: false, supported: false })) })
    render(<PhoneUsageCard {...p} />)
    expect(await screen.findByText(/iOS 26\.4 ou plus/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Autoriser' })).toBeNull()
  })

  it('autorisé : prises en main plutôt que déverrouillages', async () => {
    enablePhoneUsage()
    localStorage.setItem(
      'healthtrack_phone_usage',
      JSON.stringify({
        ...getPhoneUsageSettings(),
        today: { date: '2026-10-31', screenMinutes: 160, lateScreenMinutes: 0, unlocks: 24, sleepEstimate: null },
      }),
    )
    const p = props({ checkAccess: vi.fn(async () => ({ granted: true, supported: true })) })
    const { container } = render(<PhoneUsageCard {...p} />)
    expect(await screen.findByText(/24 prises en main/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(ANDROID)
  })
})
