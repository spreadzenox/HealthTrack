/**
 * Pilou en dehors de l'app (specs/journee.SPEC.md § 9) : ce que montrent le widget et les notifications, en fonctions
 * pures. Les images sont pré-rendues depuis la scène (brief § 7.9), une par pose ; ce module choisit la pose et
 * écrit les textes. Il ne dit jamais ce qui a été oublié ni depuis combien de temps : seulement ce qui reste
 * aujourd'hui.
 */
import { dayPhase, minuteOfDay } from './daylight.js'

/** Les six poses pré-rendues du widget (SPEC § 9), et leur texte pour le lecteur d'écran. */
export const WIDGET_POSES = Object.freeze({
  dort: 'dort',
  'se-reveille': 'se réveille',
  content: 'est content',
  rassasie: 'est rassasié',
  soir: 'profite du soir',
  fete: 'fait la fête',
})

export const NIGHT_TITLE = 'Le reste peut attendre demain'
const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
/** Une heure après le lever, Pilou finit de se réveiller. */
const WAKING_MINUTES = 60
/** Un repas noté il y a moins d'1 h 30 : Pilou est rassasié. */
const FED_MINUTES = 90
const MAX_BUBBLES = 4

/**
 * Pose de Pilou à un instant : il dort la nuit ; tout est noté → la fête ; juste après le lever → il se réveille ;
 * le soir → le soir ; un repas noté depuis peu → rassasié ; sinon content.
 */
export function widgetPose({ now = new Date(), remaining = 0, lastMealAt = null, wakeMinute, bedMinute } = {}) {
  const minute = minuteOfDay(now)
  const phase = dayPhase(minute, { wakeMinute, bedMinute })
  if (phase === 'nuit') return 'dort'
  if (remaining === 0) return 'fete'
  const wake = typeof wakeMinute === 'number' ? wakeMinute : 7 * 60
  if (minute >= wake && minute < wake + WAKING_MINUTES) return 'se-reveille'
  if (phase === 'soir') return 'soir'
  if (lastMealAt) {
    const ago = (now.getTime() - new Date(lastMealAt).getTime()) / 60000
    if (ago >= 0 && ago < FED_MINUTES) return 'rassasie'
  }
  return 'content'
}

/** « Plus rien à faire », « Encore 1 chose », « Encore 3 choses ». */
export function remainingText(n) {
  if (!n) return 'Plus rien à faire'
  return n === 1 ? 'Encore 1 chose' : `Encore ${n} choses`
}

/** « Jeudi · jour 3 » pendant la première semaine, ensuite seulement le jour de la semaine. */
export function dayText(now, usageDay = null) {
  const wd = WEEKDAYS[(now instanceof Date ? now : new Date(now)).getDay()]
  return Number.isInteger(usageDay) && usageDay >= 1 && usageDay <= 7 ? `${wd} · jour ${usageDay}` : wd
}

/**
 * État complet du widget : pose (nom de l'image), titre, ligne du jour, bulles qui restent (4 au plus, chacune
 * { label, theme }), texte pour le lecteur d'écran, et lien profond ouvert au toucher.
 * `bubbles` : les choses qui restent à noter aujourd'hui, dans l'ordre de l'Accueil.
 */
export function widgetState({ now = new Date(), name = 'Pilou', bubbles = [], usageDay = null, lastMealAt = null, wakeMinute, bedMinute } = {}) {
  let list = (bubbles || []).filter((b) => b && b.label)
  const pose = widgetPose({ now, remaining: list.length, lastMealAt, wakeMinute, bedMinute })
  // la nuit, Pilou dort : pas de compte de ce qui reste, il attendra demain (specs/ile.SPEC.md § 5)
  const night = pose === 'dort' && list.length > 0
  const title = night ? NIGHT_TITLE : remainingText(list.length)
  if (night) list = []
  const day = dayText(now, usageDay)
  const shown = list.slice(0, MAX_BUBBLES).map(({ label, theme }) => ({ label, theme: theme || null }))
  const who = String(name || 'Pilou').trim() || 'Pilou'
  const accessibility = [`${who} ${WIDGET_POSES[pose]}.`, list.length ? `${title} : ${list.map((b) => b.label).join(', ')}.` : `${title}.`, day + '.'].join(' ')
  return { pose, title, day, bubbles: shown, more: Math.max(0, list.length - shown.length), accessibility, link: 'halcya://journee' }
}

const MEAL_WORDS = { breakfast: 'petit-déjeuner', lunch: 'déjeuner', dinner: 'dîner' }

/**
 * Notification d'un repas (SPEC § 9) : seulement si ce repas n'est pas noté ; titre au nom choisi pour Pilou, image
 * « content ». Null si le repas est déjà noté ou inconnu.
 */
export function mealNotification(meal, { name = 'Pilou', alreadyNoted = false } = {}) {
  const word = MEAL_WORDS[meal]
  if (!word || alreadyNoted) return null
  const who = String(name || 'Pilou').trim() || 'Pilou'
  return {
    title: `${who} garde une place pour votre ${word}`,
    body: "Une photo de votre assiette, et c'est noté.",
    image: 'content',
  }
}
