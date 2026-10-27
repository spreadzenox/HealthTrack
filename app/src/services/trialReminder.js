/**
 * Rappel de fin d'essai (variante play, VC-18b) : une notification locale 2 jours avant le premier paiement, promise
 * par le paywall (« jour 12 : on vous prévient »). Programmée sur le téléphone (TrialReminderPlugin.java, alarme
 * reprogrammée après un redémarrage) d'après les droits donnés par le relais : seulement pendant un essai Google Play
 * qui se renouvellera ; annulée dès que l'essai est annulé, payé ou terminé. Rien ne quitte le téléphone.
 */
import { registerPlugin } from '@capacitor/core'
import { ENTITLEMENT_EVENT, getEntitlement, manageSubscriptionUrl } from './entitlement'
import { FEATURES } from '../config/distribution'
import { appLocale } from '../i18n/locale.js'

export const REMINDER_DAYS_BEFORE = 2
const DAY_MS = 86_400_000
const KEY = 'halcya_trial_reminder'

const NativeTrialReminder = registerPlugin('TrialReminder')
const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

/** Plugin natif de la variante play, faux plugin des captures / tests, sinon aucun. */
export function trialReminderPlugin() {
  if (typeof window !== 'undefined' && window.__HT_TRIAL_REMINDER__) return window.__HT_TRIAL_REMINDER__
  return FEATURES.billing && isNative() ? NativeTrialReminder : null
}

/** Le paywall ne promet le rappel que là où le téléphone sait le programmer. */
export const trialReminderAvailable = () => Boolean(trialReminderPlugin())

const longDate = (ms) => new Date(ms).toLocaleDateString(appLocale(), { weekday: 'long', day: 'numeric', month: 'long' })

/** Rappel à programmer pour ces droits (`{ at, title, body, url }`), ou null s'il n'y a rien à rappeler. */
export function trialReminderPlan(ent, now = Date.now()) {
  if (!ent?.premium || ent.source !== 'play' || ent.state !== 'active' || !ent.trial || !ent.autoRenewing) return null
  const endsAt = Date.parse(ent.expiresAt ?? '')
  if (!Number.isFinite(endsAt)) return null
  const at = endsAt - REMINDER_DAYS_BEFORE * DAY_MS
  if (at <= now) return null
  return {
    at,
    title: `Votre essai gratuit se termine dans ${REMINDER_DAYS_BEFORE} jours`,
    body: `Premier paiement ${longDate(endsAt)}, sauf si vous annulez. Touchez pour gérer l’abonnement dans Google Play.`,
    url: manageSubscriptionUrl(ent.productId),
  }
}

function readScheduled(storage) {
  try {
    const at = Number(JSON.parse(storage?.getItem(KEY) || 'null')?.at)
    return Number.isFinite(at) ? at : null
  } catch {
    return null
  }
}

function writeScheduled(storage, at) {
  try {
    if (at == null) storage?.removeItem(KEY)
    else storage?.setItem(KEY, JSON.stringify({ at }))
  } catch {
    // stockage indisponible : le rappel sera reprogrammé (sans doublon côté natif) à la prochaine vérification
  }
}

/**
 * Programme, déplace ou annule le rappel selon les droits. Au premier rappel programmé, demande l'autorisation des
 * notifications (Android 13+) : c'est juste après le début de l'essai. Rend `'scheduled' | 'unchanged' | 'cancelled'
 * | 'none'`. Ne lève jamais.
 */
export async function syncTrialReminder(ent, { plugin = trialReminderPlugin(), now = Date.now(), storage = globalThis.localStorage } = {}) {
  if (!plugin) return 'none'
  const plan = trialReminderPlan(ent, now)
  const scheduled = readScheduled(storage)
  try {
    if (!plan) {
      if (scheduled == null) return 'none'
      await plugin.cancel()
      writeScheduled(storage, null)
      return 'cancelled'
    }
    if (scheduled === plan.at) return 'unchanged'
    const res = await plugin.schedule(plan)
    writeScheduled(storage, plan.at)
    if (scheduled == null && res?.notifications === false) await plugin.requestNotifications?.()
    return 'scheduled'
  } catch {
    return 'none'
  }
}

/** Suit les droits pendant toute la vie de l'app ; rend la fonction qui arrête le suivi. */
export function startTrialReminderWatch({ plugin = trialReminderPlugin(), target = globalThis.window } = {}) {
  if (!plugin) return () => {}
  const onChange = (e) => {
    syncTrialReminder(e?.detail ?? getEntitlement(), { plugin })
  }
  syncTrialReminder(getEntitlement(), { plugin })
  target?.addEventListener?.(ENTITLEMENT_EVENT, onChange)
  return () => target?.removeEventListener?.(ENTITLEMENT_EVENT, onChange)
}
