/**
 * Ce que dit le compagnon et l'expression qu'il prend (lot VIE ; specs/journee.SPEC.md § 2 à 10, brief § 5 et § 8).
 * Fonctions pures. Règles : il réagit au fait de noter, jamais au contenu (aucun aliment jugé, aucune calorie) ;
 * « Non » vaut « Oui » ; une note basse le rend tendre, jamais triste ni déçu ; aucun compteur de jours manqués.
 * Chaque phrase est aussi le texte lu par le lecteur d'écran : le dessin de Pilou n'est que décoratif.
 *
 * Expressions : les 12 de la planche (brief § 7.2), sous leurs noms du bus (CONTRAT.md § 3).
 */
import { mealSlotOfEntry } from '../../services/dayChecklist'
import { scoreToChoice } from '../../services/mood/wellbeingScale'
import { DEFAULT_NAME } from './companionState'
import { EXPRESSIONS } from '../bus'

export { EXPRESSIONS }

/** Heure à partir de laquelle la fin de journée devient le calme du soir (SPEC journée § 8). */
export const NIGHT_FROM_HOUR = 21
/** Bannière aux couleurs du soir (SPEC journée § 1 : mauve-pêche après 19 h). */
export const EVENING_FROM_HOUR = 19
/** Jusqu'à 5 h, c'est encore la nuit : Pilou dort sur l'Accueil (bubbles/night.js), la bannière le dit aussi. */
export const NIGHT_UNTIL_HOUR = 5

/** Soir ou nuit (couleurs du soir de la bannière) : dès 19 h et jusqu'à 5 h. */
export const isLateHour = (hour) => hour >= EVENING_FROM_HOUR || hour < NIGHT_UNTIL_HOUR

const n = (name) => name || DEFAULT_NAME

/** Repas noté : la variante suit le cercle (l'heure du repas), pas l'heure à laquelle on le note (SPEC § 3.2). */
export function mealLine(entry, name) {
  const slot = entry?.at ? mealSlotOfEntry(entry) : 'noon'
  const said = {
    morning: `${n(name)} est rassasié… et bien réveillé !`,
    noon: `${n(name)} est rassasié.`,
    evening: `${n(name)} a bien dîné.`,
  }[slot]
  return { expr: 'rassasie', move: 'eat', text: 'Merci, c’était délicieux !', sub: `Bravo, ${said}`, say: `Repas noté. ${said}` }
}

/** Le miroir du bien-être : un mot et une pose par cran (SPEC journée § 4). */
export const WELLBEING_MIRROR = Object.freeze({
  5: { word: 'Très bien', expr: 'rayonnant', text: 'Super ! Ça se fête.' },
  4: { word: 'Plutôt bien', expr: 'content', text: 'Ça me fait plaisir.' },
  3: { word: 'Correct', expr: 'tranquille', text: 'D’accord, merci.' },
  2: { word: 'Bof', expr: 'tranquille', text: 'Merci de me le dire.' },
  1: { word: 'Difficile', expr: 'reconfortant', text: 'Journée difficile ? Je reste près de vous.' },
})

/** Note de bien-être (choix 1 à 5) → ce que dit le compagnon. */
export function wellbeingLine(choice) {
  const m = WELLBEING_MIRROR[choice] ?? WELLBEING_MIRROR[3]
  return { expr: m.expr, move: choice >= 4 ? 'hop' : 'none', text: m.text, sub: `${m.word} · noté`, say: `Bien-être noté : ${m.word.toLowerCase()}. ${m.text}` }
}

/** Entrée de bien-être enregistrée → sa ligne (note stockée de 0 à 5). */
export const wellbeingEntryLine = (entry) => wellbeingLine(scoreToChoice(entry?.payload?.score))

/**
 * Habitude répondue. Méditation : il médite avec vous (SPEC § 6) ; une autre habitude : une petite joie. « Non » :
 * « Pas grave, à demain ! », un haussement d'épaules gentil.
 */
export function habitLine(habitId, label, done, name) {
  if (!done) {
    return { expr: 'content', move: 'shrug', text: 'Pas grave, à demain !', sub: `${label} : non`, say: `${label} : non. Pas grave, à demain !` }
  }
  if (habitId === 'meditation') {
    return {
      expr: 'absorbe',
      move: 'meditate',
      text: 'Respirez avec moi…',
      then: 'Merci pour ce moment calme.',
      sub: `Fait ! ${n(name)} médite avec vous`,
      say: `${label} : fait. ${n(name)} médite avec vous.`,
    }
  }
  return { expr: 'content', move: 'hop', text: 'C’est noté, merci !', sub: `${label} : fait`, say: `${label} : fait.` }
}

/** Digestion du soir (SPEC § 7) : une note basse ne change pas son attitude, seulement ses mots. */
export function gutLine(level) {
  const low = level === 'discomfort' || level === 'pain'
  return {
    expr: 'reconfortant',
    move: 'none',
    text: low ? 'Merci de me l’avoir dit. Reposez-vous bien.' : 'Merci, bonne soirée.',
    sub: 'Digestion du jour · noté',
    say: `Digestion du jour notée. ${low ? 'Merci de me l’avoir dit. Reposez-vous bien.' : 'Merci, bonne soirée.'}`,
  }
}

/**
 * Digestion notée dans la journée (POLISH-SIM-123) : une note d'un moment, pas le bilan du soir ; ni « bonne soirée »
 * ni « Digestion du jour » à 08:35.
 */
export function gutMomentLine(level) {
  const low = level === 'discomfort' || level === 'pain'
  const text = low ? 'Merci de me l’avoir dit.' : 'C’est noté, merci !'
  return { expr: 'reconfortant', move: 'none', text, sub: 'Digestion · noté', say: `Digestion notée. ${text}` }
}

/** Une saisie annulée : « il rembobine », il ne recrache rien (SPEC § 10). */
export const undoLine = () => ({ expr: 'content', move: 'rewind', text: 'D’accord, c’est annulé.', say: 'Annulé.' })

/**
 * Bon retour (SPEC § 10) : un jour d'absence → « Bon retour ! Content de vous voir. » ; deux jours ou plus → « Bon
 * retour ! On repart d'aujourd'hui. » Jamais de série perdue ni de compteur.
 */
export function welcomeBackLine(daysAway) {
  if (!daysAway) return null
  return {
    expr: 'salut',
    move: 'wave',
    text: daysAway > 1 ? 'Bon retour ! On repart d’aujourd’hui.' : 'Bon retour ! Content de vous voir.',
    say: '',
  }
}

/** Ce qu'il dit sans saisie récente, selon l'heure et ce qu'il reste à noter. */
export function idleLine({ remaining, hour }) {
  const night = hour >= NIGHT_FROM_HOUR || hour < NIGHT_UNTIL_HOUR
  if (remaining === 0) return { expr: night ? 'endormi' : 'content', move: 'none', text: night ? 'Bonne nuit.' : 'Tout est noté. Merci !' }
  if (hour < NIGHT_UNTIL_HOUR) return { expr: 'endormi', move: 'none', text: 'Bonne nuit. Le reste peut attendre demain.' }
  if (hour < 11) return { expr: 'salut', move: 'none', text: 'Bonjour ! Je suis là quand vous voulez.' }
  if (hour >= EVENING_FROM_HOUR) return { expr: 'tranquille', move: 'none', text: 'Bonne soirée. Je suis là quand vous voulez.' }
  return { expr: 'tranquille', move: 'none', text: 'Je suis là quand vous voulez.' }
}

/**
 * Tout est noté (SPEC § 8). Avant 21 h : la fête sobre ; à partir de 21 h et jusqu'à 5 h : le calme du soir, il s'endort.
 */
export function finishedLine(hour, name) {
  if (hour >= NIGHT_FROM_HOUR || hour < NIGHT_UNTIL_HOUR) {
    return { expr: 'endormi', move: 'sleep', title: 'À demain.', text: `${n(name)} dort sur son îlot. Bonne nuit.` }
  }
  return {
    expr: 'rayonnant',
    move: 'party',
    title: 'Plus rien à faire, bravo !',
    text: `Tout est noté pour aujourd’hui. ${n(name)} garde vos bulles jusqu’à demain.`,
  }
}

/** « Encore N choses aujourd'hui » (même forme que la checklist). */
export const remainingText = (count) => `Encore ${count} ${count > 1 ? 'choses' : 'chose'} aujourd’hui`

/**
 * La saisie qui vient d'arriver → la réaction du compagnon, ou null (mesure automatique, autre type).
 * @param {object} entry entrée du journal
 * @param {{ name?: string, habits?: { id: string, label: string }[] }} [ctx]
 */
export function reactionFor(entry, { name } = {}) {
  if (!entry?.type) return null
  if (entry.type === 'food') return mealLine(entry, name)
  if (entry.type === 'wellbeing' && entry.source === 'app_wellbeing' && typeof entry.payload?.score === 'number') return wellbeingEntryLine(entry)
  if (entry.type === 'habit' && entry.payload?.habit) {
    return habitLine(entry.payload.habit, entry.payload.label || 'Habitude', !!entry.payload.done, name)
  }
  if (entry.type === 'gut') return entry.payload?.scope === 'day' ? gutLine(entry.payload.level) : gutMomentLine(entry.payload?.level)
  return null
}
