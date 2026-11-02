/**
 * Fin de la période de lancement sur iPhone (décision du propriétaire du 02/11 au soir) : `iosUntil` dans
 * src/launch-period.json arrête le Gold d'office des requêtes iPhone (`X-Platform: ios`, ou signes de l'app iPhone),
 * pour qu'Apple voie l'écran d'achat pendant l'examen. Android et la période play ne changent pas ; un en-tête falsifié
 * ne donne jamais plus que la période play.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHandler } from '../src/server.js'
import { createQuota } from '../src/quota.js'
import { createCredits } from '../src/credits.js'
import { createBillingRoutes, launchUntilFor } from '../src/billing.js'
import { loadConfig, readLaunchPeriod } from '../src/config.js'
import { isIosRequest } from '../src/integrity.js'

const PERIOD = { from: '2026-10-25T12:00:00Z', until: '2026-11-27T23:00:00Z', iosUntil: '2026-11-06T23:00:00Z', off: false }
const BEFORE = Date.parse('2026-11-06T22:59:00Z')
const AFTER = Date.parse('2026-11-06T23:00:00Z')
const INSTALL = 'install-ios-0123456789'
const noPlay = { getSubscription: async () => { throw new Error('pas ici') }, acknowledge: async () => ({}) }

test('launchUntilFor : avant iosUntil rien ne change ; après, plus rien pour l’iPhone, Android garde la période play', () => {
  assert.equal(launchUntilFor(PERIOD, BEFORE, 'ios'), '2026-11-06T23:00:00.000Z')
  assert.equal(launchUntilFor(PERIOD, BEFORE, 'android'), '2026-11-27T23:00:00.000Z')
  assert.equal(launchUntilFor(PERIOD, AFTER, 'ios'), null)
  assert.equal(launchUntilFor(PERIOD, AFTER, 'android'), '2026-11-27T23:00:00.000Z')
  assert.equal(launchUntilFor(PERIOD, AFTER), '2026-11-27T23:00:00.000Z')
  // iosUntil vide ou illisible : l'iPhone suit la période play ; jamais plus tard que la période play
  assert.equal(launchUntilFor({ ...PERIOD, iosUntil: '' }, AFTER, 'ios'), '2026-11-27T23:00:00.000Z')
  assert.equal(launchUntilFor({ ...PERIOD, iosUntil: 'bientôt' }, AFTER, 'ios'), '2026-11-27T23:00:00.000Z')
  assert.equal(launchUntilFor({ ...PERIOD, iosUntil: '2027-01-01T00:00:00Z' }, AFTER, 'ios'), '2026-11-27T23:00:00.000Z')
  assert.equal(launchUntilFor({ ...PERIOD, off: true }, BEFORE, 'ios'), null)
})

test('isIosRequest : X-Platform: ios, no_plugin sans en-tête, ou clé App Attest ; sinon Android', () => {
  assert.equal(isIosRequest({ 'x-platform': 'iOS' }), true)
  assert.equal(isIosRequest({ 'x-integrity-status': 'no_plugin' }), true)
  assert.equal(isIosRequest({ 'x-appattest-key': 'abc' }), true)
  assert.equal(isIosRequest({}), false)
  assert.equal(isIosRequest({ 'x-platform': 'android', 'x-integrity-status': 'no_plugin' }), false)
})

test('fichier du dépôt : iosUntil lisible, avant until ; LAUNCH_PREMIUM_IOS_UNTIL prioritaire', () => {
  const file = readLaunchPeriod()
  assert.equal(file.iosUntil, '2026-11-06T23:00:00Z')
  assert.ok(Date.parse(file.iosUntil) <= Date.parse(file.until))
  assert.equal(loadConfig({ LAUNCH_PREMIUM_IOS_UNTIL: '' }).launchPremium.iosUntil, '')
  assert.deepEqual(readLaunchPeriod('/nulle/part.json'), { from: '', until: '', iosUntil: '', off: false })
})

async function withRelay(now, fn) {
  const t = { now }
  const handler = createHandler({
    quota: createQuota({ globalPerDay: 100, installPerDay: 50, globalPerMinute: 100 }),
    vertex: { generateJson: async () => { throw new Error('pas ici') } },
    ingredientNames: ['Pomme, crue'],
    credits: createCredits({ premiumDaily: 20 }),
    billing: createBillingRoutes({ play: noPlay, packageName: 'fr.jpesquet.sante', launchPremium: PERIOD, verifyPush: async () => true, now: () => t.now }),
    now: () => t.now,
  })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  try {
    await fn(`http://127.0.0.1:${server.address().port}`, t)
  } finally {
    server.close()
  }
}

const verify = (url, headers = {}) => fetch(`${url}/v1/subscription/verify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Install-Id': INSTALL, ...headers },
  body: '{}',
}).then((r) => r.json())

test('route verify : iPhone en Gold jusqu’au 06/11 inclus, puis sans Gold d’office ; Android inchangé', async () => {
  await withRelay(BEFORE, async (url) => {
    const ios = await verify(url, { 'X-Platform': 'ios' })
    assert.deepEqual([ios.premium, ios.source, ios.tier, ios.launchUntil], [true, 'launch', 'gold', '2026-11-06T23:00:00.000Z'])
  })
  await withRelay(AFTER, async (url) => {
    const ios = await verify(url, { 'X-Platform': 'ios' })
    assert.deepEqual([ios.premium, ios.source, ios.tier, ios.launchUntil], [false, null, null, null])
    const android = await verify(url)
    assert.deepEqual([android.premium, android.source, android.tier], [true, 'launch', 'gold'])
    // En-tête falsifié dans l'autre sens (une requête iPhone qui se dit Android) : au plus la période play
    const forged = await verify(url, { 'X-Platform': 'android' })
    assert.equal(forged.launchUntil, '2026-11-27T23:00:00.000Z')
  })
})

test('crédits : après le 06/11, l’iPhone retombe au gratuit même si Android, sur la même installation, a été vu en Gold', async () => {
  await withRelay(BEFORE, async (url, t) => {
    const credits = (headers) => fetch(`${url}/v1/credits`, { headers: { 'X-Install-Id': INSTALL, ...headers } }).then((r) => r.json())
    const before = await credits({ 'X-Platform': 'ios' })
    assert.equal(before.credits.plan, 'premium')
    await credits({}) // même installation vue côté play : son cache ne doit pas servir à l'iPhone
    t.now = AFTER
    const after = await credits({ 'X-Platform': 'ios' })
    assert.equal(after.credits.plan, 'free')
    assert.equal((await credits({})).credits.plan, 'premium')
  })
})

test('bilan du déploiement : affiche aussi ce que le relais sert à un iPhone sans achat', async () => {
  const { readFileSync } = await import('node:fs')
  const wf = readFileSync(new URL('../../.github/workflows/relay-deploy.yml', import.meta.url), 'utf8')
  assert.match(wf, /iPhone sans achat/)
  assert.match(wf, /-H 'X-Platform: ios' -d '\{\}'/)
})
