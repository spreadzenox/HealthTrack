import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { weatherSummaryParts } from '../services/weather'
import { formatScreenMinutes } from '../services/phoneUsage'
import WellbeingPrompt from './WellbeingPrompt'
import DeleteEntryButton from './DeleteEntryButton'
import SavedMealEditor from './SavedMealEditor'
import { groupCigarettes, isDeletableEntry } from '../utils/entries'
import { getTagMeta } from '../services/behaviorTags'
import { formatDuration, workoutTypeLabel, shortFoodName } from '../utils/format'
import { buildDailyJournal, dayHeading } from '../services/dailyJournal'
import { mealKcal } from '../services/mealEditing'
import { useNutritionTable } from '../data/nutritionTable'
import { SOURCE_LABELS, gutLevelLabel } from '../services/today'
import { INITIAL_DAYS, MORE_DAYS, loadJournalEntries } from '../services/journalEntries'

/**
 * « Vos derniers jours » : le journal par jour (résumé chiffré, saisies et événements avec leur heure), déplacé de
 * l'accueil vers l'onglet Journal (jalon 2c-2). Modifier / Refaire / Supprimer restent sur place.
 */

const TYPE_LABELS = {
  food: 'Repas',
  activity: 'Activité',
  weight: 'Poids',
  sleep: 'Sommeil',
  wellbeing: 'Bien-être',
  cigarette: 'Cigarette',
  gut: 'Ventre',
  steps: 'Pas',
  heart_rate: 'Fréquence cardiaque',
  calories: 'Calories',
  body_composition: 'Pesée',
  height: 'Taille',
  respiratory_rate: 'Respiration',
  body_temperature: 'Température',
  blood_pressure: 'Tension',
  blood_glucose: 'Glycémie',
  weather: 'Météo',
  phone_usage: 'Téléphone',
  phone_apps: 'Temps par app',
  context: 'Fuseau horaire',
}

function entryTitle(e) {
  return TYPE_LABELS[e.type] || e.type
}

/** Libellé utilisé dans « Supprimer … ? ». */
const DELETE_LABELS = {
  food: 'ce repas',
  wellbeing: 'cette note de bien-être',
  cigarette: 'cette cigarette',
  gut: 'cette note du ventre',
}

/** Types qui ont un affichage dédié ; les autres montrent leurs données brutes. */
const ITEM_TYPES_WITH_RENDERER = ['food', 'wellbeing', 'cigarette', 'gut', 'activity', 'weight', 'height', 'body_composition']

function frNumber(v) {
  return v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

/** Principales mesures d'une composition corporelle Withings, en français. */
function bodyCompositionParts(p) {
  const parts = []
  if (typeof p.valueKg === 'number') parts.push(`${frNumber(p.valueKg)} kg`)
  if (typeof p.fatRatioPct === 'number') parts.push(`Masse grasse ${frNumber(p.fatRatioPct)} %`)
  if (typeof p.muscleMassKg === 'number') parts.push(`Muscles ${frNumber(p.muscleMassKg)} kg`)
  if (typeof p.hydrationPct === 'number') parts.push(`Hydratation ${frNumber(p.hydrationPct)} %`)
  return parts
}

function timeOf(at) {
  return new Date(at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** Tags affichés d'une note ; « Écran tard » déclaré est inutile un jour où le téléphone a mesuré l'écran. */
function visibleTags(e, measuredScreen) {
  return Array.isArray(e.payload?.tags)
    ? e.payload.tags.map(getTagMeta).filter((t) => t && !(measuredScreen && t.auto === 'phone_usage'))
    : []
}

/** Contenu d'une saisie ou d'un événement du jour (repas, bien-être, pesée…). */
function EntryBody({ e, measuredScreen = false }) {
  const shownTags = visibleTags(e, measuredScreen)
  const count = typeof e.payload?.count === 'number' ? e.payload.count : 1
  return (
    <div className="entry-card-body">
      {e.type === 'food' && e.payload?.dish && <p className="entry-dish">{e.payload.dish}</p>}
      {e.type === 'food' && e.payload?.items?.length > 0 && (
        <ul className="entry-items inline-list">
          {e.payload.items.slice(0, 5).map((item, i) => (
            <li key={i} title={item.ingredient}>{shortFoodName(item.ingredient)}{'\u00a0'}: {item.quantity}</li>
          ))}
          {e.payload.items.length > 5 && (
            <li className="entry-more">+{e.payload.items.length - 5} autres</li>
          )}
        </ul>
      )}
      {e.type === 'wellbeing' && shownTags.length > 0 && (
        <p className="entry-wellbeing-tags">
          {shownTags
            .map((t) => `${t.emoji} ${t.label}`)
            .join(' · ')}
        </p>
      )}
      {e.type === 'cigarette' && count > 1 && (
        <p className="entry-wellbeing-score"><strong>{count}</strong> cigarettes</p>
      )}
      {e.type === 'weight' && typeof e.payload?.valueKg === 'number' && (
        <p className="entry-wellbeing-score">
          <strong>{frNumber(e.payload.valueKg)}</strong> kg
        </p>
      )}
      {e.type === 'height' && typeof e.payload?.valueCm === 'number' && (
        <p className="entry-wellbeing-score">
          <strong>{frNumber(e.payload.valueCm)}</strong> cm
        </p>
      )}
      {e.type === 'body_composition' && e.payload && (
        <p className="entry-wellbeing-score">
          {bodyCompositionParts(e.payload).join(' · ') || 'Mesure enregistrée'}
        </p>
      )}
      {e.type === 'activity' && e.payload?.workoutType && (
        <p className="entry-wellbeing-score">
          {workoutTypeLabel(e.payload.workoutType)}
          {e.payload.durationSeconds && ` — ${formatDuration(e.payload.durationSeconds / 60)}`}
          {e.payload.totalCalories && ` — ${Math.round(e.payload.totalCalories)} kcal`}
        </p>
      )}
      {!ITEM_TYPES_WITH_RENDERER.includes(e.type) && (
        <pre className="entry-payload">{JSON.stringify(e.payload, null, 0)}</pre>
      )}
    </div>
  )
}

/** Résumé chiffré d'une journée : seules les valeurs disponibles sont affichées. */
function summaryChips(s) {
  const chips = []
  const fr = (v) => v.toLocaleString('fr-FR')
  if (s.sleepMinutes != null) chips.push([s.sleepEstimated ? 'Sommeil (estimé)' : 'Sommeil', formatDuration(s.sleepMinutes)])
  if (s.steps != null) chips.push(['Pas', fr(Math.round(s.steps))])
  if (s.restingHr != null) chips.push(['FC au repos', `${Math.round(s.restingHr)} bpm`])
  if (s.hrv != null) chips.push(['VFC', `${Math.round(s.hrv)} ms`])
  if (s.hrvDay != null) chips.push(['VFC jour', `${s.hrvDay} ms`])
  if (s.spo2 != null) chips.push(['SpO₂', `${frNumber(s.spo2)} %`])
  if (s.respiratoryRate != null) chips.push(['Respiration', `${frNumber(s.respiratoryRate)} /min`])
  if (s.temperatureC != null) chips.push(['Température', `${frNumber(s.temperatureC)} °C`])
  if (s.skinTempC != null) chips.push(['Temp. peau', `${frNumber(s.skinTempC)} °C`])
  if (s.bloodPressure) chips.push(['Tension', `${s.bloodPressure.systolic}/${s.bloodPressure.diastolic} mmHg`])
  if (s.glucoseMgDl != null) {
    chips.push(['Glycémie', `${(s.glucoseMgDl / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g/L`])
  }
  if (s.heartRate) {
    const { min, max } = s.heartRate
    chips.push(['FC', min === max ? `${Math.round(min)} bpm` : `${Math.round(min)} à ${Math.round(max)} bpm`])
  }
  if (s.burnedKcal != null) chips.push(['Dépense', `${fr(s.burnedKcal)} kcal`])
  // Une seule note, ou des cigarettes : déjà lisibles dans les lignes du jour, juste en dessous
  if (s.wellbeing?.count > 1) chips.push(['Bien-être', `${frNumber(s.wellbeing.average)} / 5`])
  if (s.meals > 0) {
    chips.push(['Repas', s.mealKcal > 0 ? `${s.meals} · ≈ ${fr(s.mealKcal)} kcal` : String(s.meals)])
  }
  if (s.screenMinutes != null) chips.push(['Écran', formatScreenMinutes(s.screenMinutes)])
  if (s.socialMinutes > 0) chips.push(['Réseaux sociaux', formatScreenMinutes(s.socialMinutes)])
  if (s.weather) {
    const w = weatherSummaryParts(s.weather)
    if (w.length) chips.push(['Météo', w[0]])
  }
  return chips
}

function CigaretteGroupRow({ group }) {
  const times = group.entries
    .map((e) => {
      const count = typeof e.payload?.count === 'number' ? e.payload.count : 1
      return count > 1 ? `${timeOf(e.at)} ×${count}` : timeOf(e.at)
    })
    .join(' · ')
  const lastDeletable = [...group.entries].reverse().find(isDeletableEntry)
  return (
    <li className="entry-card" data-type="cigarette">
      <div className="entry-card-header">
        <span className="entry-type">Cigarettes</span>
        <span className="entry-kcal">{group.entries.reduce((n, e) => n + (e.payload?.count > 0 ? e.payload.count : 1), 0)}</span>
      </div>
      <div className="entry-card-row">
        <div className="entry-card-body">
          <p className="entry-cigarette-times">{times}</p>
        </div>
        {lastDeletable && (
          <DeleteEntryButton
            entryId={lastDeletable.id}
            label={`la dernière cigarette (${timeOf(lastDeletable.at)})`}
          />
        )}
      </div>
    </li>
  )
}

/** Une cigarette seule, ou une note sans tag (note dans l'en-tête), n'a rien à afficher sous son titre. */
function hasBody(e, measuredScreen) {
  if (e.type === 'wellbeing') return visibleTags(e, measuredScreen).length > 0
  if (e.type === 'gut') return false
  return !(e.type === 'cigarette' && !(e.payload?.count > 1))
}

function DeleteButton({ e }) {
  return <DeleteEntryButton entryId={e.id} label={DELETE_LABELS[e.type] || 'cette entrée'} />
}

/** « Modifier » une note de bien-être saisie dans l'app (même style discret que « Supprimer »). */
function EditButton({ e, onEdit }) {
  if (!onEdit || e.type !== 'wellbeing' || !isDeletableEntry(e)) return null
  return (
    <div className="entry-edit">
      <button
        type="button"
        className="entry-delete-btn"
        onClick={() => onEdit(e)}
        aria-label={`Modifier ${DELETE_LABELS.wellbeing}`}
      >
        Modifier
      </button>
    </div>
  )
}

/** Repas : « Refaire » (page Repas pré-remplie) et « Modifier » sur place, comme sur la page Repas. */
function MealButtons({ e, onEditMeal, onRedoMeal }) {
  const hasItems = e.payload?.items?.length > 0
  return (
    <>
      {hasItems && (
        <div className="entry-edit">
          <button
            type="button"
            className="entry-delete-btn"
            onClick={() => onRedoMeal({ dish: e.payload.dish, items: e.payload.items })}
            aria-label="Refaire ce repas"
          >
            Refaire
          </button>
        </div>
      )}
      {hasItems && isDeletableEntry(e) && (
        <div className="entry-edit">
          <button
            type="button"
            className="entry-delete-btn"
            onClick={() => onEditMeal(e.id)}
            aria-label="Modifier ce repas"
          >
            Modifier
          </button>
        </div>
      )}
    </>
  )
}

function DayCard({ day, onEdit, editingMealId, onEditMeal, onRedoMeal }) {
  const { title, date } = dayHeading(day.dateKey)
  const chips = summaryChips(day.summary)
  const measuredScreen = day.summary?.screenMinutes != null
  return (
    <li className="day-card">
      <h4 className="day-card-title">
        {title} <span className="day-card-date">{date}</span>
      </h4>
      {chips.length > 0 && (
        <dl className="day-summary">
          {chips.map(([label, value]) => (
            <div key={label} className="day-summary-item">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {day.items.length > 0 && (
        <ul className="entries-list">
          {groupCigarettes(day.items).map((e) => e.type === 'cigarette_group' ? (
            <CigaretteGroupRow key={e.id} group={e} />
          ) : (
            <li key={e.id} className="entry-card" data-type={e.type}>
              <div className="entry-card-header">
                <time className="entry-at" dateTime={e.at}>{timeOf(e.at)}</time>
                <span className="entry-type">{entryTitle(e)}</span>
                {e.type === 'food' && mealKcal(e.payload?.items) > 0 && (
                  <span className="entry-kcal">≈ {mealKcal(e.payload.items).toLocaleString('fr-FR')} kcal</span>
                )}
                {e.type === 'wellbeing' && typeof e.payload?.score === 'number' && (
                  <span className="entry-kcal entry-score"><strong>{e.payload.score}</strong> / 5</span>
                )}
                {e.type === 'gut' && gutLevelLabel(e.payload?.level) && (
                  <span className="entry-kcal entry-score">{gutLevelLabel(e.payload.level)}</span>
                )}
                {!isDeletableEntry(e) && (
                  <span className="entry-source">{SOURCE_LABELS[e.source] || e.source}</span>
                )}
                {!hasBody(e, measuredScreen) && <EditButton e={e} onEdit={onEdit} />}
                {isDeletableEntry(e) && !hasBody(e, measuredScreen) && <DeleteButton e={e} />}
              </div>
              {e.type === 'food' && editingMealId === e.id ? (
                <SavedMealEditor entry={e} onCancel={() => onEditMeal(null)} onSaved={() => onEditMeal(null)} />
              ) : hasBody(e, measuredScreen) && (
                <div className={`entry-card-row${e.type === 'food' && e.payload?.items?.length ? ' entry-card-row-stacked' : ''}`}>
                  <EntryBody e={e} measuredScreen={measuredScreen} />
                  <EditButton e={e} onEdit={onEdit} />
                  {e.type === 'food' && <MealButtons e={e} onEditMeal={onEditMeal} onRedoMeal={onRedoMeal} />}
                  {isDeletableEntry(e) && <DeleteButton e={e} />}
                </div>
              )}
            </li>
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
  // kcal des repas : table Ciqual chargée à la demande, journal recalculé à son arrivée
  const nutritionTable = useNutritionTable()
  const [hiddenKey, setHiddenKey] = useState(null)
  const days = useMemo(
    () => buildDailyJournal(entries).filter((d) => d.dateKey !== hiddenKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, hiddenKey, nutritionTable],
  )

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
      <p className="page-intro">Chaque jour, ce que vos sources ont mesuré et ce que vous avez noté.</p>
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
        <p className="empty-hint">
          Aucune donnée pour l'instant. Notez votre ventre depuis <Link to="/">Aujourd’hui</Link> ou{' '}
          <Link to="/food">enregistrez un repas</Link> pour commencer.
        </p>
      ) : (
        <>
          <ul className="day-list">
            {days.slice(0, visibleDays).map((day) => (
              <DayCard
                key={day.dateKey}
                day={day}
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
