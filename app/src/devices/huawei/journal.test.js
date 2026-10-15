import { describe, it, expect } from 'vitest'
import { backgroundForJournal, watchJournal } from './journal'

describe('watchJournal', () => {
  it('exporte la relecture app fermée sans adresse ni clé', () => {
    const bg = backgroundForJournal({
      busy: false,
      lastUntil: 1_760_500_000_000,
      lastAttemptAt: 1_760_500_100_000,
      lastSuccessAt: 1_760_500_100_000,
      failures: 0,
      paused: false,
      outcome: 'connected',
      battery: 81,
      lastDecision: 'absent',
      lastDecisionAt: 1_760_500_200_000,
      lastTrigger: 'periodic',
      periodic: true,
      address: 'AA:BB:CC:DD:EE:01',
      authToken: 'secret',
    })
    expect(bg).toEqual({
      busy: false,
      lastUntil: '2025-10-15T03:46:40.000Z',
      lastAttemptAt: '2025-10-15T03:48:20.000Z',
      lastSuccessAt: '2025-10-15T03:48:20.000Z',
      failures: 0,
      paused: false,
      outcome: 'connected',
      battery: 81,
      lastDecision: 'absent',
      lastDecisionAt: '2025-10-15T03:50:00.000Z',
      lastTrigger: 'periodic',
      periodic: true,
    })
    const { json } = watchJournal({ background: bg }, new Date('2026-10-15T12:00:00Z'))
    const parsed = JSON.parse(json)
    expect(parsed.background.lastTrigger).toBe('periodic')
    expect(json).not.toMatch(/AA:BB|secret/)
  })

  it('pas d’état natif (navigateur, ancienne version) : null', () => {
    expect(backgroundForJournal(null)).toBeNull()
    expect(JSON.parse(watchJournal({}, new Date('2026-10-15T12:00:00Z')).json).background).toBeNull()
  })

  it('horodatage 0 = jamais', () => {
    expect(backgroundForJournal({ lastSuccessAt: 0, lastDecision: null }).lastSuccessAt).toBeNull()
  })
})
