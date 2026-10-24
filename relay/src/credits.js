/**
 * Crédits d'analyse IA (jalon 6c-3b) — « collecter est gratuit, comprendre est payant » :
 * - version gratuite : 10 analyses offertes à la première utilisation (elles ne périment pas) + 15 par mois civil
 *   (UTC), non cumulables ; les crédits du mois passent avant les crédits offerts ;
 * - premium : usage sans compter, avec un plafond raisonnable de 10 analyses par jour (minuit UTC).
 *
 * Les plafonds de quota.js (par installation, global, par minute) restent en place par-dessus : ce sont eux qui
 * protègent la facture. Les crédits, eux, sont la règle du produit.
 *
 * Le registre vit en mémoire et, en production, est recopié dans Firestore (P24, `createFirestoreStore`) : sans cela
 * il repartait à zéro quand Cloud Run arrêtait l'instance, et le plafond premium du jour revenait à 10 (constaté le
 * 24/10 : une analyse à 13:38, « 10 restantes » à 14:11). Chaque installation est relue une fois par instance
 * (`hydrate`) et réécrite après chaque crédit pris ou rendu (`persist`). L'app renvoie aussi le dernier état connu
 * (en-tête `X-Credits`, « AAAA-MM:utilisés du mois:offerts utilisés ») et le relais garde le plus restrictif. Si
 * Firestore ne répond pas, on continue en mémoire : les plafonds de quota.js protègent la facture.
 */
import { createHash } from 'node:crypto'
import { dayKey, nextReset } from './quota.js'

/** Le registre ne garde qu'une empreinte de l'identifiant d'installation, jamais l'identifiant lui-même. */
const keyOf = (installId) => createHash('sha256').update(`credits:${installId}`).digest('hex')

/** Mois civil UTC (AAAA-MM). */
export const monthKey = (ms) => new Date(ms).toISOString().slice(0, 7)

/** Premier jour du mois suivant, minuit UTC, en ISO : « renouvellement le … ». */
export function nextMonth(ms) {
  const d = new Date(ms)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString()
}

const STATE = /^(\d{4})-(0[1-9]|1[0-2]):(\d{1,3}):(\d{1,3})$/

/** Lit l'état rapporté par l'app ; null s'il est illisible ou hors bornes. */
export function parseClientState(raw, { freeMonthly = 15, welcome = 10 } = {}) {
  const m = STATE.exec(String(raw ?? '').trim())
  if (!m) return null
  const used = Number(m[3])
  const welcomeUsed = Number(m[4])
  if (used > freeMonthly || welcomeUsed > welcome) return null
  return { month: `${m[1]}-${m[2]}`, used, welcomeUsed }
}

export const formatState = ({ month, used, welcomeUsed }) => `${month}:${used}:${welcomeUsed}`

export function createCredits({ welcome = 10, freeMonthly = 15, premiumDaily = 10, store = null, now = Date.now } = {}) {
  /** empreinte de l'installation → { month, used, welcomeUsed, day, dayUsed } */
  const ledger = new Map()
  /** empreintes déjà relues dans le registre durable par cette instance */
  const loaded = new Set()

  function entry(installId, reported, t) {
    const key = keyOf(installId)
    const month = monthKey(t)
    const day = dayKey(t)
    let e = ledger.get(key)
    if (!e) {
      e = { month, used: 0, welcomeUsed: 0, day, dayUsed: 0 }
      ledger.set(key, e)
    }
    if (e.month !== month) {
      e.month = month
      e.used = 0
    }
    if (e.day !== day) {
      e.day = day
      e.dayUsed = 0
    }
    if (reported) mergeInto(e, reported)
    return e
  }

  /** Garde le plus restrictif de deux états (mêmes mois et jour seulement pour les compteurs qui se renouvellent). */
  function mergeInto(e, other) {
    e.welcomeUsed = Math.max(e.welcomeUsed, Number(other.welcomeUsed) || 0)
    if (other.month === e.month) e.used = Math.max(e.used, Number(other.used) || 0)
    if (other.day && other.day === e.day) e.dayUsed = Math.max(e.dayUsed, Number(other.dayUsed) || 0)
  }

  function view(e, premium, t) {
    const state = formatState(e)
    if (premium) {
      return { plan: 'premium', remaining: Math.max(0, premiumDaily - e.dayUsed), daily: premiumDaily, resetAt: nextReset(t), state }
    }
    const monthly = Math.max(0, freeMonthly - e.used)
    const welcomeLeft = Math.max(0, welcome - e.welcomeUsed)
    return { plan: 'free', remaining: monthly + welcomeLeft, monthly, welcome: welcomeLeft, resetAt: nextMonth(t), state }
  }

  return {
    /**
     * Relit une fois par instance l'état durable de l'installation (sans effet sans registre durable). Une erreur
     * remonte à l'appelant, qui continue en mémoire ; la relecture sera retentée à la requête suivante.
     */
    async hydrate(installId) {
      const key = keyOf(installId)
      if (!store || loaded.has(key)) return
      const saved = await store.get(key)
      loaded.add(key)
      if (!saved) return
      mergeInto(entry(installId, null, now()), saved)
    },

    /** Recopie l'état de l'installation dans le registre durable (sans effet sans registre). */
    async persist(installId) {
      const key = keyOf(installId)
      const e = ledger.get(key)
      if (!store || !e) return
      const { month, used, welcomeUsed, day, dayUsed } = e
      await store.set(key, { month, used, welcomeUsed, day, dayUsed })
    },

    /** Crédits restants, sans rien consommer. */
    peek(installId, { premium = false, reported = null } = {}) {
      const t = now()
      return view(entry(installId, reported, t), premium, t)
    },

    /**
     * Consomme un crédit si possible.
     * @returns {({ ok: true } & ReturnType<typeof view>) | { ok: false, scope: 'credits'|'premium_day', resetAt: string, plan: string, state: string }}
     */
    take(installId, { premium = false, reported = null } = {}) {
      const t = now()
      const e = entry(installId, reported, t)
      if (premium) {
        if (e.dayUsed >= premiumDaily) return { ok: false, scope: 'premium_day', ...view(e, true, t) }
        e.dayUsed += 1
      } else if (e.used < freeMonthly) {
        e.used += 1
        e.lastWasWelcome = false
      } else if (e.welcomeUsed < welcome) {
        e.welcomeUsed += 1
        e.lastWasWelcome = true
      } else {
        return { ok: false, scope: 'credits', ...view(e, false, t) }
      }
      return { ok: true, ...view(e, premium, t) }
    },

    /** Rend le dernier crédit pris (analyse qui n'a rien coûté). */
    refund(installId, { premium = false } = {}) {
      const e = ledger.get(keyOf(installId))
      if (!e) return
      if (premium) e.dayUsed = Math.max(0, e.dayUsed - 1)
      else if (e.lastWasWelcome) e.welcomeUsed = Math.max(0, e.welcomeUsed - 1)
      else e.used = Math.max(0, e.used - 1)
    },
  }
}

const FIRESTORE = 'https://firestore.googleapis.com/v1'
export const DATASTORE_SCOPE = 'https://www.googleapis.com/auth/datastore'

/**
 * Registre durable des crédits dans Firestore (base « (default) », europe-west1, offre gratuite : 50 000 lectures et
 * 20 000 écritures par jour, bien au-delà des plafonds du relais). Un document par empreinte d'installation, collection
 * `credits` ; seuls des compteurs y sont écrits, aucune donnée personnelle ni identifiant en clair.
 */
export function createFirestoreStore({ project, getToken, fetchImpl = fetch, collection = 'credits' }) {
  const url = (key) => `${FIRESTORE}/projects/${project}/databases/(default)/documents/${collection}/${key}`
  const headers = async () => ({ Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' })
  return {
    async get(key) {
      const res = await fetchImpl(url(key), { headers: await headers() })
      if (res.status === 404) return null
      if (!res.ok) throw Object.assign(new Error(`Firestore : lecture refusée (${res.status})`), { status: res.status })
      const f = (await res.json())?.fields ?? {}
      return {
        month: f.month?.stringValue ?? '',
        used: Number(f.used?.integerValue ?? 0),
        welcomeUsed: Number(f.welcomeUsed?.integerValue ?? 0),
        day: f.day?.stringValue ?? '',
        dayUsed: Number(f.dayUsed?.integerValue ?? 0),
      }
    },
    async set(key, { month, used, welcomeUsed, day, dayUsed }) {
      const fields = {
        month: { stringValue: month },
        used: { integerValue: String(used) },
        welcomeUsed: { integerValue: String(welcomeUsed) },
        day: { stringValue: day },
        dayUsed: { integerValue: String(dayUsed) },
      }
      const res = await fetchImpl(url(key), { method: 'PATCH', headers: await headers(), body: JSON.stringify({ fields }) })
      if (!res.ok) throw Object.assign(new Error(`Firestore : écriture refusée (${res.status})`), { status: res.status })
    },
  }
}
