import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEntries } from '../storage/localHealthStorage'
import { GUT_TYPE } from '../services/today'
import { FODMAP_CHALLENGE_TYPE, currentChallenge } from '../services/fodmapChallenge'
import { challengeSummary } from '../services/fodmapReminder'

const GUT_WINDOW_DAYS = 120

async function readSummary() {
  const now = new Date()
  const since = new Date(now.getTime() - GUT_WINDOW_DAYS * 86_400_000).toISOString()
  const [challenges, gut] = await Promise.all([
    listEntries({ type: FODMAP_CHALLENGE_TYPE, limit: Infinity }),
    listEntries({ type: GUT_TYPE, since, limit: Infinity }),
  ])
  return challengeSummary(currentChallenge(challenges, gut, now))
}

/**
 * Carte lilas d'Analyses (objectif « Mon ventre ») qui ouvre la réintroduction guidée (jalon 7b) ; pendant un test,
 * son état en une ligne (« Lait · jour 2 · portion à prendre »).
 */
export default function ReintroductionEntry({ read = readSummary }) {
  const [summary, setSummary] = useState(null)
  useEffect(() => {
    let alive = true
    read().then((s) => alive && setSummary(s)).catch(() => {})
    return () => {
      alive = false
    }
  }, [read])
  return (
    <Link to="/reintroduction" className="today-card fodmap-card fodmap-entry" data-testid="reintro-entry">
      <span className="today-card-title">{summary ? 'Votre test en cours' : 'Tester un groupe FODMAP'}</span>
      {summary ? (
        <span className="fodmap-tag mono fodmap-entry-state">{summary} ›</span>
      ) : (
        <p className="fodmap-entry-line">3 jours, des portions croissantes : l’app vous dit ce qui passe. ›</p>
      )}
    </Link>
  )
}
