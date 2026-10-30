/**
 * Rappel de la portion du jour pendant une réintroduction guidée (jalon 7, I174 étape 7b-2) : une notification par jour
 * de test à l'heure choisie (« Votre portion du jour · Lait, jour 2 : 250 ml »), qui ouvre la réintroduction. Programmée
 * sur le téléphone (PortionReminder.java, alarmes reprogrammées après un redémarrage) : le natif reçoit la liste des
 * rappels restants (au plus 3), jamais de note du ventre. Rien ne quitte le téléphone.
 *
 * Jamais sans le choix de la personne (interrupteur gardé ici), jamais pour une portion déjà notée, ni pendant une
 * pause, une question « C'est supportable ? » ou après la dernière portion. Recalculé à chaque ouverture et après
 * chaque saisie : le natif n'a qu'à afficher.
 */
import { registerPlugin } from '@capacitor/core'
import { listEntries } from '../storage/localHealthStorage'
import { GUT_TYPE } from './today'
import { CHALLENGE_DAYS, FODMAP_CHALLENGE_TYPE, calmDaysLeftText, currentChallenge, findFood, formatAmount } from './fodmapChallenge'

export const PORTION_DEFAULT_MINUTE = 12 * 60
const KEY = 'halcya_portion_reminder'
const GUT_WINDOW_DAYS = 120

const NativePortionReminder = registerPlugin('PortionReminder')
const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

/** Plugin natif dans l'app (deux variantes), faux plugin des captures / tests, sinon aucun. */
export function portionReminderPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakePortionReminder) return window.__healthtrackFakePortionReminder
  return isNative() ? NativePortionReminder : null
}

export const portionReminderAvailable = () => Boolean(portionReminderPlugin())

const validMinute = (m) => Number.isInteger(m) && m >= 0 && m < 24 * 60

/** Choix de la personne : { enabled, minute } (midi par défaut). */
export function portionReminderPrefs(storage = globalThis.localStorage) {
  try {
    const p = JSON.parse(storage?.getItem(KEY) || '{}') || {}
    return { enabled: p.enabled === true, minute: validMinute(p.minute) ? p.minute : PORTION_DEFAULT_MINUTE }
  } catch {
    return { enabled: false, minute: PORTION_DEFAULT_MINUTE }
  }
}

function savePrefs(prefs, storage) {
  try {
    storage?.setItem(KEY, JSON.stringify(prefs))
  } catch {
    /* le natif garde les rappels déjà programmés */
  }
}

/** « 12:00 » ↔ minute du jour. */
export const minuteToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export function timeToMinute(text) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(text || ''))
  if (!m) return null
  const v = Number(m[1]) * 60 + Number(m[2])
  return Number(m[1]) < 24 && Number(m[2]) < 60 ? v : null
}

function atMinute(now, dayOffset, minute) {
  const d = new Date(now.getTime())
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(Math.floor(minute / 60), minute % 60, 0, 0)
  return d.getTime()
}

/**
 * Rappels à programmer pour le test vivant (`currentChallenge`) : [{ at, title, body }] dans l'ordre, un par portion
 * restante, ou [] s'il n'y a rien à rappeler. Une portion pas encore prise aujourd'hui est rappelée aujourd'hui si
 * l'heure n'est pas passée, sinon demain (aucune portion rattrapée en double).
 */
export function portionReminderPlan(current, minute = PORTION_DEFAULT_MINUTE, now = new Date()) {
  if (!current || !/^day\d$/.test(current.status.state)) return []
  const challenge = current.entry.payload
  const taken = (challenge.doses || []).length
  if (taken >= CHALLENGE_DAYS) return []
  const food = findFood(challenge.group, challenge.food)
  const todayAt = atMinute(now, 0, minute)
  const first = current.status.canTakeDose && todayAt > now.getTime() ? 0 : 1
  const plan = []
  for (let i = 0; taken + i < CHALLENGE_DAYS; i++) {
    const day = taken + 1 + i
    plan.push({
      at: atMinute(now, first + i, minute),
      title: 'Votre portion du jour',
      body: `${food?.label ?? 'Réintroduction'} · jour ${day} : ${formatAmount(challenge.plan.amounts[day - 1], challenge.plan)}. Touchez pour la noter.`,
    })
  }
  return plan
}

/** Libellé court de l'état du test pour la carte d'entrée d'Analyses (« Lait · jour 2 · portion à prendre »), ou null. */
export function challengeSummary(current) {
  if (!current) return null
  const c = current.entry.payload
  const s = current.status
  const label = findFood(c.group, c.food)?.label ?? 'Test'
  if (s.state === 'question') return `${label} · une question vous attend`
  if (s.state === 'paused') return `${label} · test en pause`
  if (s.state === 'washout') return `${label} · résultat prêt · pause : ${calmDaysLeftText(s.calmDays)}`
  if (s.canTakeDose) return `${label} · jour ${s.day} · portion à prendre`
  return `${label} · jour ${s.day} · portion notée`
}

async function readCurrent(list, now) {
  const since = new Date(now.getTime() - GUT_WINDOW_DAYS * 86_400_000).toISOString()
  const [challenges, gut] = await Promise.all([
    list({ type: FODMAP_CHALLENGE_TYPE, limit: Infinity }),
    list({ type: GUT_TYPE, since, limit: Infinity }),
  ])
  return currentChallenge(challenges, gut, now)
}

/** Transmet au natif les rappels restants (liste vide = tout annuler). Rend l'état natif, ou null. Ne lève jamais. */
export async function syncPortionReminder({ plugin = portionReminderPlugin(), list = listEntries, now = new Date(), storage = globalThis.localStorage } = {}) {
  if (!plugin?.schedule) return null
  try {
    const prefs = portionReminderPrefs(storage)
    const items = prefs.enabled ? portionReminderPlan(await readCurrent(list, now), prefs.minute, now) : []
    return await plugin.schedule({ items })
  } catch {
    return null
  }
}

/**
 * Allume, éteint ou déplace le rappel. Allumer demande d'abord l'autorisation des notifications (Android 13+).
 * Rend { enabled, notifications, blocked } (`blocked` : refusées sans que Android puisse encore les demander).
 */
export async function setPortionReminder({ enabled, minute }, { plugin = portionReminderPlugin(), list = listEntries, now = new Date(), storage = globalThis.localStorage } = {}) {
  if (!plugin?.schedule) return { enabled: false, notifications: false, blocked: false }
  const prev = portionReminderPrefs(storage)
  savePrefs({ enabled: !!enabled, minute: validMinute(minute) ? minute : prev.minute }, storage)
  let ask = null
  if (enabled && !prev.enabled && plugin.requestNotifications) {
    try {
      ask = await plugin.requestNotifications()
    } catch {
      ask = null
    }
  }
  const status = await syncPortionReminder({ plugin, list, now, storage })
  const notifications = status?.notifications ?? ask?.notifications ?? false
  return { enabled: !!enabled, notifications: !!notifications, blocked: !!enabled && ask?.asked === false && !notifications }
}

/** La notification a-t-elle été touchée depuis la dernière vérification ? (le natif l'oublie en répondant). */
export async function takePortionOpen(plugin = portionReminderPlugin()) {
  if (!plugin?.takeOpen) return false
  try {
    return (await plugin.takeOpen())?.open === true
  } catch {
    return false
  }
}
