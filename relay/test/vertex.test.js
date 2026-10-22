import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createVertexClient, endpointUrl, extractResponseText, metadataTokenProvider, parseModelJson } from '../src/vertex.js'

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const answer = (text) => json(200, { candidates: [{ content: { parts: [{ text: 'réflexion', thought: true }, { text }] } }] })

function fakeFetch(responses) {
  const calls = []
  return {
    calls,
    fetchImpl: async (url, init) => {
      calls.push({ url, body: init?.body ? JSON.parse(init.body) : null, headers: init?.headers })
      const next = responses.shift()
      return typeof next === 'function' ? next(url) : next
    },
  }
}

const base = { project: 'p', locations: ['europe-west1'], models: ['m-lite'], getToken: async () => 'tok' }

test('adresse Vertex AI régionale (UE), jamais l’API Gemini à clé', () => {
  assert.equal(
    endpointUrl({ project: 'p', location: 'europe-west1', model: 'm' }),
    'https://europe-west1-aiplatform.googleapis.com/v1/projects/p/locations/europe-west1/publishers/google/models/m:generateContent',
  )
})

test('envoie consignes, contenu et schéma avec le jeton du compte de service, et décode le JSON', async () => {
  const f = fakeFetch([answer('{"not_food":false,"ingredients":[]}')])
  const client = createVertexClient({ ...base, fetchImpl: f.fetchImpl })
  const out = await client.generateJson({ systemInstruction: 'SYS', parts: [{ text: 'repas' }], schema: { type: 'OBJECT' } })
  assert.deepEqual(out, { parsed: { not_food: false, ingredients: [] }, model: 'm-lite', location: 'europe-west1' })
  const [call] = f.calls
  assert.equal(call.headers.Authorization, 'Bearer tok')
  assert.equal(call.url.includes('key='), false)
  assert.deepEqual(call.body.systemInstruction, { parts: [{ text: 'SYS' }] })
  assert.deepEqual(call.body.contents, [{ role: 'user', parts: [{ text: 'repas' }] }])
  assert.deepEqual(call.body.generationConfig.responseSchema, { type: 'OBJECT' })
})

test('modèle ou région indisponible → candidat suivant, puis retenu pour les appels suivants', async () => {
  const f = fakeFetch([
    json(404, { error: { message: 'model not found' } }),
    json(404, { error: { message: 'not in region' } }),
    answer('{"not_food":true}'),
    answer('{"not_food":true}'),
  ])
  const client = createVertexClient({ ...base, locations: ['europe-west1', 'europe-west4'], models: ['new', 'old'], fetchImpl: f.fetchImpl })
  const out = await client.generateJson({ systemInstruction: 'S', parts: [] })
  assert.equal(out.model, 'old')
  assert.equal(out.location, 'europe-west1')
  await client.generateJson({ systemInstruction: 'S', parts: [] })
  assert.match(f.calls[3].url, /europe-west1.*models\/old:/)
  assert.equal(f.calls.length, 4)
})

test('schéma refusé → même requête sans schéma ; autre 400 → erreur sans essayer d’autre modèle', async () => {
  const f = fakeFetch([json(400, { error: { message: 'responseSchema unsupported' } }), answer('{"not_food":true}')])
  const client = createVertexClient({ ...base, fetchImpl: f.fetchImpl })
  await client.generateJson({ systemInstruction: 'S', parts: [], schema: {} })
  assert.equal(f.calls[1].body.generationConfig.responseSchema, undefined)

  const g = fakeFetch([json(400, { error: { message: 'bad image' } })])
  const other = createVertexClient({ ...base, models: ['a', 'b'], fetchImpl: g.fetchImpl })
  await assert.rejects(other.generateJson({ systemInstruction: 'S', parts: [], schema: {} }), { status: 400, billed: false })
  assert.equal(g.calls.length, 1)
})

test('réponse illisible : erreur marquée « facturée » (non rendue au quota)', async () => {
  const f = fakeFetch([answer('pas du json')])
  const client = createVertexClient({ ...base, fetchImpl: f.fetchImpl })
  await assert.rejects(client.generateJson({ systemInstruction: 'S', parts: [] }), { status: 502, billed: true })
})

test('jeton des métadonnées mis en cache jusqu’à une minute avant expiration', async () => {
  let t = 0
  const f = fakeFetch([json(200, { access_token: 'a', expires_in: 3600 }), json(200, { access_token: 'b', expires_in: 3600 })])
  const getToken = metadataTokenProvider({ fetchImpl: f.fetchImpl, now: () => t })
  assert.equal(await getToken(), 'a')
  assert.equal(f.calls[0].headers['Metadata-Flavor'], 'Google')
  t = 3539_000
  assert.equal(await getToken(), 'a')
  t = 3541_000
  assert.equal(await getToken(), 'b')
})

test('texte de réponse sans les « pensées », JSON tolérant aux blocs de code', () => {
  assert.equal(extractResponseText({ candidates: [{ content: { parts: [{ text: 'x', thought: true }, { text: '{}' }] } }] }), '{}')
  assert.deepEqual(parseModelJson('```json\n{"a":1}\n```'), { a: 1 })
})
