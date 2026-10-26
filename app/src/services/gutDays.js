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
 * La nuit d'avant en covariable (I134 étape 1) : une mauvaise nuit peut gêner le ventre ET pousser vers le café ; sans
 * précaution, le café passerait pour une piste. Quand la durée de la nuit est connue pour assez de bilans, chaque bloc
 * est coupé en deux (nuit plus courte / plus longue que votre médiane) et l'aliment n'est comparé qu'à nuit
 * comparable. Le sommeil n'est ici qu'un X d'ajustement : il ne devient pas une piste et n'entre jamais dans
 * l'estimateur du bien-être.
 * Stress et temps d'écran de la veille (I134 étape 2) : même mécanisme, mais une covariable n'est retenue que si elle
 * va avec le ventre (|z| ≥ 2 dans les blocs, sans regarder les aliments), au plus deux. Mesure du 26/10 : les trois
 * en même temps faisaient tomber la puissance de 45 à 9/60 ; ajoutées à l'aveugle par deux, de 35 à 15/60 quand
 * seule la nuit joue. Avec le tri : pièges « café » 26–30/30 → 0 à 3/30, puissance gardée (45/60 si rien ne joue,
 * 27 → 34 si la nuit joue), fausses pistes sans effet ≤ 5/150.
 * Le ventre n'est jamais une entrée de l'estimateur du bien-être (règle anti-circularité).
 */
import { localDateKey } from './analysisEngine'
import {
  GUT_LINK_MAX_Q, GUT_TTS_MAX_U, TTS_SHIFT_DAYS, correctUnique, mantelHaenszel, mealFactors, selectTestedFactors,
  settleTwins, truncatedTimeShift,
} from './gutWindows'
import { nightlySleep } from './radar'
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
/** Covariables (nuit, stress, écran) : seulement si connues pour au moins 2 bilans sur 3 et 21 bilans. */
export const COVARIATE_MIN_SHARE = 2 / 3
export const COVARIATE_MIN_DAYS = 21
/** Au plus deux covariables à la fois (4 strates par bloc) : au-delà, la puissance s'effondre (mesure du 26/10). */
export const MAX_COVARIATES = 2
/**
 * Une covariable n'est retenue que si elle va avec le ventre (|z| de Mantel-Haenszel dans les blocs, sans regarder
 * les aliments) : une covariable sans lien avec le ventre ne peut pas fausser une piste, mais coûte de la puissance.
 */
export const COVARIATE_MIN_Z = 2
/** Compatibilité : anciens noms de la nuit d'avant (I134 étape 1). */
export const SLEEP_COVARIATE_MIN_SHARE = COVARIATE_MIN_SHARE
export const SLEEP_COVARIATE_MIN_NIGHTS = COVARIATE_MIN_DAYS

/** Bilans gardés au minimum une fois r jours retirés à chaque bout pour le TTS. */
export const DAY_TTS_MIN_KEPT = 10

const H = 3_600_000
const SYMPTOM_LEVELS = new Set(['discomfort', 'pain'])
const KNOWN_LEVELS = new Set(['calm', ...SYMPTOM_LEVELS])

/** Jour local → numéro de jour (stable même au changement d'heure). */
const dayIndex = (iso) => Math.round(Date.parse(`${localDateKey(iso)}T00:00:00Z`) / (24 * H))

const prevDayKey = (key) => {
  const d = new Date(`${key}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Stress moyen de la montre par jour local (échantillons `watch_stress`). */
function dailyStress(entries) {
  const sums = new Map()
  for (const e of entries || []) {
    const v = e?.payload?.value
    if (e?.type !== 'watch_stress' || !e.at || typeof v !== 'number' || !(v > 0)) continue
    const key = localDateKey(e.at)
    const [sum, n] = sums.get(key) || [0, 0]
    sums.set(key, [sum + v, n + 1])
  }
  return new Map([...sums].map(([key, [sum, n]]) => [key, sum / n]))
}

/** Temps d'écran par journée terminée (entrées `phone_usage`). */
function dailyScreen(entries) {
  const out = new Map()
  for (const e of entries || []) {
    const v = e?.payload?.screenMinutes
    if (e?.type === 'phone_usage' && e.payload?.date && typeof v === 'number' && Number.isFinite(v) && v >= 0) out.set(e.payload.date, v)
  }
  return out
}

/**
 * Covariables candidates, par ordre de priorité. Toutes sont connues AVANT le jour du bilan (X avant Y) : la nuit
 * qui finit le matin du bilan, le stress et le temps d'écran de la VEILLE. Ceux du jour même pourraient être une
 * conséquence du ventre (on stresse ou on reste sur son téléphone parce qu'on a mal) : s'ajuster dessus fausserait
 * la comparaison. Aucune n'est jugée « bonne » ou « mauvaise » : on coupe seulement à votre médiane.
 */
const COVARIATES = [
  { id: 'sleep', values: (entries) => nightlySleep(entries), dayOf: (key) => key },
  { id: 'stress', values: dailyStress, dayOf: prevDayKey },
  { id: 'screen', values: dailyScreen, dayOf: prevDayKey },
]

/**
 * Strates de chaque bilan : pour chaque covariable retenue, 'b' sous votre médiane, 'h' au-dessus, '?' inconnue.
 * Une covariable n'est retenue que si elle est connue pour assez de bilans et va avec le ventre dans les blocs
 * (COVARIATE_MIN_Z) ; au plus MAX_COVARIATES, les plus liées au ventre d'abord. Le choix ne regarde jamais les
 * aliments : il ne peut pas favoriser une piste.
 * @returns {{ ids: string[], strata: string[]|null }}
 */
function covariateStrata(entries, bilans, maxCovariates, minZ) {
  const candidates = []
  for (const cov of COVARIATES) {
    const byDay = cov.values(entries)
    const values = bilans.map((b) => byDay.get(cov.dayOf(b.key)))
    const known = values.filter((v) => v != null).sort((a, b) => a - b)
    if (known.length < COVARIATE_MIN_DAYS || known.length < COVARIATE_MIN_SHARE * bilans.length) continue
    const median = known[Math.floor(known.length / 2)]
    // Valeurs ex aequo (minutes arrondies, nuits identiques) : la coupure la plus équilibrée, « < » ou « ≤ » médiane.
    const below = known.filter((v) => v < median).length
    const atOrBelow = known.filter((v) => v <= median).length
    const half = known.length / 2
    const low = Math.abs(below - half) <= Math.abs(atOrBelow - half) ? (v) => v < median : (v) => v <= median
    const column = values.map((v) => (v == null ? '?' : low(v) ? 'b' : 'h'))
    const { z } = mantelHaenszel(bilans.flatMap((b, i) => (column[i] === '?' ? [] : [{ y: b.y, x: column[i] === 'h' ? 1 : 0, k: b.block }])))
    if (z != null && Math.abs(z) >= minZ) candidates.push({ id: cov.id, column, z: Math.abs(z) })
  }
  const chosen = candidates.sort((a, b) => b.z - a.z).slice(0, maxCovariates)
  chosen.sort((a, b) => COVARIATES.findIndex((c) => c.id === a.id) - COVARIATES.findIndex((c) => c.id === b.id))
  const ids = chosen.map((c) => c.id)
  const columns = chosen.map((c) => c.column)
  if (!ids.length) return { ids, strata: null }
  return { ids, strata: bilans.map((_, i) => columns.map((c) => c[i]).join('')) }
}

/** Blocs distincts parmi les strates informatives (une strate = un bloc, ou un bloc × une strate de sommeil). */
const blocksOf = (keys) => new Set(keys.map((k) => String(k).split('|')[0])).size

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
 * @param {{ blockDays?: number, minBlocks?: number, maxCovariates?: number, minCovariateZ?: number }} [options]  pour le
 *   banc seulement
 * @returns {{ days: number, tested: number, adjustedFor: ('sleep'|'stress'|'screen')[], results: {
 *   factor: string, window: 'jour'|'veille', status: 'link'|'no_link'|'too_early',
 *   exposed: { days: number, symptoms: number }, unexposed: { days: number, symptoms: number },
 *   rr: number|null, p: number|null, q: number|null, u: number|null }[] }}
 */
export function analyzeGutDays(entries, {
  blockDays = DAY_BLOCK_DAYS, minBlocks = MIN_INFORMATIVE_DAY_BLOCKS, maxCovariates = MAX_COVARIATES,
  minCovariateZ = COVARIATE_MIN_Z,
} = {}) {
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
        byDay.set(day, { day, key: localDateKey(e.at), t: Date.parse(e.at), y: SYMPTOM_LEVELS.has(e.payload.level) ? 1 : 0 })
      }
    }
  }
  const bilans = [...byDay.values()].sort((a, b) => a.day - b.day)
  if (bilans.length === 0 || meals.length === 0) return { days: bilans.length, tested: 0, adjustedFor: [], results: [] }

  const first = bilans[0].day
  const last = bilans[bilans.length - 1].day
  bilans.forEach((b) => { b.block = Math.floor((b.day - first) / blockDays) })
  const covariates = covariateStrata(entries, bilans, maxCovariates, minCovariateZ)
  bilans.forEach((b, i) => { b.k = b.block + (covariates.strata ? `|${covariates.strata[i]}` : '') })
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
        return { y: b.y, x, k: b.k }
      })
      if (ex.days === 0) continue
      const { z, informativeKeys } = mantelHaenszel(rows)
      const enough = ex.days >= MIN_EXPOSED_DAYS && un.days >= MIN_UNEXPOSED_DAYS &&
        blocksOf(informativeKeys) >= minBlocks && z != null
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
    c.u = truncatedTimeShift((s) => mantelHaenszel(kept.map((b) => ({ y: b.y, k: b.k, x: exposed(b, own, w, s) }))).z, r)
    if (c.u == null) c.status = 'too_early'
    else if (c.u <= GUT_TTS_MAX_U) c.status = 'link'
  }
  settleTwins(results)

  return { days: bilans.length, tested: tested.length, adjustedFor: covariates.ids, results }
}
