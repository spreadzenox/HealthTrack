import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createBillingRoutes, offeredFor, verifyResponse } from '../src/billing.js'
import { loadConfig, readOfferedInstalls } from '../src/config.js'
import { createHandler, hashInstallId } from '../src/server.js'
import { createQuota } from '../src/quota.js'
import { createCredits } from '../src/credits.js'

/**
 * Période offerte à une installation (GOLD-a3-3 et P44-1) : une fois la période de lancement finie, les installations
 * listées par leur empreinte gardent Gold, sans achat ni donnée personnelle. Identifiants synthétiques.
 */
const OWNER = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const TESTER = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'
const OTHER = 'c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f'
const PKG = 'fr.jpesquet.sante'
const LAUNCH = { from: '2026-10-25T12:00:00Z', until: '2026-12-02T23:00:00Z' }
const DEC_10 = Date.parse('2026-12-10T12:00:00Z')
const DEC_28 = Date.parse('2026-12-28T12:00:00Z')
const UNTIL = '2026-12-27T23:00:00Z'
const OFFERED = { [hashInstallId(OWNER)]: null, [hashInstallId(TESTER)]: UNTIL }

test('offeredFor : sans fin pour null, jusqu’à sa date sinon ; date passée, vide ou illisible → rien', () => {
  assert.deepEqual(offeredFor(OFFERED, hashInstallId(OWNER), DEC_28), { until: null })
  assert.deepEqual(offeredFor(OFFERED, hashInstallId(TESTER), DEC_10), { until: '2026-12-27T23:00:00.000Z' })
  assert.equal(offeredFor(OFFERED, hashInstallId(TESTER), DEC_28), null)
  assert.equal(offeredFor(OFFERED, hashInstallId(OTHER), DEC_10), null)
  // Une date vide ou illisible ne doit jamais devenir « sans fin »
  assert.equal(offeredFor({ abc: '' }, 'abc', DEC_10), null)
  assert.equal(offeredFor({ abc: 'bientôt' }, 'abc', DEC_10), null)
  assert.equal(offeredFor(undefined, 'abc', DEC_10), null)
  assert.equal(offeredFor({}, 'toString', DEC_10), null)
})

test('verifyResponse : période offerte → Gold, source « launch », date de fin quand il y en a une', () => {
  const open = verifyResponse({ ent: null, launchUntil: null, offered: { until: null } })
  assert.deepEqual([open.premium, open.source, open.tier, open.launchUntil], [true, 'launch', 'gold', null])
  const dated = verifyResponse({ ent: null, launchUntil: null, offered: { until: '2026-12-27T23:00:00.000Z' } })
  assert.deepEqual([dated.premium, dated.source, dated.tier, dated.launchUntil], [true, 'launch', 'gold', '2026-12-27T23:00:00.000Z'])
  const none = verifyResponse({ ent: null, launchUntil: null, offered: null })
  assert.deepEqual([none.premium, none.source, none.tier], [false, null, null])
})

async function withRelay({ t, offeredInstalls = OFFERED }, fn) {
  const now = () => t.now
  const handler = createHandler({
    quota: createQuota({ globalPerDay: 100, installPerDay: 50, globalPerMinute: 100, now }),
    vertex: { generateJson: async () => { throw new Error('pas ici') } },
    ingredientNames: ['Pomme'],
    credits: createCredits({ now }),
    billing: createBillingRoutes({
      play: { get: async () => { throw new Error('aucun achat ici') } },
      packageName: PKG, launchPremium: LAUNCH, offeredInstalls, hash: hashInstallId, verifyPush: async () => true, now,
    }),
    allowedOrigins: ['https://localhost'],
    now,
  })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  try {
    await fn(`http://127.0.0.1:${server.address().port}`)
  } finally {
    server.close()
  }
}

const verify = (url, install, headers = {}) =>
  fetch(`${url}/v1/subscription/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://localhost', 'X-Install-Id': install, ...headers },
    body: '{}',
  }).then((r) => r.json())
const credits = (url, install, headers = {}) =>
  fetch(`${url}/v1/credits`, { headers: { 'X-Install-Id': install, ...headers } }).then((r) => r.json()).then((b) => b.credits)

test('après la période de lancement : l’installation du propriétaire garde Gold (droits et 20 analyses par jour), pas les autres', async () => {
  await withRelay({ t: { now: DEC_10 } }, async (url) => {
    const owner = await verify(url, OWNER)
    assert.deepEqual([owner.premium, owner.source, owner.tier, owner.launchUntil], [true, 'launch', 'gold', null])
    assert.deepEqual(await credits(url, OWNER).then((c) => [c.plan, c.tier, c.daily]), ['premium', 'gold', 20])
    const other = await verify(url, OTHER)
    assert.deepEqual([other.premium, other.source, other.tier], [false, null, null])
    assert.equal((await credits(url, OTHER)).plan, 'free')
  })
})

test('P44 : une installation listée avec une date garde Gold jusqu’à cette date, puis retombe au gratuit', async () => {
  const t = { now: DEC_10 }
  await withRelay({ t }, async (url) => {
    const during = await verify(url, TESTER)
    assert.deepEqual([during.premium, during.source, during.tier, during.launchUntil], [true, 'launch', 'gold', '2026-12-27T23:00:00.000Z'])
    assert.equal((await credits(url, TESTER)).daily, 20)
    t.now = DEC_28
    assert.equal((await verify(url, TESTER)).premium, false)
    assert.equal((await credits(url, TESTER)).plan, 'free')
    // Le propriétaire, sans date de fin, garde Gold
    assert.equal((await verify(url, OWNER)).tier, 'gold')
  })
})

test('période offerte : pendant la période de lancement, la date générale reste celle affichée ; jamais sur iPhone', async () => {
  await withRelay({ t: { now: Date.parse('2026-11-20T12:00:00Z') } }, async (url) => {
    assert.equal((await verify(url, TESTER)).launchUntil, '2026-12-02T23:00:00.000Z')
    assert.equal((await verify(url, OWNER)).launchUntil, '2026-12-02T23:00:00.000Z')
  })
  await withRelay({ t: { now: DEC_10 } }, async (url) => {
    assert.equal((await verify(url, OWNER, { 'X-Platform': 'ios' })).premium, false)
  })
})

test('configuration : GOLD_INSTALLS sans fin, liste datée du fichier ; le fichier du dépôt est lisible et ne liste encore personne', () => {
  const file = readOfferedInstalls()
  assert.deepEqual(file.installs, [])
  assert.equal(file.until, UNTIL)
  assert.deepEqual(loadConfig({ GOLD_INSTALLS: '5e4a69f72ffb' }).offeredInstalls, { '5e4a69f72ffb': null })
  assert.deepEqual(readOfferedInstalls('/nulle/part.json'), { until: '', installs: [] })
})
