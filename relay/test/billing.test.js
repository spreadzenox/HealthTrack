import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import {
  accountIdFor, createBillingRoutes, createPlayClient, createPushVerifier, entitlementFrom, hashToken, PlayApiError,
  purchaseTokenFrom, verifyResponse,
} from '../src/billing.js'
import { createHandler } from '../src/server.js'
import { createQuota } from '../src/quota.js'
import { metadataTokenProvider } from '../src/vertex.js'

const INSTALL = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const TOKEN = 'abcdefghijklmnop.AO-J1Oz_synthetique_1234567890'
const NOW = Date.parse('2026-11-10T12:00:00Z')
const PKG = 'fr.jpesquet.sante'

/** Réponse subscriptionsv2 synthétique (champs documentés de l'API Android Publisher). */
const sub = (over = {}, item = {}) => ({
  kind: 'androidpublisher#subscriptionPurchaseV2',
  subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
  acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
  externalAccountIdentifiers: { obfuscatedExternalAccountId: accountIdFor(INSTALL) },
  lineItems: [{
    productId: 'premium',
    expiryTime: '2026-12-10T12:00:00Z',
    autoRenewingPlan: { autoRenewEnabled: true },
    offerDetails: { basePlanId: 'annuel' },
    ...item,
  }],
  ...over,
})

test('entitlementFrom : actif, grâce et annulé non échu donnent le premium ; pause, suspension, expiré non', () => {
  assert.equal(entitlementFrom(sub(), NOW).premium, true)
  assert.equal(entitlementFrom(sub(), NOW).basePlanId, 'annuel')
  assert.equal(entitlementFrom(sub({ subscriptionState: 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' }), NOW).state, 'grace')
  assert.equal(entitlementFrom(sub({ subscriptionState: 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' }), NOW).premium, true)
  const canceled = entitlementFrom(sub({ subscriptionState: 'SUBSCRIPTION_STATE_CANCELED' }, { autoRenewingPlan: { autoRenewEnabled: false } }), NOW)
  assert.deepEqual([canceled.premium, canceled.autoRenewing, canceled.state], [true, false, 'canceled'])
  assert.equal(entitlementFrom(sub({ subscriptionState: 'SUBSCRIPTION_STATE_CANCELED' }, { expiryTime: '2026-11-01T00:00:00Z' }), NOW).premium, false)
  for (const s of ['ON_HOLD', 'PAUSED', 'EXPIRED', 'PENDING', 'PENDING_PURCHASE_CANCELED', 'UNSPECIFIED']) {
    assert.equal(entitlementFrom(sub({ subscriptionState: `SUBSCRIPTION_STATE_${s}` }), NOW).premium, false, s)
  }
  assert.equal(entitlementFrom(sub({}, { expiryTime: '2026-11-01T00:00:00Z' }), NOW).premium, false)
  assert.equal(entitlementFrom(sub({}, { offerPhase: { freeTrial: {} } }), NOW).trial, true)
  assert.equal(entitlementFrom({}, NOW).premium, false)
})

test('purchaseTokenFrom : premier niveau ou format cdv-purchase, jetons farfelus refusés', () => {
  assert.equal(purchaseTokenFrom({ purchaseToken: TOKEN }), TOKEN)
  assert.equal(purchaseTokenFrom({ transaction: { type: 'android-playstore', purchaseToken: TOKEN } }), TOKEN)
  assert.equal(purchaseTokenFrom({}), null)
  assert.throws(() => purchaseTokenFrom({ purchaseToken: '../../admin' }), /invalide/)
  assert.throws(() => purchaseTokenFrom({ purchaseToken: 42 }), /invalide/)
})

test('accountIdFor : empreinte stable de 64 caractères, sans l’identifiant en clair', () => {
  assert.equal(accountIdFor(INSTALL).length, 64)
  assert.equal(accountIdFor(INSTALL), accountIdFor(INSTALL))
  assert.equal(accountIdFor(INSTALL).includes(INSTALL), false)
})

test('verifyResponse : format du validateur cdv-purchase et période de lancement', () => {
  const r = verifyResponse({ ent: entitlementFrom(sub(), NOW), launchUntil: null, acknowledged: true, accountMatch: true })
  assert.equal(r.ok, true)
  assert.equal(r.data.collection[0].id, 'premium')
  assert.equal(r.data.collection[0].isExpired, false)
  assert.equal(r.data.collection[0].renewalIntent, 'Renew')
  assert.equal(r.source, 'play')
  const launch = verifyResponse({ ent: null, launchUntil: '2026-12-01T00:00:00.000Z' })
  assert.deepEqual([launch.premium, launch.source, launch.data.collection.length], [true, 'launch', 0])
  assert.deepEqual([verifyResponse({ ent: null, launchUntil: null }).premium], [false])
})

function fakePlay(state = {}) {
  const calls = []
  return {
    calls,
    getSubscription: async (token) => {
      calls.push(['get', token])
      if (state.error) throw state.error
      return state.sub ?? sub()
    },
    acknowledge: async (productId, token) => {
      calls.push(['ack', productId, token])
      if (state.ackError) throw state.ackError
      return {}
    },
  }
}

async function withRelay({ play, launchPremiumUntil = '', verifyPush = async () => true, billingQuota }, fn) {
  const logs = []
  const handler = createHandler({
    quota: createQuota({ globalPerDay: 10, installPerDay: 2, globalPerMinute: 10 }),
    vertex: { generateJson: async () => { throw new Error('pas ici') } },
    ingredientNames: ['Pomme'],
    billing: createBillingRoutes({ play, packageName: PKG, launchPremiumUntil, verifyPush, log: (e) => logs.push(e), now: () => NOW }),
    billingQuota,
    allowedOrigins: ['https://localhost'],
    log: (e) => logs.push(e),
  })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  try {
    await fn(`http://127.0.0.1:${server.address().port}`, logs)
  } finally {
    server.close()
  }
}

const verify = (url, body, headers = { 'X-Install-Id': INSTALL }) =>
  fetch(`${url}/v1/subscription/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://localhost', ...headers },
    body: JSON.stringify(body),
  })

const rtdnBody = (note) => ({
  message: { data: Buffer.from(JSON.stringify(note)).toString('base64'), messageId: '1' },
  subscription: 'projects/healthtrack-824b26/subscriptions/play-rtdn-relay',
})
const rtdn = (url, body, auth = 'Bearer jeton-oidc') =>
  fetch(`${url}/pubsub/rtdn`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: auth }, body: JSON.stringify(body) })

test('verify : achat actif non accusé → accusé de réception par le relais, premium, jeton jamais journalisé', async () => {
  const play = fakePlay({ sub: sub({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' }) })
  await withRelay({ play }, async (url, logs) => {
    const res = await verify(url, { purchaseToken: TOKEN })
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://localhost')
    const body = await res.json()
    assert.deepEqual([body.premium, body.source, body.state, body.acknowledged, body.accountMatch], [true, 'play', 'active', true, true])
    assert.deepEqual(play.calls, [['get', TOKEN], ['ack', 'premium', TOKEN]])
    const serialized = JSON.stringify(logs)
    assert.equal(serialized.includes(TOKEN), false)
    assert.ok(serialized.includes(hashToken(TOKEN)))
  })
})

test('verify : achat en attente de paiement → ni premium ni accusé ; déjà accusé → pas de second accusé', async () => {
  const pending = fakePlay({ sub: sub({ subscriptionState: 'SUBSCRIPTION_STATE_PENDING', acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' }) })
  await withRelay({ play: pending }, async (url) => {
    const body = await (await verify(url, { purchaseToken: TOKEN })).json()
    assert.equal(body.premium, false)
    assert.deepEqual(pending.calls.map((c) => c[0]), ['get'])
  })
  const done = fakePlay()
  await withRelay({ play: done }, async (url) => {
    await verify(url, { purchaseToken: TOKEN })
    assert.deepEqual(done.calls.map((c) => c[0]), ['get'])
  })
})

test('verify : accusé refusé par Google → droits quand même rendus, accusé retenté plus tard', async () => {
  const play = fakePlay({ sub: sub({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' }), ackError: new PlayApiError('boom', 500) })
  await withRelay({ play }, async (url, logs) => {
    const body = await (await verify(url, { purchaseToken: TOKEN })).json()
    assert.deepEqual([body.premium, body.acknowledged], [true, false])
    assert.ok(logs.some((e) => e.event === 'ack_failed'))
  })
})

test('verify : autre installation (restauration après réinstallation) → premium, accountMatch faux', async () => {
  const play = fakePlay({ sub: sub({ externalAccountIdentifiers: { obfuscatedExternalAccountId: accountIdFor('autre-installation-123456') } }) })
  await withRelay({ play }, async (url) => {
    const body = await (await verify(url, { purchaseToken: TOKEN })).json()
    assert.deepEqual([body.premium, body.accountMatch], [true, false])
  })
})

test('verify : jeton inconnu → 404 ; Google injoignable ou droits manquants → 502 sans détail', async () => {
  await withRelay({ play: fakePlay({ error: new PlayApiError('Invalid', 400) }) }, async (url) => {
    const res = await verify(url, { purchaseToken: TOKEN })
    assert.equal(res.status, 404)
    assert.equal((await res.json()).premium, false)
  })
  await withRelay({ play: fakePlay({ error: new PlayApiError('The caller does not have permission', 401) }) }, async (url, logs) => {
    const res = await verify(url, { purchaseToken: TOKEN })
    assert.equal(res.status, 502)
    assert.equal((await res.json()).message.includes('permission'), false)
    assert.ok(logs.some((e) => e.event === 'error' && e.status === 401))
  })
})

test('verify : sans jeton → période de lancement seule ; demandes invalides et quota', async () => {
  const play = fakePlay()
  await withRelay({ play, launchPremiumUntil: '2026-12-01T00:00:00Z' }, async (url) => {
    const body = await (await verify(url, {})).json()
    assert.deepEqual([body.premium, body.source, body.launchUntil], [true, 'launch', '2026-12-01T00:00:00.000Z'])
  })
  await withRelay({ play, launchPremiumUntil: '2026-11-01T00:00:00Z' }, async (url) => {
    const body = await (await verify(url, {})).json()
    assert.deepEqual([body.premium, body.source], [false, null])
  })
  const billingQuota = createQuota({ installPerDay: 2, globalPerDay: 100, globalPerMinute: 100, now: () => NOW })
  await withRelay({ play, billingQuota }, async (url) => {
    assert.equal((await verify(url, {}, {})).status, 400)
    assert.equal((await verify(url, { purchaseToken: 'x/y' })).status, 400)
    assert.equal((await fetch(`${url}/v1/subscription/verify`)).status, 405)
    await verify(url, {})
    assert.equal((await verify(url, {})).status, 429)
    assert.equal(play.calls.length, 0)
  })
})

test('RTDN : livraison non authentifiée refusée, sans appel à Google', async () => {
  const play = fakePlay()
  await withRelay({ play, verifyPush: async (auth) => auth === 'Bearer bon' }, async (url) => {
    const note = { packageName: PKG, subscriptionNotification: { notificationType: 4, purchaseToken: TOKEN } }
    assert.equal((await rtdn(url, rtdnBody(note), 'Bearer mauvais')).status, 401)
    assert.equal(play.calls.length, 0)
    assert.equal((await rtdn(url, rtdnBody(note), 'Bearer bon')).status, 204)
  })
})

test('RTDN : achat → relecture et accusé côté serveur ; test, autre app, illisible → ignorés', async () => {
  const play = fakePlay({ sub: sub({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' }) })
  await withRelay({ play }, async (url, logs) => {
    assert.equal((await rtdn(url, rtdnBody({ packageName: PKG, subscriptionNotification: { notificationType: 4, purchaseToken: TOKEN, subscriptionId: 'premium' } }))).status, 204)
    assert.deepEqual(play.calls.map((c) => c[0]), ['get', 'ack'])
    assert.ok(logs.some((e) => e.event === 'rtdn' && e.type === 'PURCHASED' && e.acknowledged === true))
    assert.equal((await rtdn(url, rtdnBody({ packageName: PKG, testNotification: { version: '1.0' } }))).status, 204)
    assert.equal((await rtdn(url, rtdnBody({ packageName: 'com.autre', subscriptionNotification: { notificationType: 4, purchaseToken: TOKEN } }))).status, 204)
    assert.equal((await rtdn(url, { message: { data: 'pas-du-base64-json' } })).status, 204)
    assert.equal((await rtdn(url, {})).status, 400)
    assert.equal(play.calls.length, 2)
    assert.equal(JSON.stringify(logs).includes(TOKEN), false)
  })
})

test('RTDN : Google en panne → 503 (Pub/Sub relivre) ; droits manquants → 204 (pas de boucle)', async () => {
  const note = rtdnBody({ packageName: PKG, subscriptionNotification: { notificationType: 2, purchaseToken: TOKEN } })
  await withRelay({ play: fakePlay({ error: new PlayApiError('down', 503) }) }, async (url) => {
    assert.equal((await rtdn(url, note)).status, 503)
  })
  await withRelay({ play: fakePlay({ error: new PlayApiError('denied', 403) }) }, async (url) => {
    assert.equal((await rtdn(url, note)).status, 204)
  })
})

test('createPushVerifier : émetteur Google, compte de service et audience attendus', async () => {
  const claims = { iss: 'https://accounts.google.com', email: 'relay-runtime@p.iam.gserviceaccount.com', email_verified: 'true', aud: 'https://r/pubsub/rtdn' }
  const make = (c, ok = true) => createPushVerifier({
    audience: 'https://r/pubsub/rtdn',
    serviceAccount: 'relay-runtime@p.iam.gserviceaccount.com',
    fetchImpl: async (u) => {
      assert.match(u, /^https:\/\/oauth2\.googleapis\.com\/tokeninfo\?id_token=abc$/)
      return { ok, json: async () => c }
    },
  })
  assert.equal(await make(claims)('Bearer abc'), true)
  assert.equal(await make({ ...claims, aud: 'https://autre' })('Bearer abc'), false)
  assert.equal(await make({ ...claims, email: 'pirate@x.iam.gserviceaccount.com' })('Bearer abc'), false)
  assert.equal(await make({ ...claims, iss: 'https://evil' })('Bearer abc'), false)
  assert.equal(await make(claims, false)('Bearer abc'), false)
  assert.equal(await make(claims)(undefined), false)
})

test('createPlayClient : adresses de l’API Android Publisher et erreurs', async () => {
  const calls = []
  const play = createPlayClient({
    packageName: PKG,
    getToken: async () => 'jeton',
    fetchImpl: async (url, init) => {
      calls.push([url, init.method ?? 'GET', init.headers.Authorization])
      if (url.includes('inconnu')) return { ok: false, status: 404, text: async () => JSON.stringify({ error: { message: 'Not found' } }) }
      return { ok: true, text: async () => (url.endsWith(':acknowledge') ? '' : JSON.stringify(sub())) }
    },
  })
  assert.equal((await play.getSubscription(TOKEN)).subscriptionState, 'SUBSCRIPTION_STATE_ACTIVE')
  assert.deepEqual(await play.acknowledge('premium', TOKEN), {})
  assert.equal(calls[0][0], `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}/purchases/subscriptionsv2/tokens/${TOKEN}`)
  assert.equal(calls[1][0], `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}/purchases/subscriptions/premium/tokens/${TOKEN}:acknowledge`)
  assert.deepEqual([calls[1][1], calls[1][2]], ['POST', 'Bearer jeton'])
  await assert.rejects(play.getSubscription('inconnu-aaaaaaaaaaaaaaaaaaa'), (e) => e instanceof PlayApiError && e.status === 404 && /Not found/.test(e.message))
})

test('metadataTokenProvider : portée Android Publisher demandée au serveur de métadonnées', async () => {
  let asked = null
  const get = metadataTokenProvider({
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    fetchImpl: async (u) => { asked = u; return { ok: true, json: async () => ({ access_token: 't', expires_in: 3600 }) } },
  })
  assert.equal(await get(), 't')
  assert.match(asked, /\/token\?scopes=https%3A%2F%2Fwww\.googleapis\.com%2Fauth%2Fandroidpublisher$/)
})
