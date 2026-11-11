/**
 * Données fictives de la visite guidée (ACC-8) : synthétiques, construites en mémoire (jamais écrites dans la base),
 * et limitées aux mesures que la personne reçoit vraiment (ACC-5) : sans VFC chez elle, pas de VFC dans l'exemple.
 */
import { generateDemoEntries } from '../../scripts/visual/demoData.mjs'
import { measuresOf } from '../devices/deviceCapabilities'
import { listEntries } from '../storage/localHealthStorage'

const DAY_MS = 86_400_000

/** Mesures (ids de deviceCapabilities.MEASURES) reçues ces 30 derniers jours, lues dans la vraie base. */
export async function receivedMeasures({ now = new Date(), list = listEntries } = {}) {
  const since = new Date(now.getTime() - 30 * DAY_MS).toISOString()
  const entries = await list({ since, limit: 100000 })
  return new Set(entries.flatMap(measuresOf))
}

const DEVICE_SOURCES = new Set(['health_connect', 'huawei_watch', 'withings'])
const dayKey = (iso) => new Date(iso).toDateString()

/**
 * Données fictives « plus marquées » (accord du propriétaire, 08/11 vers 22:55) : sur 14 jours seulement, Analyses doit
 * montrer une piste nette et Agir un essai ; au jour 28, une piste digestion. Un rythme fixe (sans hasard, et sans
 * lien avec le jour de la semaine) règle un levier et le bien-être du même jour ; l'oignon cru (fructanes) règle les
 * jours de gêne. Ce n'est qu'un exemple : il montre à quoi ressemble une piste, pas ce qui compte pour la personne.
 */
/**
 * Motifs de 13 et 11 jours (jamais un multiple de 7 : rien ne tombe toujours le même jour de la semaine), choisis
 * pour que les pistes sortent nettes quels que soient la date, l'heure, le fuseau et les sources (tourResults.test.js ;
 * motifs cherchés le 08/11 sur 14 dates et heures × 4 configurations × 3 fuseaux).
 */
export const PATTERNS = {
  levels: [-1, 1, 1, -1, 1, 1, 0, 0, -1, 1, -1, 0, 0],
  onions: [0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0],
}
/** −1, 0 ou 1 : jour moins bon, ordinaire ou meilleur (`i` : jours avant aujourd'hui). */
const levelOf = (i) => PATTERNS.levels[i % PATTERNS.levels.length]
/** Jour avec de l'oignon cru au dîner. */
const onionDay = (i) => PATTERNS.onions[i % PATTERNS.onions.length] === 1
const ONION = { ingredient: 'Oignon, cru', quantity_g: 80, quantity: '80 g' }
const ONION_DINNER = [
  { ingredient: 'Riz blanc cuit', quantity_g: 180, quantity: '180 g' },
  { ingredient: 'Saumon, cuit à la vapeur', quantity_g: 130, quantity: '130 g' },
]
/** Le jour `i` jours avant `now`, à h:m (par le calendrier : un changement d'heure ne décale pas le jour). */
const daysBefore = (now, i, h, m = 0) => {
  const d = new Date(now)
  d.setDate(d.getDate() - i)
  d.setHours(h, m, 0, 0)
  return d
}
/** Jours écoulés entre la date de `iso` et aujourd'hui (0 = aujourd'hui), à minuit. */
const ago = (iso, now) => {
  const a = new Date(iso)
  const b = new Date(now)
  a.setHours(12, 0, 0, 0)
  b.setHours(12, 0, 0, 0)
  return Math.round((b - a) / DAY_MS)
}

const sleepMinutesOf = (i) => 430 + 70 * levelOf(i) + ((i * 7) % 5) * 4
/** Soir avec deux verres de vin (environ un sur trois). */
const wineDay = (i) => levelOf(i) < 0
const WINE = { ingredient: 'Vin rouge', quantity_g: 250, quantity: '250 ml' }

/**
 * Le levier de l'exemple et le bien-être qui le suit, sur le jour et la veille (la fenêtre « court terme »
 * d'Analyses) : la nuit chez qui reçoit son sommeil, sinon deux verres de vin certains soirs (rien d'autre dans
 * l'exemple ne contient d'alcool, la piste reste nette avec les seuls repas notés).
 */
function markLever(list, days, now) {
  const lever = list.some((e) => e.type === 'sleep') ? 'sleep' : 'wine'
  const good = (i) => (lever === 'sleep' ? levelOf(i) : wineDay(i) ? -1 : 0.5)
  const seen = new Set()
  for (const e of list) {
    const i = ago(e.type === 'sleep' ? e.payload?.endDate ?? e.at : e.at, now)
    if (lever === 'sleep' && e.type === 'sleep') {
      const minutes = sleepMinutesOf(i)
      e.payload = { ...e.payload, durationMinutes: minutes, endDate: new Date(Date.parse(e.at) + minutes * 60_000).toISOString() }
      seen.add(i)
    }
    if (e.type === 'wellbeing' && i > 0) {
      e.payload = { ...e.payload, score: Math.round(3 + 1.6 * ((good(i) + good(i + 1)) / 2)) }
    }
  }
  // Une nuit chaque jour (la montre de la démo est parfois oubliée), ou le vin des soirs prévus
  const model = list.find((e) => e.type === 'sleep')
  for (let i = days; i >= (lever === 'sleep' ? 0 : 1); i--) {
    if (lever === 'wine') {
      if (!wineDay(i)) continue
      list.push({ type: 'food', source: 'app_food', at: daysBefore(now, i, 19, 30).toISOString(), payload: { items: [WINE], provider: 'gemini' } })
    } else if (!seen.has(i)) {
      const bed = daysBefore(now, i + 1, 23, 20)
      const minutes = sleepMinutesOf(i)
      list.push({ ...model, payload: { ...model.payload, durationMinutes: minutes, endDate: new Date(bed.getTime() + minutes * 60_000).toISOString() }, at: bed.toISOString() })
    }
  }
}

/**
 * @param {{ days: number, now?: Date, received?: Set<string>, face?: boolean, weather?: boolean, screen?: boolean, huawei?: boolean }} p
 * @returns {Array<object>} entrées fictives (sans id ; exampleMode leur en donne un)
 */
export function buildTourEntries({ days, now = new Date(), received = new Set(), face = false, weather = false, screen = false, huawei = false }) {
  // Ce qui tomberait plus tard aujourd'hui (note de 21 h 30, repas du soir) est ramené à tout à l'heure : l'écran
  // d'aujourd'hui montre déjà sa note et ses repas
  const soon = new Date(now.getTime() - 10 * 60_000).toISOString()
  const all = generateDemoEntries({ days, now }).map((e) => (Date.parse(e.at) > now.getTime() ? { ...e, at: soon } : e))
  // La démo laisse aujourd'hui vide (journée en cours) : la visite y recopie la note, les repas et la digestion d'hier
  const yesterday = new Date(now.getTime() - DAY_MS).toDateString()
  for (const e of all.filter((x) => ['wellbeing', 'food', 'gut'].includes(x.type) && dayKey(x.at) === yesterday)) {
    const t = Date.parse(e.at) + DAY_MS
    const copy = { ...e, at: t > now.getTime() ? soon : new Date(t).toISOString() }
    // Une journée d'exemple plutôt bonne (la note fictive d'aujourd'hui ne descend pas sous 4)
    if (e.type === 'wellbeing') copy.payload = { ...e.payload, score: Math.max(4, e.payload?.score ?? 4) }
    all.push(copy)
  }
  const kept = all
    .map((e) => ({ ...e, payload: e.payload && { ...e.payload } }))
    .filter((e) => {
      if (e.type === 'face_burst') return face
      if (e.source === 'open_meteo') return weather
      if (e.source === 'phone') return screen
      const ms = measuresOf(e)
      // Appareils : seulement ce que la personne reçoit (sans source, rien ; sans VFC, pas de VFC)
      if (DEVICE_SOURCES.has(e.source)) return received.size > 0 && (ms.length === 0 || received.has(ms[0]))
      return ms.length === 0 || received.has(ms[0])
    })
    // La montre Huawei de la démo devient « Health Connect » chez qui n'en a pas
    .map((e) => (e.source === 'huawei_watch' && !huawei ? { ...e, source: 'health_connect' } : e))
  markLever(kept, days, now)
  // Digestion (jour 28) : une note chaque soir, pour que ses analyses s'ouvrent comme chez quelqu'un qui note ; gêne
  // le lendemain, douleur les soirs d'oignon cru (fructanes), calme les autres
  if (days >= 28) {
    // Aujourd'hui : la note de la démo suit la même règle (soirée d'oignon hier : gêne ; sinon calme)
    const out = kept
      .filter((e) => e.type !== 'gut' || ago(e.at, now) === 0)
      .map((e) => (e.type === 'gut' ? { ...e, payload: { ...e.payload, level: onionDay(1) ? 'discomfort' : 'calm' } } : e))
    const dinners = new Map(out.filter((e) => e.type === 'food' && new Date(e.at).getHours() >= 16).map((e) => [ago(e.at, now), e]))
    for (let i = days; i >= 1; i--) {
      if (!onionDay(i)) continue
      const dinner = dinners.get(i)
      if (dinner) {
        dinner.payload = { ...dinner.payload, items: [...(dinner.payload?.items ?? []), ONION] }
        continue
      }
      out.push({ type: 'food', source: 'app_food', at: daysBefore(now, i, 20, 15).toISOString(), payload: { items: [...ONION_DINNER, ONION], provider: 'gemini' } })
    }
    for (let i = days; i >= 1; i--) {
      const d = daysBefore(now, i, 22)
      const level = onionDay(i) ? 'pain' : onionDay(i + 1) ? 'discomfort' : 'calm'
      out.push({ type: 'gut', source: 'app_gut', at: d.toISOString(), payload: { level } })
    }
    return out
  }
  // Avant le jour 28 : une note chaque soir aussi (POLISH-SIM-39). La démo n'en a que sur ses derniers jours : au jour 14,
  // l'exemple disait « Encore 18 jours » quand le vrai écran en annonce 27 au jour 1. Niveaux de la démo gardés.
  const levels = new Map(kept.filter((e) => e.type === 'gut').map((e) => [ago(e.at, now), e.payload?.level]))
  const out = kept.filter((e) => e.type !== 'gut' || ago(e.at, now) === 0)
  if (!out.some((e) => e.type === 'gut')) out.push({ type: 'gut', source: 'app_gut', at: soon, payload: { level: 'calm' } })
  for (let i = days - 1; i >= 1; i--) {
    out.push({ type: 'gut', source: 'app_gut', at: daysBefore(now, i, 22).toISOString(), payload: { level: levels.get(i) ?? 'calm' } })
  }
  return out
}
