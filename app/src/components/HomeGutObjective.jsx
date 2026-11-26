/**
 * Accueil, sous l'île : la carte Confort digestif pour qui a choisi cet objectif (brief § 4 : « les cartes des
 * objectifs (score sur 7 jours, tendance) » ; constat de la persona « Ventre, sans technique » du 25/11). Le
 * bien-être a déjà sa carte du jour (DayStatusCard) ; celle-ci reprend telle quelle la carte de l'onglet Objectifs.
 */
import { useEffect, useState } from 'react'
import { getAnalysis, peekAnalysis } from '../services/analysisRunner'
import { objectiveCard } from '../services/objectivesOverview'
import { ObjectiveCard } from '../pages/Objectives'

const readStates = () => getAnalysis('dayStates').catch(() => null)

export default function HomeGutObjective({ read = readStates, now }) {
  const [states, setStates] = useState(() => peekAnalysis('dayStates').result ?? undefined)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const onUpdate = () => setRevision((r) => r + 1)
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [])
  useEffect(() => {
    let alive = true
    Promise.resolve().then(read).then((s) => alive && setStates(s ?? null)).catch(() => alive && setStates(null))
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
