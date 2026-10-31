import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHandler, hashInstallId } from '../src/server.js'
import { createQuota } from '../src/quota.js'
import { createCredits } from '../src/credits.js'
import { createCostLedger } from '../src/costs.js'
import { VertexError } from '../src/vertex.js'

const INSTALL = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const USAGE = { promptTokenCount: 42000, cachedContentTokenCount: 0, thoughtsTokenCount: 2500, candidatesTokenCount: 300 }
const answer = (model) => ({ parsed: { not_food: false, ingredients: [] }, model, location: 'eu', spent: [{ model, usageMetadata: USAGE }] })

function fakeVertex(model, { fail = null } = {}) {
  const calls = []
  return {
    calls,
    generateJson: async (req) => {
      calls.push(req)
      if (fail) throw fail
      return answer(model)
    },
  }
}

const billingFor = (payload) => ({ verify: async () => ({ status: 200, payload }) })

async function analyze(deps, { install = INSTALL, times = 1 } = {}) {
  const logs = []
  const handler = createHandler({
    quota: createQuota({ globalPerDay: 100, installPerDay: 50, globalPerMinute: 100 }),
    ingredientNames: ['Pomme, crue'],
    credits: createCredits({ premiumDaily: 50 }),
    log: (e) => logs.push(e),
    ...deps,
  })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  const url = `http://127.0.0.1:${server.address().port}`
  const statuses = []
  try {
    for (let i = 0; i < times; i += 1) {
      const res = await fetch(`${url}/v1/meal/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Install-Id': install },
        body: JSON.stringify({ kind: 'text', description: 'une pomme' }),
      })
      statuses.push(res.status)
      await res.json()
    }
  } finally {
    server.close()
  }
  return { logs, statuses }
}

test('période de lancement : Gold sur le dernier Flash ; jetons et coût journalisés, jamais le contenu', async () => {
  const gold = fakeVertex('gemini-3.8-flash')
  const lite = fakeVertex('gemini-3.5-flash-lite')
  const costs = createCostLedger()
  const { logs, statuses } = await analyze({ vertex: lite, goldVertex: gold, costs, billing: billingFor({ premium: true, source: 'launch' }) })
  assert.deepEqual(statuses, [200])
  assert.equal(gold.calls.length, 1)
  assert.equal(lite.calls.length, 0)
  const usage = logs.find((e) => e.event === 'usage')
  assert.deepEqual(
    { model: usage.model, tier: usage.tier, input: usage.input, cached: usage.cached, thinking: usage.thinking, output: usage.output },
    { model: 'gemini-3.8-flash', tier: 'gold', input: 42000, cached: 0, thinking: 2500, output: 300 },
  )
  assert.ok(costs.total() > 0.04)
  const done = logs.find((e) => e.event === 'analyze')
  assert.equal(done.served, 'gold')
  assert.equal(JSON.stringify(logs).includes('pomme'), false)
})

test('abonnement actuel (Silver) et gratuit : Flash-Lite', async () => {
  for (const payload of [{ premium: true, source: 'play' }, { premium: false, source: null }]) {
    const gold = fakeVertex('gemini-3.8-flash')
    const lite = fakeVertex('gemini-3.5-flash-lite')
    const { logs } = await analyze({ vertex: lite, goldVertex: gold, costs: createCostLedger(), billing: billingFor(payload) })
    assert.equal(gold.calls.length, 0)
    assert.equal(lite.calls.length, 1)
    assert.equal(logs.find((e) => e.event === 'analyze').tier, payload.premium ? 'silver' : 'free')
  }
})

test('GOLD_INSTALLS : l’installation listée (empreinte) garde Gold hors période de lancement', async () => {
  const gold = fakeVertex('gemini-3.8-flash')
  const lite = fakeVertex('gemini-3.5-flash-lite')
  await analyze({ vertex: lite, goldVertex: gold, goldInstalls: [hashInstallId(INSTALL)], billing: billingFor({ premium: false }) })
  assert.equal(gold.calls.length, 1)
})

test('Gold en échec (délai de 25 s dépassé, modèle absent) : Flash-Lite en secours, coût de l’essai compté', async () => {
  const timeout = Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' })
  const billedFail = Object.assign(new VertexError('illisible', 502, true), { spent: [{ model: 'gemini-3.8-flash', usageMetadata: USAGE }] })
  for (const fail of [timeout, billedFail]) {
    const gold = fakeVertex('gemini-3.8-flash', { fail })
    const lite = fakeVertex('gemini-3.5-flash-lite')
    const costs = createCostLedger()
    const { logs, statuses } = await analyze({ vertex: lite, goldVertex: gold, costs, billing: billingFor({ premium: true, source: 'launch' }) })
    assert.deepEqual(statuses, [200])
    assert.equal(lite.calls.length, 1)
    assert.equal(logs.find((e) => e.event === 'analyze').served, 'lite')
    assert.equal(logs.filter((e) => e.event === 'usage').length, fail === timeout ? 1 : 2)
  }
})

test('au-delà de 15 € de Vertex dans le mois : Gold repasse sur Flash-Lite', async () => {
  const costs = createCostLedger({ prices: { x: { input: 1e6, cached: 0, output: 0 } } })
  await costs.add('x', { input: 15, cached: 0, thinking: 0, output: 0 })
  const gold = fakeVertex('gemini-3.8-flash')
  const lite = fakeVertex('gemini-3.5-flash-lite')
  const { logs } = await analyze({ vertex: lite, goldVertex: gold, costs, billing: billingFor({ premium: true, source: 'launch' }) })
  assert.equal(gold.calls.length, 0)
  assert.equal(lite.calls.length, 1)
  assert.equal(logs.find((e) => e.event === 'gold_fallback').reason, 'month_budget')
})

test('au-delà de 19 € : plus aucune analyse (429 « global »), rien n’est appelé', async () => {
  const costs = createCostLedger({ prices: { x: { input: 1e6, cached: 0, output: 0 } } })
  await costs.add('x', { input: 19, cached: 0, thinking: 0, output: 0 })
  const lite = fakeVertex('gemini-3.5-flash-lite')
  const { statuses } = await analyze({ vertex: lite, costs, billing: billingFor({ premium: false }) })
  assert.deepEqual(statuses, [429])
  assert.equal(lite.calls.length, 0)
})

test('plafond Gold du jour : les analyses suivantes passent sur Flash-Lite', async () => {
  const gold = fakeVertex('gemini-3.8-flash')
  const lite = fakeVertex('gemini-3.5-flash-lite')
  await analyze({ vertex: lite, goldVertex: gold, goldDailyCap: 2, billing: billingFor({ premium: true, source: 'launch' }) }, { times: 3 })
  assert.equal(gold.calls.length, 2)
  assert.equal(lite.calls.length, 1)
})
