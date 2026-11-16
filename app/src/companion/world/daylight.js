/**
 * Le cycle du jour sur la lumière dorée (brief § 7.5, specs/ile.SPEC.md § 5), en fonction pure : une heure locale
 * donne les paramètres de lumière que la scène applique. La signature de la créature reste : le soleil est toujours
 * derrière Pilou (contre-jour, azimut ≈ −150°) ; le matin il est plus pâle et plus haut, l'après-midi doré (les
 * valeurs exactes du kit, rendu/creature/scene.js), le soir plus orangé et plus bas, la nuit une lune bleutée et
 * faible : le point ambre de l'antenne devient la lumière principale.
 *
 * Rien n'est tiré au hasard et rien ne dépend d'un état : la même minute donne toujours la même lumière, donc la scène
 * peut se mettre en pause et reprendre exactement.
 */
import { EASE, clamp01, lerp, mixHex } from './easing.js'

/** Heure de lever et de coucher par défaut (specs/ile.SPEC.md § 5 : « sinon 7 h », « sinon 22 h 30 »). */
export const DEFAULT_WAKE_MINUTE = 7 * 60
export const DEFAULT_BED_MINUTE = 22 * 60 + 30
/** Le jour de Pilou change à 4 h (fleurs d'hier, lucioles éteintes, bulles du jour). */
export const DAY_CHANGE_MINUTE = 4 * 60
/** Début du soir : la lanterne s'allume, Pilou s'assoit (specs/ile.SPEC.md § 5). */
export const EVENING_MINUTE = 17 * 60 + 48
/** Durée d'un changement d'heure visible ; en mouvements réduits, simple fondu de 600 ms. */
export const LIGHT_FADE_MS = 600

const m = (h, min = 0) => h * 60 + min

/**
 * Clés de lumière, du minuit au minuit suivant. Couleurs du ciel : specs/ile.SPEC.md § 5. Soleil de l'après-midi :
 * exactement celui du kit (#FFCFA0, élévation 15°, intensité 3,6 ; appoint #FFE4D2 à 1,15 ; environnement 0,62 ;
 * brume #FFC9A6). `ambre` : intensité relative de la lueur du point ambre (1 = lumière principale de la nuit).
 */
export const LIGHT_KEYS = Object.freeze([
  { minute: m(0), name: 'nuit', skyTop: '#1C2452', skyBottom: '#4A4A8C', haze: '#2E3466', sun: '#CCD6FF', sunElevation: 20, sunIntensity: 0.55, fill: '#8C96D8', fillIntensity: 0.3, env: 0.2, ambre: 1, stars: 1 },
  { minute: m(5, 30), name: 'nuit', skyTop: '#1C2452', skyBottom: '#4A4A8C', haze: '#2E3466', sun: '#CCD6FF', sunElevation: 20, sunIntensity: 0.55, fill: '#8C96D8', fillIntensity: 0.3, env: 0.2, ambre: 1, stars: 1 },
  { minute: m(6, 48), name: 'aube', skyTop: '#F2B6A6', skyBottom: '#FFE6CF', haze: '#F6C7B4', sun: '#FFD7AE', sunElevation: 8, sunIntensity: 2.4, fill: '#FFE4D2', fillIntensity: 0.85, env: 0.48, ambre: 0.45, stars: 0 },
  { minute: m(8, 12), name: 'matin', skyTop: '#FFCCAE', skyBottom: '#FFF1E2', haze: '#FFD9C2', sun: '#FFE6C4', sunElevation: 26, sunIntensity: 3.1, fill: '#FFF0E4', fillIntensity: 1.25, env: 0.68, ambre: 0.3, stars: 0 },
  { minute: m(12, 30), name: 'midi', skyTop: '#FFD7BA', skyBottom: '#FFF3E6', haze: '#FFD4B8', sun: '#FFE0BC', sunElevation: 22, sunIntensity: 3.4, fill: '#FFEADC', fillIntensity: 1.2, env: 0.66, ambre: 0.3, stars: 0 },
  { minute: m(15, 30), name: 'apres-midi', skyTop: '#FFC9A6', skyBottom: '#FFE9D6', haze: '#FFC9A6', sun: '#FFCFA0', sunElevation: 15, sunIntensity: 3.6, fill: '#FFE4D2', fillIntensity: 1.15, env: 0.62, ambre: 0.35, stars: 0 },
  { minute: m(18, 40), name: 'soir', skyTop: '#C9A4E2', skyBottom: '#FFD9B0', haze: '#F0B8A8', sun: '#FF9F72', sunElevation: 6, sunIntensity: 2.6, fill: '#FFD2C0', fillIntensity: 0.9, env: 0.5, ambre: 0.6, stars: 0 },
  { minute: m(21, 24), name: 'nuit', skyTop: '#1C2452', skyBottom: '#4A4A8C', haze: '#2E3466', sun: '#CCD6FF', sunElevation: 20, sunIntensity: 0.55, fill: '#8C96D8', fillIntensity: 0.3, env: 0.2, ambre: 1, stars: 1 },
  { minute: m(24), name: 'nuit', skyTop: '#1C2452', skyBottom: '#4A4A8C', haze: '#2E3466', sun: '#CCD6FF', sunElevation: 20, sunIntensity: 0.55, fill: '#8C96D8', fillIntensity: 0.3, env: 0.2, ambre: 1, stars: 1 },
])

/** Azimut du soleil (degrés, repère du kit) : toujours derrière Pilou, un peu sur le côté. */
export const SUN_AZIMUTH = -150

const COLOR_FIELDS = ['skyTop', 'skyBottom', 'haze', 'sun', 'fill']
const NUMBER_FIELDS = ['sunElevation', 'sunIntensity', 'fillIntensity', 'env', 'ambre', 'stars']

const isMinute = (v) => typeof v === 'number' && Number.isFinite(v)

/** Minute du jour (0 à 1439,99…) d'une date, à l'heure locale du téléphone. */
export function minuteOfDay(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
}

const normMinute = (v) => ((v % 1440) + 1440) % 1440

/** Jour de Pilou (AAAA-MM-JJ) : il change à 4 h, pas à minuit. */
export function worldDayKey(date) {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date)
  d.setMinutes(d.getMinutes() - DAY_CHANGE_MINUTE)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * Moment de la journée de Pilou : 'matin' (du lever à midi), 'apres-midi', 'soir' (dès 17 h 48) ou 'nuit' (dès le
 * coucher habituel, jusqu'au lever). Lever et coucher viennent du sommeil lu, sinon 7 h et 22 h 30.
 */
export function dayPhase(minute, { wakeMinute = DEFAULT_WAKE_MINUTE, bedMinute = DEFAULT_BED_MINUTE } = {}) {
  const t = normMinute(minute)
  const wake = isMinute(wakeMinute) ? normMinute(wakeMinute) : DEFAULT_WAKE_MINUTE
  const bed = isMinute(bedMinute) ? normMinute(bedMinute) : DEFAULT_BED_MINUTE
  const asleep = bed > wake ? t >= bed || t < wake : t >= bed && t < wake
  if (asleep) return 'nuit'
  if (t >= EVENING_MINUTE || t < wake) return 'soir'
  if (t >= 12 * 60) return 'apres-midi'
  return 'matin'
}

/**
 * Lumière d'une minute du jour : couleurs (hexadécimal) et grandeurs interpolées entre les deux clés voisines avec la
 * courbe `soft`. Retourne aussi la phase, si Pilou dort, si la lanterne est allumée, et la direction du soleil.
 */
export function lightAt(minuteOrDate, options = {}) {
  const minute = normMinute(minuteOrDate instanceof Date ? minuteOfDay(minuteOrDate) : Number(minuteOrDate) || 0)
  let i = 0
  while (i < LIGHT_KEYS.length - 2 && LIGHT_KEYS[i + 1].minute <= minute) i += 1
  const a = LIGHT_KEYS[i]
  const b = LIGHT_KEYS[i + 1]
  const span = b.minute - a.minute
  const t = EASE.soft(clamp01(span > 0 ? (minute - a.minute) / span : 0))
  const out = { minute, key: t < 0.5 ? a.name : b.name }
  for (const f of COLOR_FIELDS) out[f] = mixHex(a[f], b[f], t)
  for (const f of NUMBER_FIELDS) out[f] = Math.round(lerp(a[f], b[f], t) * 1000) / 1000
  out.sunAzimuth = SUN_AZIMUTH
  out.sunDirection = sunDirection(SUN_AZIMUTH, out.sunElevation)
  out.phase = dayPhase(minute, options)
  out.asleep = out.phase === 'nuit'
  out.lantern = out.phase === 'soir' || out.phase === 'nuit'
  out.night = out.stars >= 0.5
  return out
}

/** Vecteur unitaire [x, y, z] du soleil, comme dans le kit (sin az · cos él, sin él, cos az · cos él). */
export function sunDirection(azimuthDeg, elevationDeg) {
  const az = (azimuthDeg * Math.PI) / 180
  const el = (elevationDeg * Math.PI) / 180
  const r = (v) => Math.round(v * 10000) / 10000
  return [r(Math.sin(az) * Math.cos(el)), r(Math.sin(el)), r(Math.cos(az) * Math.cos(el))]
}

/**
 * Prochaine minute (à partir de `minute`) où la lumière doit être recalculée : la scène n'a pas besoin de le faire à
 * chaque image. Pas de 5 minutes, comme le ciel 2D de la SPEC (§ 1).
 */
export function nextLightUpdate(minute, stepMinutes = 5) {
  const t = normMinute(minute)
  return (Math.floor(t / stepMinutes) + 1) * stepMinutes
}
