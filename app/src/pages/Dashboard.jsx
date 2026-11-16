import SeeExample from '../components/SeeExample'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
import DayChecklist from '../components/DayChecklist'
import YesterdayHabits from '../components/YesterdayHabits'
import StoolPhotoLine from '../components/StoolPhotoLine'
import TodayBySource from '../components/TodayBySource'
import { useDetailsMode } from '../hooks/useDetailsMode'
import { headerLine, measureTiles } from '../services/today'
import { gutAsked, gutCardMode, shouldShowUnlockReminder, dismissUnlockReminder } from '../settings/onboarding'
import { describeFaceUnlock, getFaceSenseStatus } from '../services/faceSense'
import AddStrip from '../components/AddStrip'
import PeriodSheet from '../components/PeriodSheet'
import { listEntries, createEntry, deleteEntry } from '../storage/localHealthStorage'
import { habitEntry, yesterdayCatchUp, skipYesterday } from '../services/habits'
import { getHabits } from '../settings/habits'
import { CYCLE_TYPE, cycleVisible } from '../services/cycle'
import { goalsOf } from '../settings/onboarding'

/**
 * Refonte « Compagnon », étape 2 : l'ancien écran Aujourd'hui est rangé dans deux onglets. `view="home"` (Accueil) :
 * le bien-être du jour, les mesures, le lien vers Agir. `view="day"` (Ma journée) : ce qui se note à la main, la
 * checklist du jour d'abord (étape 3), puis le bandeau d'ajout et le bloc digestif. Pilou arrive à l'étape 8.
 */
export default function Dashboard({ view = 'home' }) {
  const home = view === 'home'
  const day = !home
  // Entrées des derniers jours : tuiles du jour et compteur de cigarettes (le journal des jours est dans l'onglet Journal)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wellbeingOpen, setWellbeingOpen] = useState(false)
  // « Déjà noté » de Ma journée rouvre la note du jour pour la modifier
  const [wellbeingEntry, setWellbeingEntry] = useState(undefined)
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

  // Refonte étape 4 : les habitudes suivies (Réglages), une ligne oui ou non chacune dans la checklist
  const [habits] = useState(() => getHabits())
  // `dateKey` : la carte « Hier » répond pour la veille (REFONTE-7c-2), la checklist pour aujourd'hui
  const answerHabit = useCallback(async (habit, done, dateKey) => {
    try {
      await createEntry(habitEntry(habit, dateKey || localDateKey(new Date().toISOString()), done))
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
    } catch (e) {
      setError(e.message)
    }
  }, [])
  const undoHabit = useCallback(async (entry) => {
    try {
      await deleteEntry(entry.id)
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const [, setSkipTick] = useState(0)
  const catchUp = day && !loading ? yesterdayCatchUp(entries, habits) : null
  const skipCatchUp = useCallback((dateKey) => { skipYesterday(dateKey); setSkipTick((t) => t + 1) }, [])

  const head = headerLine()
  // Refonte étape 1 : sans l'objectif digestion, on ne demande pas le ventre (sauf à qui le note déjà)
  const askGut = gutAsked(gutMode, entries)

  return (
    <section className="dashboard">
      <header className="today-head">
        <h1 className="today-date">{day ? 'Ma journée' : head.date}</h1>
      </header>
      {/* « Hier » : les habitudes de la veille restées sans réponse, en tête de liste (journee.SPEC § 10). */}
      {day && !error && <YesterdayHabits catchUp={catchUp} onAnswer={answerHabit} onSkip={skipCatchUp} />}
      {/* Refonte étape 3 : la checklist du jour, ce qu'il reste à noter et ce qui l'est déjà. */}
      {day && !loading && !error && (
        <DayChecklist entries={entries} askGut={askGut} habits={habits}
          onWellbeing={(entry) => { setWellbeingEntry(entry); setWellbeingOpen(true) }}
          onGut={() => setAddOpen('digestion')} onHabit={answerHabit} onHabitUndo={undoHabit} />
      )}
      {day && !loading && !error && habits.length === 0 && (
        <Link to="/settings" className="day-habits-link">Suivre une habitude</Link>
      )}
      {/* Le seul vrai endroit pour ajouter le reste (AUJ-1), sous la checklist. */}
      {day && (
        <AddStrip
          open={addOpen}
          onOpenChange={setAddOpen}
          onWellbeing={() => { setWellbeingEntry(undefined); setWellbeingOpen(true) }}
          digestion={askGut ? <GutCard title="Ma digestion" details={details} onToggleDetails={toggleDetails} /> : null}
          stool={askGut ? <StoolPhotoLine /> : null}
          period={cycleOn ? <PeriodSheet /> : null}
          cigarette={!loading && <CigaretteQuickAdd />}
          cigaretteInStrip={!loading && shouldShowCigaretteCounter(entries)}
          onCountCigarettes={() => { setCigaretteCounterPinned(true); setCigaretteTick((t) => t + 1) }}
        />
      )}
      {home && <PaymentIssueCard />}
      {home && <LaunchEndCard />}
      {/* AUJ-2 : le bien-être du jour (valeur, lectures, courbe) ; détails dans l'historique. */}
      {home && (
        <DayStatusCard data={loading ? undefined : wellbeing} entries={entries}
          onAddManual={() => setWellbeingOpen(true)} onReminder={eveningNotePlugin() ? () => setWellbeingOpen('reminder') : undefined}
          unlockReminder={unlockReminder}
          onDismissReminder={closeUnlockReminder} />
      )}
      {/* AUJ-3 : vos données du jour, un bloc, l'écart à votre norme sur chaque mesure. */}
      {home && !loading && !error && (
        <TodayBySource tiles={tiles} summary={todaySummary} entries={entries} />
      )}
      {/* Agir n'a plus d'onglet : il se range sous l'Accueil (brief § 4), en attendant les défis d'Objectifs (étape 6). */}
      {home && !loading && (
        <Link to="/agir" className="more-item home-act-link">
          <span className="more-text">
            <span className="more-title">Agir</span>
            <span className="more-desc">Vérifier une piste par un essai</span>
          </span>
          <span className="more-chevron" aria-hidden="true">›</span>
        </Link>
      )}
      {/* AUJ-4 : le bloc digestif ; les résultats des analyses n'ont qu'une maison (leçon 16). */}
      {day && !loading && askGut && <DigestBlock onNote={() => setAddOpen('digestion')}
        meals={entries.filter((e) => e.type === 'food' && e.at && localDateKey(e.at) === todayKey)} />}

      <WellbeingPrompt open={!!wellbeingOpen} initialMode={wellbeingOpen === 'reminder' ? 'reminder' : 'now'}
        entry={wellbeingEntry} onClose={() => { setWellbeingOpen(false); setWellbeingEntry(undefined) }} />

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Chargement des données…</p>
        </div>
      )}
      {error && <div className="error-msg" role="alert">{error}</div>}
      {home && <SeeExample />}
    </section>
  )
}
