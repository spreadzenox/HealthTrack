import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { listEntries } from '../storage/localHealthStorage'
import WellbeingCharts from '../components/WellbeingCharts'
import WellbeingPrompt from '../components/WellbeingPrompt'
import CigaretteQuickAdd from '../components/CigaretteQuickAdd'
import BaselineCards from '../components/BaselineCards'
import HealthRadar from '../components/HealthRadar'
import DeleteEntryButton from '../components/DeleteEntryButton'
import { isDeletableEntry } from '../utils/entries'
import { getTagMeta } from '../services/behaviorTags'
import { formatDuration, workoutTypeLabel } from '../utils/format'
import { buildDailyJournal, dayHeading } from '../services/dailyJournal'
import { mealKcal } from '../services/mealEditing'

const SOURCE_LABELS = {
  app_food: 'Alimentation (app)',
  app_wellbeing: 'Bien-être (app)',
  app_cigarette: 'Tabac (app)',
  samsung_watch: 'Montre Samsung',
  health_connect: 'Health Connect',
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
  body_composition: 'Composition corporelle',
  height: 'Taille',
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
function EntryBody({ e }) {
  const count = typeof e.payload?.count === 'number' ? e.payload.count : 1
  return (
    <div className="entry-card-body">
      {e.type === 'food' && e.payload?.dish && <p className="entry-dish">{e.payload.dish}</p>}
      {e.type === 'food' && e.payload?.items?.length > 0 && (
        <ul className="entry-items">
          {e.payload.items.slice(0, 5).map((item, i) => (
            <li key={i}>{item.ingredient}{'\u00a0'}: {item.quantity}</li>
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
      {e.type === 'wellbeing' && Array.isArray(e.payload?.tags) && e.payload.tags.some(getTagMeta) && (
        <p className="entry-wellbeing-tags">
          {e.payload.tags
            .map(getTagMeta)
            .filter(Boolean)
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
  if (s.sleepMinutes != null) chips.push(['Sommeil', formatDuration(s.sleepMinutes)])
  if (s.steps != null) chips.push(['Pas', fr(Math.round(s.steps))])
  if (s.restingHr != null) chips.push(['FC au repos', `${Math.round(s.restingHr)} bpm`])
  if (s.hrv != null) chips.push(['VFC', `${Math.round(s.hrv)} ms`])
  if (s.spo2 != null) chips.push(['SpO₂', `${frNumber(s.spo2)} %`])
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
  return chips
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

function DayCard({ day, onEdit }) {
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
          {day.items.map((e) => (
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
              {hasBody(e) && (
                <div className="entry-card-row">
                  <EntryBody e={e} />
                  <EditButton e={e} onEdit={onEdit} />
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
  const [visibleDays, setVisibleDays] = useState(INITIAL_DAYS)
  const days = useMemo(() => buildDailyJournal(entries), [entries])

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
          <strong>montre Samsung Fit 3</strong> (pas, sommeil, fréquence cardiaque) via Health Connect,{' '}
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
        <CigaretteQuickAdd />
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
          <HealthRadar />
          <BaselineCards />
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
                  <DayCard key={day.dateKey} day={day} onEdit={setEditingWellbeing} />
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
