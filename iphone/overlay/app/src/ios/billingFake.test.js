import { describe, it, expect, vi } from 'vitest'
import process from 'node:process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fakeAppStoreBilling, installBillingFake, needsBillingFake, buildPlan, ROUTES, DARK_ROUTES, SCROLLS, REVEALS, MORE_ONBOARDING, EMPTY_ROUTES, EMPTY_SCROLLS } from './captureMode.js'
import { describePlans, loadPlans } from '../services/playBilling'

// Version iOS (HealthTrack-iOS), étape I6 : l'écran d'achat des captures (et de la capture pour l'examen d'Apple)
// montre les trois abonnements créés dans App Store Connect, aux prix décidés, par un faux plugin de même forme que
// AppStoreBilling.swift ; le faux relais des captures rend « sans abonnement ».
describe('faux plugin d’achat des captures', () => {
  it('les trois abonnements aux prix de store/app-store/abonnements.md, essai de 14 jours sur Silver annuel', async () => {
    const { products } = await fakeAppStoreBilling().getProducts({ productIds: ['halcya_premium', 'halcya_gold'] })
    const silver = describePlans(products)
    const gold = describePlans(products, 'halcya_gold')
    expect(silver.map((p) => [p.offerToken, p.price, p.trialDays])).toEqual([['halcya_premium_annuel', '29,99 €', 14], ['halcya_premium_mensuel', '4,99 €', null]])
    expect(gold.map((p) => [p.offerToken, p.price, p.trialDays])).toEqual([['halcya_gold_mensuel', '9,99 €', null]])
    const md = readFileSync(resolve(process.cwd(), '../../store/app-store/abonnements.md'), 'utf8')
    for (const price of ['29,99 €', '4,99 €', '9,99 €']) expect(md).toContain(price)
    expect(await loadPlans({ native: fakeAppStoreBilling() })).toHaveLength(3)
  })

  it('rien ne s’achète, aucun achat en cours', async () => {
    const fake = fakeAppStoreBilling()
    expect(await fake.purchase({ productId: 'halcya_gold' })).toEqual({ status: 'cancelled' })
    expect(await fake.queryPurchases()).toEqual({ purchases: [] })
  })

  it('installé : faux plugin, droits « sans abonnement » à la place du relais, page d’abonnement remontée', async () => {
    const pushed = []
    const target = { fetch: vi.fn(async () => 'réseau'), dispatchEvent: vi.fn() }
    const storage = { removeItem: vi.fn() }
    installBillingFake({ target, storage, location: { pathname: '/premium' }, history: { pushState: (_s, _t, p) => pushed.push(p) } })
    expect(typeof target.__HT_PLAY_BILLING__.getProducts).toBe('function')
    const res = await target.fetch('https://relais.example/v1/subscription/verify', { method: 'POST' })
    expect(await res.json()).toMatchObject({ premium: false })
    expect(await target.fetch('https://relais.example/v1/analyze')).toBe('réseau')
    expect(storage.removeItem).toHaveBeenCalledWith('halcya_entitlement')
    expect(pushed).toEqual(['/plus', '/premium'])
  })

  it('posé seulement pour les captures de l’écran d’achat : ailleurs, le rapport PDF reste ouvert aux gestes réels (Gold du test)', () => {
    const plan = buildPlan(ROUTES, DARK_ROUTES, SCROLLS, REVEALS, MORE_ONBOARDING, EMPTY_ROUTES, EMPTY_SCROLLS)
    const faked = plan.filter(needsBillingFake).map((step) => step.name)
    expect(faked).toEqual(['demo-clair-premium', 'demo-clair-premium-2'])
    expect(needsBillingFake(plan.find((step) => step.route === '/data'))).toBe(false)
    expect(needsBillingFake(undefined)).toBe(false) // captures finies : gestes réels de uitests/
  })
})
