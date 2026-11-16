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
 * @returns {{ bubbles: Array<{ id: string, kind: 'meals'|'wellbeing'|'gut'|'habit', label: string, tone: string,
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
        id: 'meals', kind: 'meals', label, tone: 'peach', icon: 'meal', fill: t.count, total: t.slots.length,
        ariaLabel: `Repas, ${t.count} sur ${t.slots.length}, touchez pour photographier le repas`,
      })
    } else if (t.id === 'wellbeing') {
      bubbles.push({ id: 'wellbeing', kind: 'wellbeing', label: 'Bien-être', tone: 'mint', icon: 'smile',
        ariaLabel: 'Bien-être, à faire, touchez pour noter' })
    } else if (t.id === 'gut') {
      const waiting = !t.available
      bubbles.push({ id: 'gut', kind: 'gut', label: 'Ventre', tone: 'peach', icon: 'digestion', waiting,
        ariaLabel: waiting ? `Ventre, à partir de ${GUT_EVENING_FROM_HOUR} h` : 'Ventre, à faire, touchez pour noter' })
    } else if (t.habit) {
      bubbles.push({ id: t.id, kind: 'habit', label: t.habit.label, tone: 'honey',
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
  if (bubble.kind === 'meals') return 'Repas noté.'
  if (bubble.kind === 'wellbeing') return 'Bien-être noté.'
  return 'C’est noté.'
}

/** Ligne du bandeau et des lecteurs d'écran : « 3 bulles à faire ». */
export function bubblesLeftText(n) {
  if (!n) return 'Plus rien à faire aujourd’hui'
  return `${n} ${n > 1 ? 'bulles' : 'bulle'} à faire`
}

/**
 * Place des bulles sur l'orbite (ile.SPEC § 3), en fraction du cadre de l'îlot (x, y de 0 à 1) : créneaux égaux,
 * décalés de `phase` (radians). Devant (θ = 0), la bulle passe au bas de l'îlot ; derrière, au-dessus de la tête.
 * `scale` donne la perspective (80 % derrière), `back` vrai quand la bulle est derrière Pilou.
 * Au-delà de 6 bulles, rayon × 0,85.
 */
export function orbitLayout(n, phase = 0) {
  const out = []
  const k = 0.2 // largeur du cadre par unité du monde
  for (let i = 0; i < n; i++) {
    // Premier créneau sur le côté gauche, pour que rien ne se pose devant le visage au repos
    const theta = phase + (2 * Math.PI * i) / n - Math.PI / 2
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    const x = 1.86 * s
    const z = 1.25 * c
    const y = 0.9 - 0.95 * c + 0.45 * Math.max(0, -c) ** 2
    const scale = (0.9 + 0.1 * c) * (n > 6 ? 0.85 : 1)
    out.push({
      x: 0.5 + x * k,
      // Le cadre fait ≈ 0,9 fois sa largeur en hauteur ; le dessus de l'îlot est à 64 %
      y: 0.64 + ((-y * k) + z * k * 0.25) / 0.9,
      scale,
      back: z < -0.05 * 1.25,
    })
  }
  return out
}
