/**
 * Entrées de la barre de la première semaine : les jours notés du bien-être et le délai du confort digestif, comptés
 * comme l'onglet Objectifs (un jour observé = une note de bien-être ou une lecture du visage ; une note du ventre
 * pour la digestion : services/method/stateSpace.js).
 *
 * L'Accueil ne lance jamais le calcul complet des états du jour (budget de lectures, `npm run perf`) : il relit son
 * résultat s'il est en cache, et sinon compte lui-même sur les 45 derniers jours, en peu de lectures. Le plus grand
 * des deux comptes l'emporte (un vieux résultat en cache ne fait jamais reculer la barre).
 */
import { useEffect, useState } from 'react'
import { peekAnalysis, lastAnalysis } from '../../services/analysisRunner'
import { FIRST_SCORE_DAY } from '../../config/firstResults'
import { listEntries } from '../../storage/localHealthStorage'
import { observationsFromEntries } from '../../services/method/stateSpace'
import { localDateKey } from '../../services/analysisEngine'
import { FACE_BURST_TYPE } from '../../services/faceBursts'
import { GUT_TYPE } from '../../services/today'
import { wellbeingDays } from './firstWeek'

const WINDOW_DAYS = 45

/** Jours avant le premier score du confort digestif (même compte que objectiveCard). */
export function digestionDaysLeft(states) {
  const noted = (states?.days || []).filter((d) => !d.future && d.observed?.digestion).length
  return Math.max(0, FIRST_SCORE_DAY.digestion - noted)
}

/** Compte léger, sur des entrées récentes : même règle que les états du jour. */
export function countObserved(entries, now = new Date()) {
  const today = localDateKey(now.toISOString())
  const obs = observationsFromEntries(entries)
  const wDays = [...obs.wellbeing.keys()].filter((dk) => dk <= today)
  const dDays = [...obs.digestion].filter(([dk, o]) => dk <= today && Number.isFinite(o?.gut)).length
  return {
    wellbeing: { noted: wDays.length, todayNoted: wDays.includes(today) },
    gut: { daysLeft: Math.max(0, FIRST_SCORE_DAY.digestion - dDays) },
  }
}

function fromStates(states) {
  return { wellbeing: wellbeingDays(states), gut: { daysLeft: digestionDaysLeft(states) } }
}

/** Le plus avancé des deux comptes. */
export function mergeCounts(a, b) {
  if (!a) return b
  if (!b) return a
  return {
    wellbeing: {
      noted: Math.max(a.wellbeing.noted, b.wellbeing.noted),
      todayNoted: a.wellbeing.todayNoted || b.wellbeing.todayNoted,
    },
    gut: { daysLeft: Math.min(a.gut.daysLeft, b.gut.daysLeft) },
  }
}

async function lightCount(now = new Date()) {
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000).toISOString()
  const [notes, faces, gut] = await Promise.all([
    listEntries({ type: 'wellbeing', since, limit: 200 }),
    listEntries({ type: FACE_BURST_TYPE, since, limit: 600 }),
    listEntries({ type: GUT_TYPE, since, limit: 200 }),
  ])
  return countObserved([...notes, ...faces, ...gut], now)
}

export function useFirstWeekInputs() {
  const [inputs, setInputs] = useState(() => {
    const peek = peekAnalysis('dayStates')
    return peek.hit && peek.result ? fromStates(peek.result) : { wellbeing: null, gut: null }
  })
  useEffect(() => {
    let alive = true
    const load = () => {
      const peek = peekAnalysis('dayStates')
      const cached = peek.hit && peek.result ? fromStates(peek.result) : null
      const stale = lastAnalysis('dayStates')
      lightCount()
        .then((light) => {
          if (alive) setInputs(mergeCounts(mergeCounts(light, cached), stale ? fromStates(stale) : null))
        })
        .catch(() => { if (alive && !cached) setInputs(countObserved([])) })
    }
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [])
  return inputs
}
