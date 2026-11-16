/**
 * La première semaine (refonte « Compagnon », étape 10 ; brief § 3.5 et § 4, specs/ile.SPEC.md § 7).
 * « Jour 3 sur 7 avant vos premières analyses » : la barre porte sur le bien-être et compte les jours notés comme
 * l'onglet Objectifs (services/objectivesOverview.js, même seuil FIRST_SCORE_DAY) ; un jour sans rien ne la fait
 * pas reculer, elle attend. Un cadeau par jour noté (J1 arbuste … J7 arc-en-ciel), ouvert une fois, à la première
 * ouverture du jour. Au 7e jour, la barre laisse la place à la carte des premières analyses.
 * Seuls les cadeaux déjà ouverts et le jour de la fin sont gardés (téléphone seulement, aucune donnée de santé).
 */
import { FIRST_SCORE_DAY } from '../../config/firstResults'
import { localDateKey } from '../../services/analysisEngine'

export const WEEK_DAYS = FIRST_SCORE_DAY.wellbeing

export const GIFTS = [
  { day: 1, id: 'shrub', item: 'arbuste', name: 'Arbuste', text: 'Un arbuste pour l’îlot !' },
  { day: 2, id: 'lantern', item: 'lanterne', name: 'Lanterne', text: 'Une lanterne pour l’îlot !' },
  { day: 3, id: 'scarf', item: 'echarpe', name: 'Écharpe', text: 'Une écharpe pour {name} !' },
  { day: 4, id: 'pebbles', item: 'galets', name: 'Galets', text: 'Des galets pour l’îlot !' },
  { day: 5, id: 'butterfly', item: 'papillon', name: 'Papillon', text: 'Un papillon pour {name} !' },
  { day: 6, id: 'cloud', item: 'nuage', name: 'Nuage', text: 'Un petit nuage pour {name} !' },
  { day: 7, id: 'rainbow', item: 'arc-en-ciel', name: 'Arc-en-ciel', text: 'Un arc-en-ciel pour l’îlot !' },
]

const KEY = 'halcya.companion.firstWeek'

function read(storage) {
  try {
    const v = JSON.parse(storage?.getItem(KEY) ?? 'null')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

function write(storage, v) {
  try {
    storage?.setItem(KEY, JSON.stringify(v))
  } catch {
    // sans stockage, le cadeau reviendra : rien de grave
  }
}

/** Texte après l'ouverture d'un cadeau (ile.SPEC § 12). */
export function giftText(gift, name = 'Pilou') {
  const first = gift.text.replace('{name}', name)
  return gift.day === WEEK_DAYS ? `${first} La semaine est complète.` : `${first} Prochain cadeau demain.`
}

/** « Premier score dans 7 jours » / « … demain » (ile.SPEC § 7). */
export function digestionCountdown(daysLeft) {
  if (daysLeft <= 0) return 'Confort digestif : premier score prêt'
  if (daysLeft === 1) return 'Confort digestif : premier score demain.'
  return `Confort digestif : premier score dans ${daysLeft} jours.`
}

/**
 * @param {{ noted: number, todayNoted: boolean }} wellbeing jours notés du bien-être (Objectifs) et si aujourd'hui l'est
 * @param {{ now?: Date, storage?: Storage }} [opts]
 * @returns {{ state: 'week'|'ready'|'done', day: number, filled: number, gifts: Array<{ day, id, name, text,
 *   given: boolean }>, todayGift: object|null }}
 *   `week` : la barre ; `ready` : le jour où la semaine se termine (carte des analyses) ; `done` : plus rien.
 */
export function firstWeek({ noted = 0, todayNoted = false } = {}, { now = new Date(), storage = globalThis.localStorage } = {}) {
  const saved = read(storage)
  const today = localDateKey(now.toISOString())
  const opened = new Set(Array.isArray(saved.opened) ? saved.opened : [])
  const filled = Math.min(WEEK_DAYS, Math.max(0, noted))
  if (filled >= WEEK_DAYS) {
    // Déjà plus d'une semaine notée avant la refonte, sans jamais avoir vu la barre : rien à fêter
    if (!saved.readyOn && !opened.size) {
      write(storage, { ...saved, readyOn: 'avant', seen: true })
      return { state: 'done', day: WEEK_DAYS, filled, gifts: GIFTS.map((g) => ({ ...g, given: true })), todayGift: null }
    }
    // La semaine se termine : la carte des analyses reste le jour même, et tant qu'on ne l'a pas ouverte
    if (!saved.readyOn) write(storage, { ...saved, readyOn: today })
    const readyOn = saved.readyOn ?? today
    const state = !saved.seen || readyOn === today ? 'ready' : 'done'
    return { state, day: WEEK_DAYS, filled, gifts: GIFTS.map((g) => ({ ...g, given: true })), todayGift: null,
      rainbowGiven: opened.has(WEEK_DAYS) }
  }
  // Le jour en cours : celui qui vient après les jours déjà notés (aujourd'hui compte dès qu'il est noté)
  const day = Math.min(WEEK_DAYS, todayNoted ? filled : filled + 1)
  // Les cadeaux des jours passés sont donnés ; celui d'aujourd'hui attend d'être ouvert
  const gifts = GIFTS.map((g) => ({ ...g, given: g.day < day || opened.has(g.day) }))
  const todayGift = opened.has(day) || saved.giftOn === today ? null : GIFTS[day - 1]
  // Le cadeau ouvert aujourd'hui : son texte reste affiché jusqu'au soir
  const giftToday = saved.giftOn === today && Number.isInteger(saved.lastGift) ? GIFTS[saved.lastGift - 1] ?? null : null
  return { state: 'week', day, filled, gifts, todayGift, giftToday }
}

/** Le cadeau du jour est ouvert : il ne revient pas, et aucun autre n'arrive avant demain. */
export function openGift(day, { now = new Date(), storage = globalThis.localStorage } = {}) {
  const saved = read(storage)
  const opened = new Set(Array.isArray(saved.opened) ? saved.opened : [])
  opened.add(day)
  write(storage, { ...saved, opened: [...opened].sort((a, b) => a - b), giftOn: localDateKey(now.toISOString()), lastGift: day })
}

/** Jours notés du bien-être d'après les états du jour (même compte que l'onglet Objectifs). */
export function wellbeingDays(states, now = new Date()) {
  const today = localDateKey(now.toISOString())
  const days = (states?.days || []).filter((d) => !d.future && d.observed?.wellbeing)
  return { noted: days.length, todayNoted: days.some((d) => d.date === today) }
}

/** « Découvrir » a été touché : la carte des premières analyses ne revient plus les jours suivants. */
export function markReadySeen({ storage = globalThis.localStorage } = {}) {
  write(storage, { ...read(storage), seen: true })
}
