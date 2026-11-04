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
    async list({ since }) {
      return items.filter((e) => e.createdAt >= since).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
    /** Avis reçus depuis `since` (ISO), les plus récents d'abord, 500 au plus (requête sur un seul champ : sans index). */
    async list({ since, limit = DIGEST_MAX_ITEMS }) {
      const res = await fetchImpl(`${FIRESTORE}/projects/${project}/databases/(default)/documents:runQuery`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: collection }],
            where: { fieldFilter: { field: { fieldPath: 'createdAt' }, op: 'GREATER_THAN_OR_EQUAL', value: { timestampValue: since } } },
            orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
            limit,
          },
        }),
      })
      if (!res.ok) throw Object.assign(new Error(`Firestore : lecture refusée (${res.status})`), { status: res.status })
      const rows = await res.json()
      return (Array.isArray(rows) ? rows : [])
        .map((row) => row?.document?.fields)
        .filter(Boolean)
        .map((f) => ({
          text: f.text?.stringValue ?? '',
          version: f.version?.stringValue ?? 'inconnue',
          variant: f.variant?.stringValue ?? 'inconnue',
          platform: f.platform?.stringValue ?? 'android',
          day: f.day?.stringValue ?? '',
          createdAt: f.createdAt?.timestampValue ?? '',
        }))
    },
  }
}

export const DIGEST_MAX_ITEMS = 500
export const DIGEST_MAX_DAYS = 30

/**
 * Thèmes repérés par mots-clés (AVIS-RELAIS-3). Le résumé ne contient que des comptes : jamais le texte d'un avis,
 * pour qu'il puisse être publié dans le résumé d'un workflow d'un dépôt public. Un avis peut toucher plusieurs thèmes.
 */
export const FEEDBACK_THEMES = [
  ['plantage', 'Plantage ou blocage', /plant|crash|se ferme|s'est fermée?|ferme toute seule|bloqu|fig[ée]|écran blanc|ne s'ouvre|freeze/i],
  ['bug', 'Bug ou erreur', /\bbugs?\b|erreur|marche pas|fonctionne pas|probl[eè]me|ne s'affiche|n'apparai|ne remonte/i],
  ['lenteur', 'Lenteur', /\blente?s?\b|lenteur|\brame\b|met du temps|longtemps|chargement/i],
  ['clarte', 'Pas clair', /comprends? pas|pas compris|pas clair|confus|compliqu|perdu|à quoi sert/i],
  ['idee', 'Idée ou demande', /j'aimerais|ce serait|serait bien|pourriez|pourrait|ajout|idée|souhait|il manque|manque/i],
  ['prix', 'Prix ou abonnement', /prix|abonnement|payer|payant|\bgold\b|\bsilver\b|\bcher\b|essai|€/i],
  ['sources', 'Montre ou sources', /montre|huawei|health connect|garmin|samsung|withings|oura|fitbit|xiaomi|synchro|bluetooth/i],
  ['repas', 'Repas et photos', /repas|photo|\bplats?\b|aliment|calorie|nutrition|fodmap|ingrédient/i],
  ['bienetre', 'Bien-être et visage', /bien[- ]?être|visage|caméra|camera|humeur|émotion|déverrouill/i],
  ['ventre', 'Ventre', /ventre|selles?\b|bristol|ballonn|digestion|intestin/i],
  ['analyses', 'Analyses et pistes', /analyse|pistes?\b|corrélation|tendance|graphique|courbe/i],
  ['merci', 'Compliment', /merci|bravo|super|génial|\btop\b|j'adore|j'aime|bien fait|chouette|pratique/i],
]

const countBy = (items, key) => {
  const out = {}
  for (const item of items) out[item[key]] = (out[item[key]] ?? 0) + 1
  return out
}

/** Résumé anonyme : comptes par jour, variante, plateforme, version et thème ; aucun texte. */
export function digestFeedback(items, { since, until }) {
  const themes = Object.fromEntries(FEEDBACK_THEMES.map(([key]) => [key, 0]))
  let unclassified = 0
  for (const { text } of items) {
    const hits = FEEDBACK_THEMES.filter(([, , re]) => re.test(text))
    for (const [key] of hits) themes[key]++
    if (!hits.length) unclassified++
  }
  return {
    since,
    until,
    total: items.length,
    truncated: items.length >= DIGEST_MAX_ITEMS,
    byDay: countBy(items, 'day'),
    byVariant: countBy(items, 'variant'),
    byPlatform: countBy(items, 'platform'),
    byVersion: countBy(items, 'version'),
    themes,
    themeLabels: Object.fromEntries(FEEDBACK_THEMES.map(([key, label]) => [key, label])),
    unclassified,
    medianChars: items.length ? [...items.map((i) => i.text.length)].sort((a, b) => a - b)[Math.floor(items.length / 2)] : 0,
  }
}
