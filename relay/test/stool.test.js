import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHandler, buildStoolRequest, normalizeStool } from '../src/server.js'
import { createQuota } from '../src/quota.js'
import { createCredits } from '../src/credits.js'
import { VertexError } from '../src/vertex.js'
import { STOOL_SCHEMA } from '../src/prompts.js'

// Tests sur réponses simulées seulement : aucune vraie photo de selles dans le dépôt (I221)
const INSTALL = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x06, 0x47, 0x50, 0x53, 0x21, 0xff, 0xda, 0x00, 0x02, 0x01, 0xff, 0xd9])
const photo = { image: { mimeType: 'image/jpeg', data: JPEG.toString('base64') } }

function fakeVertex(model, result) {
  const calls = []
  return {
    calls,
    generateJson: async (req) => {
      calls.push(req)
      if (result instanceof Error) throw result
      return { parsed: result, model, location: 'eu', spent: [] }
    },
  }
}

async function withServer(deps, fn) {
  const logs = []
  const handler = createHandler({
    quota: createQuota({ globalPerDay: 100, installPerDay: 10, globalPerMinute: 100 }),
    ingredientNames: ['Pomme, crue'],
    log: (e) => logs.push(e),
    ...deps,
  })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  const url = `http://127.0.0.1:${server.address().port}`
  try {
    await fn((body) => fetch(`${url}/v1/stool/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Install-Id': INSTALL },
      body: JSON.stringify(body),
    }), logs, url)
  } finally {
    server.close()
  }
}

test('buildStoolRequest : JPEG seulement, EXIF retiré, consigne fixe et schéma des selles', () => {
  const req = buildStoolRequest(photo)
  assert.equal(req.kind, 'stool')
  assert.equal(req.schema, STOOL_SCHEMA)
  assert.equal(req.liteOnly, true)
  const sent = Buffer.from(req.parts[0].inlineData.data, 'base64')
  assert.equal(sent.includes(Buffer.from('GPS')), false)
  assert.match(req.systemInstruction, /Bristol/)
  // Rien de médical : la consigne interdit de commenter couleur, sang ou mucus
  assert.match(req.systemInstruction, /couleur/)
  assert.throws(() => buildStoolRequest({ image: { mimeType: 'image/png', data: 'xx' } }), /JPEG/)
  assert.throws(() => buildStoolRequest({ kind: 'text', description: 'type 4' }), /JPEG/)
})

test('normalizeStool : type 1 à 7 entier, confiance bornée, rien d’autre ne sort', () => {
  assert.deepEqual(normalizeStool({ visible: true, bristol: 4, confidence: 'high', note: 'sang' }), { visible: true, bristol: 4, confidence: 'high' })
  assert.deepEqual(normalizeStool({ visible: true, bristol: 9, confidence: 'high' }), { visible: false, bristol: null, confidence: 'low' })
  assert.deepEqual(normalizeStool({ visible: true, bristol: '3', confidence: 'certain' }), { visible: true, bristol: 3, confidence: 'low' })
  assert.deepEqual(normalizeStool({ visible: false, bristol: 5 }), { visible: false, bristol: null, confidence: 'low' })
  assert.deepEqual(normalizeStool(null), { visible: false, bristol: null, confidence: 'low' })
})

test('route : toujours Flash-Lite, même pour Gold ; une analyse décomptée ; journaux sans résultat', async () => {
  const lite = fakeVertex('gemini-lite', { visible: true, bristol: 6, confidence: 'medium' })
  const gold = fakeVertex('gemini-flash', { visible: true, bristol: 6, confidence: 'medium' })
  const credits = createCredits({ welcome: 3, freeMonthly: 3, premiumDaily: 20 })
  const billing = { verify: async () => ({ status: 200, payload: { premium: true, source: 'launch' } }) }
  await withServer({ vertex: lite, goldVertex: gold, credits, billing }, async (post, logs) => {
    const res = await post(photo)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.deepEqual(body.parsed, { visible: true, bristol: 6, confidence: 'medium' })
    assert.equal(body.credits.remaining, 19)
    assert.equal(gold.calls.length, 0)
    assert.equal(lite.calls.length, 1)
    assert.equal(lite.calls[0].schema, STOOL_SCHEMA)
    const analyze = logs.find((e) => e.event === 'analyze')
    assert.equal(analyze.kind, 'stool')
    assert.equal(analyze.served, 'lite')
    assert.equal(JSON.stringify(logs).includes('bristol'), false)
  })
})

test('photo illisible pour le modèle (réponse vide, filtre) : « difficile à lire », crédit rendu', async () => {
  const lite = fakeVertex('gemini-lite', new VertexError('Réponse du modèle vide.', 502, true))
  const credits = createCredits({ welcome: 3, freeMonthly: 3, premiumDaily: 20 })
  await withServer({ vertex: lite, credits }, async (post, _logs, url) => {
    const peekCredits = async () => (await (await fetch(`${url}/v1/credits`, { headers: { 'X-Install-Id': INSTALL } })).json()).credits.remaining
    const before = await peekCredits()
    const res = await post(photo)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.deepEqual(body.parsed, { visible: false, bristol: null, confidence: 'low' })
    assert.equal(body.unreadable, true)
    assert.equal(body.credits.remaining, before)
    assert.equal(await peekCredits(), before)
  })
})

test('panne du modèle (hors réponse illisible) : 502 comme pour un repas', async () => {
  const lite = fakeVertex('gemini-lite', new VertexError('indisponible', 503, false))
  await withServer({ vertex: lite }, async (post) => {
    const res = await post(photo)
    assert.equal(res.status, 502)
  })
})

test('demande invalide refusée sans appel au modèle', async () => {
  const lite = fakeVertex('gemini-lite', { visible: true, bristol: 4, confidence: 'high' })
  await withServer({ vertex: lite }, async (post) => {
    const res = await post({ image: { mimeType: 'image/png', data: 'abc' } })
    assert.equal(res.status, 400)
    assert.equal(lite.calls.length, 0)
  })
})
