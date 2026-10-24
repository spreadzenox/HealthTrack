import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ENTITLEMENT_EVENT } from './entitlement'
import { REMINDER_DAYS_BEFORE, startTrialReminderWatch, syncTrialReminder, trialReminderPlan } from './trialReminder'

const NOW = Date.parse('2026-10-24T10:00:00Z')
const DAY = 86_400_000
const trial = (days, extra = {}) => ({
  premium: true, source: 'play', state: 'active', trial: true, autoRenewing: true, productId: 'halcya_premium',
  expiresAt: new Date(NOW + days * DAY).toISOString(), ...extra,
})
const fakePlugin = (notifications = true) => ({
  schedule: vi.fn().mockResolvedValue({ notifications }),
  cancel: vi.fn().mockResolvedValue({}),
  requestNotifications: vi.fn().mockResolvedValue({}),
})

describe('rappel de fin d’essai (VC-18b)', () => {
  beforeEach(() => localStorage.clear())

  it('pendant un essai qui se renouvellera : 2 jours avant le premier paiement, avec le lien Google Play', () => {
    const plan = trialReminderPlan(trial(14), NOW)
    expect(REMINDER_DAYS_BEFORE).toBe(2)
    expect(plan.at).toBe(NOW + 12 * DAY)
    expect(plan.title).toBe('Votre essai gratuit se termine dans 2 jours')
    expect(plan.body).toMatch(/^Premier paiement .+, sauf si vous annulez\./)
    expect(plan.url).toContain('play.google.com/store/account/subscriptions')
    expect(plan.url).toContain('halcya_premium')
  })

  it('rien à rappeler hors d’un essai actif et renouvelable, ou quand le moment est passé', () => {
    expect(trialReminderPlan(null, NOW)).toBeNull()
    expect(trialReminderPlan(trial(14, { trial: false }), NOW)).toBeNull()
    expect(trialReminderPlan(trial(14, { autoRenewing: false, state: 'canceled' }), NOW)).toBeNull()
    expect(trialReminderPlan(trial(14, { source: 'launch' }), NOW)).toBeNull()
    expect(trialReminderPlan(trial(14, { premium: false }), NOW)).toBeNull()
    expect(trialReminderPlan(trial(14, { expiresAt: null }), NOW)).toBeNull()
    expect(trialReminderPlan(trial(1), NOW)).toBeNull()
  })

  it('programme une fois, sans reprogrammer la même date, et demande les notifications si elles sont coupées', async () => {
    const plugin = fakePlugin(false)
    expect(await syncTrialReminder(trial(14), { plugin, now: NOW })).toBe('scheduled')
    expect(plugin.schedule).toHaveBeenCalledWith(expect.objectContaining({ at: NOW + 12 * DAY }))
    expect(plugin.requestNotifications).toHaveBeenCalledTimes(1)
    expect(await syncTrialReminder(trial(14), { plugin, now: NOW + 3600_000 })).toBe('unchanged')
    expect(plugin.schedule).toHaveBeenCalledTimes(1)
  })

  it('ne demande pas les notifications quand elles sont déjà autorisées', async () => {
    const plugin = fakePlugin(true)
    await syncTrialReminder(trial(14), { plugin, now: NOW })
    expect(plugin.requestNotifications).not.toHaveBeenCalled()
  })

  it('déplace le rappel si l’échéance change, et l’annule quand l’essai est annulé', async () => {
    const plugin = fakePlugin()
    await syncTrialReminder(trial(14), { plugin, now: NOW })
    expect(await syncTrialReminder(trial(10), { plugin, now: NOW })).toBe('scheduled')
    expect(plugin.schedule).toHaveBeenLastCalledWith(expect.objectContaining({ at: NOW + 8 * DAY }))
    expect(await syncTrialReminder(trial(10, { autoRenewing: false, state: 'canceled' }), { plugin, now: NOW })).toBe('cancelled')
    expect(plugin.cancel).toHaveBeenCalledTimes(1)
    expect(await syncTrialReminder({ premium: false }, { plugin, now: NOW })).toBe('none')
    expect(plugin.cancel).toHaveBeenCalledTimes(1)
  })

  it('sans plugin (variante sideload, navigateur) ou si le natif échoue : rien, sans erreur', async () => {
    expect(await syncTrialReminder(trial(14), { plugin: null, now: NOW })).toBe('none')
    const broken = { schedule: vi.fn().mockRejectedValue(new Error('x')), cancel: vi.fn() }
    expect(await syncTrialReminder(trial(14), { plugin: broken, now: NOW })).toBe('none')
  })

  it('suit chaque nouvel état des droits', async () => {
    const plugin = fakePlugin()
    const target = new EventTarget()
    const stop = startTrialReminderWatch({ plugin, target })
    const ent = trial(14, { expiresAt: new Date(Date.now() + 14 * DAY).toISOString() })
    target.dispatchEvent(new CustomEvent(ENTITLEMENT_EVENT, { detail: ent }))
    await vi.waitFor(() => expect(plugin.schedule).toHaveBeenCalledTimes(1))
    stop()
    target.dispatchEvent(new CustomEvent(ENTITLEMENT_EVENT, { detail: trial(9, { expiresAt: new Date(Date.now() + 9 * DAY).toISOString() }) }))
    await new Promise((r) => setTimeout(r, 0))
    expect(plugin.schedule).toHaveBeenCalledTimes(1)
  })
})
