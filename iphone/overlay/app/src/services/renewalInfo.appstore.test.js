import { describe, it, expect, vi, beforeEach } from 'vitest'

// Version iOS (HealthTrack-iOS), étape I6 : le plugin d'achat de l'iPhone joint à chaque achat les informations de
// renouvellement signées par Apple (`renewalInfo`) ; le relais d'Android les lit déjà (v689, `body.renewalInfo`). Sans
// elles, un abonnement qui se renouvelle serait dit « actif · jusqu'au … » et une période de grâce jamais repérée.
// Correctif 37 du 2/11, repris par Android v722 (#638) dans le code partagé : ces tests le vérifient sur iPhone.
import { purchasePlan, restorePurchases, handlePurchasesUpdated } from './playBilling'
import { refreshEntitlement } from './entitlement'

const achat = (extra = {}) => ({ state: 'purchased', products: ['halcya_premium'], purchaseToken: 'tx.jws.signe', ...extra })
const plugin = (purchase) => ({
  queryPurchases: vi.fn(async () => ({ purchases: purchase ? [purchase] : [] })),
  purchase: vi.fn(async () => ({ status: 'ok', purchases: [purchase] })),
})
const plan = { productId: 'halcya_premium', offerToken: 'halcya_premium_mensuel' }

describe('informations de renouvellement de l’App Store transmises au relais (correctif 37)', () => {
  beforeEach(() => localStorage.clear())

  it('achat sur iPhone : le relais reçoit la transaction et son renouvellement', async () => {
    const refresh = vi.fn(async () => ({ premium: true }))
    const native = plugin(achat({ renewalInfo: 'renouvellement.jws.signe' }))
    native.queryPurchases = vi.fn(async () => ({ purchases: [] }))
    const res = await purchasePlan(plan, { native, refresh })
    expect(res.status).toBe('purchased')
    expect(refresh).toHaveBeenCalledWith({ purchaseToken: 'tx.jws.signe', renewalInfo: 'renouvellement.jws.signe' })
  })

  it('« Restaurer un achat » et relecture à l’ouverture : le renouvellement suit aussi', async () => {
    const refresh = vi.fn(async () => ({ premium: true }))
    const res = await restorePurchases({ native: plugin(achat({ renewalInfo: 'renouvellement.jws.signe' })), refresh })
    expect(res.found).toBe(true)
    expect(refresh).toHaveBeenCalledWith({ purchaseToken: 'tx.jws.signe', renewalInfo: 'renouvellement.jws.signe' })
  })

  it('achat terminé hors du parcours (événement `purchasesUpdated`) : le renouvellement suit aussi', async () => {
    const refresh = vi.fn(async () => ({ premium: true }))
    await handlePurchasesUpdated({ code: 0, purchases: [achat({ purchaseToken: 'autre.jws.signe', renewalInfo: 'renouvellement.jws.signe' })] }, { refresh })
    expect(refresh).toHaveBeenCalledWith({ purchaseToken: 'autre.jws.signe', renewalInfo: 'renouvellement.jws.signe' })
  })

  it('achat Google Play (sans renouvellement joint) : appel inchangé', async () => {
    const refresh = vi.fn(async () => ({ premium: true }))
    await restorePurchases({ native: plugin(achat()), refresh })
    expect(refresh).toHaveBeenCalledWith({ purchaseToken: 'tx.jws.signe' })
  })

  it('le corps envoyé au relais porte `renewalInfo` à côté de `purchaseToken`, et seulement s’il existe', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, premium: true, source: 'appstore', state: 'active', autoRenewing: true }) }))
    await refreshEntitlement({ purchaseToken: 'tx.jws.signe', renewalInfo: 'renouvellement.jws.signe', fetchImpl })
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ purchaseToken: 'tx.jws.signe', renewalInfo: 'renouvellement.jws.signe' })
    await refreshEntitlement({ purchaseToken: 'tx.jws.signe', fetchImpl })
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual({ purchaseToken: 'tx.jws.signe' })
    await refreshEntitlement({ renewalInfo: 'renouvellement.jws.signe', fetchImpl })
    expect(JSON.parse(fetchImpl.mock.calls[2][1].body)).toEqual({})
  })
})
