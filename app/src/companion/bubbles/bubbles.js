/**
 * Les bulles de l'Accueil (refonte « Compagnon », étape 10 ; brief § 4 et § 5, specs/ile.SPEC.md § 3).
 * Fonctions pures : ce qu'il reste à noter aujourd'hui, une bulle par chose, d'après la checklist de Ma journée
 * (services/dayChecklist.js : une seule source pour les deux écrans). « Oui » et « Non » d'une habitude font
 * éclater la bulle pareil : la checklist compte la ligne faite dans les deux cas.
 */
import { dayChecklist } from '../../services/dayChecklist'
import { GUT_EVENING_FROM_HOUR } from '../../services/today'

/** Questions des habitudes proposées (feuille d'action) ; une habitude libre a sa forme générique. */
const HABIT_QUESTIONS = {
  meditation: 'Avez-vous médité aujourd’hui ?',
  stretching: 'Avez-vous fait des étirements aujourd’hui ?',
  relaxation: 'Avez-vous pris un moment de détente aujourd’hui ?',
  reading: 'Avez-vous lu aujourd’hui ?',
}

export function habitQuestion(habit) {
  return HABIT_QUESTIONS[habit?.id] ?? `${habit?.label ?? 'Cette habitude'}, aujourd’hui ?`
}

/** Icône d'une bulle (dessins de BubbleIcon.jsx). */
const HABIT_ICONS = { meditation: 'lotus', stretching: 'stretch', relaxation: 'leaf', reading: 'book' }

/**
 * @param {object[]} entries entrées récentes
 * @param {{ now?: Date, askGut?: boolean, habits?: { id: string, label: string }[] }} [opts]
 * @returns {{ bubbles: Array<{ id: string, kind: 'meal'|'wellbeing'|'gut'|'habit', label: string, tone: string,
 *   icon: string, fill?: number, total?: number, waiting?: boolean, habit?: object, ariaLabel: string }>,
 *   remaining: number, allDone: boolean, total: number, done: number }}
 */
export function homeBubbles(entries, { now = new Date(), askGut = false, habits = [] } = {}) {
  const list = dayChecklist(entries, { now, askGut, habits })
  const bubbles = []
  for (const t of list.tasks) {
    if (t.done) continue
    if (t.id === 'meals') {
      const label = `Repas ${t.count}/${t.slots.length}`
      bubbles.push({
        id: 'meals', kind: 'meal', label, tone: 'peach', theme: 'peche', icon: 'meal', fill: t.count, total: t.slots.length,
        ariaLabel: `Repas, ${t.count} sur ${t.slots.length}, touchez pour photographier le repas`,
      })
    } else if (t.id === 'wellbeing') {
      bubbles.push({ id: 'wellbeing', kind: 'wellbeing', label: 'Bien-être', tone: 'mint', theme: 'menthe', icon: 'smile',
        ariaLabel: 'Bien-être, à faire, touchez pour noter' })
    } else if (t.id === 'gut') {
      const waiting = !t.available
      bubbles.push({ id: 'gut', kind: 'gut', label: 'Digestion', tone: 'peach', theme: 'peche', icon: 'digestion', waiting,
        ariaLabel: waiting ? `Digestion, à partir de ${GUT_EVENING_FROM_HOUR} h` : 'Digestion, à faire, touchez pour noter' })
    } else if (t.habit) {
      bubbles.push({ id: t.id, kind: 'habit', label: t.habit.label, tone: 'honey', theme: 'miel',
        icon: HABIT_ICONS[t.habit.id] ?? 'sparkle', habit: t.habit,
        ariaLabel: `${t.habit.label}, à faire, touchez pour noter` })
    }
  }
  // Gestes : chaque repas compte, comme chaque ligne faite (humeur du jour, fleurs)
  const meals = list.tasks.find((t) => t.id === 'meals')
  const total = list.tasks.reduce((n, t) => n + (t.id === 'meals' ? t.slots.length : 1), 0)
  const done = list.tasks.reduce((n, t) => n + (t.id === 'meals' ? t.count : t.done ? 1 : 0), 0)
  return { bubbles, remaining: list.remaining, allDone: list.allDone, total, done, mealsCount: meals?.count ?? 0 }
}

/** Texte bref après un éclatement (ile.SPEC § 3, 2 s). */
export function poppedMessage(bubble, done) {
  if (bubble.kind === 'habit') return `${bubble.label} : ${done ? 'oui' : 'non'}, c’est noté.`
  if (bubble.kind === 'meal') return 'Repas noté.'
  if (bubble.kind === 'wellbeing') return 'Bien-être noté.'
  return 'C’est noté.'
}

/** Ligne du bandeau et des lecteurs d'écran : « 3 bulles à faire ». */
export function bubblesLeftText(n) {
  if (!n) return 'Plus rien à faire aujourd’hui'
  return `${n} ${n > 1 ? 'bulles' : 'bulle'} à faire`
}

/**
 * Orbite des bulles en unités du monde (ile.SPEC § 3 ; Pilou mesure 1,24, l'îlot 1,3 de rayon, +z vers l'écran) :
 * créneaux égaux décalés de `phase` (radians). Devant (θ = 0) la bulle passe devant le bord de l'îlot ; derrière, elle
 * remonte au-dessus de sa tête. Le premier créneau est sur le côté, pour que rien ne se pose devant le visage au repos.
 */
export const BUBBLE_RADIUS = 0.46

export function orbitWorld(n, phase = 0) {
  const out = []
  for (let i = 0; i < n; i++) {
    const theta = phase + (2 * Math.PI * i) / n - Math.PI / 2
    const c = Math.cos(theta)
    out.push({
      x: 1.86 * Math.sin(theta),
      y: 0.9 - 0.95 * c + 0.45 * Math.max(0, -c) ** 2,
      z: 1.25 * c,
      // Au-delà de 6 bulles, rayon × 0,85
      size: n > 6 ? 0.85 : 1,
    })
  }
  return out
}

/**
 * Projection de repli (sans la scène 3D) d'un point du monde sur le cadre de l'îlot dessiné, en fraction du cadre
 * (x, y de 0 à 1) : vue un peu plongeante, perspective de 80 % derrière. Même forme que `stage.project` du contrat.
 */
export function stillProject(x, y, z) {
  return {
    x: 0.5 + x * 0.2,
    y: 0.495 - y * 0.05 + z * 0.23,
    scale: 0.9 + 0.08 * z,
    behind: z < -0.05,
  }
}

/**
 * Place de la bulle cadeau de la première semaine (fractions du cadre de l'îlot, centre de la bulle) : coin bas
 * gauche, hors de l'orbite à toutes les rotations, au-dessus de l'étiquette de l'îlot (POLISH-SIM-148 : posée au
 * milieu, elle cachait la bulle du créneau de devant).
 */
export const GIFT_SPOT = Object.freeze({ x: 0.07, y: 0.78 })

/** Place des bulles sur le cadre de repli (fractions), pour les tests et l'îlot dessiné. */
export function orbitLayout(n, phase = 0) {
  return orbitWorld(n, phase).map((p) => {
    const q = stillProject(p.x, p.y, p.z)
    return { x: q.x, y: q.y, scale: q.scale * p.size, back: q.behind }
  })
}
