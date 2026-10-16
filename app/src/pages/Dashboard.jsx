import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listEntries } from '../storage/localHealthStorage'
import { weatherSummaryParts } from '../services/weather'
import { formatScreenMinutes } from '../services/phoneUsage'
import WellbeingCharts from '../components/WellbeingCharts'
import WellbeingPrompt from '../components/WellbeingPrompt'
import CigaretteQuickAdd from '../components/CigaretteQuickAdd'
import { shouldShowCigaretteCounter } from '../settings/cigaretteCounter'
import FormeSection from '../components/FormeSection'
import DeleteEntryButton from '../components/DeleteEntryButton'
import SavedMealEditor from '../components/SavedMealEditor'
import { groupCigarettes, isDeletableEntry } from '../utils/entries'
import { getTagMeta } from '../services/behaviorTags'
import { formatDuration, workoutTypeLabel, shortFoodName } from '../utils/format'
import { buildDailyJournal, dayHeading } from '../services/dailyJournal'
import { mealKcal } from '../services/mealEditing'
import { useNutritionTable } from '../data/nutritionTable'

const SOURCE_LABELS = {
  app_food: 'Alimentation (app)',
  app_wellbeing: 'Bien-être (app)',
  app_cigarette: 'Tabac (app)',
  samsung_watch: 'Montre Samsung',
  health_connect: 'Health Connect',
  huawei_watch: 'Montre Huawei',
  ble: 'Capteur Bluetooth',
  withings: 'Withings Body Scan',
  scale: 'Balance connectée',
}

const TYPE_LABELS = {
  food: 'Repas',
  activity: 'Activité',
  weight: 'Poids',
  sleep: 'Sommeil',
  wellbeing: 'Bien-être',
  cigarette: 'Cigarette',
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
}

function entryTitle(e) {
  return TYPE_LABELS[e.type] || e.type
}

/** Libellé utilisé dans « Supprimer … ? ». */
const DELETE_LABELS = {
  food: 'ce repas',
  wellbeing: 'cette note de bien-être',
  cigarette: 'cette cigarette',
}

/** Types qui ont un affichage dédié ; les autres montrent leurs données brutes. */
const ITEM_TYPES_WITH_RENDERER = ['food', 'wellbeing', 'cigarette', 'activity', 'weight', 'height', 'body_composition']

/** Jours affichés d'emblée, puis ajoutés à chaque « Voir les jours précédents ». */
const INITIAL_DAYS = 3
const MORE_DAYS = 4
/** Fenêtre chargée pour le journal (les mesures horaires de la montre rendent un « limit » fixe trop court). */
const JOURNAL_WINDOW_DAYS = 14

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

/** Contenu d'une saisie ou d'un événement du jour (repas, bien-être, pesée…). */
function EntryBody({ e, measuredScreen = false }) {
  // Tag déclaré « Écran tard » : inutile de le répéter un jour où le téléphone a mesuré l'écran (chiffre « Écran » du jour)
  const shownTags = Array.isArray(e.payload?.tags)
    ? e.payload.tags.map(getTagMeta).filter((t) => t && !(measuredScreen && t.auto === 'phone_usage'))
    : []
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
      {e.type === 'wellbeing' && typeof e.payload?.score === 'number' && (
        <p className="entry-wellbeing-score">
          Note : <strong>{e.payload.score}</strong> / 5
        </p>
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
  if (s.spo2 != null) chips.push(['SpO₂', `${frNumber(s.spo2)} %`])
  if (s.respiratoryRate != null) chips.push(['Respiration', `${frNumber(s.respiratoryRate)} /min`])
  if (s.temperatureC != null) chips.push(['Température', `${frNumber(s.temperatureC)} °C`])
  if (s.bloodPressure) chips.push(['Tension', `${s.bloodPressure.systolic}/${s.bloodPressure.diastolic} mmHg`])
  if (s.glucoseMgDl != null) {
    chips.push(['Glycémie', `${(s.glucoseMgDl / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g/L`])
  }
  if (s.heartRate) {
    const { min, max } = s.heartRate
    chips.push(['FC', min === max ? `${Math.round(min)} bpm` : `${Math.round(min)} à ${Math.round(max)} bpm`])
  }
  if (s.burnedKcal != null) chips.push(['Dépense', `${fr(s.burnedKcal)} kcal`])
  if (s.wellbeing) chips.push(['Bien-être', `${frNumber(s.wellbeing.average)} / 5`])
  if (s.meals > 0) {
    chips.push(['Repas', s.mealKcal > 0 ? `${s.meals} · ≈ ${fr(s.mealKcal)} kcal` : String(s.meals)])
  }
  if (s.cigarettes > 0) chips.push(['Cigarettes', String(s.cigarettes)])
  if (s.screenMinutes != null) chips.push(['Écran', formatScreenMinutes(s.screenMinutes)])
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

/** Une cigarette seule n'a rien à afficher sous son titre. */
function hasBody(e) {
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
                {!isDeletableEntry(e) && (
                  <span className="entry-source">{SOURCE_LABELS[e.source] || e.source}</span>
                )}
                {isDeletableEntry(e) && !hasBody(e) && <DeleteButton e={e} />}
              </div>
              {e.type === 'food' && editingMealId === e.id ? (
                <SavedMealEditor entry={e} onCancel={() => onEditMeal(null)} onSaved={() => onEditMeal(null)} />
              ) : hasBody(e) && (
                <div className={`entry-card-row${e.type === 'food' && e.payload?.items?.length ? ' entry-card-row-stacked' : ''}`}>
                  <EntryBody e={e} measuredScreen={day.summary?.screenMinutes != null} />
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

/** Entrées des derniers jours ; repli sur les 30 dernières si rien de récent (synchro ancienne). */
async function loadJournalEntries() {
  const now = new Date()
  const since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - JOURNAL_WINDOW_DAYS + 1)
  const recent = await listEntries({ since: since.toISOString(), limit: 5000 })
  if (recent.length > 0) return recent
  return listEntries({ limit: 30 })
}

export default function Dashboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wellbeingOpen, setWellbeingOpen] = useState(false)
  const [editingWellbeing, setEditingWellbeing] = useState(null)
  const [editingMealId, setEditingMealId] = useState(null)
  const navigate = useNavigate()
  const redoMeal = useCallback((meal) => navigate('/food', { state: { redoMeal: meal } }), [navigate])
  const [visibleDays, setVisibleDays] = useState(INITIAL_DAYS)
  // kcal des repas : table Ciqual chargée à la demande, journal recalculé à son arrivée
  const nutritionTable = useNutritionTable()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const days = useMemo(() => buildDailyJournal(entries), [entries, nutritionTable])

  const loadEntries = useCallback(async () => {
    try {
      const data = await loadJournalEntries()
      setEntries(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await loadJournalEntries()
        if (!cancelled) setEntries(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handler = () => loadEntries()
    window.addEventListener('health-entries-updated', handler)
    return () => window.removeEventListener('health-entries-updated', handler)
  }, [loadEntries])

  return (
    <section className="dashboard">
      <h2 className="page-title">Tableau de bord</h2>
      {/* Présentation utile au premier lancement seulement : avec des données, elle repoussait tout le contenu. */}
      {!loading && !error && days.length === 0 && (
        <p className="dashboard-intro">
          HealthTrack centralise vos données santé : <strong>alimentation</strong> (photo → ingrédients),{' '}
          <strong>montre ou bague connectée</strong> (pas, sommeil, cœur, respiration) via Health Connect,{' '}
          et bien plus. Configurez les sources dans{' '}
          <Link to="/connectors" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Connecteurs</Link>.
        </p>
      )}

      <div className="dashboard-actions">
        <button
          type="button"
          className="btn btn-secondary dashboard-wellbeing-btn"
          onClick={() => setWellbeingOpen(true)}
        >
          + Ajouter un bien-être
        </button>
        {!loading && shouldShowCigaretteCounter(entries) && <CigaretteQuickAdd />}
      </div>

      <WellbeingPrompt open={wellbeingOpen} onClose={() => setWellbeingOpen(false)} />
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

      {!loading && !error && (
        <>
          <FormeSection />
          <WellbeingCharts />
          <h3 className="section-title">Vos derniers jours</h3>
          {days.length === 0 ? (
            <p className="empty-hint">
              Aucune donnée pour l'instant. <Link to="/food">Enregistrez un repas</Link> pour commencer.
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
              {days.length > visibleDays && (
                <button
                  type="button"
                  className="btn btn-secondary day-more-btn"
                  onClick={() => setVisibleDays((n) => n + MORE_DAYS)}
                >
                  Voir les jours précédents
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}
