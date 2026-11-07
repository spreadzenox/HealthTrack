import { useState, useEffect, useCallback, useMemo } from 'react'
import WellbeingPrompt from '../components/WellbeingPrompt'
import CigaretteQuickAdd from '../components/CigaretteQuickAdd'
import { shouldShowCigaretteCounter } from '../settings/cigaretteCounter'
import DayStatusCard from '../components/DayStatusCard'
import PaymentIssueCard from '../components/PaymentIssueCard'
import LaunchEndCard from '../components/LaunchEndCard'
import { loadWellbeingToday } from '../services/mood/faceMoodData'
import { loadJournalEntries } from '../services/journalEntries'
import { buildDailyJournal } from '../services/dailyJournal'
import { localDateKey } from '../services/analysisEngine'
import { GutCard, PistesTeaser } from '../components/TodayCards'
import TodayBySource from '../components/TodayBySource'
import { useDetailsMode } from '../hooks/useDetailsMode'
import { headerLine, measureTiles } from '../services/today'
import { APP_NAME } from '../config/brand'
import { homeFocus, gutCardMode, shouldShowUnlockReminder, dismissUnlockReminder } from '../settings/onboarding'
import { describeFaceUnlock, getFaceSenseStatus } from '../services/faceSense'
import NoteSection from '../components/NoteSection'
import DayChanges from '../components/DayChanges'

export default function Dashboard() {
  // Entrées des derniers jours : tuiles du jour et compteur de cigarettes (le journal des jours est dans l'onglet Journal)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wellbeingOpen, setWellbeingOpen] = useState(false)
  // Écarts de « Ce qui change aujourd'hui », relus par la carte des analyses (TESTEUR-1d-3)
  const [dayChanges, setDayChanges] = useState(null)
  const [details, toggleDetails] = useDetailsMode()
  // L'objectif choisi règle l'Accueil : la carte des pistes parle sommeil avec « énergie et sommeil » (I155), la
  // carte ventre n'apparaît qu'avec « Mon ventre » (POL-4 ; aucune note effacée)
  const [focus] = useState(() => homeFocus())
  const [gutMode] = useState(() => gutCardMode())
  // Bien-être estimé (visage) : undefined pendant la lecture, null sans aucune lecture avec un visage
  const [wellbeing, setWellbeing] = useState(undefined)
  // Rappel discret de la lecture au déverrouillage (POL-PLAY-84), une seule fois, pour qui a dit « Plus tard »
  const [unlockReminder, setUnlockReminder] = useState(false)
  useEffect(() => {
    if (!shouldShowUnlockReminder(undefined, { state: 'off' })) return undefined
    let alive = true
    getFaceSenseStatus()
      .then((s) => { if (alive) setUnlockReminder(shouldShowUnlockReminder(undefined, describeFaceUnlock(s))) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  const closeUnlockReminder = useCallback(() => {
    dismissUnlockReminder()
    setUnlockReminder(false)
  }, [])
  const days = useMemo(() => buildDailyJournal(entries), [entries])
  // Aucune donnée : pas de renvoi vers un Journal et des Tendances vides (VC-26)
  const empty = days.length === 0

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
  const yesterdayKey = localDateKey(new Date(Date.now() - 86_400_000).toISOString())
  const yesterdaySummary = days.find((d) => d.dateKey === yesterdayKey)?.summary ?? null
  const tiles = useMemo(() => measureTiles(todaySummary, entries, new Date(), yesterdaySummary),
    [todaySummary, yesterdaySummary, entries])

  const head = headerLine()

  return (
    <section className="dashboard">
      <header className="today-head">
        <p className="today-dateline">{head.date}</p>
        <p className="today-hello">{head.hello}</p>
      </header>
      <PaymentIssueCard />
      <LaunchEndCard />
      {/* Présentation utile au premier lancement seulement, en une phrase (VC-26) ; les sources se branchent pendant
          l'accueil et restent dans l'onglet Sources. */}
      {!loading && !error && empty && (
        <p className="dashboard-intro">
          Notez {focus === 'gut' ? 'vos repas et votre ventre' : 'vos repas'} en un geste : {APP_NAME} vous aide à
          comprendre ce qui va avec vos bons et mauvais jours.
        </p>
      )}

      {/* TESTEUR-1c : le statut du jour remplace le titre et la carte « Bien-être estimé » (détails dans l'historique). */}
      <DayStatusCard data={loading ? undefined : wellbeing} entries={entries}
        onAddManual={() => setWellbeingOpen(true)} unlockReminder={unlockReminder}
        onDismissReminder={closeUnlockReminder} />
      {/* Ordre de la maquette du 07/11 : statut, ce qui change, analyses, données du jour, puis un seul endroit pour
          noter (TESTEUR-1d). */}
      {!loading && !error && !empty && <DayChanges onItems={setDayChanges} />}
      <PistesTeaser focus={focus} details={details} onToggleDetails={toggleDetails} todayChanges={dayChanges} />
      {!loading && !error && (
        <TodayBySource tiles={tiles} summary={todaySummary} entries={entries} showGut={gutMode !== 'hide'} />
      )}

      <NoteSection
        onWellbeing={() => setWellbeingOpen(true)}
        gut={gutMode !== 'hide' && (
          <GutCard title="Mon ventre" details={details} onToggleDetails={toggleDetails}
            onlyIfUsed={gutMode === 'used'} />
        )}
        other={!loading && shouldShowCigaretteCounter(entries) && <CigaretteQuickAdd />}
      />

      <WellbeingPrompt open={wellbeingOpen} onClose={() => setWellbeingOpen(false)} />

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Chargement des données…</p>
        </div>
      )}
      {error && <div className="error-msg" role="alert">{error}</div>}

    </section>
  )
}
