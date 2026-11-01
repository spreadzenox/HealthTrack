import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCredits, createFirestoreStore, expiryOf, monthKey, nextMonth, parseClientState, formatState } from '../src/credits.js'

const clock = (start) => {
  let t = start
  return { now: () => t, set: (iso) => { t = Date.parse(iso) } }
}
const T0 = Date.parse('2026-10-23T10:00:00Z')
const opts = (c) => ({ welcome: 10, freeMonthly: 15, premiumDaily: 10, now: c.now })

test('mois civil UTC et premier jour du mois suivant', () => {
  assert.equal(monthKey(T0), '2026-10')
  assert.equal(nextMonth(T0), '2026-11-01T00:00:00.000Z')
  assert.equal(nextMonth(Date.parse('2026-12-31T23:00:00Z')), '2027-01-01T00:00:00.000Z')
})

test('gratuit : 15 du mois puis les 10 offerts, ensuite refus jusqu\'au mois suivant', () => {
  const c = clock(T0)
  const cr = createCredits(opts(c))
  assert.deepEqual(cr.peek('a', { premium: false }), { plan: 'free', remaining: 25, monthly: 15, welcome: 10, resetAt: '2026-11-01T00:00:00.000Z', state: '2026-10:0:0' })
  for (let i = 0; i < 25; i += 1) assert.equal(cr.take('a', { premium: false }).ok, true)
  const denied = cr.take('a', { premium: false })
  assert.equal(denied.ok, false)
  assert.equal(denied.scope, 'credits')
  assert.equal(denied.resetAt, '2026-11-01T00:00:00.000Z')
  // Mois suivant : 15 de nouveau, non cumulables, et les 10 offerts sont déjà utilisés
  c.set('2026-11-01T08:00:00Z')
  assert.equal(cr.peek('a', { premium: false }).remaining, 15)
})

test('les crédits du mois passent avant les crédits offerts (qui ne périment pas)', () => {
  const c = clock(T0)
  const cr = createCredits(opts(c))
  for (let i = 0; i < 3; i += 1) cr.take('a', { premium: false })
  c.set('2026-11-02T08:00:00Z')
  const p = cr.peek('a', { premium: false })
  assert.equal(p.remaining, 25)
  assert.equal(p.welcome, 10)
})

test('premium : 10 par jour, renouvelés à minuit UTC, sans toucher aux crédits gratuits', () => {
  const c = clock(T0)
  const cr = createCredits(opts(c))
  for (let i = 0; i < 10; i += 1) assert.equal(cr.take('a', { premium: true }).ok, true)
  const denied = cr.take('a', { premium: true })
  assert.deepEqual([denied.ok, denied.scope, denied.resetAt], [false, 'premium_day', '2026-10-24T00:00:00.000Z'])
  assert.equal(cr.peek('a', { premium: false }).remaining, 25)
  c.set('2026-10-24T00:00:01Z')
  assert.deepEqual(cr.peek('a', { premium: true }).remaining, 10)
})

test('rendre un crédit qui n\'a rien coûté', () => {
  const c = clock(T0)
  const cr = createCredits(opts(c))
  cr.take('a', { premium: false })
  cr.refund('a', { premium: false })
  assert.equal(cr.peek('a', { premium: false }).remaining, 25)
  cr.take('a', { premium: true })
  cr.refund('a', { premium: true })
  assert.equal(cr.peek('a', { premium: true }).remaining, 10)
})

test('état rapporté par l\'app : on garde le plus restrictif (le relais repart à zéro au redémarrage)', () => {
  const c = clock(T0)
  const cr = createCredits(opts(c))
  const reported = parseClientState('2026-10:15:4')
  assert.deepEqual(reported, { month: '2026-10', used: 15, welcomeUsed: 4 })
  assert.equal(cr.peek('a', { premium: false, reported }).remaining, 6)
  const r = cr.take('a', { premium: false, reported })
  assert.equal(r.remaining, 5)
  assert.equal(r.state, '2026-10:15:5')
  // Un état plus généreux que celui du relais ne rend rien
  assert.equal(cr.peek('a', { premium: false, reported: parseClientState('2026-10:0:0') }).remaining, 5)
  // Un état d'un mois passé ne compte que pour les crédits offerts
  const cr2 = createCredits(opts(c))
  assert.equal(cr2.peek('b', { premium: false, reported: parseClientState('2026-09:15:10') }).remaining, 15)
})

test('état illisible ou hors bornes → ignoré', () => {
  for (const raw of [undefined, '', 'abc', '2026-13:1:1', '2026-10:-1:0', '2026-10:1:99', '2026-10:999:0']) {
    assert.equal(parseClientState(raw), null, String(raw))
  }
  assert.equal(formatState({ month: '2026-10', used: 2, welcomeUsed: 1 }), '2026-10:2:1')
})

/** Registre durable factice (Map), qui compte ses lectures. */
const memoryStore = () => {
  const docs = new Map()
  let reads = 0
  return { docs, get reads() { return reads }, async get(k) { reads += 1; return docs.get(k) ?? null }, async set(k, v) { docs.set(k, { ...v }) } }
}

test('registre durable : le plafond premium du jour survit à un redémarrage de l\'instance', async () => {
  const c = clock(T0)
  const store = memoryStore()
  const first = createCredits({ ...opts(c), store })
  await first.hydrate('a')
  assert.equal(first.take('a', { premium: true }).ok, true)
  await first.persist('a')
  // Nouvelle instance Cloud Run : la mémoire repart à zéro, Firestore non
  const second = createCredits({ ...opts(c), store })
  await second.hydrate('a')
  assert.equal(second.peek('a', { premium: true }).remaining, 9)
  // Le lendemain, le plafond du jour se renouvelle
  c.set('2026-10-24T08:00:00Z')
  const third = createCredits({ ...opts(c), store })
  await third.hydrate('a')
  assert.equal(third.peek('a', { premium: true }).remaining, 10)
})

test('registre durable : crédits gratuits et offerts gardés, relus une seule fois par instance', async () => {
  const c = clock(T0)
  const store = memoryStore()
  const first = createCredits({ ...opts(c), store })
  for (let i = 0; i < 17; i += 1) first.take('a', { premium: false })
  await first.persist('a')
  const second = createCredits({ ...opts(c), store })
  await second.hydrate('a')
  await second.hydrate('a')
  assert.equal(store.reads, 1)
  assert.deepEqual(second.peek('a', { premium: false }), { plan: 'free', remaining: 8, monthly: 0, welcome: 8, resetAt: '2026-11-01T00:00:00.000Z', state: '2026-10:15:2' })
  // Mois suivant : les offerts consommés restent consommés
  c.set('2026-11-03T08:00:00Z')
  const third = createCredits({ ...opts(c), store })
  await third.hydrate('a')
  assert.equal(third.peek('a', { premium: false }).remaining, 23)
})

test('registre durable : une lecture en échec est retentée à la requête suivante', async () => {
  const c = clock(T0)
  const store = memoryStore()
  let fail = true
  const flaky = { get: async (k) => { if (fail) throw new Error('down'); return store.get(k) }, set: store.set }
  const cr = createCredits({ ...opts(c), store: flaky })
  await assert.rejects(cr.hydrate('a'))
  fail = false
  await cr.hydrate('a')
  assert.equal(store.reads, 1)
})

test('expiration : 13 mois après la fin du mois de la dernière analyse', () => {
  assert.equal(expiryOf(T0), '2027-12-01T00:00:00.000Z')
  assert.equal(expiryOf(Date.parse('2026-12-31T23:00:00Z')), '2028-02-01T00:00:00.000Z')
})

test('registre durable : chaque écriture repousse la date d\'expiration du compteur', async () => {
  const c = clock(T0)
  const store = memoryStore()
  const cr = createCredits({ ...opts(c), store })
  cr.take('a', { premium: false })
  await cr.persist('a')
  const [key] = store.docs.keys()
  assert.equal(store.docs.get(key).expireAt, '2027-12-01T00:00:00.000Z')
  c.set('2027-03-10T08:00:00Z')
  cr.take('a', { premium: false })
  await cr.persist('a')
  assert.equal(store.docs.get(key).expireAt, '2028-05-01T00:00:00.000Z')
})

test('Firestore : lecture, document absent, écriture des seuls compteurs', async () => {
  const calls = []
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init })
    if (init.method === 'PATCH') return { ok: true, status: 200, json: async () => ({}) }
    if (url.endsWith('/absent')) return { ok: false, status: 404 }
    return { ok: true, status: 200, json: async () => ({ fields: { month: { stringValue: '2026-10' }, used: { integerValue: '3' }, welcomeUsed: { integerValue: '1' }, day: { stringValue: '2026-10-23' }, dayUsed: { integerValue: '2' } } }) }
  }
  const store = createFirestoreStore({ project: 'p', getToken: async () => 'jeton', fetchImpl })
  assert.deepEqual(await store.get('abc'), { month: '2026-10', used: 3, welcomeUsed: 1, day: '2026-10-23', dayUsed: 2 })
  assert.equal(calls[0].url, 'https://firestore.googleapis.com/v1/projects/p/databases/(default)/documents/credits/abc')
  assert.equal(calls[0].init.headers.Authorization, 'Bearer jeton')
  assert.equal(await store.get('absent'), null)
  await store.set('abc', { month: '2026-10', used: 4, welcomeUsed: 1, day: '2026-10-23', dayUsed: 0, expireAt: '2027-12-01T00:00:00.000Z' })
  const body = JSON.parse(calls[2].init.body)
  assert.deepEqual(Object.keys(body.fields).sort(), ['day', 'dayUsed', 'expireAt', 'month', 'used', 'welcomeUsed'])
  assert.equal(body.fields.used.integerValue, '4')
  // Champ d'horodatage : c'est lui que la politique TTL de Firestore (P33) lit pour effacer le document
  assert.equal(body.fields.expireAt.timestampValue, '2027-12-01T00:00:00.000Z')
  const failing = createFirestoreStore({ project: 'p', getToken: async () => 'j', fetchImpl: async () => ({ ok: false, status: 403 }) })
  await assert.rejects(failing.get('abc'), /403/)
})

test('nouvelle installation : seul le premier crédit d\'une installation inconnue du registre est marqué', async () => {
  const c = clock(T0)
  const store = memoryStore()
  const cr = createCredits({ ...opts(c), store })
  await cr.hydrate('a')
  assert.equal(cr.take('a', { premium: false }).firstUse, true)
  assert.equal(cr.take('a', { premium: false }).firstUse, false)
  await cr.persist('a')
  // Installation déjà connue du registre (autre instance) : jamais « nouvelle »
  const other = createCredits({ ...opts(c), store })
  await other.hydrate('a')
  assert.equal(other.take('a', { premium: true }).firstUse, false)
  // Sans registre durable, on ne sait pas : jamais « nouvelle »
  assert.equal(createCredits(opts(c)).take('b', { premium: false }).firstUse, false)
  // L'app rapporte déjà des crédits pris : pas une nouvelle installation
  const third = createCredits({ ...opts(c), store })
  await third.hydrate('c')
  assert.equal(third.take('c', { premium: false, reported: { month: '2026-10', used: 3, welcomeUsed: 0 } }).firstUse, false)
})

test('nouvelle installation : un premier crédit rendu (analyse sans coût) reste à compter', async () => {
  const c = clock(T0)
  const cr = createCredits({ ...opts(c), store: memoryStore() })
  await cr.hydrate('a')
  assert.equal(cr.take('a', { premium: false }).firstUse, true)
  cr.refund('a', { premium: false })
  assert.equal(cr.take('a', { premium: false }).firstUse, true)
})

test('Gold : 20 analyses par jour (Silver : 10), même compteur du jour', () => {
  const c = clock(T0)
  const cr = createCredits({ ...opts(c), goldDaily: 20 })
  assert.deepEqual([cr.peek('g', { premium: true, tier: 'gold' }).daily, cr.peek('g', { premium: true, tier: 'gold' }).tier], [20, 'gold'])
  assert.deepEqual([cr.peek('s', { premium: true }).daily, cr.peek('s', { premium: true }).tier], [10, 'silver'])
  for (let i = 0; i < 20; i += 1) assert.equal(cr.take('g', { premium: true, tier: 'gold' }).ok, true)
  assert.equal(cr.take('g', { premium: true, tier: 'gold' }).scope, 'premium_day')
  // Redescendu en Silver le même jour : déjà au-delà de 10, rien de plus
  assert.equal(cr.take('g', { premium: true, tier: 'silver' }).ok, false)
  // Gratuit inchangé
  assert.equal(cr.peek('g', { premium: false }).remaining, 25)
})
