/**
 * Essais d'Agir (ORG-8, revue design du 07/11, maquette validée) : vérifier une piste d'Analyses par soi-même.
 * Fonction pure, sans React ni stockage.
 * - 10 jours tirés au sort, 5 « avec » et 5 « sans » (tirage équilibré : le hasard, pas l'envie du jour, décide).
 *   REFONTE-6c-2 (brief § 4 et § 5, « défi doux ») : 5 jours avec au lieu de 7, le tirage d'ORG-8 gardé ; un essai
 *   déjà commencé garde son calendrier de 14 jours ;
 * - la tenue de la consigne vient des données (montre, téléphone) ; la question n'est posée que si elles manquent ;
 * - « Résultat en cours » : le résultat du lendemain des jours avec / sans, leurs moyennes et l'écart, avec une
 *   fourchette dès 3 lendemains de chaque sorte ;
 * - à la fin, un bilan en mots (grille de `specs/comprendre.SPEC.md` § 7, sur la fourchette au lieu de minutes) :
 *   « Plutôt oui » si la fourchette exclut zéro dans le sens attendu, « Plutôt non » dans l'autre sens, « Pas de
 *   différence nette » sinon, « Trop peu de jours pour conclure » sous 3 lendemains d'une sorte ; sous 10 jours avec,
 *   toujours « À confirmer sur plus de jours » ;
 * - une habitude gardée : les 14 dernières pastilles de tenue ; « Vous vous éloignez de cette habitude » quand 9 jours
 *   sur 14 ne sont pas tenus, au plus une fois par mois et par habitude, effacé dès qu'elle reprend.
 * Des liens vérifiés chez vous, jamais une cause générale ni un traitement.
 */
import { formatDuration } from '../utils/format'
import { appLocale } from '../i18n/locale.js'

export const TRIAL_TYPE = 'trial'
export const TRIAL_SOURCE = 'app_trial'
export const TRIAL_DAYS = 10
/** Jours « avec » suivis d'un résultat en dessous desquels un bilan reste « à confirmer ». */
export const CONFIRM_BELOW = 10
/** Lendemains de chaque sorte avant de dessiner l'écart et sa fourchette. */
export const RESULT_MIN_EACH = 3
/** Habitude : jours non tenus sur les 14 derniers avant de le dire. */
export const DRIFT_DAYS = 9
export const DRIFT_WINDOW = 14
const NUDGE_EVERY_DAYS = 30
const DAY_MS = 86_400_000

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const n0 = (v) => Math.round(v).toLocaleString(appLocale())

/** Facteurs mesurés par l'app (le reste se demande) : champ du résumé du jour et façon de l'écrire. */
const MEASURED = {
  sleepMinutes: { field: 'sleepMinutes', fmt: (v) => formatDuration(v), missing: 'Nous n’avons pas reçu vos données de sommeil pour hier soir.', more: 'Dormir au moins', less: 'Dormir moins de' },
  steps: { field: 'steps', fmt: (v) => `${n0(v)} pas`, missing: 'Nous n’avons pas reçu vos pas d’hier.', more: 'Faire au moins', less: 'Faire moins de' },
  screen_minutes: { field: 'screenMinutes', fmt: (v) => formatDuration(v), missing: 'Nous n’avons pas reçu votre temps d’écran d’hier.', more: 'Au moins', less: 'Moins de', suffix: ' d’écran' },
}

export function keyOfDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const addDays = (key, n) => {
  const d = new Date(`${key}T12:00:00`)
  d.setDate(d.getDate() + n)
  return keyOfDate(d)
}

/**
 * Nouvel essai à partir d'une piste (facteur du contrat d'Analyses). `rng` : tirage (Math.random par défaut).
 * Sens « avec » : celui qui va avec un meilleur résultat d'après la piste (effet > 0 → plus du facteur).
 */
export function createTrial(factor, { now = new Date(), rng = Math.random } = {}) {
  const start = keyOfDate(now)
  const flags = [...Array(TRIAL_DAYS / 2).fill(true), ...Array(TRIAL_DAYS / 2).fill(false)]
  for (let i = flags.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[flags[i], flags[j]] = [flags[j], flags[i]]
  }
  const direction = factor.effect >= 0 ? 'more' : 'less'
  const m = MEASURED[factor.key]
  const change = Math.abs(factor.usualChange?.amount ?? 0)
  const threshold = m && isNum(factor.center) ? (direction === 'more' ? factor.center + change : factor.center - change) : null
  return {
    factor: { key: factor.key, label: factor.label, theme: factor.theme, outcome: factor.outcome, effect: factor.effect, center: factor.center ?? null, change },
    direction,
    threshold: isNum(threshold) ? Math.max(0, Math.round(threshold)) : null,
    schedule: flags.map((w, i) => ({ date: addDays(start, i), with: w })),
    answers: {},
    startedAt: now.toISOString(),
    endedAt: null,
    kept: false,
    removedAt: null,
    nudgedAt: null,
  }
}

/** La consigne d'un jour « avec » (« Dormir au moins 7 h 40 ») ; « sans » : comme d'habitude. */
export function instruction(trial, withDay = true) {
  if (!withDay) return 'Comme d’habitude'
  const m = MEASURED[trial.factor.key]
  if (m && isNum(trial.threshold)) return `${trial.direction === 'more' ? m.more : m.less} ${m.fmt(trial.threshold)}${m.suffix ?? ''}`
  const what = trial.factor.label.toLowerCase()
  // « d’alcool », « d’activité » ; « de sucres »
  const of = /^[aeéèêiîoôuh]/.test(what) ? `d’${what}` : `de ${what}`
  return trial.direction === 'more' ? `Un peu plus ${of} que d’habitude` : `Un peu moins ${of} que d’habitude`
}

const pts = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString(appLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
const OUTCOME_WORDS = { wellbeing: 'de bien-être', digestion: 'de confort digestif' }

/**
 * Carte « Proposés par vos analyses » (maquette Agir validée, POLISH-AGIR-PROPOSE) : la consigne des jours « avec »
 * de l'essai qui démarrera (« Dormir au moins 7 h 30 ») et l'effet chiffré de la piste.
 */
export function proposal(factor, outcome = factor.outcome) {
  const draft = createTrial({ ...factor, outcome }, { rng: () => 0 })
  const what = factor.usualChange?.text
  const effect = isNum(factor.effect) && what ? ` : ${pts(factor.effect)} point ${OUTCOME_WORDS[outcome] ?? 'de bien-être'} pour ${what}` : ''
  return {
    title: instruction(draft, true),
    detail: `Lien repéré${effect}. ${TRIAL_DAYS / 2} jours avec, ${TRIAL_DAYS / 2} jours sans, tirés au sort.`,
  }
}

/** Tenu d'après les données (true / false), ou null si la mesure manque. */
function heldFromData(trial, day, summaries) {
  const m = MEASURED[trial.factor.key]
  if (!m || !isNum(trial.threshold)) return null
  const v = summaries.get(day.date)?.[m.field]
  if (!isNum(v)) return null
  const above = trial.direction === 'more' ? v >= trial.threshold : v < trial.threshold
  return day.with ? above : !above
}

function meanSd(xs) {
  const n = xs.length
  const m = xs.reduce((s, x) => s + x, 0) / n
  const v = n > 1 ? xs.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1) : 0
  return { n, m, v }
}

/**
 * État d'un essai.
 * @param {object} trial      payload
 * @param {{ summaries: Map<string, object>, outcome: Map<string, number>, now?: Date }} data
 *   `outcome` : le résultat suivi (bien-être 0 à 5 ou confort digestif 1 à 5) par jour.
 */
export function trialStatus(trial, { summaries = new Map(), outcome = new Map(), now = new Date() } = {}) {
  const today = keyOfDate(now)
  const yesterday = addDays(today, -1)
  const calendar = trial.schedule.map((d) => {
    const fromData = d.date < today ? heldFromData(trial, d, summaries) : null
    const answer = trial.answers?.[d.date]
    return { ...d, future: d.date > today, today: d.date === today, held: fromData ?? (typeof answer === 'boolean' ? answer : null), fromData: fromData !== null }
  })
  const todayDay = calendar.find((d) => d.today) ?? null
  const yday = calendar.find((d) => d.date === yesterday)
  const ask = yday && yday.held === null
    ? { date: yesterday, missing: MEASURED[trial.factor.key]?.missing ?? null, question: `Hier, ${instruction(trial, yday.with).charAt(0).toLowerCase()}${instruction(trial, yday.with).slice(1)} : c’était tenu ?` }
    : null
  // Lendemain des jours tenus (ou dont la tenue est inconnue) : le résultat suivi
  const pick = (w) => calendar.filter((d) => d.with === w && d.held !== false && d.date < today).map((d) => outcome.get(addDays(d.date, 1))).filter(isNum)
  const withV = pick(true)
  const withoutV = pick(false)
  let result = { with: withV, without: withoutV, meanWith: null, meanWithout: null, diff: null, low: null, high: null }
  if (withV.length) result.meanWith = meanSd(withV).m
  if (withoutV.length) result.meanWithout = meanSd(withoutV).m
  if (withV.length >= RESULT_MIN_EACH && withoutV.length >= RESULT_MIN_EACH) {
    const a = meanSd(withV)
    const b = meanSd(withoutV)
    const diff = a.m - b.m
    const se = Math.sqrt(a.v / a.n + b.v / b.n)
    result = { ...result, diff, low: diff - 2 * se, high: diff + 2 * se }
  }
  const last = trial.schedule[trial.schedule.length - 1].date
  const done = Boolean(trial.endedAt) || today > addDays(last, 1)
  // Les jours « avec » vont avec un meilleur résultat d'après la piste : le sens attendu de l'écart est positif
  let bilan = null
  if (done) bilan = result.diff == null ? 'too_few' : result.low > 0 ? 'yes' : result.high < 0 ? 'no' : 'none'
  const confirm = done && bilan !== 'too_few' && withV.length < CONFIRM_BELOW
  const total = trial.schedule.length
  const dayIndex = Math.min(total, Math.max(1, calendar.findIndex((d) => d.today) + 1 || total))
  const withDays = calendar.filter((d) => d.with)
  return {
    calendar, todayDay, ask, result, done, bilan, confirm, dayIndex, total,
    goal: withDays.length,
    kept: withDays.filter((d) => d.held === true).length,
    missed: withDays.filter((d) => d.held === false).length,
  }
}

/**
 * LANT-1 : une lanterne par jour « avec », dans l'ordre du calendrier (5 pour un défi de 10 jours, 7 pour un ancien
 * essai de 14). Allumée quand le jour est tenu, éteinte quand il ne l'a pas été (rien ne repart à zéro), en attente
 * tant que le jour n'est pas passé ou que la tenue est inconnue. Les jours « sans » n'ont pas de lanterne.
 */
export function lanterns(status) {
  return status.calendar
    .filter((d) => d.with)
    .map((d) => ({ date: d.date, state: d.held === true ? 'lit' : d.held === false ? 'out' : 'pending' }))
}

/**
 * UPG-1 : l'essai en cours, pour la carte Agir de l'Accueil (Agir n'a plus d'onglet depuis la refonte). `rows` : les
 * entrées « trial » ; seule la date compte (la tenue n'y figure pas). Le plus avancé s'il y en a plusieurs ; null sinon.
 */
export function homeTrial(rows, now = new Date()) {
  const live = (rows ?? [])
    .filter((e) => e?.type === TRIAL_TYPE && Array.isArray(e.payload?.schedule) && e.payload.schedule.length && !e.payload.removedAt && !e.payload.kept)
    .map((e) => ({ e, s: trialStatus(e.payload, { now }) }))
    .filter(({ s }) => !s.done && s.todayDay)
    .sort((a, b) => b.s.dayIndex - a.s.dayIndex)
  if (!live.length) return null
  const { e, s } = live[0]
  const withToday = Boolean(s.todayDay.with)
  const head = live.length > 1 ? `${live.length} essais en cours` : 'Essai'
  return {
    to: live.length > 1 ? '/agir' : `/agir/essai/${e.id}`,
    title: instruction(e.payload, true),
    detail: `${head} · jour ${s.dayIndex} sur ${s.total} · aujourd’hui, ${withToday ? 'jour avec' : 'jour sans'}`,
    withToday,
  }
}

const BILAN_TITLES = { yes: 'Plutôt oui', no: 'Plutôt non', none: 'Pas de différence nette', too_few: 'Trop peu de jours pour conclure' }

/** Le bilan d'un essai fini, en mots : un titre, et la réserve qui va avec (ou null). */
export function bilanWords(status) {
  if (!status?.bilan) return null
  const n = status.result.with.length
  const note = status.bilan === 'too_few'
    ? 'Vous pouvez réessayer quand vous voulez.'
    : status.confirm ? `À confirmer sur plus de jours : ${n} jours avec, c’est encore peu.` : null
  return { title: BILAN_TITLES[status.bilan], note }
}

/** Habitude gardée : les 14 derniers jours (tenu / pas tenu / inconnu) et s'il faut dire qu'on s'en éloigne. */
export function habitStatus(trial, { summaries = new Map(), now = new Date() } = {}) {
  const today = keyOfDate(now)
  const days = []
  for (let i = DRIFT_WINDOW; i >= 1; i -= 1) {
    const date = addDays(today, -i)
    days.push({ date, held: heldFromData(trial, { date, with: true }, summaries) ?? (typeof trial.answers?.[date] === 'boolean' ? trial.answers[date] : null) })
  }
  const missed = days.filter((d) => d.held === false).length
  const recentNudge = trial.nudgedAt && now.getTime() - Date.parse(trial.nudgedAt) < NUDGE_EVERY_DAYS * DAY_MS
  const lastHeld = days[days.length - 1]?.held === true
  return { days, drifting: missed >= DRIFT_DAYS && !lastHeld && !recentNudge }
}
