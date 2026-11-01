import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHandler } from '../src/server.js'
import { createQuota } from '../src/quota.js'
import { createCostLedger } from '../src/costs.js'

// Plus petit JPEG lisible (SOI + SOS + EOI) : le relais retire l'EXIF et accepte la photo
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9]).toString('base64')
const USAGE = { promptTokenCount: 1000, cachedContentTokenCount: 0, thoughtsTokenCount: 10, candidatesTokenCount: 50 }

function fakeVertex(model) {
  const calls = []
  return {
    calls,
    generateJson: async (req) => {
      calls.push(req)
      return { parsed: { not_food: false, ingredients: [{ ingredient: 'Pomme, crue', quantity_g: 150 }] }, model, location: 'eu', spent: [{ model, usageMetadata: USAGE }] }
    },
  }
}

async function call(deps, { auth = 'Bearer good', body = { tier: 'gold', dish: 'dish_1', kind: 'photo', image: { mimeType: 'image/jpeg', data: JPEG } }, times = 1 } = {}) {
  const logs = []
  const handler = createHandler({
    quota: createQuota({ globalPerDay: 100, installPerDay: 50, globalPerMinute: 100 }),
    ingredientNames: ['Pomme, crue'],
    benchAuth: async (authorization) => authorization === 'Bearer good',
    log: (e) => logs.push(e),
    ...deps,
  })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  const url = `http://127.0.0.1:${server.address().port}`
  const out = []
  try {
    for (let i = 0; i < times; i += 1) {
      const res = await fetch(`${url}/v1/bench/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
        body: JSON.stringify(body),
      })
      out.push({ status: res.status, json: await res.json() })
    }
  } finally {
    server.close()
  }
  return { logs, out }
}

test('banc : sans jeton de la CI, 401 et aucun appel au modèle', async () => {
  const gold = fakeVertex('gemini-3.8-flash')
  const lite = fakeVertex('gemini-3.5-flash-lite')
  for (const auth of [null, 'Bearer bad']) {
    const { out } = await call({ vertex: lite, goldVertex: gold }, { auth })
    assert.equal(out[0].status, 401)
  }
  assert.equal(gold.calls.length + lite.calls.length, 0)
})

test('banc : la route n\'existe pas sans vérificateur (benchAuth absent)', async () => {
  const { out } = await call({ vertex: fakeVertex('lite'), benchAuth: null })
  assert.equal(out[0].status, 404)
})

test('banc : le niveau demandé choisit le modèle ; réponse avec le modèle servi et le coût', async () => {
  const gold = fakeVertex('gemini-3.8-flash')
  const lite = fakeVertex('gemini-3.5-flash-lite')
  const costs = createCostLedger()
  const g = await call({ vertex: lite, goldVertex: gold, costs })
  assert.equal(g.out[0].status, 200)
  assert.equal(g.out[0].json.served, 'gold')
  assert.equal(g.out[0].json.model, 'gemini-3.8-flash')
  assert.equal(g.out[0].json.parsed.ingredients[0].quantity_g, 150)
  assert.ok(g.out[0].json.eur > 0)
  const s = await call({ vertex: lite, goldVertex: gold, costs }, { body: { tier: 'silver', dish: 'dish_1', kind: 'photo', image: { mimeType: 'image/jpeg', data: JPEG } } })
  assert.equal(s.out[0].json.served, 'lite')
  assert.equal(gold.calls.length, 1)
  assert.equal(lite.calls.length, 1)
  // Coût cumulé au mois comme toute analyse ; journal sans contenu
  assert.ok(costs.total() > 0)
  assert.equal(g.logs.find((e) => e.event === 'bench').tier, 'gold')
})

test('banc : niveau inconnu ou plat absent refusés', async () => {
  for (const body of [{ tier: 'platinum', dish: 'dish_1', kind: 'text', description: 'x' }, { tier: 'gold', kind: 'text', description: 'x' }]) {
    const { out } = await call({ vertex: fakeVertex('lite') }, { body })
    assert.equal(out[0].status, 400)
  }
})

test('banc : soumis aux plafonds habituels (jour global, Gold du jour, budget du mois)', async () => {
  // Plafond global du jour : 2 appels, le 3e est refusé
  const lite = fakeVertex('gemini-3.5-flash-lite')
  const { out } = await call({ vertex: lite, quota: createQuota({ globalPerDay: 2, installPerDay: 50, globalPerMinute: 100 }) }, { body: { tier: 'silver', dish: 'dish_1', kind: 'text', description: 'une pomme' }, times: 3 })
  assert.deepEqual(out.map((o) => o.status), [200, 200, 429])

  // Plafond Gold du jour atteint : Flash-Lite répond, et le banc le sait (served: 'lite')
  const gold = fakeVertex('gemini-3.8-flash')
  const capped = await call({ vertex: fakeVertex('gemini-3.5-flash-lite'), goldVertex: gold, goldDailyCap: 1 }, { times: 2 })
  assert.deepEqual(capped.out.map((o) => o.json.served), ['gold', 'lite'])

  // Budget du mois épuisé : plus rien
  const costs = createCostLedger({ stopMonthlyEur: 0 })
  await costs.add('gemini-3.8-flash', { input: 1e6, cached: 0, thinking: 0, output: 0 })
  const stopped = await call({ vertex: fakeVertex('lite'), costs })
  assert.equal(stopped.out[0].status, 429)
})

test('workflow du banc : lancé à la main seulement, audience du jeton = adresse vérifiée par le relais', async () => {
  const { readFileSync } = await import('node:fs')
  const { loadConfig } = await import('../src/config.js')
  const wf = readFileSync(new URL('../../.github/workflows/bench-gold.yml', import.meta.url), 'utf8')
  const config = loadConfig({})
  assert.match(wf, /id_token_audience: (\S+)/)
  assert.equal(wf.match(/id_token_audience: (\S+)/)[1], `${config.publicUrl}/v1/bench/analyze`)
  assert.match(wf, new RegExp(`service_account: ${config.benchServiceAccount.replaceAll('.', '\\.')}`))
  assert.match(wf, /id_token_include_email: true/)
  // Pas de déclenchement automatique : chaque banc coûte quelques euros
  assert.equal(/\n\s+(push|pull_request|schedule):/.test(wf), false)
  // Aucune image gardée : l'artefact ne contient que le dossier des chiffres
  assert.match(wf, /path: \$\{\{ runner\.temp \}\}\/bench\//)
})
