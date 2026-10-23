import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCredits, monthKey, nextMonth, parseClientState, formatState } from '../src/credits.js'

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
