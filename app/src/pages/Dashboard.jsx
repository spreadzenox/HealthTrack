import SeeExample from '../components/SeeExample'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { eveningNotePlugin } from '../services/eveningNote'
import WellbeingPrompt from '../components/WellbeingPrompt'
import CigaretteQuickAdd from '../components/CigaretteQuickAdd'
import { shouldShowCigaretteCounter, setCigaretteCounterPinned } from '../settings/cigaretteCounter'
import DayStatusCard from '../components/DayStatusCard'
import PaymentIssueCard from '../components/PaymentIssueCard'
import LaunchEndCard from '../components/LaunchEndCard'
import { loadWellbeingToday } from '../services/mood/faceMoodData'
import { loadJournalEntries } from '../services/journalEntries'
import { buildDailyJournal } from '../services/dailyJournal'
import { localDateKey } from '../services/analysisEngine'
import { GutCard } from '../components/TodayCards'
import DigestBlock from '../components/DigestBlock'
import TodayMeals from '../components/TodayMeals'
import StoolPhotoLine from '../components/StoolPhotoLine'
import TodayBySource from '../components/TodayBySource'
import { useDetailsMode } from '../hooks/useDetailsMode'
import { headerLine, measureTiles } from '../services/today'
import { gutCardMode, shouldShowUnlockReminder, dismissUnlockReminder } from '../settings/onboarding'
import { describeFaceUnlock, getFaceSenseStatus } from '../services/faceSense'
import AddStrip from '../components/AddStrip'
import PeriodSheet from '../components/PeriodSheet'
import { listEntries } from '../storage/localHealthStorage'
import { CYCLE_TYPE, cycleVisible } from '../services/cycle'
import { goalsOf } from '../settings/onboarding'

export default function Dashboard() {
  // Entrées des derniers jours : tuiles du jour et compteur de cigarettes (le journal des jours est dans l'onglet Journal)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wellbeingOpen, setWellbeingOpen] = useState(false)
  // Écarts de « Ce qui change aujourd'hui », relus par la carte des analyses (TESTEUR-1d-3)
  // « Noter maintenant » d'Analyses › Digestion arrive ici avec la fenêtre « Ma digestion » ouverte (ORG-4)
  const location = useLocation()
  const [addOpen, setAddOpen] = useState(() => (location.state?.open === 'digestion' ? 'digestion' : null))
  const [details, toggleDetails] = useDetailsMode()
  // L'objectif choisi règle l'Accueil : la carte des pistes parle sommeil avec « énergie et sommeil » (I155), la
  // carte ventre n'apparaît qu'avec « Mon ventre » (POL-4 ; aucune note effacée)
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
  // POLISH-SIM-42 : « Je fume : compter mes cigarettes » met le compteur dans le bandeau (relu au rendu)
  const [, setCigaretteTick] = useState(0)
  // CYCLE-2 : « Règles » dans le bandeau avec « Mon cycle », ou dès qu'une donnée de cycle existe
  const [cycleOn, setCycleOn] = useState(() => cycleVisible(goalsOf(), false))
  useEffect(() => {
    if (cycleOn) return undefined
    let alive = true
    listEntries({ type: CYCLE_TYPE, limit: 1 })
      .then((rows) => { if (alive && rows.length) setCycleOn(true) })
      .catch(() => {})
    return () => { alive = false }
  }, [cycleOn])

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
        <h1 className="today-date">{head.date}</h1>
      </header>
      {/* Nouvel écran Aujourd'hui (07/11, AUJ-1) : le seul vrai endroit pour ajouter, juste sous la date. */}
      <AddStrip
        open={addOpen}
        onOpenChange={setAddOpen}
        onWellbeing={() => setWellbeingOpen(true)}
        digestion={<GutCard title="Ma digestion" details={details} onToggleDetails={toggleDetails} />}
        stool={gutMode !== 'hide' ? <StoolPhotoLine /> : null}
        period={cycleOn ? <PeriodSheet /> : null}
        cigarette={!loading && <CigaretteQuickAdd />}
        cigaretteInStrip={!loading && shouldShowCigaretteCounter(entries)}
        onCountCigarettes={() => { setCigaretteCounterPinned(true); setCigaretteTick((t) => t + 1) }}
      />
      <PaymentIssueCard />
      <LaunchEndCard />
      {/* AUJ-2 : le bien-être du jour (valeur, lectures, courbe) ; détails dans l'historique. */}
      <DayStatusCard data={loading ? undefined : wellbeing} entries={entries}
        onAddManual={() => setWellbeingOpen(true)} onReminder={eveningNotePlugin() ? () => setWellbeingOpen('reminder') : undefined}
        unlockReminder={unlockReminder}
        onDismissReminder={closeUnlockReminder} />
      {/* AUJ-3 : vos données du jour, un bloc, l'écart à votre norme sur chaque mesure ; puis les analyses. */}
      {!loading && !error && (
        <TodayBySource tiles={tiles} summary={todaySummary} entries={entries} />
      )}
      {/* AUJ-4 : le bloc digestif ; les résultats des analyses n'ont qu'une maison, l'onglet Analyses (leçon 16). */}
      {!loading && gutMode !== 'hide' && <DigestBlock onNote={() => setAddOpen('digestion')}
        meals={entries.filter((e) => e.type === 'food' && e.at && localDateKey(e.at) === todayKey)} />}
      {/* AUJ-5 : les repas du jour, ou un bouton qui ouvre l'appareil photo. */}
      {!loading && !error && <TodayMeals entries={entries} />}


      <WellbeingPrompt open={!!wellbeingOpen} initialMode={wellbeingOpen === 'reminder' ? 'reminder' : 'now'}
        onClose={() => setWellbeingOpen(false)} />

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Chargement des données…</p>
        </div>
      )}
      {error && <div className="error-msg" role="alert">{error}</div>}
      <SeeExample />
    </section>
  )
}
