/**
 * Réintroduction FODMAP guidée (jalon 7, I174 étape 7a) : machine pure, sans React ni stockage.
 *
 * Un test = une entrée `fodmap_challenge` du magasin des entrées (aucune migration : un type de plus, exporté et
 * importé comme les autres). On y garde seulement ce que la personne a fait (aliment, portions prévues, portions
 * mangées horodatées, réponses « c'est supportable ? ») ; l'état et le verdict se CALCULENT à partir des notes du
 * ventre existantes (`gut`), jamais recopiées.
 *
 * Déroulé (fiche patient NHS Gloucestershire, conseils de l'université Monash, lus le 26/10) : on ne commence
 * qu'après 3 jours de ventre calme d'affilée ; J1 portion de départ, J2 le double, J3 le triple ; chaque portion est
 * suivie 24 h. Gêne ou douleur dans ces 24 h → « C'est supportable ? » : oui = on continue (léger = réussi), non =
 * on s'arrête. Puis une pause jusqu'à 3 jours calmes avant le test suivant. Un seul test à la fois. Un jour sauté
 * décale le test ; deux jours sautés le mettent en pause et il repart de J1 (pour garder un résultat lisible).
 * Les portions sont des repères généraux, à adapter avec une diététicienne (règle 6 : pas de norme imposée).
 * Le ventre n'entre jamais dans l'estimateur du bien-être (règle anti-circularité).
 */
import { localDateKey } from './analysisEngine'
import { GUT_TYPE, GUT_LEVELS } from './today'
import { decimalMark } from '../i18n/locale.js'

export const FODMAP_CHALLENGE_TYPE = 'fodmap_challenge'
export const FODMAP_CHALLENGE_SOURCE = 'app_fodmap'
export const CHALLENGE_DAYS = 3
export const CHALLENGE_WINDOW_MS = 24 * 3600 * 1000
export const CALM_DAYS_REQUIRED = 3
/** Jours sans portion (après le jour attendu) au-delà desquels le test est mis en pause. */
export const MAX_SKIPPED_DAYS = 1

/**
 * Groupes et repères de départ (J2 = 2 ×, J3 = 3 ×). `perFood` : le verdict vaut pour l'aliment seulement (les
 * fructanes du blé ne disent rien de ceux de l'oignon) ; sinon il vaut pour le groupe. `words` / `not` : noms
 * d'aliments des repas qui renvoient à ce test depuis une piste ventre (7c), au singulier, sans accent requis.
 */
export const FODMAP_GROUPS = [
  {
    id: 'fructans', label: 'Fructanes', hint: 'blé, oignon, ail', perFood: true,
    foods: [
      { id: 'wheat', label: 'Blé', example: 'pain de blé', amount: 1, unit: 'tranche', units: 'tranches',
        reference: { ingredient: 'Pain (aliment moyen)', grams: 30 },
        words: ['blé', 'pain', 'baguette', 'pâte', 'semoule', 'couscous', 'biscotte', 'croissant', 'brioche'], not: ['sans gluten'] },
      { id: 'onion', label: 'Oignon', example: 'oignon cuit', amount: 1, unit: 'cuillère à soupe', units: 'cuillères à soupe',
        reference: { ingredient: 'Oignon blanc ou jaune, sauté/poêlé sans matière grasse', grams: 15 },
        words: ['oignon', 'échalote'] },
      { id: 'garlic', label: 'Ail', example: 'ail', amount: 0.5, unit: 'gousse', units: 'gousses',
        reference: { ingredient: 'Ail, cru', grams: 2.5 }, words: ['ail'] },
    ],
  },
  {
    id: 'gos', label: 'GOS', hint: 'pois chiches, lentilles',
    foods: [{ id: 'chickpeas', label: 'Pois chiches', example: 'pois chiches cuits', amount: 40, unit: 'g', units: 'g',
      reference: { ingredient: 'Pois chiche, appertisé, égoutté', grams: 40 },
      words: ['pois chiche', 'lentille', 'houmous', 'haricot rouge'] }],
  },
  {
    id: 'fructose', label: 'Fructose', hint: 'miel, mangue',
    foods: [{ id: 'honey', label: 'Miel', example: 'miel', amount: 1, unit: 'cuillère à café', units: 'cuillères à café',
      reference: { ingredient: 'Miel', grams: 7 }, words: ['miel', 'mangue'] }],
  },
  {
    id: 'lactose', label: 'Lactose', hint: 'lait, yaourt',
    foods: [{ id: 'milk', label: 'Lait', example: 'lait', amount: 125, unit: 'ml', units: 'ml',
      reference: { ingredient: 'Lait demi-écrémé, UHT', grams: 125 },
      words: ['lait', 'yaourt', 'yogourt', 'fromage blanc'], not: ['coco', 'amande', 'avoine', 'soja', 'riz', 'sans lactose'] }],
  },
  {
    // Avocat et mûres retirés le 29/10 : Ciqual 2025 y mesure moins de 0,5 g de polyols pour 100 g (le test n'aurait
    // rien apporté). `retired` : plus proposé ni relié aux pistes, mais un ancien test reste lisible.
    id: 'sorbitol', label: 'Sorbitol', hint: 'pruneaux, prunes',
    foods: [
      { id: 'prunes', label: 'Pruneaux', example: 'pruneaux secs', amount: 1, unit: 'pruneau', units: 'pruneaux',
        reference: { ingredient: 'Pruneau, sans noyau, sec', grams: 8 }, words: ['pruneau', 'prune'] },
      { id: 'avocado', label: 'Avocat', example: 'avocat', amount: 0.25, unit: 'avocat', units: 'avocat', retired: true,
        reference: { ingredient: 'Avocat', grams: 40 }, words: [] },
    ],
  },
  {
    // Chou-fleur retiré du conseil le 29/10 (Ciqual 2025 : moins de 0,5 g de polyols pour 100 g) ; champignons de
    // Paris cuits (Ciqual 3 g de polyols pour 100 g poêlés ; le cru, 0,28 g, n'atteindrait pas le repère).
    id: 'mannitol', label: 'Mannitol', hint: 'champignons, pois mange-tout',
    foods: [{ id: 'mushrooms', label: 'Champignons', example: 'champignons de Paris poêlés', amount: 40, unit: 'g', units: 'g',
      reference: { ingredient: 'Champignon de Paris ou champignon de couche, sauté/poêlé, sans matière grasse', grams: 40 },
      words: ['champignon', 'pois mange tout', 'pois gourmand'] }],
  },
]

/** Groupes avec les seuls aliments encore proposés (sans les aliments retirés, gardés pour lire les anciens tests). */
export function pickableGroups() {
  return FODMAP_GROUPS.map((g) => ({ ...g, foods: g.foods.filter((f) => !f.retired) }))
}

/** Verdicts, du plus prudent au plus favorable. */
export const VERDICTS = {
  retest: { id: 'retest', tag: 'à retester' },
  small: { id: 'small', tag: 'petite portion' },
  medium: { id: 'medium', tag: 'portion moyenne' },
  tolerated: { id: 'tolerated', tag: 'bien toléré' },
}

const DAY_MS = 24 * 3600 * 1000
const toMs = (v) => (v instanceof Date ? v.getTime() : new Date(v).getTime())
const isBad = (level) => level === 'discomfort' || level === 'pain'

export function findGroup(groupId) {
  return FODMAP_GROUPS.find((g) => g.id === groupId) ?? null
}

export function findFood(groupId, foodId) {
  return findGroup(groupId)?.foods.find((f) => f.id === foodId) ?? null
}

const plainWords = (text) => String(text ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .split(/[^a-z]+/).filter(Boolean)

/** `phrase` (un ou plusieurs mots) apparaît dans `words`, au singulier ou au pluriel (« pâtes », « lentilles »). */
function hasPhrase(words, phrase) {
  const target = plainWords(phrase)
  const same = (w, t) => w === t || w === `${t}s` || w === `${t}x`
  return words.some((_, i) => target.every((t, k) => words[i + k] !== undefined && same(words[i + k], t)))
}

/**
 * Le test qui correspond à un aliment des repas cité par une piste ventre (7c) : `{ group, food }`, ou null quand
 * aucun groupe ne lui correspond. Piste d'un sous-groupe FODMAP (N5, `fodmap:lactose`…) : le test du même groupe ;
 * pour les fructanes, testés aliment par aliment, `food` vaut null (la personne choisit blé, oignon ou ail).
 */
export function challengeFoodFor(factor) {
  const group = typeof factor === 'string' && factor.startsWith('fodmap:') ? findGroup(factor.slice(7)) : null
  if (group) {
    const foods = group.foods.filter((f) => !f.retired)
    return { group: group.id, food: foods.length === 1 ? foods[0].id : null }
  }
  const words = plainWords(factor)
  if (words.length === 0) return null
  for (const g of pickableGroups()) {
    for (const f of g.foods) {
      if ((f.not ?? []).some((p) => hasPhrase(words, p))) continue
      if (f.words.some((p) => hasPhrase(words, p))) return { group: g.id, food: f.id }
    }
  }
  return null
}

/**
 * Lien vers la réintroduction depuis une piste : le test du premier aliment qui en a un (une piste peut regrouper des
 * aliments toujours mangés ensemble), sinon le choix du groupe.
 */
export function challengePath(factors) {
  const match = [].concat(factors).map(challengeFoodFor).find(Boolean)
  if (!match) return '/reintroduction'
  return `/reintroduction?groupe=${match.group}${match.food ? `&aliment=${match.food}` : ''}`
}

/** Portions prévues des 3 jours à partir du repère de départ (modifiables ensuite par la personne). */
export function defaultPlan(groupId, foodId) {
  const food = findFood(groupId, foodId)
  if (!food) return null
  return { unit: food.unit, units: food.units, amounts: [1, 2, 3].map((k) => Math.round(food.amount * k * 100) / 100) }
}

function gutNotes(gutEntries) {
  return (gutEntries || []).filter((e) => e?.type === GUT_TYPE && GUT_LEVELS.some((l) => l.id === e.payload?.level))
}

/** Calendrier jour → { bad, any } à partir des notes du ventre (bilans du soir et notes horodatées). */
function dayMap(gutEntries) {
  const days = new Map()
  for (const e of gutNotes(gutEntries)) {
    const key = localDateKey(e.at)
    const d = days.get(key) ?? { bad: false, any: false }
    d.any = true
    if (isBad(e.payload.level)) d.bad = true
    days.set(key, d)
  }
  return days
}

function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n, 12)
  return localDateKey(dt.toISOString())
}

function dayDiff(fromKey, toKey) {
  const [a, b] = [fromKey, toKey].map((k) => {
    const [y, m, d] = k.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  })
  return Math.round((b - a) / DAY_MS)
}

/**
 * Nombre de jours calmes d'affilée qui finissent aujourd'hui (ou hier si rien n'est encore noté aujourd'hui). Un jour
 * compte s'il a au moins une note du ventre et aucune gêne ni douleur : sans note, on ne sait pas, donc on ne compte
 * pas. Avec `sinceKey`, seuls les jours à partir de celui-ci comptent.
 */
export function calmStreak(gutEntries, now = new Date(), { sinceKey = null } = {}) {
  const days = dayMap(gutEntries)
  let key = localDateKey(new Date(toMs(now)).toISOString())
  if (!days.get(key)?.any) key = addDays(key, -1)
  let n = 0
  while (days.get(key)?.any && !days.get(key).bad && (!sinceKey || key >= sinceKey)) {
    n += 1
    key = addDays(key, -1)
  }
  return n
}

/** Crée un test (payload de l'entrée `fodmap_challenge`). */
export function startChallenge({ group, food, plan }, now = new Date()) {
  const g = findGroup(group)
  const f = findFood(group, food)
  if (!g || !f || f.retired) throw new Error('Groupe ou aliment inconnu')
  const p = plan ?? defaultPlan(group, food)
  if (!Array.isArray(p?.amounts) || p.amounts.length !== CHALLENGE_DAYS || !p.amounts.every((a) => Number.isFinite(a) && a > 0)) {
    throw new Error('Trois portions positives attendues')
  }
  return {
    group, food, plan: { unit: p.unit, units: p.units, amounts: [...p.amounts] },
    startedAt: new Date(toMs(now)).toISOString(), doses: [], answers: [], restarts: 0,
  }
}

/**
 * État du test à l'instant `now`, calculé à partir des notes du ventre.
 * @returns {{ state: 'day1'|'day2'|'day3'|'question'|'paused'|'washout'|'done', day: number|null,
 *   doseTakenToday: boolean, canTakeDose: boolean, question: {day:number}|null, stoppedAt: number|null,
 *   verdict: object|null, calmDays: number }}
 */
export function challengeStatus(challenge, gutEntries, now = new Date()) {
  const t = toMs(now)
  const notes = gutNotes(gutEntries)
  const doses = [...(challenge.doses || [])].sort((a, b) => toMs(a.at) - toMs(b.at))
  const answers = challenge.answers || []
  let stoppedAt = null
  let question = null
  let passed = 0
  for (let i = 0; i < doses.length; i++) {
    const day = i + 1
    const from = toMs(doses[i].at)
    const to = Math.min(from + CHALLENGE_WINDOW_MS, i + 1 < doses.length ? toMs(doses[i + 1].at) : Infinity)
    // Notes horodatées et bilans du soir comptent s'ils sont posés dans les 24 h qui suivent la portion (une gêne
    // après la portion suivante revient à celle-ci).
    const bad = notes.some((e) => isBad(e.payload.level) && toMs(e.at) > from && toMs(e.at) <= to)
    const windowOver = t >= from + CHALLENGE_WINDOW_MS || i + 1 < doses.length
    if (bad) {
      const answer = answers.find((a) => a.day === day)
      if (!answer) {
        question = { day }
        break
      }
      if (!answer.tolerable) {
        stoppedAt = day
        break
      }
    }
    if (!windowOver) break
    passed = day
  }

  const endedAt = challenge.endedAt ?? null
  const finished = stoppedAt != null || passed >= CHALLENGE_DAYS
  if (finished) {
    const verdict = verdictFor(stoppedAt)
    const lastDose = doses[(stoppedAt ?? CHALLENGE_DAYS) - 1]
    const end = new Date(toMs(lastDose.at) + CHALLENGE_WINDOW_MS).toISOString()
    const calmDays = calmStreak(gutEntries, now, { sinceKey: localDateKey(end) })
    const state = calmDays >= CALM_DAYS_REQUIRED ? 'done' : 'washout'
    return { state, day: null, doseTakenToday: false, canTakeDose: false, question: null, stoppedAt, verdict, calmDays, endedAt: endedAt ?? end }
  }

  const todayKey = localDateKey(new Date(t).toISOString())
  const last = doses[doses.length - 1]
  const doseTakenToday = !!last && localDateKey(last.at) === todayKey
  if (question) {
    return { state: 'question', day: question.day, doseTakenToday, canTakeDose: false, question, stoppedAt: null, verdict: null, calmDays: 0, endedAt: null }
  }
  // Jour attendu pour la prochaine portion : le jour du départ, puis le lendemain de la portion précédente.
  const expectedKey = last ? addDays(localDateKey(last.at), 1) : localDateKey(challenge.startedAt)
  const skipped = dayDiff(expectedKey, todayKey)
  const nextDay = doses.length + 1
  if (!doseTakenToday && skipped > MAX_SKIPPED_DAYS) {
    return { state: 'paused', day: nextDay, doseTakenToday, canTakeDose: false, question: null, stoppedAt: null, verdict: null, calmDays: 0, endedAt: null }
  }
  // Une seule portion par jour calendaire : aucune portion rattrapée en double.
  const canTakeDose = !doseTakenToday && doses.length < CHALLENGE_DAYS
  const state = `day${doseTakenToday ? doses.length : nextDay}`
  return { state, day: doseTakenToday ? doses.length : nextDay, doseTakenToday, canTakeDose, question: null, stoppedAt: null, verdict: null, calmDays: 0, endedAt: null }
}

function verdictFor(stoppedAt) {
  if (stoppedAt === 1) return VERDICTS.retest
  if (stoppedAt === 2) return VERDICTS.small
  if (stoppedAt === 3) return VERDICTS.medium
  return VERDICTS.tolerated
}

/** « J'ai mangé ma portion » : ajoute la portion du jour si c'est permis, sinon renvoie le test inchangé. */
export function recordDose(challenge, gutEntries, now = new Date()) {
  const s = challengeStatus(challenge, gutEntries, now)
  if (!s.canTakeDose) return challenge
  const day = (challenge.doses || []).length + 1
  const amount = challenge.plan.amounts[day - 1]
  const dose = { day, amount, unit: challenge.plan.unit, at: new Date(toMs(now)).toISOString() }
  return { ...challenge, doses: [...(challenge.doses || []), dose] }
}

/** Réponse à « C'est supportable ? » pour le jour posé. */
export function answerTolerable(challenge, gutEntries, tolerable, now = new Date()) {
  const s = challengeStatus(challenge, gutEntries, now)
  if (s.state !== 'question') return challenge
  return { ...challenge, answers: [...(challenge.answers || []), { day: s.question.day, tolerable: !!tolerable, at: new Date(toMs(now)).toISOString() }] }
}

/** Après une pause (2 jours sautés), le test repart de J1 ; les portions déjà prises restent dans l'historique. */
export function restartChallenge(challenge, gutEntries, now = new Date()) {
  if (challengeStatus(challenge, gutEntries, now).state !== 'paused') return challenge
  return {
    ...challenge,
    history: [...(challenge.history || []), { doses: challenge.doses || [], answers: challenge.answers || [] }],
    doses: [], answers: [], restarts: (challenge.restarts || 0) + 1, startedAt: new Date(toMs(now)).toISOString(),
  }
}

const challengesOf = (entries) => (entries || []).filter((e) => e?.type === FODMAP_CHALLENGE_TYPE && e.payload?.group)

/**
 * Peut-on commencer un nouveau test ? Un seul à la fois (ni pendant un test, ni pendant sa pause), et seulement
 * après 3 jours de ventre calme d'affilée.
 * @returns {{ ok: boolean, reason: null|'busy'|'not_calm', calmDays: number }}
 */
export function canStartChallenge(challengeEntries, gutEntries, now = new Date()) {
  const busy = challengesOf(challengeEntries).some((e) => !e.payload.abandonedAt && challengeStatus(e.payload, gutEntries, now).state !== 'done')
  const calmDays = calmStreak(gutEntries, now)
  if (busy) return { ok: false, reason: 'busy', calmDays }
  if (calmDays < CALM_DAYS_REQUIRED) return { ok: false, reason: 'not_calm', calmDays }
  return { ok: true, reason: null, calmDays }
}

/**
 * Résultats par groupe, pour les étiquettes du choix du groupe. Le dernier verdict d'un aliment l'emporte ; pour les
 * fructanes (verdict par aliment), le groupe garde la liste par aliment et n'est jamais généralisé.
 * @returns {Record<string, { verdict: object|null, byFood: Record<string, object> }>}
 */
export function groupResults(challengeEntries, gutEntries, now = new Date()) {
  const out = Object.fromEntries(FODMAP_GROUPS.map((g) => [g.id, { verdict: null, byFood: {} }]))
  const sorted = challengesOf(challengeEntries).sort((a, b) => toMs(a.payload.startedAt) - toMs(b.payload.startedAt))
  for (const e of sorted) {
    const g = findGroup(e.payload.group)
    if (!g || e.payload.abandonedAt) continue
    const s = challengeStatus(e.payload, gutEntries, now)
    if (!s.verdict) continue
    out[g.id].byFood[e.payload.food] = s.verdict
    if (!g.perFood) out[g.id].verdict = s.verdict
  }
  return out
}

/** Les combinaisons ne se proposent qu'après au moins 2 groupes bien tolérés. */
export function combinationsAvailable(results) {
  return Object.values(results).filter((r) => r.verdict?.id === VERDICTS.tolerated.id).length >= 2
}

/** Portion lisible (« 2,5 tranches », « 250 ml »). */
export function formatAmount(amount, plan) {
  const n = String(amount).replace('.', decimalMark())
  return `${n} ${amount > 1 ? plan.units : plan.unit}`
}

/** Phrase de résultat (« Blé : une portion moyenne passe (2 tranches). Au-delà, gêne. »). */
export function verdictSentence(challenge, verdict) {
  const food = findFood(challenge.group, challenge.food)
  const name = food?.label ?? challenge.food
  const [a1, a2, a3] = challenge.plan.amounts
  switch (verdict?.id) {
    case 'tolerated':
      return `${name} : bien toléré jusqu’à ${formatAmount(a3, challenge.plan)}.`
    case 'medium':
      return `${name} : une portion moyenne passe (${formatAmount(a2, challenge.plan)}). Au-delà, gêne.`
    case 'small':
      return `${name} : une petite portion passe (${formatAmount(a1, challenge.plan)}). Au-delà, gêne.`
    case 'retest':
      return `${name} : gêne dès la première portion. À retester plus tard, en plus petit.`
    default:
      return null
  }
}

/**
 * Test vivant (le plus récent non abandonné et pas encore terminé, pause comprise), avec son état, ou null.
 * @returns {{ entry: object, status: object }|null}
 */
export function currentChallenge(challengeEntries, gutEntries, now = new Date()) {
  return (challengeEntries || [])
    .filter((e) => e?.payload?.group && !e.payload.abandonedAt)
    .sort((a, b) => toMs(b.payload.startedAt) - toMs(a.payload.startedAt))
    .map((entry) => ({ entry, status: challengeStatus(entry.payload, gutEntries, now) }))
    .find((c) => c.status.state !== 'done') ?? null
}
