// Réglages de l'app par l'API (scripts/store-app.mjs), contre un App Store Connect simulé : seulement ce que le
// propriétaire a demandé, rien de remplacé, jamais les États-Unis.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { availabilityBody, priceScheduleBody, freePricePoint, applyAppSettings, parseArgs, CONTENT_RIGHTS } from './store-app.mjs'

function fakeAsc({ availability = false, price = false, contentRights = null } = {}) {
  const db = { availability, price, app: { contentRightsDeclaration: contentRights }, posts: [], patches: [] }
  const json = (status, body) => ({ ok: status < 300, status, json: async () => body })
  const fetchImpl = async (url, { method, body }) => {
    const u = new URL(url)
    const path = u.pathname
    const sent = body ? JSON.parse(body) : null
    if (method === 'GET' && path === '/v1/apps') return json(200, { data: [{ id: 'app1', type: 'apps', attributes: { ...db.app } }] })
    if (method === 'GET' && path === '/v1/apps/app1/appAvailabilityV2') return db.availability ? json(200, { data: { id: 'av1' } }) : json(404, { errors: [{ title: 'Not found' }] })
    if (method === 'GET' && path === '/v1/apps/app1/appPriceSchedule') return db.price ? json(200, { data: { id: 'ps1' } }) : json(404, { errors: [{ title: 'Not found' }] })
    if (method === 'GET' && path === '/v1/apps/app1/appPricePoints') {
      assert.equal(u.searchParams.get('filter[territory]'), 'FRA')
      return json(200, { data: [{ id: 'pp-0', attributes: { customerPrice: '0.0' } }, { id: 'pp-099', attributes: { customerPrice: '0.99' } }] })
    }
    if (method === 'POST') {
      db.posts.push({ path, body: sent })
      if (path === '/v2/appAvailabilities') db.availability = true
      if (path === '/v1/appPriceSchedules') db.price = true
      return json(201, { data: {} })
    }
    if (method === 'PATCH' && path === '/v1/apps/app1') {
      db.patches.push(sent)
      Object.assign(db.app, sent.data.attributes)
      return json(200, { data: {} })
    }
    return json(500, { errors: [{ title: `route non simulée ${method} ${path}` }] })
  }
  return { db, fetchImpl }
}

test('disponibilité : les 5 pays de P32 seulement, jamais les États-Unis, pas les nouveaux pays', () => {
  const b = availabilityBody('app1')
  assert.equal(b.data.attributes.availableInNewTerritories, false)
  const ids = b.included.map((x) => x.relationships.territory.data.id)
  assert.deepEqual(ids, ['FRA', 'BEL', 'LUX', 'CHE', 'CAN'])
  assert.ok(!ids.includes('USA'))
  assert.ok(b.included.every((x) => x.attributes.available === true))
  assert.deepEqual(b.data.relationships.territoryAvailabilities.data.map((x) => x.id), b.included.map((x) => x.id))
})

test('prix : le palier gratuit, la France comme territoire de base', () => {
  const b = priceScheduleBody('app1', 'pp-0')
  assert.equal(b.data.relationships.baseTerritory.data.id, 'FRA')
  assert.equal(b.included[0].relationships.appPricePoint.data.id, 'pp-0')
  assert.equal(b.data.relationships.manualPrices.data[0].id, b.included[0].id)
  assert.equal(freePricePoint([{ id: 'a', attributes: { customerPrice: '0.99' } }, { id: 'b', attributes: { customerPrice: '0.00' } }]).id, 'b')
  assert.throws(() => freePricePoint([{ id: 'a', attributes: { customerPrice: '0.99' } }]), /palier gratuit : 0 trouvé/)
})

test('prix et disponibilité : créés quand ils manquent, jamais remplacés', async () => {
  const asc = fakeAsc()
  const lines = []
  const { drift } = await applyAppSettings({ token: 't', fetchImpl: asc.fetchImpl, priceAndAvailability: true, log: (l) => lines.push(l) })
  assert.deepEqual(drift, [])
  assert.deepEqual(asc.db.posts.map((p) => p.path), ['/v2/appAvailabilities', '/v1/appPriceSchedules'])
  assert.equal(asc.db.posts[1].body.included[0].relationships.appPricePoint.data.id, 'pp-0')
  assert.equal(asc.db.patches.length, 0, 'Content Rights non demandé : pas touché')
  assert.ok(lines.some((l) => /FRA, BEL, LUX, CHE, CAN/.test(l)))

  const again = await applyAppSettings({ token: 't', fetchImpl: asc.fetchImpl, priceAndAvailability: true })
  assert.equal(asc.db.posts.length, 2, 'rien de renvoyé au second passage')
  assert.equal(again.drift.length, 2)
})

test('Content Rights : seulement la déclaration choisie, et seulement si elle change', async () => {
  const asc = fakeAsc()
  await applyAppSettings({ token: 't', fetchImpl: asc.fetchImpl, contentRights: 'USES_THIRD_PARTY_CONTENT' })
  assert.deepEqual(asc.db.patches.map((p) => p.data.attributes), [{ contentRightsDeclaration: 'USES_THIRD_PARTY_CONTENT' }])
  assert.equal(asc.db.posts.length, 0, 'prix et disponibilité non demandés : pas touchés')
  await applyAppSettings({ token: 't', fetchImpl: asc.fetchImpl, contentRights: 'USES_THIRD_PARTY_CONTENT' })
  assert.equal(asc.db.patches.length, 1)
  await assert.rejects(applyAppSettings({ token: 't', fetchImpl: asc.fetchImpl, contentRights: 'OUI' }), /inconnu/)
})

test('ligne de commande : rien sans option, une déclaration d\'Apple ou rien', () => {
  assert.deepEqual(parseArgs(['node', 'x']), { priceAndAvailability: false, contentRights: null, dryRun: false })
  assert.deepEqual(parseArgs(['node', 'x', '--prix-et-disponibilite', '--dry-run']), { priceAndAvailability: true, contentRights: null, dryRun: true })
  assert.equal(parseArgs(['node', 'x', '--content-rights', CONTENT_RIGHTS[0]]).contentRights, 'USES_THIRD_PARTY_CONTENT')
  assert.throws(() => parseArgs(['node', 'x', '--content-rights', 'peut-etre']), /USES_THIRD_PARTY_CONTENT ou DOES_NOT_USE_THIRD_PARTY_CONTENT/)
})
