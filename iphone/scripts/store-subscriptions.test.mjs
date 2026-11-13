// Tests de scripts/store-subscriptions.mjs (node --test) : catalogue identique au plugin AppStoreBilling
// (BillingRule.swift) et au tableau de store/app-store/abonnements.md, limites d'Apple, choix du palier de prix, et
// création contre un App Store Connect simulé : tout se crée au premier passage, rien au second, et un prix déjà en
// place n'est jamais modifié.
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SUBSCRIPTIONS, LIMITS, TERRITORY, TERRITORIES, GROUP, NOTIFICATIONS, bodies, pricePointFor, currentPrices, ensureSubscriptions, readReviewScreenshot, notificationsPlan, diagnose, appTerritories } from './store-subscriptions.mjs'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('catalogue : les identifiants du plugin AppStoreBilling (BillingRule.swift), Gold au-dessus de Silver', () => {
  const swift = read('ios/HalcyaRules/Sources/HalcyaRules/BillingRule.swift')
  const plans = [...swift.matchAll(/\("(halcya_[a-z_]+)", "(halcya_[a-z]+)", "([a-z]+)"\)/g)].map((m) => ({ storeId: m[1], productId: m[2], basePlanId: m[3] }))
  assert.deepEqual(SUBSCRIPTIONS.map((s) => s.productId).sort(), plans.map((p) => p.storeId).sort())
  for (const s of SUBSCRIPTIONS) {
    const p = plans.find((x) => x.storeId === s.productId)
    assert.equal(s.groupLevel, p.productId === 'halcya_gold' ? 1 : 2, s.productId)
    assert.equal(s.period, p.basePlanId === 'annuel' ? 'ONE_YEAR' : 'ONE_MONTH', s.productId)
  }
})

test('catalogue : prix, essai et textes du tableau de store/app-store/abonnements.md, dans les limites d’Apple', () => {
  const md = read('store/app-store/abonnements.md')
  const rows = Object.fromEntries([...md.matchAll(/^\|\s*`(halcya_[a-z_]+)`\s*\|\s*(\d)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/gm)]
    .map((m) => [m[1], { level: Number(m[2]), trial: m[4].trim(), name: m[5].trim(), description: m[6].trim() }]))
  for (const s of SUBSCRIPTIONS) {
    const row = rows[s.productId]
    assert.ok(row, `${s.productId} absent de abonnements.md`)
    assert.equal(s.groupLevel, row.level, s.productId)
    assert.equal(s.name, row.name, s.productId)
    assert.equal(s.description, row.description, s.productId)
    assert.equal(Boolean(s.trial), /essai/.test(row.trial), s.productId)
    assert.ok(s.name.length <= LIMITS.name && s.description.length <= LIMITS.description && s.referenceName.length <= LIMITS.referenceName)
  }
  // Prix décidés : Silver 29,99 €/an avec 14 jours d'essai et 4,99 €/mois, Gold 9,99 €/mois sans essai
  const by = Object.fromEntries(SUBSCRIPTIONS.map((s) => [s.productId, s]))
  assert.equal(by.halcya_premium_annuel.price, '29.99')
  assert.deepEqual(by.halcya_premium_annuel.trial, { offerMode: 'FREE_TRIAL', duration: 'TWO_WEEKS', numberOfPeriods: 1 })
  assert.equal(by.halcya_premium_mensuel.price, '4.99')
  assert.equal(by.halcya_gold_mensuel.price, '9.99')
  assert.equal(by.halcya_gold_mensuel.trial, null)
  assert.equal(by.halcya_gold_annuel, undefined, 'Gold annuel : seulement si le propriétaire le décide')
  assert.match(md, /9,99 €/)
  assert.match(md, /4,99 €\/mois ou 29,99 €\/an/)
})

test('catalogue : jamais de promesse de précision ni de nom de modèle dans les textes des abonnements', () => {
  for (const s of SUBSCRIPTIONS) {
    const text = `${s.name} ${s.description} ${s.referenceName}`
    assert.doesNotMatch(text, /erreur|précis|meilleur|Gemini|Flash|Google/i, s.productId)
  }
})

test('corps des requêtes : les 5 pays de P32, pas de partage familial, niveau et durée du catalogue', () => {
  const gold = SUBSCRIPTIONS[0]
  assert.deepEqual(bodies.subscription(gold, 'g1').data.attributes, {
    name: 'Halcya Gold mensuel', productId: 'halcya_gold_mensuel', subscriptionPeriod: 'ONE_MONTH', groupLevel: 1, familySharable: false,
  })
  const av = bodies.availability('s1').data
  assert.equal(av.attributes.availableInNewTerritories, false)
  assert.deepEqual(av.relationships.availableTerritories.data.map((t) => t.id), ['FRA', 'BEL', 'LUX', 'CHE', 'CAN'])
  assert.ok(!TERRITORIES.includes('USA'), 'jamais les États-Unis (P32)')
  assert.equal(bodies.price('s1', 'pp').data.relationships.territory.data.id, TERRITORY)
  assert.equal(bodies.price('s1', 'pp', 'CHE').data.relationships.territory.data.id, 'CHE')
  assert.equal(bodies.trial(SUBSCRIPTIONS[1], 's1', 'CAN').data.relationships.territory.data.id, 'CAN')
  assert.equal(bodies.groupLocalization('g1').data.attributes.name, GROUP.name)
})

test('pricePointFor : le palier dont le prix client est exactement celui décidé', () => {
  const points = [{ id: 'a', attributes: { customerPrice: '4.49' } }, { id: 'b', attributes: { customerPrice: '4.99' } }, { id: 'c', attributes: { customerPrice: '29.99' } }]
  assert.equal(pricePointFor(points, '4.99').id, 'b')
  assert.equal(pricePointFor(points, '29.99').id, 'c')
  assert.throws(() => pricePointFor(points, '9.99'), /0 trouvé/)
})

test('currentPrices : prix clients en place lus dans les paliers inclus', () => {
  const res = {
    data: [{ id: 'p1', relationships: { subscriptionPricePoint: { data: { id: 'pp1' } } } }, { id: 'p2', relationships: { subscriptionPricePoint: { data: { id: 'pp1' } } } }],
    included: [{ type: 'subscriptionPricePoints', id: 'pp1', attributes: { customerPrice: '4.99' } }, { type: 'territories', id: 'FRA' }],
  }
  assert.deepEqual(currentPrices(res), ['4.99'])
  assert.deepEqual(currentPrices({ data: [] }), [])
})

/** App Store Connect simulé : juste ce que le script lit et crée. */
function fakeAsc({ prePrice = null, monthlyPlans = false, app = {} } = {}) {
  const db = { app: { ...app }, groups: [], groupLocs: [], subs: [], locs: [], avail: {}, prices: {}, pricesBy: {}, postedPrices: [], offers: {}, shots: {}, uploads: [], deleted: [] }
  const calls = []
  let n = 0
  const id = (p) => `${p}${++n}`
  const json = (status, body) => ({ ok: status < 300, status, json: async () => body })
  const pricePoints = (subId) => ['0.99', '4.90', '4.99', '6.99', '9.90', '9.99', '12.99', '29.00', '29.99', '39.99', '79.99']
    .map((c) => ({ id: `${subId}-pp-${c}`, type: 'subscriptionPricePoints', attributes: { customerPrice: c } }))
  // Prix par pays : db.prices[abonnement] pour la France (comme avant), db.pricesBy[« abonnement|pays »] ailleurs
  const pricesOf = (sub, t) => (t === 'FRA' ? db.prices[sub] : db.pricesBy[`${sub}|${t}`]) || []
  const fetchImpl = async (url, { method, body }) => {
    const u = new URL(url)
    const path = u.pathname
    const data = body && typeof body === 'string' ? JSON.parse(body).data : null
    calls.push(`${method} ${path}`)
    let m
    if (method === 'GET' && path === '/v1/apps') return json(200, { data: [{ id: 'app1', type: 'apps', attributes: { ...db.app } }] })
    if (method === 'PATCH' && path === '/v1/apps/app1') {
      Object.assign(db.app, data.attributes)
      return json(200, { data: { id: 'app1', type: 'apps', attributes: { ...db.app } } })
    }
    if (method === 'GET' && path === '/v1/apps/app1/subscriptionGroups') return json(200, { data: db.groups })
    if (method === 'POST' && path === '/v1/subscriptionGroups') {
      const g = { id: id('g'), type: 'subscriptionGroups', attributes: data.attributes }
      db.groups.push(g)
      return json(201, { data: g })
    }
    if ((m = /^\/v1\/subscriptionGroups\/(\w+)\/subscriptionGroupLocalizations$/.exec(path))) return json(200, { data: db.groupLocs.filter((l) => l.group === m[1]) })
    if (method === 'POST' && path === '/v1/subscriptionGroupLocalizations') {
      db.groupLocs.push({ id: id('gl'), group: data.relationships.subscriptionGroup.data.id, attributes: data.attributes })
      return json(201, { data: {} })
    }
    if ((m = /^\/v1\/subscriptionGroups\/(\w+)\/subscriptions$/.exec(path))) return json(200, { data: db.subs.filter((s) => s.group === m[1]) })
    if (method === 'POST' && path === '/v1/subscriptions') {
      const s = { id: id('s'), type: 'subscriptions', group: data.relationships.group.data.id, attributes: { ...data.attributes, state: 'MISSING_METADATA' } }
      db.subs.push(s)
      if (prePrice) db.prices[s.id] = [prePrice]
      return json(201, { data: s })
    }
    if ((m = /^\/v1\/subscriptions\/(\w+)\/subscriptionLocalizations$/.exec(path))) return json(200, { data: db.locs.filter((l) => l.sub === m[1]) })
    if (method === 'POST' && path === '/v1/subscriptionLocalizations') {
      db.locs.push({ id: id('l'), sub: data.relationships.subscription.data.id, attributes: data.attributes })
      return json(201, { data: {} })
    }
    if ((m = /^\/v1\/subscriptions\/(\w+)\/subscriptionAvailability$/.exec(path))) {
      const a = db.avail[m[1]]
      return a ? json(200, { data: a, included: a.relationships.availableTerritories.data }) : json(404, { errors: [{ title: 'Not found' }] })
    }
    if (method === 'POST' && path === '/v1/subscriptionAvailabilities') {
      db.avail[data.relationships.subscription.data.id] = { id: id('a'), ...data }
      return json(201, { data: {} })
    }
    if ((m = /^\/v1\/subscriptions\/(\w+)\/prices$/.exec(path))) {
      const list = pricesOf(m[1], u.searchParams.get('filter[territory]'))
      return json(200, {
        data: list.map((c, i) => ({ id: `${m[1]}-p${i}`, relationships: { subscriptionPricePoint: { data: { id: `${m[1]}-pp-${c}` } } } })),
        included: list.map((c) => ({ type: 'subscriptionPricePoints', id: `${m[1]}-pp-${c}`, attributes: { customerPrice: c } })),
      })
    }
    if ((m = /^\/v1\/subscriptions\/(\w+)\/pricePoints$/.exec(path))) {
      // Deux pages, pour vérifier que le script suit `links.next` ; avec `monthlyPlans`, des paliers « MONTHLY »
      // au même prix que ceux du paiement d'avance, sauf si l'on filtre sur UPFRONT
      const upfront = u.searchParams.get('filter[planType]') === 'UPFRONT'
      const all = [...pricePoints(m[1]), ...(monthlyPlans && !upfront ? pricePoints(`${m[1]}m`) : [])]
      const second = u.searchParams.get('cursor') === '2'
      return json(200, second ? { data: all.slice(3), links: {} } : { data: all.slice(0, 3), links: { next: `${url}&cursor=2` } })
    }
    if (method === 'POST' && path === '/v1/subscriptionPrices') {
      const sub = data.relationships.subscription.data.id
      const c = data.relationships.subscriptionPricePoint.data.id.split('-pp-')[1]
      const t = data.relationships.territory.data.id
      db.postedPrices.push(t)
      if (t === 'FRA') db.prices[sub] = [...(db.prices[sub] || []), c]
      else db.pricesBy[`${sub}|${t}`] = [...(db.pricesBy[`${sub}|${t}`] || []), c]
      return json(201, { data: {} })
    }
    if ((m = /^\/v1\/subscriptions\/(\w+)\/introductoryOffers$/.exec(path))) return json(200, { data: db.offers[m[1]] || [] })
    if (method === 'POST' && path === '/v1/subscriptionIntroductoryOffers') {
      const sub = data.relationships.subscription.data.id
      db.offers[sub] = [...(db.offers[sub] || []), { id: id('o'), attributes: data.attributes, relationships: { territory: { data: data.relationships.territory.data } } }]
      return json(201, { data: {} })
    }
    if ((m = /^\/v1\/subscriptions\/(\w+)\/appStoreReviewScreenshot$/.exec(path))) {
      const shot = db.shots[m[1]]
      return shot ? json(200, { data: shot }) : json(404, { errors: [{ title: 'Not found' }] })
    }
    if (method === 'POST' && path === '/v1/subscriptionAppStoreReviewScreenshots') {
      const sub = data.relationships.subscription.data.id
      const shot = {
        id: id('rs'), sub, attributes: { ...data.attributes, uploadOperations: [
          { method: 'PUT', url: `https://envoi.example/${sub}/1`, offset: 0, length: 4, requestHeaders: [{ name: 'Content-Type', value: 'image/png' }] },
          { method: 'PUT', url: `https://envoi.example/${sub}/2`, offset: 4, length: data.attributes.fileSize - 4, requestHeaders: [] },
        ] },
      }
      db.shots[sub] = shot
      return json(201, { data: shot })
    }
    if (u.host === 'envoi.example' && method === 'PUT') {
      db.uploads.push({ path, bytes: Buffer.from(body).length })
      return json(200, {})
    }
    if ((m = /^\/v1\/subscriptionAppStoreReviewScreenshots\/(\w+)$/.exec(path))) {
      const shot = Object.values(db.shots).find((x) => x.id === m[1])
      if (method === 'DELETE') {
        db.deleted.push(m[1])
        delete db.shots[shot.sub]
        return json(204, {})
      }
      if (method === 'PATCH') {
        Object.assign(shot.attributes, data.attributes)
        return json(200, { data: shot })
      }
    }
    if ((m = /^\/v1\/subscriptions\/(\w+)$/.exec(path)) && method === 'GET') return json(200, { data: db.subs.find((s) => s.id === m[1]) })
    if (/^\/v1\/subscriptions\/\w+\/planAvailabilities$/.test(path) && method === 'GET') return json(200, { data: [] })
    if (method === 'GET' && path === '/v1/apps/app1/appAvailabilityV2') {
      return db.noAppAvailability ? json(404, { errors: [{ title: 'Not found' }] }) : json(200, { data: { id: 'av1', type: 'appAvailabilities' } })
    }
    if (method === 'GET' && path === '/v1/apps/app1/appPriceSchedule') return db.appPrice ? json(200, db.appPrice) : json(404, { errors: [{ title: 'Not found' }] })
    if (method === 'GET' && path === '/v2/appAvailabilities/av1/territoryAvailabilities') {
      return json(200, { data: (db.appTerritories || ['FRA']).map((t) => ({ type: 'territoryAvailabilities', attributes: { available: true }, relationships: { territory: { data: { type: 'territories', id: t } } } })) })
    }
    if (/^\/v1\/subscriptions\/\w+\/versions$/.test(path) && method === 'GET' && !db.noVersions) {
      return json(200, { data: [{ id: 'v1', type: 'subscriptionVersions', attributes: { version: 1, state: 'PREPARE_FOR_SUBMISSION' } }] })
    }
    return json(500, { errors: [{ title: `route non simulée ${method} ${path}` }] })
  }
  return { db, calls, fetchImpl }
}

test('ensureSubscriptions : tout se crée au premier passage, rien au second (idempotent)', async () => {
  const asc = fakeAsc()
  const lines = []
  const first = await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl, log: (l) => lines.push(l) })
  assert.deepEqual(first.drift, [])
  assert.equal(asc.db.groups.length, 1)
  assert.equal(asc.db.groups[0].attributes.referenceName, 'Halcya')
  assert.equal(asc.db.groupLocs.length, 1)
  assert.deepEqual(asc.db.subs.map((s) => [s.attributes.productId, s.attributes.groupLevel]), [
    ['halcya_gold_mensuel', 1], ['halcya_premium_annuel', 2], ['halcya_premium_mensuel', 2],
  ])
  const priceOf = (pid) => asc.db.prices[asc.db.subs.find((s) => s.attributes.productId === pid).id]
  assert.deepEqual(priceOf('halcya_gold_mensuel'), ['9.99'])
  assert.deepEqual(priceOf('halcya_premium_annuel'), ['29.99'])
  assert.deepEqual(priceOf('halcya_premium_mensuel'), ['4.99'])
  // Ailleurs qu'en France, les prix de P32 : zone euro au prix français, Suisse et Canada comme Google Play
  const localOf = (pid, t) => asc.db.pricesBy[`${asc.db.subs.find((s) => s.attributes.productId === pid).id}|${t}`]
  assert.deepEqual(['BEL', 'LUX', 'CHE', 'CAN'].map((t) => localOf('halcya_premium_mensuel', t)), [['4.99'], ['4.99'], ['4.90'], ['6.99']])
  assert.deepEqual(['CHE', 'CAN'].map((t) => localOf('halcya_premium_annuel', t)), [['29.00'], ['39.99']])
  assert.deepEqual(['CHE', 'CAN'].map((t) => localOf('halcya_gold_mensuel', t)), [['9.90'], ['12.99']])
  const offers = Object.entries(asc.db.offers)
  assert.equal(offers.length, 1, 'un seul essai : Silver annuel')
  assert.equal(asc.db.subs.find((s) => s.id === offers[0][0]).attributes.productId, 'halcya_premium_annuel')
  assert.deepEqual(offers[0][1].map((o) => o.relationships.territory.data.id), TERRITORIES, 'essai dans les 5 pays')
  assert.ok(offers[0][1].every((o) => o.attributes.duration === 'TWO_WEEKS'))
  assert.ok(Object.values(asc.db.avail).every((a) => a.attributes.availableInNewTerritories === false))
  assert.deepEqual(first.states, { halcya_gold_mensuel: 'MISSING_METADATA', halcya_premium_annuel: 'MISSING_METADATA', halcya_premium_mensuel: 'MISSING_METADATA' })
  assert.ok(lines.some((l) => /halcya_premium_annuel : créé, .*essai gratuit/.test(l)))

  const before = asc.calls.filter((c) => !c.startsWith('GET')).length
  const again = []
  const second = await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl, log: (l) => again.push(l) })
  assert.deepEqual(second.drift, [])
  assert.equal(asc.calls.filter((c) => !c.startsWith('GET')).length, before, 'aucune écriture au second passage')
  assert.equal(asc.db.subs.length, 3)
  assert.ok(again.filter((l) => /^halcya_/.test(l)).every((l) => /déjà en place/.test(l)))
})

test('ensureSubscriptions : un prix déjà en place n’est jamais modifié, l’écart est signalé', async () => {
  const asc = fakeAsc({ prePrice: '0.99' })
  const { drift } = await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl })
  assert.equal(drift.length, 3)
  assert.match(drift[0], /prix 0\.99 € en place en FRA, 9\.99 € décidé \(non modifié\)/)
  assert.ok(!asc.db.postedPrices.includes('FRA'), 'prix français jamais modifié')
})

test('ensureSubscriptions : deux paliers au même prix (paiement mensuel d’Apple) → celui du paiement d’avance', async () => {
  const asc = fakeAsc({ monthlyPlans: true })
  const { drift } = await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl })
  assert.deepEqual(drift, [])
  for (const s of asc.db.subs) assert.equal(asc.db.prices[s.id].length, 1)
  assert.equal(asc.calls.filter((c) => c === 'POST /v1/subscriptionPrices').length, 3 * TERRITORIES.length)
})

test('capture pour l’examen : envoyée pour chaque abonnement, morceaux et empreinte MD5, la précédente remplacée', async () => {
  const asc = fakeAsc()
  const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('image de l’écran d’achat')])
  const shot = { name: 'achat.png', bytes: png }
  const lines = []
  await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl, log: (l) => lines.push(l), reviewScreenshot: shot })
  assert.equal(Object.keys(asc.db.shots).length, 3)
  for (const s of Object.values(asc.db.shots)) {
    assert.equal(s.attributes.fileName, 'achat.png')
    assert.equal(s.attributes.fileSize, png.length)
    assert.equal(s.attributes.uploaded, true)
    assert.equal(s.attributes.sourceFileChecksum, createHash('md5').update(png).digest('hex'))
  }
  assert.equal(asc.db.uploads.length, 6, 'deux morceaux par abonnement')
  assert.equal(asc.db.uploads.reduce((n, x) => n + x.bytes, 0), 3 * png.length)
  assert.ok(lines.filter((l) => /capture pour l'examen envoyée \(achat\.png\)/.test(l)).length === 3)
  // Second envoi : l'ancienne capture est supprimée avant la nouvelle, sans rien recréer d'autre
  const writesBefore = asc.calls.filter((c) => c.startsWith('POST /v1/subscriptions')).length
  await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl, reviewScreenshot: shot })
  assert.equal(asc.db.deleted.length, 3)
  assert.equal(Object.keys(asc.db.shots).length, 3)
  assert.equal(asc.calls.filter((c) => c.startsWith('POST /v1/subscriptions')).length, writesBefore, 'aucun abonnement recréé')
})

test('readReviewScreenshot : un PNG seulement, avec son nom de fichier', () => {
  const dir = mkdtempSync(join(tmpdir(), 'examen-'))
  const ok = join(dir, 'iphone-17-pro-max-demo-clair-premium.png')
  writeFileSync(ok, Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('x')]))
  assert.equal(readReviewScreenshot(ok).name, 'iphone-17-pro-max-demo-clair-premium.png')
  const bad = join(dir, 'faux.png')
  writeFileSync(bad, 'pas une image')
  assert.throws(() => readReviewScreenshot(bad), /n'est pas un PNG/)
})

test('notifications serveur : adresse du relais d’Android en production et en sandbox, version 2', () => {
  assert.match(NOTIFICATIONS.url, /^https:\/\/halcya-relay-[0-9]+\.europe-west1\.run\.app\/appstore\/notifications$/)
  assert.equal(NOTIFICATIONS.version, 'V2')
  assert.match(read('store/app-store/abonnements.md'), new RegExp(NOTIFICATIONS.url.replace(/[.]/g, '\\.')))
  assert.deepEqual(notificationsPlan({}).attributes, {
    subscriptionStatusUrl: NOTIFICATIONS.url, subscriptionStatusUrlVersion: 'V2',
    subscriptionStatusUrlForSandbox: NOTIFICATIONS.url, subscriptionStatusUrlVersionForSandbox: 'V2',
  })
  const done = { subscriptionStatusUrl: NOTIFICATIONS.url, subscriptionStatusUrlVersion: 'V2', subscriptionStatusUrlForSandbox: NOTIFICATIONS.url, subscriptionStatusUrlVersionForSandbox: 'V2' }
  assert.deepEqual(notificationsPlan(done), { attributes: {}, drift: [] })
  // Version 1 déjà réglée sur la bonne adresse : passée en version 2
  assert.deepEqual(notificationsPlan({ ...done, subscriptionStatusUrlVersion: 'V1' }).attributes, { subscriptionStatusUrlVersion: 'V2' })
  // Une autre adresse en place n'est jamais remplacée, l'écart est signalé
  const other = notificationsPlan({ ...done, subscriptionStatusUrlForSandbox: 'https://exemple.fr/notif' })
  assert.deepEqual(other.attributes, {})
  assert.match(other.drift[0], /sandbox.*non modifiée/)
})

test('ensureSubscriptions : l’adresse des notifications est réglée une fois, puis laissée telle quelle', async () => {
  const asc = fakeAsc()
  await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl })
  assert.equal(asc.db.app.subscriptionStatusUrl, NOTIFICATIONS.url)
  assert.equal(asc.db.app.subscriptionStatusUrlForSandbox, NOTIFICATIONS.url)
  assert.equal(asc.db.app.subscriptionStatusUrlVersionForSandbox, 'V2')
  await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl })
  assert.equal(asc.calls.filter((c) => c === 'PATCH /v1/apps/app1').length, 1)
  const kept = fakeAsc({ app: { subscriptionStatusUrl: 'https://exemple.fr/notif', subscriptionStatusUrlVersion: 'V2' } })
  const { drift } = await ensureSubscriptions({ token: 't', fetchImpl: kept.fetchImpl })
  assert.equal(kept.db.app.subscriptionStatusUrl, 'https://exemple.fr/notif')
  assert.equal(kept.db.app.subscriptionStatusUrlForSandbox, NOTIFICATIONS.url, 'la sandbox vide est réglée')
  assert.match(drift.join(' ; '), /production.*non modifiée/)
})

test('diagnose : relevé sans écriture de chaque pièce exigée par Apple', async () => {
  const asc = fakeAsc()
  await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl })
  const writes = asc.calls.filter((c) => !c.startsWith('GET')).length
  const lines = await diagnose({ token: 't', fetchImpl: asc.fetchImpl })
  assert.equal(asc.calls.filter((c) => !c.startsWith('GET')).length, writes, 'aucune écriture')
  assert.match(lines[0], /^app : langue principale /)
  assert.match(lines[1], /^groupe : fr-FR « Halcya »/)
  assert.equal(lines.length, 5)
  assert.match(lines[0], /; app disponible dans 1 pays, manquent BEL, LUX, CHE, CAN ; prix de l'app non réglé$/)
  // « Prix et disponibilité » jamais rempli : Apple répond 404, dit en clair
  const blank = fakeAsc()
  await ensureSubscriptions({ token: 't', fetchImpl: blank.fetchImpl })
  blank.db.noAppAvailability = true
  blank.db.appPrice = { data: { relationships: { baseTerritory: { data: { id: 'FRA' } } } } }
  const blankLines = await diagnose({ token: 't', fetchImpl: blank.fetchImpl })
  assert.match(blankLines[0], /; disponibilité de l'app non réglée \(« Prix et disponibilité » vide\) ; prix de l'app réglé \(territoire de base FRA\)$/)
  assert.match(lines[2], /^halcya_gold_mensuel : état MISSING_METADATA ; noms fr-FR .* ; capture absente ; prix FRA 9\.99, BEL 9\.99, LUX 9\.99, CHE 9\.90, CAN 12\.99 ; territoires FRA, BEL, LUX, CHE, CAN ; note pour l'examen absente ; formules aucune ; versions 1 PREPARE_FOR_SUBMISSION$/)
  // Une pièce que l'API ne sait pas lire n'interrompt pas le relevé
  const broken = fakeAsc()
  await ensureSubscriptions({ token: 't', fetchImpl: broken.fetchImpl })
  broken.db.noVersions = true
  const partial = await diagnose({ token: 't', fetchImpl: broken.fetchImpl })
  assert.match(partial[2], /versions illisible \(500\)$/)
})

test('noms affichés par Apple (feuille d\'achat, réglages d\'abonnement) : ceux de l\'app, Silver et Gold, jamais « Premium »', async () => {
  const { SUBSCRIPTIONS } = await import('./store-subscriptions.mjs')
  const byId = Object.fromEntries(SUBSCRIPTIONS.map((s) => [s.productId, s.name]))
  assert.equal(byId.halcya_gold_mensuel, 'Halcya Gold')
  assert.equal(byId.halcya_premium_annuel, 'Halcya Silver annuel')
  assert.equal(byId.halcya_premium_mensuel, 'Halcya Silver')
  for (const s of SUBSCRIPTIONS) assert.doesNotMatch(`${s.name} ${s.description}`, /Premium/)
})

test('pays de P32 : un abonnement déjà en vente en France seulement est ouvert aux 4 autres, sans toucher au prix français', async () => {
  const asc = fakeAsc()
  await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl })
  // État d'avant P32 : France seulement, prix et essai français en place
  for (const sub of asc.db.subs) {
    asc.db.avail[sub.id].relationships.availableTerritories.data = [{ type: 'territories', id: 'FRA' }]
    for (const t of ['BEL', 'LUX', 'CHE', 'CAN']) delete asc.db.pricesBy[`${sub.id}|${t}`]
    if (asc.db.offers[sub.id]) asc.db.offers[sub.id] = asc.db.offers[sub.id].filter((o) => o.relationships.territory.data.id === 'FRA')
  }
  asc.db.postedPrices.length = 0
  const lines = []
  const { drift } = await ensureSubscriptions({ token: 't', fetchImpl: asc.fetchImpl, log: (l) => lines.push(l) })
  assert.deepEqual(drift, [])
  for (const sub of asc.db.subs) assert.deepEqual(asc.db.avail[sub.id].relationships.availableTerritories.data.map((t) => t.id), TERRITORIES)
  assert.ok(!asc.db.postedPrices.includes('FRA'), 'prix français jamais renvoyé')
  assert.equal(asc.db.postedPrices.length, 3 * 4)
  const annual = asc.db.subs.find((s) => s.attributes.productId === 'halcya_premium_annuel')
  assert.deepEqual(asc.db.offers[annual.id].map((o) => o.relationships.territory.data.id).sort(), [...TERRITORIES].sort())
  assert.ok(lines.some((l) => /halcya_premium_annuel : en vente en FRA, BEL, LUX, CHE, CAN, .*prix 29,00 CHF fixé en CHE.*essai gratuit de 2 semaines créé en BEL, LUX, CHE, CAN/.test(l)))
})

test('pays de P32 : un palier absent chez Apple est signalé, sans arrêter les autres pays', async () => {
  const asc = fakeAsc()
  const fetchImpl = async (url, init) => {
    const u = new URL(url)
    // Apple sans palier à 4,90 CHF
    if (/\/pricePoints$/.test(u.pathname) && u.searchParams.get('filter[territory]') === 'CHE') {
      return { ok: true, status: 200, json: async () => ({ data: [{ id: 'x', attributes: { customerPrice: '5.00' } }] }) }
    }
    return asc.fetchImpl(url, init)
  }
  const { drift } = await ensureSubscriptions({ token: 't', fetchImpl })
  assert.equal(drift.length, 3)
  assert.match(drift.find((d) => d.startsWith('halcya_premium_mensuel')), /prix 4\.90 CHF non fixé en CHE : palier de prix 4\.90 CHF : 0 trouvé\(s\) en CHE/)
  assert.equal(asc.db.postedPrices.filter((t) => t === 'CAN').length, 3)
})

test('pays de l\'app : résumé par rapport aux 5 pays de P32', () => {
  assert.equal(appTerritories(['FRA', 'BEL', 'LUX', 'CHE', 'CAN']), 'app disponible dans 5 pays, les 5 de P32')
  assert.equal(appTerritories(['FRA', 'USA', 'DEU']), 'app disponible dans 3 pays, États-Unis compris, manquent BEL, LUX, CHE, CAN, 2 hors P32')
})
