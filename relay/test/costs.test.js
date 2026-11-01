import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_PRICES, costOf, createCostLedger, createFirestoreCostStore, parsePrices, priceFactorAt, priceOf, pricesAt, readUsage } from '../src/costs.js'

const MS_OCT = Date.UTC(2026, 9, 31, 12)
const MS_NOV = Date.UTC(2026, 10, 1, 0, 5)

test('jetons d’une réponse : entrée, cache, réflexion, sortie (0 si absents)', () => {
  assert.deepEqual(
    readUsage({ promptTokenCount: 41000, cachedContentTokenCount: 32000, thoughtsTokenCount: 1500, candidatesTokenCount: 250 }),
    { input: 41000, cached: 32000, thinking: 1500, output: 250 },
  )
  assert.deepEqual(readUsage(undefined), { input: 0, cached: 0, thinking: 0, output: 0 })
})

test('coût d’une analyse Gold dans la fourchette annoncée (1,4 à 4,3 centimes)', () => {
  // Sans cache, réflexion longue : borne haute
  const worst = costOf('gemini-3.8-flash', { input: 42000, cached: 0, thinking: 2500, output: 300 })
  assert.ok(worst > 0.04 && worst < 0.045, `pire cas ${worst}`)
  // Liste d'ingrédients lue dans le cache implicite, réflexion moyenne : borne basse
  const best = costOf('gemini-3.8-flash', { input: 42000, cached: 38000, thinking: 1700, output: 300 })
  assert.ok(best > 0.012 && best < 0.016, `meilleur cas ${best}`)
})

test('modèle inconnu : compté au prix le plus élevé de la grille', () => {
  assert.deepEqual(priceOf('gemini-9-ultra'), DEFAULT_PRICES['gemini-3.8-flash'])
})

test('MODEL_PRICES remplace la grille ; valeur illisible : grille par défaut', () => {
  assert.equal(parsePrices('{"gemini-3.8-flash":{"input":1.5,"cached":0.15,"output":9}}')['gemini-3.8-flash'].input, 1.5)
  assert.equal(parsePrices('{"x":{"input":-1}}'), DEFAULT_PRICES)
  assert.equal(parsePrices('pas du json'), DEFAULT_PRICES)
})

test('cumul du mois : Gold coupé à 15 €, tout coupé à 19 €, remise à zéro le mois suivant', async () => {
  let t = MS_OCT
  const ledger = createCostLedger({ prices: { m: { input: 1e6, cached: 0, output: 0 } }, now: () => t })
  await ledger.add('m', { input: 14, cached: 0, thinking: 0, output: 0 })
  assert.equal(ledger.goldAllowed(), true)
  await ledger.add('m', { input: 1, cached: 0, thinking: 0, output: 0 })
  assert.equal(ledger.goldAllowed(), false)
  assert.equal(ledger.stopped(), false)
  await ledger.add('m', { input: 4, cached: 0, thinking: 0, output: 0 })
  assert.equal(ledger.stopped(), true)
  t = MS_NOV
  assert.equal(ledger.total(), 0)
  assert.equal(ledger.goldAllowed(), true)
})

test('cumul durable : relu une fois par mois, incrémenté en micro-euros dans Firestore (sans contenu)', async () => {
  const calls = []
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : null })
    if (!init.method) return new Response(JSON.stringify({ fields: { micro: { integerValue: '15500000' } } }), { status: 200 })
    return new Response('{}', { status: 200 })
  }
  const store = createFirestoreCostStore({ project: 'p', getToken: async () => 'tok', fetchImpl })
  const ledger = createCostLedger({ store, prices: { m: { input: 1, cached: 0, output: 0 } }, now: () => MS_OCT })
  await ledger.hydrate()
  await ledger.hydrate()
  assert.equal(calls.filter((c) => c.method === 'GET').length, 1)
  assert.match(calls[0].url, /relay-costs\/2026-10$/)
  assert.equal(ledger.goldAllowed(), false)
  await ledger.add('m', { input: 2, cached: 0, thinking: 0, output: 0 })
  const write = calls.at(-1)
  assert.match(write.url, /documents:commit$/)
  assert.deepEqual(write.body.writes[0].transform.fieldTransforms, [{ fieldPath: 'micro', increment: { integerValue: '2' } }])
})

test('prix doublés au 1er janvier 2027 (UTC) : facteur 1 en 2026, 2 ensuite', () => {
  assert.equal(priceFactorAt(Date.UTC(2026, 11, 31, 23, 59, 59)), 1)
  assert.equal(priceFactorAt(Date.UTC(2027, 0, 1, 0, 0, 0)), 2)
  assert.equal(priceFactorAt(Date.UTC(2028, 5, 1)), 2)
  // Calendrier sur mesure : le dernier palier atteint l'emporte, quel que soit l'ordre
  const schedule = [{ from: '2028-01-01', factor: 3 }, { from: '2027-01-01', factor: 2 }]
  assert.equal(priceFactorAt(Date.UTC(2028, 0, 2), schedule), 3)
  assert.equal(priceFactorAt(Date.UTC(2027, 6, 1), schedule), 2)
  assert.equal(priceFactorAt(Date.UTC(2027, 6, 1), []), 1)
})

test('une analyse Gold coûte le double en 2027 (2,8 à 8,6 centimes)', () => {
  const worstUsage = { input: 42000, cached: 0, thinking: 2500, output: 300 }
  const bestUsage = { input: 42000, cached: 38000, thinking: 1700, output: 300 }
  const prices2027 = pricesAt(Date.UTC(2027, 0, 1))
  const worst = costOf('gemini-3.8-flash', worstUsage, prices2027)
  const best = costOf('gemini-3.8-flash', bestUsage, prices2027)
  assert.ok(Math.abs(worst - 2 * costOf('gemini-3.8-flash', worstUsage)) < 1e-12)
  assert.ok(worst > 0.08 && worst < 0.09, `pire cas ${worst}`)
  assert.ok(best > 0.024 && best < 0.032, `meilleur cas ${best}`)
  // La grille de 2026 n'est pas modifiée en place
  assert.equal(DEFAULT_PRICES['gemini-3.8-flash'].input, 0.75)
  assert.deepEqual(pricesAt(Date.UTC(2026, 10, 2)), DEFAULT_PRICES)
})

test('cumul du mois : la grille suit la date de l’appel (décembre 2026 puis janvier 2027)', async () => {
  let t = Date.UTC(2026, 11, 31, 22)
  const ledger = createCostLedger({ prices: { m: { input: 1e6, cached: 0, output: 0 } }, now: () => t })
  assert.equal(await ledger.add('m', { input: 8, cached: 0, thinking: 0, output: 0 }), 8)
  assert.equal(ledger.goldAllowed(), true)
  t = Date.UTC(2027, 0, 1, 1)
  assert.equal(ledger.total(), 0)
  assert.equal(await ledger.add('m', { input: 8, cached: 0, thinking: 0, output: 0 }), 16)
  // Les seuils (15 € Gold, 19 € tout) restent en euros : atteints deux fois plus vite
  assert.equal(ledger.goldAllowed(), false)
  assert.equal(ledger.stopped(), false)
})
