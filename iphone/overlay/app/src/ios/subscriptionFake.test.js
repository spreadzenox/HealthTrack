import { describe, it, expect, vi } from 'vitest'
import { buildPlan, ROUTES, DARK_ROUTES, SCROLLS, REVEALS, MORE_ONBOARDING, EMPTY_ROUTES, EMPTY_SCROLLS, SUBSCRIBED_ROUTES,
  needsSubscriptionFake, needsBillingFake, installSubscriptionFake, removeSubscriptionFake, CAPTURE_ENTITLEMENT_EVENT } from './captureMode.js'
import { ENTITLEMENT_EVENT, getEntitlement, refreshEntitlement } from '../services/entitlement'

// REFONTE-6b sur iPhone : le détail d'un objectif masque « Par famille » sans abonnement ; une capture `-abonne`
// montre ce que voit un abonné, avec des droits de démonstration posés pour cette seule page.
const plan = () => buildPlan(ROUTES, DARK_ROUTES, SCROLLS, REVEALS, MORE_ONBOARDING, EMPTY_ROUTES, EMPTY_SCROLLS, SUBSCRIBED_ROUTES)

function fakeTarget(fetch = vi.fn(async () => 'réseau')) {
  const target = new EventTarget()
  target.fetch = fetch
  return target
}
const memory = () => {
  const map = new Map()
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) }
}

describe('droits d’abonné des captures', () => {
  it('une seule capture d’abonné, le détail du bien-être, après les pages claires et jamais en dernier', () => {
    const steps = plan()
    const subscribed = steps.filter(needsSubscriptionFake)
    expect(subscribed.map((s) => [s.name, s.route, s.theme])).toEqual([['demo-clair-recommendations-bien-etre-abonne', '/recommendations/bien-etre', 'light']])
    expect(new Set(steps.map((s) => s.name)).size).toBe(steps.length)
    expect(needsSubscriptionFake(steps[steps.length - 1])).toBe(false) // les sondes et les gestes réels gardent les vrais droits
    expect(subscribed.some(needsBillingFake)).toBe(false)
    expect(needsSubscriptionFake(undefined)).toBe(false)
    // Sans la liste, le plan ne change pas
    expect(buildPlan().some(needsSubscriptionFake)).toBe(false)
  })

  it('l’événement est celui de l’app', () => {
    expect(CAPTURE_ENTITLEMENT_EVENT).toBe(ENTITLEMENT_EVENT)
  })

  it('installés : le relais rend un abonné, l’état connu de l’app le dit, les écrans affichés sont prévenus', async () => {
    localStorage.clear()
    const target = fakeTarget()
    const seen = []
    target.addEventListener(CAPTURE_ENTITLEMENT_EVENT, (e) => seen.push(e.detail.premium))
    installSubscriptionFake({ target, storage: localStorage })
    expect(seen).toEqual([true])
    expect(getEntitlement()).toMatchObject({ premium: true, source: 'appstore', tier: 'silver' })
    expect(await refreshEntitlement({ fetchImpl: target.fetch })).toMatchObject({ premium: true, tier: 'silver' })
    expect(await target.fetch('https://relais.example/v1/analyze')).toBe('réseau')
  })

  it('une réponse tardive du vrai relais (« sans abonnement ») est recouverte', async () => {
    const target = fakeTarget()
    const storage = memory()
    installSubscriptionFake({ target, storage })
    storage.setItem('halcya_entitlement', JSON.stringify({ premium: false }))
    const seen = []
    target.addEventListener(CAPTURE_ENTITLEMENT_EVENT, (e) => seen.push(e.detail.premium))
    target.dispatchEvent(new CustomEvent(CAPTURE_ENTITLEMENT_EVENT, { detail: { premium: false } }))
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(JSON.parse(storage.getItem('halcya_entitlement')).premium).toBe(true)
    expect(seen).toEqual([false, true])
  })

  it('retirés avant la page suivante : plus de droits en cache, plus de recouvrement', async () => {
    const target = fakeTarget()
    const storage = memory()
    installSubscriptionFake({ target, storage })
    removeSubscriptionFake({ target, storage })
    expect(storage.getItem('halcya_entitlement')).toBeNull()
    target.dispatchEvent(new CustomEvent(CAPTURE_ENTITLEMENT_EVENT, { detail: { premium: false } }))
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(storage.getItem('halcya_entitlement')).toBeNull()
  })
})
