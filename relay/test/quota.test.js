import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createQuota, dayKey, nextReset } from '../src/quota.js'

const clock = (start) => {
  let t = start
  return { now: () => t, advance: (ms) => { t += ms } }
}
const T0 = Date.parse('2026-10-22T10:00:00Z')

test('plafond par installation, puis reprise le lendemain (minuit UTC)', () => {
  const c = clock(T0)
  const q = createQuota({ globalPerDay: 100, installPerDay: 2, globalPerMinute: 100, now: c.now })
  assert.deepEqual(q.take('a'), { ok: true, remaining: 1, resetAt: '2026-10-23T00:00:00.000Z' })
  assert.equal(q.take('a').remaining, 0)
  assert.deepEqual(q.take('a'), { ok: false, scope: 'install', resetAt: '2026-10-23T00:00:00.000Z' })
  assert.equal(q.take('b').ok, true) // une autre installation n'est pas concernée
  c.advance(14 * 3600_000)
  assert.equal(q.take('a').ok, true)
})

test('plafond global par jour, toutes installations confondues', () => {
  const c = clock(T0)
  const q = createQuota({ globalPerDay: 3, installPerDay: 10, globalPerMinute: 100, now: c.now })
  for (const id of ['a', 'b', 'c']) assert.equal(q.take(id).ok, true)
  assert.equal(q.take('d').scope, 'global')
  assert.deepEqual(q.stats(), { day: '2026-10-22', global: 3, installs: 3 })
})

test('plafond par minute (rafales), libéré une minute après le plus ancien appel', () => {
  const c = clock(T0)
  const q = createQuota({ globalPerDay: 100, installPerDay: 100, globalPerMinute: 2, now: c.now })
  q.take('a')
  c.advance(10_000)
  q.take('b')
  const refused = q.take('c')
  assert.equal(refused.scope, 'minute')
  assert.equal(refused.resetAt, new Date(T0 + 60_000).toISOString())
  c.advance(50_000)
  assert.equal(q.take('c').ok, true)
})

test('un appel qui n’a rien coûté est rendu', () => {
  const q = createQuota({ globalPerDay: 1, installPerDay: 1, globalPerMinute: 1, now: () => T0 })
  assert.equal(q.take('a').ok, true)
  q.refund('a')
  assert.equal(q.take('a').ok, true)
})

test('jour civil et prochaine remise à zéro', () => {
  assert.equal(dayKey(Date.parse('2026-10-22T23:59:59Z')), '2026-10-22')
  assert.equal(nextReset(Date.parse('2026-12-31T08:00:00Z')), '2027-01-01T00:00:00.000Z')
})
