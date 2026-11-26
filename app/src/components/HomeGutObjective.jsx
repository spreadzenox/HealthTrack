/**
 * Accueil, sous l'île : la carte Confort digestif pour qui a choisi cet objectif (brief § 4 : « les cartes des
 * objectifs (score sur 7 jours, tendance) » ; constat de la persona « Ventre, sans technique » du 25/11). Le
 * bien-être a déjà sa carte du jour (DayStatusCard) ; celle-ci reprend telle quelle la carte de l'onglet Objectifs.
 * Budget de lectures de l'Accueil (perf) : jamais de calcul ici, seulement le dernier résultat gardé (comme
 * useFirstWeekInputs) ; tant qu'Objectifs, Données ou l'îlot ne l'ont pas calculé, la carte n'apparaît pas.
 */
import { useEffect, useState } from 'react'
import { lastAnalysis, peekAnalysis } from '../services/analysisRunner'
import { objectiveCard } from '../services/objectivesOverview'
import { ObjectiveCard } from '../pages/Objectives'

// undefined : rien de calculé encore ; null : calculé, sans aucune donnée
const readStates = () => {
  const peek = peekAnalysis('dayStates')
  return peek.hit ? peek.result : (lastAnalysis('dayStates') ?? undefined)
}

export default function HomeGutObjective({ read = readStates, now }) {
  const [states, setStates] = useState(undefined)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const onUpdate = () => setRevision((r) => r + 1)
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [])
  useEffect(() => {
    let alive = true
    Promise.resolve().then(read).then((s) => alive && setStates(s)).catch(() => alive && setStates(undefined))
    return () => {
      alive = false
    }
  }, [read, revision])
  if (states === undefined) return null
  return (
    <ul className="objectives-list home-objectives">
      <ObjectiveCard card={objectiveCard('digestion', states, now || new Date())} />
    </ul>
  )
}
