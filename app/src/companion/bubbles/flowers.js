/**
 * Une fleur par geste (refonte « Compagnon », étape 10 ; specs/ile.SPEC.md § 4). Fonction pure : les fleurs se
 * déduisent des saisies, donc rien n'est stocké en plus, l'export et l'import les gardent d'office, et une fleur
 * ne fane jamais. Couleur = thème du geste. Les fleurs du jour occupent 6 places sur un arc devant Pilou, puis une
 * rangée intérieure ; celles des 7 jours d'avant forment la prairie du bord (44 au plus).
 * Repère de l'îlot : centre = Pilou, angle 0 = vers l'écran, rayon du plateau = 1.
 */
import { localDateKey } from '../../services/analysisEngine'
import { GUT_TYPE } from '../../services/today'
import { HABIT_TYPE } from '../../services/habits'

export const DAY_SLOTS = [
  { angle: -74, r: 0.95 }, { angle: -44, r: 0.88 }, { angle: -14, r: 0.82 },
  { angle: 30, r: 0.84 }, { angle: 58, r: 0.9 }, { angle: 84, r: 1.0 },
  { angle: -59, r: 0.62 }, { angle: -29, r: 0.62 }, { angle: 44, r: 0.62 }, { angle: 71, r: 0.62 },
]
export const MEADOW_MAX = 44
const GOLDEN = 137.508

/** Thème d'une saisie qui fait pousser une fleur ; null pour ce qui ne se note pas à la main. */
export function flowerTone(e) {
  if (e?.type === 'food') return 'peach'
  if (e?.type === 'wellbeing') return 'mint'
  if (e?.type === GUT_TYPE) return 'peach'
  if (e?.type === HABIT_TYPE) return 'honey'
  return null
}

const isGesture = (e) => e?.at && flowerTone(e) && (e.type !== 'wellbeing' || e.source !== 'face')

/**
 * @returns {{ today: Array<{ id, tone, angle, r }>, meadow: Array<{ id, tone, angle, r, day }> }}
 */
export function islandFlowers(entries, now = new Date()) {
  const today = localDateKey(now.toISOString())
  const days = new Set()
  for (let i = 1; i <= 7; i++) days.add(localDateKey(new Date(now.getTime() - i * 86_400_000).toISOString()))
  const gestures = (entries || []).filter(isGesture).sort((a, b) => (a.at < b.at ? -1 : 1))
  const idOf = (e) => String(e.id ?? `${e.type}-${e.at}`)
  const todayList = gestures.filter((e) => localDateKey(e.at) === today)
    .slice(0, DAY_SLOTS.length)
    .map((e, i) => ({ id: idOf(e), tone: flowerTone(e), ...DAY_SLOTS[i] }))
  const past = gestures.filter((e) => days.has(localDateKey(e.at))).slice(-MEADOW_MAX)
  const meadow = past.map((e, i) => ({
    id: idOf(e), tone: flowerTone(e), day: localDateKey(e.at),
    angle: ((i * GOLDEN) % 360) - 180, r: 1.0 + 0.13 * ((i * 0.618) % 1),
  }))
  return { today: todayList, meadow }
}
