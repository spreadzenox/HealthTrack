/**
 * Repas → ventre, jour par jour (jalon 5, I170 étape 3) : l'unité est le bilan du soir (« Et votre ventre
 * aujourd'hui ? », `scope: 'day'`), pas une note horodatée. Il ne dépend pas de l'heure où l'on pense à noter, et il
 * compte les journées calmes autant que les autres : c'est ce qui manquait à `gutWindows.js`.
 *
 * Deux expositions fixées d'avance : l'aliment a été mangé le jour même (avant le bilan : X précède Y) ou la veille.
 * Même prudence que pour les notes horodatées : comparaison À L'INTÉRIEUR de blocs de jours (Mantel-Haenszel
 * unilatéral, correction de continuité), correction des comparaisons multiples (Benjamini-Hochberg), puis porte du
 * décalage temporel tronqué (TTS) sur les candidates. Un seul bilan par jour : le plus récent.
 *
 * Blocs de 7 jours, pas 3 : avec un bilan par jour, un bloc de 3 jours n'a presque jamais à la fois des jours avec et
 * sans l'aliment ET des jours calmes et gênés. Banc du 26/10 (`gutDays.calibration.test.js`, 200 jeux par scénario,
 * 6 et 9 semaines, dix aliments, 15 % de soirs oubliés) : au plus 7/200 jeux sans effet gardent une piste (scénario
 * le plus exigeant : dérive lente seule, 9 semaines ; les quatre difficultés ensemble : 1/200). Blocs de 3 jours :
 * aussi prudents mais deux fois moins puissants ; un seul bloc (aucune protection contre la dérive) : à peine plus
 * puissant. Puissance pour un effet ×4 (cote de gêne) en 9 semaines : 25/200 le jour même, 36/200 la veille ; ×8 en
 * 13 semaines : environ 3 fois sur 4. Ce qui coûte le plus, c'est la correction des 20 comparaisons (10 aliments ×
 * 2 jours), pas la porte TTS : on préfère attendre plutôt que montrer de faux suspects.
 * Le ventre n'est jamais une entrée de l'estimateur du bien-être (règle anti-circularité).
 */
import { localDateKey } from './analysisEngine'
import {
  GUT_LINK_MAX_Q, GUT_TTS_MAX_U, TTS_SHIFT_DAYS, correctUnique, mantelHaenszel, mealFactors, selectTestedFactors,
  settleTwins, truncatedTimeShift,
} from './gutWindows'
import { normalCdf } from './statistics'
import { GUT_TYPE, isGutDayNote } from './today'

export const GUT_DAY_WINDOWS = [
  { id: 'jour', label: 'le jour même', lagDays: 0 },
  { id: 'veille', label: 'la veille', lagDays: 1 },
]

/** Bilans minimaux avec et sans l'aliment, taille des blocs et blocs informatifs exigés (banc du 26/10). */
export const MIN_EXPOSED_DAYS = 8
export const MIN_UNEXPOSED_DAYS = 8
export const DAY_BLOCK_DAYS = 7
export const MIN_INFORMATIVE_DAY_BLOCKS = 5
/** Bilans gardés au minimum une fois r jours retirés à chaque bout pour le TTS. */
export const DAY_TTS_MIN_KEPT = 10

const H = 3_600_000
const SYMPTOM_LEVELS = new Set(['discomfort', 'pain'])
const KNOWN_LEVELS = new Set(['calm', ...SYMPTOM_LEVELS])

/** Jour local → numéro de jour (stable même au changement d'heure). */
const dayIndex = (iso) => Math.round(Date.parse(`${localDateKey(iso)}T00:00:00Z`) / (24 * H))

/** L'aliment a-t-il été mangé dans la fenêtre du bilan, repas décalés de `s` jours ? */
function exposed(bilan, meals, w, s = 0) {
  return meals.some((m) => {
    const d = m.day + s
    if (w.lagDays === 0) return d === bilan.day && m.t + s * 24 * H < bilan.t
    return d === bilan.day - w.lagDays
  }) ? 1 : 0
}

/**
 * @param {object[]} entries  entrées `food` et bilans du soir `gut` (les notes horodatées sont ignorées)
 * @param {{ blockDays?: number, minBlocks?: number }} [options]  pour le banc seulement
 * @returns {{ days: number, tested: number, results: {
 *   factor: string, window: 'jour'|'veille', status: 'link'|'no_link'|'too_early',
 *   exposed: { days: number, symptoms: number }, unexposed: { days: number, symptoms: number },
 *   rr: number|null, p: number|null, q: number|null, u: number|null }[] }}
 */
export function analyzeGutDays(entries, { blockDays = DAY_BLOCK_DAYS, minBlocks = MIN_INFORMATIVE_DAY_BLOCKS } = {}) {
  const meals = []
  const byDay = new Map()
  for (const e of entries || []) {
    if (!e?.at || Number.isNaN(Date.parse(e.at))) continue
    if (e.type === 'food') {
      const factors = mealFactors(e)
      if (factors.length) meals.push({ t: Date.parse(e.at), day: dayIndex(e.at), factors })
    } else if (e.type === GUT_TYPE && isGutDayNote(e) && KNOWN_LEVELS.has(e.payload?.level)) {
      const day = dayIndex(e.at)
      const prev = byDay.get(day)
      if (!prev || prev.t < Date.parse(e.at)) {
        byDay.set(day, { day, t: Date.parse(e.at), y: SYMPTOM_LEVELS.has(e.payload.level) ? 1 : 0 })
      }
    }
  }
  const bilans = [...byDay.values()].sort((a, b) => a.day - b.day)
  if (bilans.length === 0 || meals.length === 0) return { days: bilans.length, tested: 0, results: [] }

  const first = bilans[0].day
  const last = bilans[bilans.length - 1].day
  const block = (d) => Math.floor((d - first) / blockDays)
  const factors = selectTestedFactors(meals)

  const results = []
  const seen = new Map()
  for (const factor of factors) {
    const own = meals.filter((m) => m.factors.includes(factor))
    for (const w of GUT_DAY_WINDOWS) {
      const ex = { days: 0, symptoms: 0 }
      const un = { days: 0, symptoms: 0 }
      const rows = bilans.map((b) => {
        const x = exposed(b, own, w)
        const bucket = x ? ex : un
        bucket.days += 1
        bucket.symptoms += b.y
        return { y: b.y, x, k: block(b.day) }
      })
      if (ex.days === 0) continue
      const { z, informative } = mantelHaenszel(rows)
      const enough = ex.days >= MIN_EXPOSED_DAYS && un.days >= MIN_UNEXPOSED_DAYS &&
        informative >= minBlocks && z != null
      const rr = enough ? ((ex.symptoms + 0.5) / (ex.days + 1)) / ((un.symptoms + 0.5) / (un.days + 1)) : null
      const p = enough ? 1 - normalCdf(z) : null
      const res = { factor, window: w.id, status: enough ? 'no_link' : 'too_early', exposed: ex, unexposed: un, rr, p, q: null, u: null }
      const sig = `${w.id}|${rows.map((row) => row.x).join('')}`
      if (enough && seen.has(sig)) res.twinOf = seen.get(sig)
      else if (enough) seen.set(sig, res)
      results.push(res)
    }
  }

  const tested = correctUnique(results)

  const r = TTS_SHIFT_DAYS
  const kept = bilans.filter((b) => b.day - first >= r && last - b.day >= r)
  for (const c of tested.filter((t) => t.q < GUT_LINK_MAX_Q)) {
    if (kept.length < DAY_TTS_MIN_KEPT) { c.status = 'too_early'; continue }
    const w = GUT_DAY_WINDOWS.find((win) => win.id === c.window)
    const own = meals.filter((m) => m.factors.includes(c.factor))
    c.u = truncatedTimeShift((s) => mantelHaenszel(kept.map((b) => ({ y: b.y, k: block(b.day), x: exposed(b, own, w, s) }))).z, r)
    if (c.u == null) c.status = 'too_early'
    else if (c.u <= GUT_TTS_MAX_U) c.status = 'link'
  }
  settleTwins(results)

  return { days: bilans.length, tested: tested.length, results }
}
