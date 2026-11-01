/**
 * Coût Vertex AI des analyses (bascule Gold du 31/10) : le relais lit les jetons de chaque réponse (entrée, cache,
 * réflexion, sortie ; jamais le contenu), en déduit un coût en euros d'après une grille de prix, et cumule le coût du
 * mois civil (UTC). Deux seuils protègent le budget de 20 €/mois du projet :
 * - au-delà de `goldMonthlyEur` (15 € par défaut), Gold repasse sur Flash-Lite jusqu'à la fin du mois ;
 * - au-delà de `stopMonthlyEur` (19 € par défaut), plus aucune analyse jusqu'à la fin du mois.
 *
 * Le cumul vit en mémoire et, en production, dans Firestore (un document par mois, collection `relay-costs`, compteur
 * en micro-euros incrémenté côté serveur). Une panne de Firestore ne bloque rien : le cumul en mémoire continue.
 */
import { monthKey } from './credits.js'

/**
 * Prix en euros par million de jetons (entrée, entrée lue dans le cache, sortie ; la réflexion est facturée comme de
 * la sortie). Valeurs prudentes de 2026, arrondies vers le haut ; MODEL_PRICES (JSON, même forme) les remplace. Les
 * prix doublent au 1er janvier 2027 : `PRICE_SCHEDULE` applique ce facteur à la grille (par défaut ou MODEL_PRICES)
 * selon la date de l'appel, sans redéploiement.
 */
export const DEFAULT_PRICES = {
  'gemini-3.8-flash': { input: 0.75, cached: 0.075, output: 4.5 },
  'gemini-3.5-flash-lite': { input: 0.25, cached: 0.025, output: 1.5 },
  'gemini-3.1-flash-lite': { input: 0.25, cached: 0.025, output: 1.5 },
}

/** Paliers de prix (date UTC de début, facteur appliqué à la grille de 2026). */
export const PRICE_SCHEDULE = [{ from: '2027-01-01', factor: 2 }]

/** Facteur de prix en vigueur à l'instant `ms` : celui du dernier palier commencé, 1 avant le premier. */
export function priceFactorAt(ms, schedule = PRICE_SCHEDULE) {
  let best = null
  for (const step of schedule) {
    const start = Date.parse(`${step.from}T00:00:00Z`)
    if (start <= ms && (!best || start > best.start)) best = { start, factor: step.factor }
  }
  return best ? best.factor : 1
}

/** Grille en vigueur à l'instant `ms` (nouvel objet ; la grille de base n'est jamais modifiée). */
export function pricesAt(ms, prices = DEFAULT_PRICES, schedule = PRICE_SCHEDULE) {
  const f = priceFactorAt(ms, schedule)
  if (f === 1) return prices
  return Object.fromEntries(Object.entries(prices).map(([model, p]) => [model, { input: p.input * f, cached: p.cached * f, output: p.output * f }]))
}

/** Modèle absent de la grille : on compte le prix le plus élevé connu, pour ne jamais sous-estimer la facture. */
export function priceOf(model, prices = DEFAULT_PRICES) {
  if (prices[model]) return prices[model]
  const all = Object.values(prices)
  return {
    input: Math.max(...all.map((p) => p.input)),
    cached: Math.max(...all.map((p) => p.cached)),
    output: Math.max(...all.map((p) => p.output)),
  }
}

/** Jetons d'une réponse Vertex (`usageMetadata`), en nombres entiers ; 0 pour un champ absent. */
export function readUsage(usageMetadata) {
  const n = (v) => Math.max(0, Math.round(Number(v) || 0))
  const u = usageMetadata ?? {}
  return {
    input: n(u.promptTokenCount),
    cached: n(u.cachedContentTokenCount),
    thinking: n(u.thoughtsTokenCount),
    output: n(u.candidatesTokenCount),
  }
}

/** Coût en euros d'un appel : les jetons lus dans le cache font partie de l'entrée mais sont facturés à part. */
export function costOf(model, usage, prices = DEFAULT_PRICES) {
  const p = priceOf(model, prices)
  const fresh = Math.max(0, usage.input - usage.cached)
  return (fresh * p.input + usage.cached * p.cached + (usage.thinking + usage.output) * p.output) / 1e6
}

/** Lit MODEL_PRICES (JSON) ; grille par défaut si la variable est absente ou illisible. */
export function parsePrices(raw) {
  if (!raw) return DEFAULT_PRICES
  try {
    const parsed = JSON.parse(raw)
    const ok = Object.values(parsed).every((p) => ['input', 'cached', 'output'].every((k) => Number.isFinite(p?.[k]) && p[k] >= 0))
    return ok && Object.keys(parsed).length ? { ...DEFAULT_PRICES, ...parsed } : DEFAULT_PRICES
  } catch {
    return DEFAULT_PRICES
  }
}

/**
 * Cumul du coût du mois.
 * @param {{ goldMonthlyEur?: number, stopMonthlyEur?: number, store?: { get(month: string): Promise<number>, add(month: string, micro: number): Promise<void> } | null,
 *   prices?: object, schedule?: Array<{ from: string, factor: number }>, now?: () => number }} options
 * Les seuils restent en euros : avec les prix doublés de 2027, ils sont atteints avec deux fois moins d'analyses.
 */
export function createCostLedger({ goldMonthlyEur = 15, stopMonthlyEur = 19, store = null, prices = DEFAULT_PRICES, schedule = PRICE_SCHEDULE, now = Date.now } = {}) {
  let month = monthKey(now())
  let micro = 0
  let hydrated = false

  function roll() {
    const m = monthKey(now())
    if (m !== month) {
      month = m
      micro = 0
      hydrated = false
    }
  }

  return {
    /** Relit le cumul durable une fois par mois et par instance ; garde le plus grand des deux. */
    async hydrate() {
      roll()
      if (hydrated || !store) return
      const remote = await store.get(month)
      micro = Math.max(micro, Math.round(Number(remote) || 0))
      hydrated = true
    },
    /** Ajoute le coût d'un appel ; renvoie le coût en euros. */
    async add(model, usage) {
      roll()
      const eur = costOf(model, usage, pricesAt(now(), prices, schedule))
      const delta = Math.round(eur * 1e6)
      micro += delta
      if (store && delta > 0) await store.add(month, delta)
      return eur
    },
    /** Coût cumulé du mois en cours, en euros. */
    total() {
      roll()
      return micro / 1e6
    },
    goldAllowed() {
      return this.total() < goldMonthlyEur
    },
    stopped() {
      return this.total() >= stopMonthlyEur
    },
  }
}

const FIRESTORE = 'https://firestore.googleapis.com/v1'

/** Cumul durable dans Firestore : document `relay-costs/AAAA-MM`, champ `micro` (micro-euros) incrémenté par Firestore. */
export function createFirestoreCostStore({ project, getToken, fetchImpl = fetch, collection = 'relay-costs' }) {
  const root = `projects/${project}/databases/(default)/documents`
  const headers = async () => ({ Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' })
  return {
    async get(month) {
      const res = await fetchImpl(`${FIRESTORE}/${root}/${collection}/${month}`, { headers: await headers() })
      if (res.status === 404) return 0
      if (!res.ok) throw Object.assign(new Error(`Firestore : lecture refusée (${res.status})`), { status: res.status })
      return Number((await res.json())?.fields?.micro?.integerValue ?? 0)
    },
    async add(month, micro) {
      const body = {
        writes: [{
          transform: {
            document: `${root}/${collection}/${month}`,
            fieldTransforms: [{ fieldPath: 'micro', increment: { integerValue: String(micro) } }],
          },
        }],
      }
      const res = await fetchImpl(`${FIRESTORE}/${root}:commit`, { method: 'POST', headers: await headers(), body: JSON.stringify(body) })
      if (!res.ok) throw Object.assign(new Error(`Firestore : écriture refusée (${res.status})`), { status: res.status })
    },
  }
}
