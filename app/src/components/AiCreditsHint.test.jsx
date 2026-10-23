import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'play', FEATURES: actual.featuresFor('play') }
})

const relay = vi.hoisted(() => ({ refreshCredits: vi.fn() }))
vi.mock('../services/aiRelay', async (importOriginal) => ({ ...(await importOriginal()), ...relay }))

import AiCreditsHint from './AiCreditsHint'
import { ENTITLEMENT_EVENT } from '../services/entitlement'

const inDays = (n) => new Date(Date.now() + n * 86_400_000).toISOString()

describe('compteur des analyses IA (variante play)', () => {
  beforeEach(() => {
    localStorage.clear()
    relay.refreshCredits.mockReset()
  })

  it('relu auprès du relais quand le premium s’ouvre (achat confirmé en arrière-plan, 6c-3c)', async () => {
    relay.refreshCredits.mockResolvedValueOnce({ plan: 'free', remaining: 3, resetAt: inDays(8) })
    render(<AiCreditsHint />)
    expect(await screen.findByTestId('ai-credits')).toHaveTextContent('3 analyses IA restantes')
    expect(relay.refreshCredits).toHaveBeenCalledTimes(1)

    relay.refreshCredits.mockResolvedValueOnce({ plan: 'premium', remaining: 10, resetAt: inDays(1) })
    act(() => {
      window.dispatchEvent(new CustomEvent(ENTITLEMENT_EVENT, { detail: { premium: true, source: 'play' } }))
    })
    expect(relay.refreshCredits).toHaveBeenCalledTimes(2)
    expect(await screen.findByText(/10 analyses IA restantes/)).toBeInTheDocument()
  })
})
