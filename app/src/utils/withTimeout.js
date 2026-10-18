/**
 * Borne une attente : `promise` si elle se résout avant `ms`, sinon rejet `TimeoutError` (« délai dépassé »).
 * Sert aux appels natifs (Bluetooth, apps du téléphone) qui peuvent ne jamais répondre : un écran ne doit
 * jamais rester bloqué sur « en cours… » (régression du test de la montre, 18/10/2026).
 */
export class TimeoutError extends Error {
  constructor(what, ms) {
    super(`${what ? `${what} : ` : ''}délai dépassé (${Math.max(1, Math.round(ms / 1000))} s)`)
    this.name = 'TimeoutError'
    this.timeout = true
  }
}

export function withTimeout(promise, ms, what = '') {
  if (!(ms > 0) || !Number.isFinite(ms)) return Promise.resolve(promise)
  let timer
  const limit = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(what, ms)), ms)
  })
  return Promise.race([Promise.resolve(promise), limit]).finally(() => clearTimeout(timer))
}

export const isTimeout = (e) => e?.timeout === true
