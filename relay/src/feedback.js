/**
 * « Votre avis » (AVIS-RELAIS-1, retours du propriétaire du 04/11) : un avis écrit par l'utilisateur, envoyé seulement
 * sur son geste, lu ensuite par un workflow qui en publie un résumé anonyme.
 *
 * Ce qui est gardé : le texte (2 000 caractères au plus, e-mails et numéros de téléphone masqués dès la réception),
 * la version, la variante et la plateforme de l'app, le jour d'envoi. Jamais l'identifiant d'installation, ni une
 * empreinte de celui-ci : le quota (5 avis par jour et par installation) ne vit qu'en mémoire. Chaque avis s'efface
 * de lui-même au bout de 90 jours (champ `expireAt`, règle TTL de Firestore à activer par le propriétaire).
 */
import { HttpError } from './http.js'

export const FEEDBACK_MAX_LENGTH = 2000
export const FEEDBACK_TTL_DAYS = 90
export const FEEDBACK_VARIANTS = ['play', 'sideload', 'ios']

const VERSION = /^[0-9A-Za-z.+_-]{1,32}$/
// Adresse e-mail, puis suite de 8 chiffres ou plus (séparés ou non par des espaces, points, tirets) : téléphone,
// numéro de sécurité sociale, de carte…
const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[A-Za-z]{2,}/g
const LONG_NUMBER = /\+?\d(?:[\s.\-/]?\d){7,}/g

/** Masque ce qui permettrait de reconnaître la personne (e-mail, numéros) avant tout stockage. */
export function redactPersonal(text) {
  return String(text).replace(EMAIL, '[e-mail masqué]').replace(LONG_NUMBER, '[numéro masqué]')
}

/** Valide le corps `{ text, version, variant }` et rend l'avis à garder. */
export function parseFeedback(body, { now = Date.now(), platform = 'android' } = {}) {
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!text) throw new HttpError(400, 'empty', 'Écrivez quelques mots avant d\'envoyer.')
  if (text.length > FEEDBACK_MAX_LENGTH) {
    throw new HttpError(400, 'too_long', `Avis limité à ${FEEDBACK_MAX_LENGTH} caractères.`)
  }
  const version = typeof body?.version === 'string' && VERSION.test(body.version) ? body.version : 'inconnue'
  const variant = FEEDBACK_VARIANTS.includes(body?.variant) ? body.variant : 'inconnue'
  const created = new Date(now)
  return {
    text: redactPersonal(text),
    version,
    variant,
    platform: platform === 'ios' ? 'ios' : 'android',
    day: created.toISOString().slice(0, 10),
    createdAt: created.toISOString(),
    expireAt: new Date(now + FEEDBACK_TTL_DAYS * 86_400_000).toISOString(),
  }
}

/** Stockage en mémoire (tests, développement). */
export function createMemoryFeedbackStore() {
  const items = []
  return {
    items,
    async add(entry) {
      items.push(entry)
    },
  }
}

const FIRESTORE = 'https://firestore.googleapis.com/v1'

/** Stockage dans Firestore, collection `feedback` (identifiant de document tiré par Firestore). */
export function createFirestoreFeedbackStore({ project, getToken, fetchImpl = fetch, collection = 'feedback' }) {
  const url = `${FIRESTORE}/projects/${project}/databases/(default)/documents/${collection}`
  return {
    async add({ text, version, variant, platform, day, createdAt, expireAt }) {
      const fields = {
        text: { stringValue: text },
        version: { stringValue: version },
        variant: { stringValue: variant },
        platform: { stringValue: platform },
        day: { stringValue: day },
        createdAt: { timestampValue: createdAt },
        expireAt: { timestampValue: expireAt },
      }
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      })
      if (!res.ok) throw Object.assign(new Error(`Firestore : écriture refusée (${res.status})`), { status: res.status })
    },
  }
}
