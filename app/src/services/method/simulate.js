/**
 * ORG-5a — Banc de simulation : des matrices quotidiennes synthétiques dont on connaît la vérité (quels facteurs
 * agissent, sur quel résultat, à quel horizon, de combien). Même forme que `buildAnalysisMatrix` : la méthode est
 * jugée exactement comme elle tourne dans l'app. Aucune donnée réelle.
 *
 * Ce qui rend le banc exigeant (les pièges d'un vrai journal) :
 * - facteurs autocorrélés (AR(1)) : une semaine de bon sommeil suit souvent une autre ;
 * - rythme de la semaine et tendance lente sur le résultat (et sur les facteurs, en option) ;
 * - écart du jour lui-même autocorrélé ;
 * - jours sans mesure (facteurs) et jours sans note (résultat) ;
 * - digestion notée sur une échelle ordonnée (calme / gêne / douleur), comme dans l'app.
 */

const DAY_MS = 86_400_000
const START = Date.UTC(2026, 0, 5) // un lundi

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function gaussian(r) {
  const u = Math.max(r(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r())
}

export const simDayKey = (i) => new Date(START + i * DAY_MS).toISOString().slice(0, 10)

/** Fenêtres des horizons (jours avant le jour mesuré), mêmes que le contrat. */
const WINDOWS = { short: [0, 1], medium: [2, 6], long: [7, 27] }

/** Échelle plausible des facteurs simulés (moyenne, écart type). */
const SCALE = {
  sleepMinutes: [430, 45], steps: [7000, 2500], activityCalories: [350, 150], screen_minutes: [220, 60],
  screen_late_minutes: [30, 20], social_minutes: [60, 30], kcal: [2000, 350], fiber_g: [20, 6], sugar_g: [60, 20],
  fat_g: [75, 20], alcohol_g: [8, 10], restingHR: [60, 4], hrv_ms: [45, 10], weather_sunshine_h: [5, 3],
  weather_temp_max_c: [15, 6], weather_pressure_change_hpa: [0, 5],
}

/**
 * @param {object} o
 * @param {number} [o.days=70]
 * @param {number} [o.seed=1]
 * @param {string[]} [o.factors]          clés simulées (par défaut toutes celles de SCALE)
 * @param {number} [o.factorAr=0.6]       autocorrélation jour à jour des facteurs
 * @param {number} [o.factorMissing=0.1]  part des jours sans mesure
 * @param {number} [o.factorTrend=0]      dérive lente des facteurs (en écarts types sur toute la période)
 * @param {Array<{ outcome: 'wellbeing'|'digestion', key: string, horizon: 'short'|'medium'|'long', size: number }>} [o.effects]
 *   size = effet sur le résultat latent (bien-être, ou confort digestif : > 0 = mieux) (écarts types du bruit) pour 1 écart type du facteur moyen sur la fenêtre
 * @param {number} [o.weekly=0.3]         rythme de la semaine (écarts types du bruit, week-end plus haut)
 * @param {number} [o.trend=0.5]          tendance lente du résultat sur la période (écarts types du bruit)
 * @param {number} [o.noiseAr=0.4]        autocorrélation de l'écart du jour
 * @param {number} [o.wellbeingMissing=0.1]
 * @param {number} [o.digestionMissing=0.15]
 * @param {number} [o.symptomShare=0.3]   part des jours de gêne ou douleur
 * @param {number} [o.wellbeingSd=0.5]    bruit du bien-être, en points sur 5
 * @param {number} [o.burnIn=28]          jours simulés avant le premier (pour remplir la fenêtre longue)
 */
export function simulateMatrix({
  days = 70, seed = 1, factors = Object.keys(SCALE), factorAr = 0.6, factorMissing = 0.1, factorTrend = 0,
  effects = [], weekly = 0.3, trend = 0.5, noiseAr = 0.4, wellbeingMissing = 0.1, digestionMissing = 0.15,
  symptomShare = 0.3, wellbeingSd = 0.5, burnIn = 28,
} = {}) {
  const r = rng(seed)
  const total = days + burnIn
  // Facteurs standardisés (AR(1) stationnaire, variance 1) + dérive éventuelle.
  const z = {}
  for (const key of factors) {
    const s = new Array(total)
    s[0] = gaussian(r)
    for (let i = 1; i < total; i += 1) s[i] = factorAr * s[i - 1] + Math.sqrt(1 - factorAr ** 2) * gaussian(r)
    if (factorTrend) for (let i = 0; i < total; i += 1) s[i] += factorTrend * (i / total - 0.5)
    z[key] = s
  }
  const windowMean = (key, i, h) => {
    const [from, to] = WINDOWS[h]
    let sum = 0
    let n = 0
    for (let k = from; k <= to; k += 1) if (i - k >= 0) { sum += z[key][i - k]; n += 1 }
    return n ? sum / n : 0
  }
  const latent = (outcome) => {
    const out = new Array(total)
    let e = gaussian(r)
    for (let i = 0; i < total; i += 1) {
      e = noiseAr * e + Math.sqrt(1 - noiseAr ** 2) * gaussian(r)
      const dow = new Date(START + (i - burnIn) * DAY_MS).getUTCDay()
      let v = e + (dow === 0 || dow === 6 ? weekly : 0) + trend * (i / total - 0.5)
      for (const eff of effects) if (eff.outcome === outcome) v += eff.size * windowMean(eff.key, i, eff.horizon)
      out[i] = v
    }
    return out
  }
  const wb = latent('wellbeing')
  const dg = latent('digestion')
  // Le latent digestif est un confort (plus haut = mieux) : gêne sous le seuil choisi pour la part de jours visée.
  const sorted = dg.slice(burnIn).sort((a, b) => a - b)
  const cutDiscomfort = sorted[Math.floor(symptomShare * sorted.length)] ?? -Infinity
  const cutPain = sorted[Math.floor((symptomShare / 3) * sorted.length)] ?? -Infinity

  const wellbeing = new Map()
  const digestion = new Map()
  const dayMap = new Map()
  let symptomDays = 0
  for (let i = 0; i < total; i += 1) {
    const dk = simDayKey(i - burnIn)
    const vals = {}
    for (const key of factors) {
      const [m, sd] = SCALE[key] ?? [0, 1]
      vals[key] = r() < factorMissing ? null : m + sd * z[key][i]
    }
    dayMap.set(dk, vals)
    if (i < burnIn) continue
    if (r() >= wellbeingMissing) wellbeing.set(dk, Math.min(5, Math.max(0, 3 + wellbeingSd * wb[i])))
    if (r() >= digestionMissing) {
      const level = dg[i] < cutPain ? 'pain' : dg[i] < cutDiscomfort ? 'discomfort' : 'calm'
      if (level !== 'calm') symptomDays += 1
      digestion.set(dk, { calm: 5, discomfort: 3, pain: 1 }[level])
    }
  }
  return {
    matrix: { series: { wellbeing, digestion, symptomDays }, days: dayMap },
    truth: effects,
    lastDay: simDayKey(days - 1),
  }
}
