/**
 * I6-RELAIS (1) et (2) : transactions StoreKit 2 synthétiques, signées par une chaîne de test générée à la volée
 * (openssl, dossier temporaire effacé). Aucune clé privée ni vraie transaction dans le dépôt.
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sign, X509Certificate } from 'node:crypto'
import {
  APPLE_ROOT_CA_G3_PEM, APPLE_ROOT_CA_G3_SHA256, appAccountTokenFor, createAppStoreBilling, createAppStoreVerifier,
  createAppStoreNotifications, createFirestoreStatusStore, createMemoryStatusStore, entitlementFromTransaction,
  fingerprint256, isAppStoreJws, MAX_JWS_LENGTH, subscriptionKey, tierOfAppStoreProduct,
} from '../src/appstore.js'
import { accountIdFor, createBillingRoutes, isTokenShape, purchaseTokenFrom } from '../src/billing.js'

const dir = mkdtempSync(join(tmpdir(), 'appstore-test-'))
after(() => rmSync(dir, { recursive: true, force: true }))

const ssl = (...args) => execFileSync('openssl', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] })
const LEAF_EXT = '1.2.840.113635.100.6.11.1=ASN1:NULL'
const INTER_EXT = '1.2.840.113635.100.6.2.1=ASN1:NULL'

/** Chaîne racine → intermédiaire → feuille (EC P-256), avec ou sans les marqueurs de l'App Store. */
function chain(name, { leafOid = true, interOid = true } = {}) {
  const f = (s) => `${name}-${s}`
  for (const k of ['root', 'inter', 'leaf']) ssl('ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', f(`${k}.key`))
  ssl('req', '-x509', '-new', '-key', f('root.key'), '-subj', `/CN=${name} Test Root`, '-days', '3650', '-out', f('root.pem'),
    '-addext', 'basicConstraints=critical,CA:TRUE', '-addext', 'keyUsage=critical,keyCertSign,cRLSign')
  writeFileSync(join(dir, f('inter.ext')), `basicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n${interOid ? INTER_EXT : ''}\n`)
  writeFileSync(join(dir, f('leaf.ext')), `basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature\n${leafOid ? LEAF_EXT : ''}\n`)
  ssl('req', '-new', '-key', f('inter.key'), '-subj', `/CN=${name} Test Intermediate`, '-out', f('inter.csr'))
  ssl('x509', '-req', '-in', f('inter.csr'), '-CA', f('root.pem'), '-CAkey', f('root.key'), '-CAcreateserial', '-days', '3650',
    '-extfile', f('inter.ext'), '-out', f('inter.pem'))
  ssl('req', '-new', '-key', f('leaf.key'), '-subj', `/CN=${name} Test Signing`, '-out', f('leaf.csr'))
  ssl('x509', '-req', '-in', f('leaf.csr'), '-CA', f('inter.pem'), '-CAkey', f('inter.key'), '-CAcreateserial', '-days', '3650',
    '-extfile', f('leaf.ext'), '-out', f('leaf.pem'))
  const pem = (k) => readFileSync(join(dir, f(k)), 'utf8')
  const der = (k) => new X509Certificate(pem(k)).raw.toString('base64')
  return { rootPem: pem('root.pem'), leafKey: pem('leaf.key'), x5c: [der('leaf.pem'), der('inter.pem'), der('root.pem')] }
}

const good = chain('good')
const rogue = chain('rogue')
const noOid = chain('nooid', { leafOid: false })

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
function jws(payload, { c = good, x5c = c.x5c, alg = 'ES256', key = c.leafKey } = {}) {
  const head = `${b64({ alg, x5c })}.${b64(payload)}`
  const sig = sign('sha256', Buffer.from(head), { key, dsaEncoding: 'ieee-p1363' })
  return `${head}.${sig.toString('base64url')}`
}

const INSTALL = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const NOW = Date.parse('2026-11-10T12:00:00Z')
const DAY = 86_400_000
const tx = (over = {}) => ({
  transactionId: '2000000000000001',
  originalTransactionId: '2000000000000000',
  bundleId: 'fr.jpesquet.sante',
  productId: 'halcya_premium_annuel',
  subscriptionGroupIdentifier: '21000000',
  purchaseDate: NOW - 5 * DAY,
  expiresDate: NOW + 360 * DAY,
  type: 'Auto-Renewable Subscription',
  inAppOwnershipType: 'PURCHASED',
  environment: 'Sandbox',
  appAccountToken: appAccountTokenFor(INSTALL),
  signedDate: NOW - DAY,
  ...over,
})

const verifyJws = createAppStoreVerifier({ roots: [good.rootPem], now: () => NOW })
const appStore = createAppStoreBilling({ verifyJws })

test('la racine embarquée est bien Apple Root CA - G3 (empreinte publiée par Apple)', () => {
  assert.equal(fingerprint256(APPLE_ROOT_CA_G3_PEM), APPLE_ROOT_CA_G3_SHA256)
  assert.match(new X509Certificate(APPLE_ROOT_CA_G3_PEM).subject, /Apple Root CA - G3/)
})

test('isAppStoreJws : un JWS StoreKit oui, un jeton Google Play non ; forme acceptée par purchaseTokenFrom', () => {
  const t = jws(tx())
  assert.ok(t.length > 1500)
  assert.equal(isAppStoreJws(t), true)
  assert.equal(isAppStoreJws('abcdefghijklmnop.AO-J1Oz_synthetique_1234567890'), false)
  assert.equal(isAppStoreJws('kgkkdenihldlkcajdnoakmmb.AO-J1Oz.synthetique'), false)
  assert.equal(purchaseTokenFrom({ purchaseToken: t }), t)
  assert.equal(isTokenShape(t), true)
  assert.equal(isTokenShape(`${t}${'A'.repeat(17_000)}`), false)
})

test('appAccountTokenFor : les 32 premiers chiffres de accountIdFor au format UUID', () => {
  const uuid = appAccountTokenFor(INSTALL)
  assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  assert.equal(uuid.replace(/-/g, ''), accountIdFor(INSTALL).slice(0, 32))
})

test('tierOfAppStoreProduct : halcya_gold → Gold, halcya_premium → Silver, autre → aucun', () => {
  assert.equal(tierOfAppStoreProduct('halcya_gold_mensuel'), 'gold')
  assert.equal(tierOfAppStoreProduct('halcya_premium_annuel'), 'silver')
  assert.equal(tierOfAppStoreProduct('halcya_premium_mensuel'), 'silver')
  assert.equal(tierOfAppStoreProduct('autre_app_premium'), null)
  assert.equal(tierOfAppStoreProduct(undefined), null)
})

test('vérification : signature et chaîne jusqu’à la racine de confiance', () => {
  assert.equal(verifyJws(jws(tx())).productId, 'halcya_premium_annuel')
  assert.throws(() => verifyJws(jws(tx(), { c: rogue })), { code: 'untrusted_root' })
  // Racine de confiance glissée en bout d'une chaîne qu'elle n'a pas émise
  assert.throws(() => verifyJws(jws(tx(), { c: rogue, x5c: [rogue.x5c[0], rogue.x5c[1], good.x5c[2]] })), { code: 'bad_chain' })
  // Feuille d'une autre chaîne sous le bon intermédiaire
  assert.throws(() => verifyJws(jws(tx(), { x5c: [rogue.x5c[0], good.x5c[1], good.x5c[2]], key: rogue.leafKey })), { code: 'bad_chain' })
  // Certificats sans les marqueurs de l'App Store
  const v2 = createAppStoreVerifier({ roots: [noOid.rootPem], now: () => NOW })
  assert.throws(() => v2(jws(tx(), { c: noOid })), { code: 'bad_chain' })
  // Signée par une autre clé que celle de la feuille
  assert.throws(() => verifyJws(jws(tx(), { key: rogue.leafKey })), { code: 'bad_signature' })
  // Contenu modifié après signature
  const [h, , s] = jws(tx()).split('.')
  assert.throws(() => verifyJws(`${h}.${b64(tx({ productId: 'halcya_gold_mensuel' }))}.${s}`), { code: 'bad_signature' })
  assert.throws(() => verifyJws(jws(tx(), { alg: 'none' })), { code: 'bad_alg' })
  assert.throws(() => verifyJws(jws(tx(), { x5c: good.x5c.slice(0, 2) })), { code: 'bad_chain' })
  assert.throws(() => verifyJws('pas.un.jws!'), { code: 'not_jws' })
  // Signée hors de la période de validité des certificats
  assert.throws(() => verifyJws(jws(tx({ signedDate: Date.parse('2001-01-01') }))), { code: 'expired_chain' })
  // La vraie racine d'Apple ne valide pas une chaîne de test
  assert.throws(() => createAppStoreVerifier()(jws(tx())), { code: 'untrusted_root' })
})

test('droits : actif, Gold, essai, expiré, révoqué (remboursé), grâce, renouvellement coupé', async () => {
  const v = (t, opts) => appStore.verify(jws(t), INSTALL, { now: NOW, ...opts })
  const silver = await v(tx())
  assert.deepEqual([silver.ent.premium, silver.ent.tier, silver.ent.state, silver.ent.source, silver.ent.test, silver.accountMatch],
    [true, 'silver', 'active', 'appstore', true, true])
  const gold = await v(tx({ productId: 'halcya_gold_mensuel', environment: 'Production' }))
  assert.deepEqual([gold.ent.tier, gold.ent.test, gold.environment], ['gold', false, 'Production'])
  assert.equal((await v(tx({ offerType: 1, offerDiscountType: 'FREE_TRIAL' }))).ent.trial, true)
  assert.equal((await v(tx({ offerType: 1, offerDiscountType: 'PAY_AS_YOU_GO' }))).ent.trial, false)
  const expired = await v(tx({ expiresDate: NOW - DAY }))
  assert.deepEqual([expired.ent.premium, expired.ent.tier, expired.ent.state], [false, null, 'expired'])
  const revoked = await v(tx({ revocationDate: NOW - DAY, revocationReason: 0 }))
  assert.deepEqual([revoked.ent.premium, revoked.ent.state], [false, 'revoked'])
  assert.equal((await v(tx({ productId: 'autre_produit' }))).ent.premium, false)

  const renewal = (over = {}) => jws({ originalTransactionId: '2000000000000000', autoRenewStatus: 1, environment: 'Sandbox', signedDate: NOW, ...over })
  const renewing = await v(tx(), { signedRenewalInfo: renewal() })
  assert.deepEqual([renewing.ent.autoRenewing, renewing.ent.state], [true, 'active'])
  const stopped = await v(tx(), { signedRenewalInfo: renewal({ autoRenewStatus: 0 }) })
  assert.deepEqual([stopped.ent.premium, stopped.ent.autoRenewing, stopped.ent.state], [true, false, 'canceled'])
  const grace = await v(tx({ expiresDate: NOW - DAY }), { signedRenewalInfo: renewal({ gracePeriodExpiresDate: NOW + 3 * DAY }) })
  assert.deepEqual([grace.ent.premium, grace.ent.state], [true, 'grace'])
  // Informations de renouvellement d'un autre abonnement, ou mal signées : ignorées
  assert.equal((await v(tx({ expiresDate: NOW - DAY }), { signedRenewalInfo: renewal({ originalTransactionId: '9', gracePeriodExpiresDate: NOW + DAY }) })).ent.premium, false)
  assert.equal((await v(tx({ expiresDate: NOW - DAY }), { signedRenewalInfo: jws({ originalTransactionId: '2000000000000000', gracePeriodExpiresDate: NOW + DAY, environment: 'Sandbox' }, { c: rogue }) })).ent.premium, false)
})

test('contrôles : autre app, environnement inconnu, achat non abonnement, autre installation', async () => {
  await assert.rejects(() => appStore.verify(jws(tx({ bundleId: 'com.autre.app' })), INSTALL, { now: NOW }), { code: 'other_app' })
  await assert.rejects(() => appStore.verify(jws(tx({ environment: 'Xcode' })), INSTALL, { now: NOW }), { code: 'bad_environment' })
  await assert.rejects(() => appStore.verify(jws(tx({ type: 'Consumable' })), INSTALL, { now: NOW }), { code: 'not_subscription' })
  assert.equal((await appStore.verify(jws(tx()), 'b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', { now: NOW })).accountMatch, false)
  assert.equal((await appStore.verify(jws(tx({ appAccountToken: undefined })), INSTALL, { now: NOW })).accountMatch, null)
  assert.equal((await appStore.verify(jws(tx({ appAccountToken: appAccountTokenFor(INSTALL).toUpperCase() })), INSTALL, { now: NOW })).accountMatch, true)
})

test('entitlementFromTransaction sans renouvellement : autoRenewing faux, état actif', () => {
  const e = entitlementFromTransaction(tx(), null, NOW)
  assert.deepEqual([e.autoRenewing, e.state, e.basePlanId, e.needsAck], [false, 'active', null, false])
})

test('/v1/subscription/verify : un JWS part à l’App Store, un jeton Play chez Google, comme avant', async () => {
  const playCalls = []
  const play = {
    getSubscription: async (token) => {
      playCalls.push(token)
      return { subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE', acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED', lineItems: [{ productId: 'halcya_gold', expiryTime: '2026-12-10T12:00:00Z' }] }
    },
    acknowledge: async () => {},
  }
  const logs = []
  const routes = createBillingRoutes({ play, appStore, packageName: 'fr.jpesquet.sante', verifyPush: async () => true, log: (e) => logs.push(e), now: () => NOW })

  const ios = await routes.verify({ purchaseToken: jws(tx({ productId: 'halcya_gold_mensuel' })) }, INSTALL)
  assert.equal(ios.status, 200)
  assert.deepEqual(
    [ios.payload.premium, ios.payload.tier, ios.payload.source, ios.payload.state, ios.payload.accountMatch, ios.payload.data.transaction.type],
    [true, 'gold', 'appstore', 'active', true, 'ios-appstore'])
  for (const k of ['expiresAt', 'autoRenewing', 'trial']) assert.ok(k in ios.payload, k)
  assert.equal(playCalls.length, 0)
  // Renouvellement envoyé au format cdv-purchase (dans transaction)
  const withRenewal = await routes.verify({ transaction: { purchaseToken: jws(tx()), renewalInfo: jws({ originalTransactionId: '2000000000000000', autoRenewStatus: 1, environment: 'Sandbox' }) } }, INSTALL)
  assert.equal(withRenewal.payload.autoRenewing, true)

  const forged = await routes.verify({ purchaseToken: jws(tx(), { c: rogue }) }, INSTALL)
  assert.deepEqual([forged.status, forged.payload.error, forged.payload.premium], [400, 'invalid_purchase', false])
  assert.equal(logs.at(-1).result, 'untrusted_root')
  assert.ok(!JSON.stringify(logs).includes(INSTALL))

  const android = await routes.verify({ purchaseToken: 'abcdefghijklmnop.AO-J1Oz_synthetique_1234567890' }, INSTALL)
  assert.deepEqual([android.payload.source, android.payload.tier, android.payload.data.transaction.type], ['play', 'gold', 'android-playstore'])
  assert.equal(playCalls.length, 1)

  // Période de lancement : Gold pour tous, la source reste celle de l'achat
  const launch = createBillingRoutes({ play, appStore, packageName: 'fr.jpesquet.sante', launchPremium: { until: '2026-12-01T00:00:00Z' }, verifyPush: async () => true, now: () => NOW })
  const l = await launch.verify({ purchaseToken: jws(tx()) }, INSTALL)
  assert.deepEqual([l.payload.tier, l.payload.source], ['gold', 'appstore'])
})

// ——— I6-RELAIS-3 : notifications serveur V2 ———

const note = (type, { subtype, txOver = {}, renewalOver = null, signedDate = NOW, data = {}, c = good } = {}) => jws({
  notificationType: type,
  ...(subtype ? { subtype } : {}),
  notificationUUID: '6f1b8a2e-0000-4000-8000-000000000001',
  version: '2.0',
  signedDate,
  data: {
    appAppleId: 1234567890,
    bundleId: 'fr.jpesquet.sante',
    environment: 'Sandbox',
    signedTransactionInfo: jws(tx({ signedDate, ...txOver })),
    ...(renewalOver ? { signedRenewalInfo: jws({ originalTransactionId: '2000000000000000', environment: 'Sandbox', signedDate, autoRenewStatus: 1, ...renewalOver }) } : {}),
    ...data,
  },
}, { c })

function setup() {
  const status = createMemoryStatusStore()
  const notifications = createAppStoreNotifications({ verifyJws, status })
  const billing = createAppStoreBilling({ verifyJws, notifications })
  const logs = []
  const routes = createBillingRoutes({ play: {}, appStore: billing, appStoreNotifications: notifications, packageName: 'fr.jpesquet.sante', verifyPush: async () => true, log: (e) => logs.push(e), now: () => NOW })
  return { status, notifications, billing, routes, logs }
}

test('notification : signature et chaîne vérifiées comme une transaction, JWS emboîtés compris', async () => {
  const { routes, logs } = setup()
  const forged = await routes.appStoreNotification({ signedPayload: note('DID_RENEW', { c: rogue }) })
  assert.deepEqual([forged.status, forged.payload.error], [400, 'untrusted_root'])
  // Enveloppe authentique mais transaction emboîtée forgée
  const inner = jws({ notificationType: 'REFUND', signedDate: NOW, data: { bundleId: 'fr.jpesquet.sante', environment: 'Sandbox', signedTransactionInfo: jws(tx(), { c: rogue }) } })
  assert.equal((await routes.appStoreNotification({ signedPayload: inner })).status, 400)
  await assert.rejects(() => routes.appStoreNotification({}), { status: 400 })
  // Autre app ou environnement Xcode : 200 (inutile que l'App Store relivre), rien d'appliqué
  const other = await routes.appStoreNotification({ signedPayload: note('REFUND', { data: { bundleId: 'com.autre.app' } }) })
  assert.deepEqual([other.status, other.payload.error], [200, 'other_app'])
  const test0 = await routes.appStoreNotification({ signedPayload: note('TEST', { data: { signedTransactionInfo: undefined } }) })
  assert.equal(test0.status, 200)
  assert.equal(logs.at(-1).type, 'TEST')
  // Une vraie notification (trois JWS, ~3 chaînes) dépasse la taille d'une transaction seule : acceptée
  const big = note('DID_RENEW', { renewalOver: {}, txOver: { padding: 'x'.repeat(4000) } })
  assert.ok(big.length > MAX_JWS_LENGTH)
  assert.equal((await routes.appStoreNotification({ signedPayload: big })).status, 200)
})

test('remboursement puis révocation : la transaction signée avant ne donne plus de droits', async () => {
  const { routes, logs, status } = setup()
  const before = jws(tx({ signedDate: NOW - DAY }))
  assert.equal((await routes.verify({ purchaseToken: before }, INSTALL)).payload.premium, true)

  const refund = await routes.appStoreNotification({ signedPayload: note('REFUND', { txOver: { revocationDate: NOW - 1000, revocationReason: 0 } }) })
  assert.equal(refund.status, 200)
  assert.deepEqual([logs.at(-1).type, logs.at(-1).state, logs.at(-1).lock], ['REFUND', 'revoked', 'set'])
  const after = await routes.verify({ purchaseToken: before }, INSTALL)
  assert.deepEqual([after.status, after.payload.premium, after.payload.tier, after.payload.state], [200, false, null, 'revoked'])
  assert.equal(logs.at(-1).locked, true)
  // Aucun identifiant de personne ni d'achat en clair dans le journal ni dans le registre
  const dump = JSON.stringify(logs) + JSON.stringify(await status.get(subscriptionKey('2000000000000000')))
  for (const secret of [INSTALL, '2000000000000000', '2000000000000001', appAccountTokenFor(INSTALL)]) assert.ok(!dump.includes(secret), secret)

  // Nouvel achat dans le même groupe, signé après : droits rouverts
  const again = jws(tx({ signedDate: NOW + 60_000, transactionId: '2000000000000009' }))
  assert.equal((await routes.verify({ purchaseToken: again }, INSTALL)).payload.premium, true)
  const revoke = await routes.appStoreNotification({ signedPayload: note('REVOKE', { txOver: { revocationDate: NOW - 1000 } }) })
  assert.equal(revoke.status, 200)
})

test('expiration, période de grâce, renouvellement, changement de formule', async () => {
  const { routes, logs, notifications } = setup()
  const old = tx({ signedDate: NOW - 2 * DAY })
  // Échec de paiement avec période de grâce : toujours premium, aucun verrou
  await routes.appStoreNotification({ signedPayload: note('DID_FAIL_TO_RENEW', { subtype: 'GRACE_PERIOD', txOver: { expiresDate: NOW - 1000 }, renewalOver: { gracePeriodExpiresDate: NOW + 3 * DAY } }) })
  assert.deepEqual([logs.at(-1).state, logs.at(-1).premium, logs.at(-1).lock], ['grace', true, null])
  // Fin de la grâce : verrou
  await routes.appStoreNotification({ signedPayload: note('GRACE_PERIOD_EXPIRED', { txOver: { expiresDate: NOW - DAY }, renewalOver: { gracePeriodExpiresDate: NOW - 1000 } }) })
  assert.deepEqual([logs.at(-1).state, logs.at(-1).lock], ['expired', 'set'])
  assert.equal((await notifications.lockFor(old)).state, 'expired')
  // Renouvellement plus récent : verrou levé
  await routes.appStoreNotification({ signedPayload: note('DID_RENEW', { signedDate: NOW + 1000, txOver: { expiresDate: NOW + 30 * DAY } }) })
  assert.equal(logs.at(-1).lock, 'cleared')
  assert.equal(await notifications.lockFor(old), null)
  // Une notification ancienne relivrée n'écrase pas l'état plus récent
  await routes.appStoreNotification({ signedPayload: note('EXPIRED', { subtype: 'VOLUNTARY', signedDate: NOW - DAY, txOver: { expiresDate: NOW - 2 * DAY } }) })
  assert.equal(logs.at(-1).lock, null)
  assert.equal(await notifications.lockFor(old), null)
  // Passage à Gold dans le groupe : droits Gold, aucun verrou
  await routes.appStoreNotification({ signedPayload: note('DID_CHANGE_RENEWAL_PREF', { subtype: 'UPGRADE', signedDate: NOW + 2000, txOver: { productId: 'halcya_gold_mensuel' } }) })
  assert.deepEqual([logs.at(-1).tier, logs.at(-1).lock], ['gold', null])
  // Renouvellement coupé : premium jusqu'à l'échéance
  await routes.appStoreNotification({ signedPayload: note('DID_CHANGE_RENEWAL_STATUS', { subtype: 'AUTO_RENEW_DISABLED', signedDate: NOW + 3000, renewalOver: { autoRenewStatus: 0 } }) })
  assert.deepEqual([logs.at(-1).state, logs.at(-1).premium], ['canceled', true])
})

test('registre injoignable : notification relivrée (503), abonné jamais bloqué à la vérification', async () => {
  const broken = { get: async () => { throw Object.assign(new Error('x'), { status: 503 }) }, set: async () => {} }
  const notifications = createAppStoreNotifications({ verifyJws, status: broken })
  const logs = []
  const routes = createBillingRoutes({ play: {}, appStore: createAppStoreBilling({ verifyJws, notifications }), appStoreNotifications: notifications, packageName: 'fr.jpesquet.sante', verifyPush: async () => true, log: (e) => logs.push(e), now: () => NOW })
  assert.equal((await routes.appStoreNotification({ signedPayload: note('REFUND', { txOver: { revocationDate: NOW } }) })).status, 503)
  const v = await routes.verify({ purchaseToken: jws(tx()) }, INSTALL)
  assert.deepEqual([v.payload.premium, logs.at(-1).lockError], [true, true])
})

test('registre Firestore : lecture et écriture', async () => {
  const calls = []
  const docs = new Map()
  const fetchImpl = async (url, { method = 'GET', body } = {}) => {
    calls.push([method, url])
    const key = url.split('/').at(-1)
    if (method === 'PATCH') { docs.set(key, JSON.parse(body)); return { ok: true, status: 200 } }
    return docs.has(key) ? { ok: true, status: 200, json: async () => docs.get(key) } : { ok: false, status: 404 }
  }
  const store = createFirestoreStatusStore({ project: 'p', getToken: async () => 't', fetchImpl })
  const key = subscriptionKey('2000000000000000')
  assert.equal(await store.get(key), null)
  await store.set(key, { state: 'revoked', premium: false, at: NOW })
  assert.deepEqual(await store.get(key), { state: 'revoked', premium: false, at: NOW })
  await store.set(key, { state: 'active', premium: true, at: NOW + 1 })
  assert.deepEqual(await store.get(key), { state: 'active', premium: true, at: NOW + 1 })
  assert.match(calls[0][1], /\/projects\/p\/databases\/\(default\)\/documents\/appstore-status\/[0-9a-f]{32}$/)
})

test('route HTTP POST /appstore/notifications branchée', async () => {
  const { createHandler } = await import('../src/server.js')
  const { routes } = setup()
  const handler = createHandler({ quota: { take: () => ({ ok: true }) }, vertex: {}, credits: null, billing: routes, log: () => {} })
  const { Readable } = await import('node:stream')
  const send = async (body) => {
    const req = Readable.from([Buffer.from(JSON.stringify(body))])
    Object.assign(req, { method: 'POST', url: '/appstore/notifications', headers: { 'content-type': 'application/json' } })
    let status
    const res = { headersSent: false, writeHead(s) { status = s; this.headersSent = true }, setHeader() {}, end() {} }
    await handler(req, res)
    return status
  }
  assert.equal(await send({ signedPayload: note('DID_RENEW') }), 200)
  assert.equal(await send({ signedPayload: note('DID_RENEW', { c: rogue }) }), 400)
})
