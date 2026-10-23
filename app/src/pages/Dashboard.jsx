import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import WellbeingPrompt from '../components/WellbeingPrompt'
import CigaretteQuickAdd from '../components/CigaretteQuickAdd'
import { shouldShowCigaretteCounter } from '../settings/cigaretteCounter'
import MoodEstimateCard from '../components/MoodEstimateCard'
import { loadWellbeingToday } from '../services/mood/faceMoodData'
import { loadJournalEntries } from '../services/journalEntries'
import { buildDailyJournal } from '../services/dailyJournal'
import { localDateKey } from '../services/analysisEngine'
import { MeasureTiles, GutCard, PistesTeaser } from '../components/TodayCards'
import { useDetailsMode } from '../hooks/useDetailsMode'
import { daySummaryTitle, headerLine, measureTiles } from '../services/today'
import { APP_NAME } from '../config/brand'
import { homeFocus } from '../settings/onboarding'

export default function Dashboard() {
  // Entrées des derniers jours : tuiles du jour et compteur de cigarettes (le journal des jours est dans l'onglet Journal)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wellbeingOpen, setWellbeingOpen] = useState(false)
  const navigate = useNavigate()
  const [details, toggleDetails] = useDetailsMode()
  // L'objectif choisi règle l'ordre (I155) : avec « énergie et sommeil », le ventre passe en bas ; rien n'est masqué
  const [focus] = useState(() => homeFocus())
  // Bien-être estimé (visage) : undefined pendant la lecture, null sans aucune lecture avec un visage
  const [wellbeing, setWellbeing] = useState(undefined)
  const days = useMemo(() => buildDailyJournal(entries), [entries])

  const loadEntries = useCallback(async (isCancelled = () => false) => {
    try {
      const r = await loadJournalEntries(false)
      if (!isCancelled()) setEntries(r.entries)
    } catch (e) {
      if (!isCancelled()) setError(e.message)
    } finally {
      if (!isCancelled()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    loadEntries(() => cancelled)
    const handler = () => loadEntries(() => cancelled)
    window.addEventListener('health-entries-updated', handler)
    return () => {
      cancelled = true
      window.removeEventListener('health-entries-updated', handler)
    }
  }, [loadEntries])

  useEffect(() => {
    let cancelled = false
    const load = () => loadWellbeingToday()
      .then((d) => { if (!cancelled) setWellbeing(d) })
      .catch(() => { if (!cancelled) setWellbeing(null) })
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      cancelled = true
      window.removeEventListener('health-entries-updated', load)
    }
  }, [])

  const todayKey = localDateKey(new Date().toISOString())
  const todaySummary = days.find((d) => d.dateKey === todayKey)?.summary ?? null
  const tiles = useMemo(() => measureTiles(todaySummary, entries), [todaySummary, entries])

  return (
    <section className="dashboard">
      <header className="today-head">
        <p className="today-dateline">{headerLine()}</p>
        <h2 className="today-title">{daySummaryTitle(wellbeing?.est)}</h2>
      </header>
      {/* Présentation utile au premier lancement seulement : avec des données, elle repoussait tout le contenu. */}
      {!loading && !error && days.length === 0 && (
        <p className="dashboard-intro">
          Notez vos repas et votre ventre en un geste, ajoutez votre montre (sommeil, cœur, pas) : {APP_NAME}{' '}
          vous aide à comprendre ce qui va avec vos bons et mauvais jours. Tout reste sur le téléphone par défaut ;
          l’IA seulement si vous le voulez. Tout se règle dans <Link to="/connectors">Sources</Link>.
        </p>
      )}

      <MoodEstimateCard data={wellbeing} details={details} onToggleDetails={toggleDetails} />
      {!loading && !error && <MeasureTiles tiles={tiles} details={details} />}
      {focus !== 'energy' && <GutCard details={details} onToggleDetails={toggleDetails} />}

      <div className="today-actions">
        <button type="button" className="btn" onClick={() => navigate('/food')}>Photo du repas</button>
        <button type="button" className="btn btn-secondary" onClick={() => setWellbeingOpen(true)}>Une note</button>
      </div>
      {!loading && shouldShowCigaretteCounter(entries) && (
        <div className="dashboard-actions"><CigaretteQuickAdd /></div>
      )}

      <PistesTeaser focus={focus} details={details} onToggleDetails={toggleDetails} />
      {focus === 'energy' && <GutCard details={details} onToggleDetails={toggleDetails} />}

      <WellbeingPrompt open={wellbeingOpen} onClose={() => setWellbeingOpen(false)} />

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Chargement des données…</p>
        </div>
      )}
      {error && <div className="error-msg" role="alert">{error}</div>}

      {!loading && !error && (
        <>
          {/* Forme et courbes : Journal → Tendances (jalon 2b), l'accueil s'arrête au résumé du jour. */}
          <nav className="today-journal-links" aria-label="Plus de détails">
            <Link to="/journal" className="btn btn-secondary today-journal-link">Vos derniers jours, dans le Journal</Link>
            <Link to="/tendances" className="btn btn-secondary today-journal-link">Vos tendances, dans le Journal</Link>
          </nav>
        </>
      )}
    </section>
  )
}
