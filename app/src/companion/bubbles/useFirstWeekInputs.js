/**
 * Entrées de la barre de la première semaine : les jours notés du bien-être et le délai du confort digestif, lus
 * dans les états du jour (tâche `dayStates`, la même que l'onglet Objectifs : un seul compte dans toute l'app).
 */
import { useEffect, useState } from 'react'
import { getAnalysis, peekAnalysis } from '../../services/analysisRunner'
import { FIRST_SCORE_DAY } from '../../config/firstResults'
import { wellbeingDays } from './firstWeek'

/** Jours avant le premier score du confort digestif (même compte que objectiveCard). */
export function digestionDaysLeft(states) {
  const noted = (states?.days || []).filter((d) => !d.future && d.observed?.digestion).length
  return Math.max(0, FIRST_SCORE_DAY.digestion - noted)
}

/** Sans états (aucune donnée encore), zéro jour noté : la barre commence au jour 1. */
function inputsOf(states) {
  return { wellbeing: wellbeingDays(states), gut: { daysLeft: digestionDaysLeft(states) } }
}

export function useFirstWeekInputs() {
  const [inputs, setInputs] = useState(() => {
    const peek = peekAnalysis('dayStates')
    return peek.hit ? inputsOf(peek.result ?? null) : { wellbeing: null, gut: null }
  })
  useEffect(() => {
    let alive = true
    const load = () => getAnalysis('dayStates')
      .then((s) => { if (alive) setInputs(inputsOf(s)) })
      .catch(() => { if (alive) setInputs(inputsOf(null)) })
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [])
  return inputs
}
