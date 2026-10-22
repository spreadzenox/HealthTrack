/**
 * Plafonds d'appels du relais, pour que la facture Vertex AI ne puisse jamais s'emballer (budget 20 €/mois) :
 * - par installation et par jour (identifiant aléatoire tiré par l'app, sans donnée personnelle) ;
 * - global par jour, toutes installations confondues ;
 * - global par minute (rafales).
 *
 * Compteurs en mémoire : le service tourne sur une seule instance au plus (--max-instances=1). Ils repartent à zéro
 * quand Cloud Run arrête l'instance au repos ; le plafond par minute borne donc le pire cas, et les jetons
 * Play Integrity (jalon 6b) fermeront la porte aux appels qui ne viennent pas de l'app.
 */
const MINUTE_MS = 60_000

/** Jour civil UTC (AAAA-MM-JJ) : tous les compteurs quotidiens repartent à minuit UTC. */
export function dayKey(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Minuit UTC suivant, en ISO : renvoyé à l'app pour afficher « renouvellement le … ». */
export function nextReset(ms) {
  const d = new Date(ms)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toISOString()
}

export function createQuota({ globalPerDay, installPerDay, globalPerMinute, now = Date.now }) {
  let day = null
  let globalCount = 0
  let perInstall = new Map()
  let recent = []

  function roll(t) {
    const key = dayKey(t)
    if (key !== day) {
      day = key
      globalCount = 0
      perInstall = new Map()
    }
    recent = recent.filter((at) => t - at < MINUTE_MS)
  }

  return {
    /**
     * Réserve un appel pour `installId` si aucun plafond n'est atteint.
     * @returns {{ ok: true, remaining: number, resetAt: string } | { ok: false, scope: 'install'|'global'|'minute', resetAt: string }}
     */
    take(installId) {
      const t = now()
      roll(t)
      const resetAt = nextReset(t)
      const used = perInstall.get(installId) ?? 0
      if (used >= installPerDay) return { ok: false, scope: 'install', resetAt }
      if (globalCount >= globalPerDay) return { ok: false, scope: 'global', resetAt }
      if (recent.length >= globalPerMinute) {
        return { ok: false, scope: 'minute', resetAt: new Date(recent[0] + MINUTE_MS).toISOString() }
      }
      perInstall.set(installId, used + 1)
      globalCount += 1
      recent.push(t)
      return { ok: true, remaining: installPerDay - used - 1, resetAt }
    },

    /** Rend un appel réservé qui n'a rien coûté (Vertex injoignable avant toute génération). */
    refund(installId) {
      const used = perInstall.get(installId) ?? 0
      if (used > 0) perInstall.set(installId, used - 1)
      if (globalCount > 0) globalCount -= 1
      recent.pop()
    },

    stats() {
      roll(now())
      return { day, global: globalCount, installs: perInstall.size }
    },
  }
}
