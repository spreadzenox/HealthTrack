import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import WellbeingPrompt from './WellbeingPrompt'
import JournalEmpty from './JournalEmpty'
import { groupCigarettes } from '../utils/entries'
import { buildDailyJournal, dayHeading } from '../services/dailyJournal'
import { useNutritionTable } from '../data/nutritionTable'
import { INITIAL_DAYS, MORE_DAYS, loadJournalEntries } from '../services/journalEntries'
import { chipKey, chipTheme, chipValueBreaks, summaryChips } from '../services/journalChips'
import { measureNorms, normSinceFromChanges, readDeviationEntries } from '../services/dayDeviations'
import { lastAnalysis } from '../services/analysisRunner'
import LineIcon from './LineIcon'
import { monoDigits } from '../utils/monoDigits'
import Ordinal from './Ordinal'
import { CigaretteGroupRow, CycleLine, EntryItem } from './DayEntries'
import { readCycle } from '../services/cycleRead'
import './TodayCards.css'

/** Icône de chaque mesure du jour (ORG-2, leçon 9 : une icône pour toutes les mesures). */
const CHIP_ICONS = {
  sleepMinutes: 'moon', watchSleepScore: 'star', sleepHr: 'heart', steps: 'steps', restingHr: 'heart', hrv: 'pulse',
  hrvDay: 'pulse', spo2: 'drop', respiratoryRate: 'wind', temperatureC: 'thermo', skinTempC: 'thermo', watchStress: 'gauge',
  bloodPressure: 'heart', glucoseMgDl: 'drop', heartRate: 'heart', burnedKcal: 'flame', wellbeing: 'smile', meals: 'meal',
  workouts: 'dumbbell',
  screenMinutes: 'phone', socialMinutes: 'phone', weather: 'sun',
}
/** Mesure du résumé → mesure comparée à votre norme (dayDeviations, AUJ-3b). */
const NORM_KEYS = { sleepMinutes: 'sleep', hrv: 'hrv', restingHr: 'restingHr', steps: 'steps', screenMinutes: 'screen' }
/** Mesure du résumé → sa courbe dans Journal › Tendances (POLISH-SIM-36 : une tuile touchée l'ouvre, comme Aujourd'hui). */
const TREND_KEYS = {
  sleepMinutes: 'sleep', steps: 'steps', hrv: 'hrv', restingHr: 'restingHr', screenMinutes: 'screen', wellbeing: 'wellbeing',
}
/** Jours relus pour les normes : 14 jours avant le plus ancien jour affiché (14 jours de journal au plus). */
const NORM_EXTRA_DAYS = 15

/**
 * Normes du jour `dateKey`, depuis le dernier changement durable de la mesure (TS-2). Dans les 14 derniers jours : la
 * même habitude qu'aujourd'hui, donc le même chiffre que l'Accueil (POLISH-SIM-11) ; plus ancien : les 14 jours qui
 * le précèdent (un jour passé est fini).
 */
function normsOf(normDays, dateKey, since) {
  if (!normDays) return {}
  const today = new Date()
  const current = measureNorms(normDays, today, { since, dayKey: dateKey })
  if (Object.keys(current.norms).length || current.ready) return current.norms
  return measureNorms(normDays, new Date(`${dateKey}T23:59:00`), { since }).norms
}

/**
 * « Vos derniers jours » : le journal par jour (résumé chiffré, saisies et événements avec leur heure), déplacé de
 * l'accueil vers l'onglet Journal (jalon 2c-2). Modifier / Refaire / Supprimer restent sur place. Les saisies et la
 * ligne du cycle viennent de DayEntries (étape 7a), qui les montre aussi dans le détail du jour de Tendances.
 */

function DayCard({ day, onEdit, editingMealId, onEditMeal, onRedoMeal, normDays = null, normSince = {}, cycle = null }) {
  const { title, date } = dayHeading(day.dateKey)
  const norms = normsOf(normDays, day.dateKey, normSince)
  const chips = summaryChips(day.summary)
  const measuredScreen = day.summary?.screenMinutes != null
  return (
    <li className="day-card">
      <h4 className="day-card-title">
        {title} <span className="day-card-date">{date}</span>
        {cycle?.cycleDay && !cycle.period && (
          <span className="day-card-cycle"><Ordinal n={cycle.cycleDay} /> jour du cycle</span>
        )}
      </h4>
      <CycleLine info={cycle} dateKey={day.dateKey} />
      {chips.length > 0 && (
        <dl className="day-summary">
          {chips.map(([label, value, note]) => {
            const key = chipKey(label)
            const n = note ? null : norms[NORM_KEYS[key]]
            return (
              <div key={label} className="day-summary-item" data-theme={chipTheme(label)}>
                <dt><LineIcon name={CHIP_ICONS[key] ?? 'dots'} size={14} />{label}</dt>
                <dd>
                  {monoDigits(chipValueBreaks(value))}
                  {TREND_KEYS[key] && (
                    <Link to={`/tendances?mesure=${TREND_KEYS[key]}`} className="day-summary-link" aria-label={`${label} : ${value}. Voir la courbe`} />
                  )}
                </dd>
                {note && <dd className="day-summary-usual">{note}</dd>}
                {n?.direction && (
                  <dd className="day-summary-usual" aria-label={n.text}>
                    {n.direction === 'up' ? '↑' : '↓'} d’habitude <span style={{ whiteSpace: 'nowrap' }}>{monoDigits(n.usualValue)}</span>
                  </dd>
                )}
              </div>
            )
          })}
        </dl>
      )}
      {day.items.length > 0 && (
        <ul className="entries-list">
          {groupCigarettes(day.items).map((e) => e.type === 'cigarette_group' ? (
            <CigaretteGroupRow key={e.id} group={e} />
          ) : (
            <EntryItem
              key={e.id}
              e={e}
              measuredScreen={measuredScreen}
              onEdit={onEdit}
              editingMealId={editingMealId}
              onEditMeal={onEditMeal}
              onRedoMeal={onRedoMeal}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function DailyJournal() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingWellbeing, setEditingWellbeing] = useState(null)
  const [editingMealId, setEditingMealId] = useState(null)
  const navigate = useNavigate()
  const redoMeal = useCallback((meal) => navigate('/food', { state: { redoMeal: meal } }), [navigate])
  const [visibleDays, setVisibleDays] = useState(INITIAL_DAYS)
  // Selles en photo (SELLES-PHOTO-2) : ici seulement, et comme la carte ventre, pas pour un autre objectif
  // kcal des repas : table Ciqual chargée à la demande, journal recalculé à son arrivée
  const nutritionTable = useNutritionTable()
  const [hiddenKey, setHiddenKey] = useState(null)
  // AUJ-3b : l'écart à votre norme sur chaque mesure, comme sur l'Accueil (lu à part, quelques types)
  const [normDays, setNormDays] = useState(null)
  const [normSince, setNormSince] = useState({})
  useEffect(() => {
    let alive = true
    const load = () => readDeviationEntries(new Date(), NORM_EXTRA_DAYS)
      .then((list) => {
        if (!alive) return
        // TS-2 : la norme repart du dernier changement durable (dernier calcul connu, aucun calcul ici)
        setNormSince(normSinceFromChanges(lastAnalysis('changes')))
        setNormDays(buildDailyJournal(list))
      })
      .catch(() => {})
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [])
  const days = useMemo(
    () => buildDailyJournal(entries).filter((d) => d.dateKey !== hiddenKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, hiddenKey, nutritionTable],
  )
  // CYCLE-1b : règles et jour du cycle, lus à part (le jour du cycle remonte aux dernières règles)
  const [cycleOf, setCycleOf] = useState(null)
  useEffect(() => {
    let alive = true
    const load = () => readCycle().then((f) => { if (alive) setCycleOf(() => f) }).catch(() => {})
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [])
  const cycleDays = useMemo(() => (cycleOf ? cycleOf(days.map((d) => d.dateKey)) : null), [cycleOf, days])

  // Fenêtre complète (14 jours) lue ? Un ref : les rechargements après écriture gardent la même fenêtre.
  const fullWindow = useRef(false)
  const [hasOlder, setHasOlder] = useState(false)
  const applyJournal = useCallback((r) => {
    fullWindow.current = r.full
    setHasOlder(r.hasOlder)
    setHiddenKey(r.hiddenKey)
    setEntries(r.entries)
  }, [])

  const loadEntries = useCallback(async () => {
    try {
      applyJournal(await loadJournalEntries(fullWindow.current))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [applyJournal])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await loadJournalEntries(false)
        if (!cancelled) applyJournal(r)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [applyJournal])

  useEffect(() => {
    const handler = () => loadEntries()
    window.addEventListener('health-entries-updated', handler)
    return () => window.removeEventListener('health-entries-updated', handler)
  }, [loadEntries])

  const showOlderDays = useCallback(() => {
    setVisibleDays((n) => n + MORE_DAYS)
    if (!fullWindow.current) {
      fullWindow.current = true
      loadEntries()
    }
  }, [loadEntries])

  return (
    <section className="daily-journal" aria-labelledby="daily-journal-title">
      <h2 id="daily-journal-title" className="page-title">Vos derniers jours</h2>
      <WellbeingPrompt
        open={editingWellbeing !== null}
        entry={editingWellbeing}
        onClose={() => setEditingWellbeing(null)}
      />
      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Chargement des données…</p>
        </div>
      )}
      {error && <div className="error-msg" role="alert">{error}</div>}
      {!loading && !error && (days.length === 0 ? (
        <>
          <JournalEmpty />
        </>
      ) : (
        <>
          <ul className="day-list">
            {days.slice(0, visibleDays).map((day) => (
              <DayCard
                key={day.dateKey}
                day={day}
                normDays={normDays}
                normSince={normSince}
                cycle={cycleDays?.get(day.dateKey) ?? null}
                onEdit={setEditingWellbeing}
                editingMealId={editingMealId}
                onEditMeal={setEditingMealId}
                onRedoMeal={redoMeal}
              />
            ))}
          </ul>
          {(days.length > visibleDays || hasOlder) && (
            <button
              type="button"
              className="btn btn-secondary day-more-btn"
              onClick={showOlderDays}
            >
              Voir les jours précédents
            </button>
          )}
        </>
      ))}
    </section>
  )
}
