import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHandler, buildRequest, hashInstallId, MAX_BODY_BYTES } from '../src/server.js'
import { createQuota } from '../src/quota.js'
import { VertexError } from '../src/vertex.js'
import { loadConfig, loadIngredientNames } from '../src/config.js'

const INSTALL = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x06, 0x47, 0x50, 0x53, 0x21, 0xff, 0xda, 0x00, 0x02, 0x01, 0xff, 0xd9])

async function withServer(deps, fn) {
  const logs = []
  const handler = createHandler({
    quota: createQuota({ globalPerDay: 100, installPerDay: 2, globalPerMinute: 100 }),
    ingredientNames: ['Pomme, crue', 'Yaourt nature'],
    allowedOrigins: ['https://localhost'],
    log: (e) => logs.push(e),
    ...deps,
  })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  const url = `http://127.0.0.1:${server.address().port}`
  try {
    await fn(url, logs)
  } finally {
    server.close()
  }
}

const post = (url, body, headers = { 'X-Install-Id': INSTALL }) =>
  fetch(`${url}/v1/meal/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://localhost', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const okVertex = (calls = []) => ({
  generateJson: async (req) => {
    calls.push(req)
    return { parsed: { not_food: false, dish: 'Pomme', ingredients: [{ ingredient: 'Pomme, crue', quantity_g: 150 }] }, model: 'm-lite', location: 'europe-west1' }
  },
})

test('description → consignes du relais (liste des ingrédients en tête), réponse et quota restant', async () => {
  const calls = []
  await withServer({ vertex: okVertex(calls) }, async (url, logs) => {
    const res = await post(url, { kind: 'text', description: '  une pomme  ' })
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://localhost')
    const body = await res.json()
    assert.equal(body.model, 'm-lite')
    assert.equal(body.parsed.dish, 'Pomme')
    assert.equal(body.quota.remaining, 1)
    assert.ok(calls[0].systemInstruction.startsWith('LISTE EXHAUSTIVE'))
    assert.ok(calls[0].systemInstruction.includes('Pomme, crue\nYaourt nature'))
    assert.deepEqual(calls[0].parts, [{ text: 'DESCRIPTION DU REPAS :\nune pomme' }])
    assert.ok(calls[0].schema)
    // Journaux : ni le texte, ni l'identifiant d'installation en clair
    const serialized = JSON.stringify(logs)
    assert.equal(serialized.includes('pomme'), false)
    assert.equal(serialized.includes(INSTALL), false)
    assert.ok(serialized.includes(hashInstallId(INSTALL)))
  })
})

test('photo : métadonnées retirées avant l’envoi au modèle', async () => {
  const calls = []
  await withServer({ vertex: okVertex(calls) }, async (url) => {
    const res = await post(url, { kind: 'photo', image: { mimeType: 'image/jpeg', data: JPEG.toString('base64') } })
    assert.equal(res.status, 200)
    const sent = Buffer.from(calls[0].parts[0].inlineData.data, 'base64')
    assert.equal(sent.includes(Buffer.from('GPS')), false)
    assert.deepEqual([...sent.subarray(0, 4)], [0xff, 0xd8, 0xff, 0xda])
  })
})

test('demandes invalides refusées sans appeler le modèle ni consommer de quota', async () => {
  const calls = []
  await withServer({ vertex: okVertex(calls) }, async (url) => {
    assert.equal((await post(url, { kind: 'text', description: 'x' }, {})).status, 400) // sans identifiant
    assert.equal((await post(url, '{pas du json')).status, 400)
    assert.equal((await post(url, { kind: 'prompt', text: 'écris un poème' })).status, 400)
    assert.equal((await post(url, { kind: 'text', description: 'a'.repeat(501) })).status, 400)
    assert.equal((await post(url, { kind: 'photo', image: { mimeType: 'image/png', data: 'AAAA' } })).status, 400)
    assert.equal((await post(url, { kind: 'photo', image: { mimeType: 'image/jpeg', data: 'AAAA' } })).status, 400)
    assert.equal(calls.length, 0)
    assert.equal((await post(url, { kind: 'text', description: 'pomme' })).status, 200)
  })
})

test('corps trop volumineux → 413', async () => {
  await withServer({ vertex: okVertex() }, async (url) => {
    const res = await post(url, { kind: 'text', description: 'a'.repeat(MAX_BODY_BYTES) }).catch(() => null)
    // Le serveur coupe la connexion après la réponse : selon le moment, fetch lit le 413 ou échoue
    if (res) assert.equal(res.status, 413)
  })
})

test('quota atteint → 429 avec message et date de renouvellement', async () => {
  await withServer({ vertex: okVertex() }, async (url) => {
    await post(url, { kind: 'text', description: 'pomme' })
    await post(url, { kind: 'text', description: 'pomme' })
    const res = await post(url, { kind: 'text', description: 'pomme' })
    assert.equal(res.status, 429)
    const body = await res.json()
    assert.equal(body.scope, 'install')
    assert.match(body.message, /demain/)
    assert.match(body.resetAt, /T00:00:00.000Z$/)
  })
})

test('échec de Vertex : 502 générique ; appel rendu au quota s’il n’a rien coûté', async () => {
  let billed = false
  const vertex = { generateJson: async () => { throw new VertexError('boom', 500, billed) } }
  await withServer({ vertex }, async (url) => {
    for (let i = 0; i < 3; i++) {
      const res = await post(url, { kind: 'text', description: 'pomme' })
      assert.equal(res.status, 502)
      assert.equal((await res.json()).message.includes('boom'), false)
    }
    billed = true
    await post(url, { kind: 'text', description: 'pomme' })
    await post(url, { kind: 'text', description: 'pomme' })
    assert.equal((await post(url, { kind: 'text', description: 'pomme' })).status, 429)
  })
})

test('santé, pré-vol CORS limité aux origines de l’app, adresses inconnues', async () => {
  await withServer({ vertex: okVertex() }, async (url) => {
    assert.deepEqual(await (await fetch(`${url}/health`)).json(), { ok: true })
    const pre = await fetch(`${url}/v1/meal/analyze`, { method: 'OPTIONS', headers: { Origin: 'https://localhost' } })
    assert.equal(pre.status, 204)
    assert.match(pre.headers.get('access-control-allow-headers'), /X-Install-Id/)
    const evil = await fetch(`${url}/v1/meal/analyze`, { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } })
    assert.equal(evil.headers.get('access-control-allow-origin'), null)
    assert.equal((await fetch(`${url}/admin`)).status, 404)
    assert.equal((await fetch(`${url}/v1/meal/analyze`)).status, 405)
  })
})

test('buildRequest : photo sans consigne de l’utilisateur, uniquement l’image', () => {
  const req = buildRequest({ kind: 'photo', image: { mimeType: 'image/jpeg', data: JPEG.toString('base64') } }, ['A'])
  assert.equal(req.parts.length, 1)
  assert.ok(req.parts[0].inlineData)
})

test('configuration par défaut : UE, Flash-Lite d’abord, petits plafonds, base d’ingrédients de l’app', () => {
  const config = loadConfig({})
  assert.deepEqual(config.locations, ['eu', 'europe-west1'])
  for (const location of config.locations) assert.match(location, /^(eu|europe-)/, 'jamais hors de l’UE (ni « global »)')
  assert.match(config.models[0], /flash-lite/)
  // Retiré par Google le 20/10/2026 (réponses 404) : ne plus le proposer
  assert.equal(config.models.includes('gemini-2.5-flash-lite'), false)
  assert.ok(config.globalPerDay <= 500)
  assert.ok(config.installPerDay <= 30)
  const names = loadIngredientNames(config.ingredientsPath)
  assert.ok(names.length > 1000)
  assert.equal(loadConfig({ GLOBAL_DAILY_CAP: '50', VERTEX_MODELS: 'x, y' }).globalPerDay, 50)
  assert.deepEqual(loadConfig({ VERTEX_MODELS: 'x, y' }).models, ['x', 'y'])
})

test('crédits : analyse décomptée, état renvoyé, refus 429 « credits » une fois épuisés', async () => {
  const { createCredits } = await import('../src/credits.js')
  const credits = createCredits({ welcome: 1, freeMonthly: 1, premiumDaily: 5 })
  await withServer({ vertex: okVertex(), credits, quota: createQuota({ globalPerDay: 100, installPerDay: 10, globalPerMinute: 100 }) }, async (url) => {
    const first = await (await post(url, { kind: 'text', description: 'une pomme' })).json()
    assert.equal(first.credits.plan, 'free')
    assert.equal(first.credits.remaining, 1)
    assert.match(first.credits.state, /^\d{4}-\d{2}:1:0$/)
    assert.equal((await post(url, { kind: 'text', description: 'une pomme' })).status, 200)
    const denied = await post(url, { kind: 'text', description: 'une pomme' })
    assert.equal(denied.status, 429)
    const body = await denied.json()
    assert.equal(body.scope, 'credits')
    assert.equal(body.credits.remaining, 0)
    const peek = await (await fetch(`${url}/v1/credits`, { headers: { 'X-Install-Id': INSTALL } })).json()
    assert.equal(peek.credits.remaining, 0)
  })
})

test('crédits : premium relu chez Google Play (jeton en en-tête), mis en cache', async () => {
  const { createCredits } = await import('../src/credits.js')
  let verifies = 0
  const billing = {
    verify: async (body) => {
      verifies += 1
      return { status: 200, payload: { premium: body.purchaseToken === 'tok_abcdefghijklmnopqrstuvwxyz', expiresAt: '2099-01-01T00:00:00Z' } }
    },
  }
  const credits = createCredits({ welcome: 10, freeMonthly: 15, premiumDaily: 10 })
  await withServer({ vertex: okVertex(), credits, billing }, async (url) => {
    const headers = { 'X-Install-Id': INSTALL, 'X-Purchase-Token': 'tok_abcdefghijklmnopqrstuvwxyz' }
    const a = await (await fetch(`${url}/v1/credits`, { headers })).json()
    assert.deepEqual([a.credits.plan, a.credits.remaining], ['premium', 10])
    const b = await (await post(url, { kind: 'text', description: 'une pomme' }, headers)).json()
    assert.deepEqual([b.credits.plan, b.credits.remaining], ['premium', 9])
    assert.equal(verifies, 1)
  })
})

test('crédits : un état rapporté par l\'app plus restrictif est gardé ; Vertex en échec rend le crédit', async () => {
  const { createCredits, monthKey } = await import('../src/credits.js')
  const credits = createCredits({ welcome: 10, freeMonthly: 15, premiumDaily: 10 })
  const failing = { generateJson: async () => { throw new VertexError('down', 503) } }
  await withServer({ vertex: failing, credits }, async (url) => {
    const headers = { 'X-Install-Id': INSTALL, 'X-Credits': `${monthKey(Date.now())}:15:3` }
    assert.equal((await post(url, { kind: 'text', description: 'une pomme' }, headers)).status, 502)
    const peek = await (await fetch(`${url}/v1/credits`, { headers })).json()
    assert.equal(peek.credits.remaining, 7)
  })
})
