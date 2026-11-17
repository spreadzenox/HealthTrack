/**
 * Le widget de Pilou tenu à jour par l'app (specs/journee.SPEC.md § 9) : après chaque saisie vue par l'Accueil ou
 * Ma journée, l'état du jour (ce qui reste, ce qui est prévu, le dernier repas, lever et coucher) part au widget
 * Android (PilouWidgetPlugin), qui le redessine et le refait seul toutes les 30 min. Rien ne sort du téléphone.
 * iPhone : pas encore de widget (WidgetKit), voir journal/sprint/LOT-MONDE.md ; ces appels n'y font rien.
 */
import { registerPlugin } from '@capacitor/core'
import { dayChecklist } from '../../services/dayChecklist'
import { localDateKey } from '../../services/analysisEngine'
import { worldDayKey } from './daylight.js'
import { loadWorldContext, worldContextForDay, resetWorldContextCache } from './context.js'
import { companionNameNow } from '../bubbles/name.js'

const NativePilouWidget = registerPlugin('PilouWidget')

/** Plugin natif sur Android, faux plugin des tests et captures, sinon aucun (iPhone, navigateur). */
export function pilouWidgetPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakePilouWidget) return window.__healthtrackFakePilouWidget
  const cap = typeof window !== 'undefined' ? window.Capacitor : null
  return cap?.isNativePlatform?.() && cap.getPlatform?.() === 'android' ? NativePilouWidget : null
}

const TASK_LABELS = { meals: 'Repas', wellbeing: 'Bien-être', gut: 'Digestion' }

const labelOf = (task) => (task.habit ? task.habit.label : TASK_LABELS[task.id]) || null

/**
 * État du widget pour le jour en cours : les mêmes lignes que la checklist de Ma journée (repas, bien-être,
 * digestion avec son objectif, habitudes), dans le même ordre.
 */
export function widgetDayState(entries, { now = new Date(), askGut = false, habits = [], context = {}, name = 'Pilou' } = {}) {
  const list = dayChecklist(entries, { now, askGut, habits })
  const planned = list.tasks.map(labelOf).filter(Boolean)
  const remaining = list.tasks.filter((t) => !t.done).map(labelOf).filter(Boolean)
  const today = localDateKey(now.toISOString())
  const meals = (entries || []).filter((e) => e?.type === 'food' && e.at && localDateKey(e.at) === today)
  const lastMeal = meals.reduce((max, e) => (max == null || e.at > max ? e.at : max), null)
  const notedToday = list.noted.length > 0
  const days = Number(context.daysOfUse) || 0
  return {
    day: worldDayKey(now),
    planned,
    remaining,
    lastMealAt: lastMeal ? new Date(lastMeal).getTime() : 0,
    wake: Number.isFinite(context.wake) ? context.wake : -1,
    bed: Number.isFinite(context.bedtime) ? context.bedtime : -1,
    usageDay: days + (notedToday ? 0 : 1),
    name: String(name || 'Pilou').trim() || 'Pilou',
  }
}

/**
 * Envoie l'état du jour au widget, avec le nom choisi pour le compagnon (« Pilou » sinon) ; ne lève jamais (un
 * widget pas à jour ne doit rien casser).
 */
export async function syncPilouWidget({ entries, askGut = false, habits = [], now = new Date(), plugin = pilouWidgetPlugin(), loadContext = loadWorldContext, name = companionNameNow() } = {}) {
  if (!plugin?.update) return false
  try {
    const context = await worldContextForDay({ now, load: loadContext })
    await plugin.update({ state: widgetDayState(entries, { now, askGut, habits, context, name }) })
    return true
  } catch {
    return false
  }
}

/** Le widget a-t-il été touché depuis la dernière fois ? (l'app ouvre alors Ma journée) */
export async function takePilouWidgetOpen(plugin = pilouWidgetPlugin()) {
  if (!plugin?.takeOpen) return false
  try {
    return (await plugin.takeOpen())?.open === true
  } catch {
    return false
  }
}

/** Pour les tests. */
export function resetWidgetContextCache() {
  resetWorldContextCache()
}
