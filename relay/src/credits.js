/**
 * Crédits d'analyse IA (jalon 6c-3b) — « collecter est gratuit, comprendre est payant » :
 * - version gratuite : 10 analyses offertes à la première utilisation (elles ne périment pas) + 15 par mois civil
 *   (UTC), non cumulables ; les crédits du mois passent avant les crédits offerts ;
 * - premium : usage sans compter, avec un plafond raisonnable de 10 analyses par jour (minuit UTC).
 *
 * Les plafonds de quota.js (par installation, global, par minute) restent en place par-dessus : ce sont eux qui
 * protègent la facture. Les crédits, eux, sont la règle du produit.
 *
 * Rien n'est stocké sur disque : le registre vit en mémoire et repart à zéro quand Cloud Run arrête l'instance. Pour
 * que le compteur d'une personne ne « remonte » pas après un redémarrage, l'app renvoie le dernier état que le relais
 * lui a donné (en-tête `X-Credits`, « AAAA-MM:utilisés du mois:offerts utilisés ») et le relais garde le plus
 * restrictif des deux. Un client malhonnête ne gagne au pire que les plafonds quotidiens de quota.js ; la fermeture
 * de cette porte passe par Play Integrity (6b-2) et un registre durable (BACKLOG).
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

export function createCredits({ welcome = 10, freeMonthly = 15, premiumDaily = 10, now = Date.now } = {}) {
  /** empreinte de l'installation → { month, used, welcomeUsed, day, dayUsed } */
  const ledger = new Map()

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
    if (reported) {
      e.welcomeUsed = Math.max(e.welcomeUsed, reported.welcomeUsed)
      if (reported.month === month) e.used = Math.max(e.used, reported.used)
    }
    return e
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
