/**
 * « Vos saisies » d'un jour (refonte « Compagnon », étape 7a ; inventaire ETAPE-7-DONNEES.md § 3) : chaque saisie du
 * jour avec son heure et ses gestes (Modifier, Refaire, Supprimer derrière « … »), la ligne « Règles · 2e jour » et
 * les habitudes. Extrait du Journal jour par jour, qui sera supprimé (brief § 3.6) : le détail du jour de Tendances
 * reprend tout ce qui ne se faisait que dans le Journal. Rien n'est stocké ici : ce sont les entrées existantes.
 */
import { formatNote } from '../services/mood/wellbeingScale'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import WellbeingPrompt from './WellbeingPrompt'
import EntryActionsToggle from './EntryActionsToggle'
import DeleteEntryButton from './DeleteEntryButton'
import SavedMealEditor from './SavedMealEditor'
import { groupCigarettes, isDeletableEntry } from '../utils/entries'
import { getTagMeta } from '../services/behaviorTags'
import MealItemList from './MealItemList'
import { formatDuration, workoutTypeLabel, workoutDetailParts } from '../utils/format'
import { buildDailyJournal } from '../services/dailyJournal'
import { mealKcal } from '../services/mealEditing'
import { useNutritionTable } from '../data/nutritionTable'
import { SOURCE_LABELS, GUT_LEVELS, gutLevelLabel, isGutDayNote } from '../services/today'
import { updateEntry, listEntries } from '../storage/localHealthStorage'
import { stoolEntryLabel } from '../services/stool'
import { appLocale } from '../i18n/locale.js'
import LineIcon from './LineIcon'
import { useStackedChoices } from '../hooks/useStackedChoices'
import Ordinal from './Ordinal'
import { CYCLE_SOURCE, SYMPTOM_LABELS, cycleLineParts } from '../services/cycle'
import { readCycle } from '../services/cycleRead'
import PeriodSheet from './PeriodSheet'
import { HABIT_TYPE, habitAnswers } from '../services/habits'
import './TodayCards.css'

/** « Règles · 2e jour · flux moyen · Crampes » sous le titre du jour ; « … » si les règles ont été notées ici. */
export function CycleLine({ info, dateKey }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const parts = cycleLineParts(info)
  const symptoms = (info?.symptoms || []).map((s) => SYMPTOM_LABELS[s]).filter(Boolean)
  if (!parts && !symptoms.length) return null
  const entry = info?.entry?.source === CYCLE_SOURCE ? info.entry : null
  const bits = []
  if (parts) {
    bits.push(parts.label)
    if (parts.periodDay) bits.push(<><Ordinal n={parts.periodDay} /> jour</>)
    if (parts.flow) bits.push(parts.flow)
  }
  if (symptoms.length) bits.push(symptoms.join(', '))
  const label = 'ces règles'
  return (
    <>
      <div className="day-cycle">
        <LineIcon name="drop" size={14} />
        <span className="day-cycle-text">{bits.map((b, i) => <span key={i}>{i > 0 && ' · '}{b}</span>)}</span>
        {entry && !editing && (
          <span className="day-cycle-actions">
            {open && (
              <div className="entry-edit">
                <button type="button" className="entry-delete-btn" aria-label={`Modifier ${label}`}
                  onClick={() => { setOpen(false); setEditing(true) }}>
                  Modifier
                </button>
              </div>
            )}
            {open && <DeleteEntryButton entryId={entry.id} label={label} />}
            <EntryActionsToggle open={open} label={label} onToggle={() => setOpen((o) => !o)} />
          </span>
        )}
      </div>
      {editing && entry && (
        <div className="day-cycle-edit">
          <PeriodSheet dateKey={dateKey} onDone={() => setEditing(false)} />
        </div>
      )}
    </>
  )
}

const TYPE_LABELS = {
  food: 'Repas',
  activity: 'Séance',
  weight: 'Poids',
  sleep: 'Sommeil',
  wellbeing: 'Bien-être',
  cigarette: 'Cigarette',
  gut: 'Digestion',
  stool: 'Selles',
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
  watch_stress: 'Stress (montre)',
}

function entryTitle(e) {
  if (isGutDayNote(e)) return 'Digestion, bilan du jour'
  if (e.type === HABIT_TYPE) return e.payload?.label || 'Habitude'
  return TYPE_LABELS[e.type] || e.type
}

/** Libellé utilisé dans « Supprimer … ? ». */
const DELETE_LABELS = {
  food: 'ce repas',
  wellbeing: 'cette note de bien-être',
  cigarette: 'cette cigarette',
  gut: 'cette note digestive',
  stool: 'cette note des selles',
  habit: 'cette réponse',
}

/** Types qui ont un affichage dédié ; les autres montrent leurs données brutes. */
const ITEM_TYPES_WITH_RENDERER = ['food', 'wellbeing', 'cigarette', 'gut', 'stool', 'activity', 'weight', 'height', 'body_composition', HABIT_TYPE]

function frNumber(v) {
  return v.toLocaleString(appLocale(), { maximumFractionDigits: 1 })
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
  return new Date(at).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })
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
        <MealItemList items={e.payload.items} max={5} moreLabel={(n) => `+${n} autres`} moreClassName="entry-more" />
      )}
      {e.type === 'wellbeing' && shownTags.length > 0 && (
        <p className="entry-wellbeing-tags">
          {shownTags
            .map((t) => t.label)
            .join(', ')}
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
          {bodyCompositionParts(e.payload).join(', ') || 'Mesure enregistrée'}
        </p>
      )}
      {e.type === 'activity' && e.payload?.workoutType && (
        <p className="entry-wellbeing-score">
          {workoutTypeLabel(e.payload.workoutType)}
          {e.payload.durationSeconds && `, ${formatDuration(e.payload.durationSeconds / 60)}`}
          {e.payload.totalCalories && `, ${Math.round(e.payload.totalCalories)} kcal`}
        </p>
      )}
      {e.type === 'activity' && workoutDetailParts(e.payload).length > 0 && (
        <p className="entry-workout-detail">
          <span>{workoutDetailParts(e.payload).join(', ')}</span>
          <HeartRateSpark curve={e.payload.heartRateCurve} />
        </p>
      )}
      {!ITEM_TYPES_WITH_RENDERER.includes(e.type) && (
        <pre className="entry-payload">{JSON.stringify(e.payload, null, 0)}</pre>
      )}
    </div>
  )
}

/** Courbe de FC d'une séance (une moyenne par minute), sans axes : la forme de l'effort d'un coup d'œil. */
export function HeartRateSpark({ curve }) {
  const values = (curve?.bpm || []).map((v, i) => [i, v]).filter(([, v]) => typeof v === 'number')
  if (values.length < 2) return null
  const min = Math.min(...values.map(([, v]) => v))
  const max = Math.max(...values.map(([, v]) => v))
  const last = curve.bpm.length - 1 || 1
  const points = values.map(([i, v]) => `${((i / last) * 100).toFixed(1)},${(22 - ((v - min) / (max - min || 1)) * 20).toFixed(1)}`).join(' ')
  return (
    <svg className="entry-workout-spark" viewBox="0 0 100 24" preserveAspectRatio="none" role="img" aria-label={`Fréquence cardiaque de ${min} à ${max} bpm`}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

export function CigaretteGroupRow({ group }) {
  const times = group.entries
    .map((e) => {
      const count = typeof e.payload?.count === 'number' ? e.payload.count : 1
      return count > 1 ? `${timeOf(e.at)} ×${count}` : timeOf(e.at)
    })
    .join(', ')
  const lastDeletable = [...group.entries].reverse().find(isDeletableEntry)
  const [open, setOpen] = useState(false)
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
        {lastDeletable && open && (
          <DeleteEntryButton
            entryId={lastDeletable.id}
            label={`la dernière cigarette (${timeOf(lastDeletable.at)})`}
          />
        )}
        {lastDeletable && <EntryActionsToggle open={open} label="ces cigarettes" onToggle={() => setOpen((o) => !o)} />}
      </div>
    </li>
  )
}

/** Une cigarette seule, ou une note sans tag (note dans l'en-tête), n'a rien à afficher sous son titre. */
function hasBody(e, measuredScreen) {
  if (e.type === 'wellbeing') return visibleTags(e, measuredScreen).length > 0
  if (e.type === 'gut' || e.type === 'stool' || e.type === HABIT_TYPE) return false
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

/** « Modifier » une note digestive saisie dans l'app : ouvre le choix du niveau sur place (POLISH-SIM-36b). */
function GutEditButton({ e, onEdit }) {
  if (e.type !== 'gut' || !isDeletableEntry(e)) return null
  return (
    <div className="entry-edit">
      <button type="button" className="entry-delete-btn" onClick={onEdit} aria-label={`Modifier ${DELETE_LABELS.gut}`}>
        Modifier
      </button>
    </div>
  )
}

/** Calme / Gêne / Douleur, le niveau actuel enfoncé ; le reste de la note (portée, heure) est gardé. */
function GutLevelPicker({ e, onDone }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [ref, layout] = useStackedChoices()
  const choose = async (level) => {
    if (level === e.payload?.level) return onDone()
    setSaving(true)
    setError(null)
    try {
      await updateEntry(e.id, { payload: { ...e.payload, level } })
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      onDone()
    } catch {
      setError('Modification impossible, réessayez.')
      setSaving(false)
    }
  }
  return (
    <div className="entry-gut-edit">
      <div ref={ref} className={layout === 'row' ? 'gut-choices' : `gut-choices gut-choices--${layout}`} role="group" aria-label="Niveau de la note digestive">
        {GUT_LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            className="gut-choice"
            aria-pressed={e.payload?.level === l.id}
            disabled={saving}
            onClick={() => choose(l.id)}
          >
            <span className="gut-choice-radio" aria-hidden="true" />
            <span className="choice-label">{l.label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="entry-delete-btn" onClick={onDone} disabled={saving}>Annuler</button>
      {error && <span className="entry-delete-error" role="alert">{error}</span>}
    </div>
  )
}

/** « Modifier » une habitude (oui ou non) d'un jour passé : ouvre le choix sur place (étape 7a). */
function HabitEditButton({ e, onEdit }) {
  if (e.type !== HABIT_TYPE || !isDeletableEntry(e)) return null
  return (
    <div className="entry-edit">
      <button type="button" className="entry-delete-btn" onClick={onEdit} aria-label={`Modifier ${e.payload?.label || 'cette habitude'}`}>
        Modifier
      </button>
    </div>
  )
}

/** Oui / Non, la réponse actuelle enfoncée ; la même entrée est corrigée (une réponse par habitude et par jour). */
function HabitPicker({ e, onDone }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const choose = async (done) => {
    if (done === e.payload?.done) return onDone()
    setSaving(true)
    setError(null)
    try {
      await updateEntry(e.id, { payload: { ...e.payload, done } })
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      onDone()
    } catch {
      setError('Modification impossible, réessayez.')
      setSaving(false)
    }
  }
  return (
    <div className="entry-gut-edit">
      <div className="gut-choices" role="group" aria-label={e.payload?.label || 'Habitude'}>
        {[[true, 'Oui'], [false, 'Non']].map(([done, label]) => (
          <button key={label} type="button" className="gut-choice" aria-pressed={e.payload?.done === done} disabled={saving}
            onClick={() => choose(done)}>
            <span className="gut-choice-radio" aria-hidden="true" />
            <span className="choice-label">{label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="entry-delete-btn" onClick={onDone} disabled={saving}>Annuler</button>
      {error && <span className="entry-delete-error" role="alert">{error}</span>}
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

function hasActions(e) {
  return isDeletableEntry(e) || (e.type === 'food' && e.payload?.items?.length > 0)
}

export function EntryItem({ e, measuredScreen, onEdit, editingMealId, onEditMeal, onRedoMeal }) {
  const [open, setOpen] = useState(false)
  const label = DELETE_LABELS[e.type] || 'cette entrée'
  const editWellbeing = (entry) => { setOpen(false); onEdit(entry) }
  const editMeal = (id) => { setOpen(false); onEditMeal(id) }
  const [editingGut, setEditingGut] = useState(false)
  const editGut = () => { setOpen(false); setEditingGut(true) }
  const [editingHabit, setEditingHabit] = useState(false)
  const editHabit = () => { setOpen(false); setEditingHabit(true) }
  const toggle = hasActions(e) && <EntryActionsToggle open={open} label={label} onToggle={() => setOpen((o) => !o)} />
  const withBody = hasBody(e, measuredScreen)
  return (
    <li className="entry-card" data-type={e.type}>
      <div className="entry-card-header">
        {/* POLISH-SIM-125 : une habitude vaut pour la journée, son heure (midi) est un rangement, pas une saisie */}
        {e.type !== HABIT_TYPE && <time className="entry-at" dateTime={e.at}>{timeOf(e.at)}</time>}
        <span className="entry-type">{entryTitle(e)}</span>
        {e.type === 'food' && mealKcal(e.payload?.items) > 0 && (
          <span className="entry-kcal">≈ {mealKcal(e.payload.items).toLocaleString(appLocale())} kcal</span>
        )}
        {e.type === 'wellbeing' && typeof e.payload?.score === 'number' && (
          <span className="entry-kcal entry-score"><strong>{formatNote(e.payload.score)}</strong> / 5</span>
        )}
        {e.type === 'gut' && gutLevelLabel(e.payload?.level) && (
          <span className="entry-kcal entry-score">{gutLevelLabel(e.payload.level)}</span>
        )}
        {e.type === HABIT_TYPE && typeof e.payload?.done === 'boolean' && (
          <span className="entry-kcal entry-score">{e.payload.done ? 'Oui' : 'Non'}</span>
        )}
        {e.type === 'stool' && stoolEntryLabel(e) && (
          <span className="entry-kcal entry-score">{`${stoolEntryLabel(e)}${e.payload?.estimated ? ' (photo)' : ''}`}</span>
        )}
        {!isDeletableEntry(e) && (
          <span className="entry-source">{SOURCE_LABELS[e.source] || e.source}</span>
        )}
        {!withBody && open && <EditButton e={e} onEdit={editWellbeing} />}
        {!withBody && open && <GutEditButton e={e} onEdit={editGut} />}
        {!withBody && open && <HabitEditButton e={e} onEdit={editHabit} />}
        {!withBody && open && isDeletableEntry(e) && <DeleteButton e={e} />}
        {!withBody && !editingGut && !editingHabit && toggle}
      </div>
      {editingGut && <GutLevelPicker e={e} onDone={() => setEditingGut(false)} />}
      {editingHabit && <HabitPicker e={e} onDone={() => setEditingHabit(false)} />}
      {e.type === 'food' && editingMealId === e.id ? (
        <SavedMealEditor entry={e} onCancel={() => onEditMeal(null)} onSaved={() => onEditMeal(null)} />
      ) : withBody && (
        <div className={`entry-card-row${!open ? ' entry-card-row-closed' : e.type === 'food' && e.payload?.items?.length ? ' entry-card-row-stacked' : ''}`}>
          <EntryBody e={e} measuredScreen={measuredScreen} />
          {open && <EditButton e={e} onEdit={editWellbeing} />}
          {open && e.type === 'food' && <MealButtons e={e} onEditMeal={editMeal} onRedoMeal={onRedoMeal} />}
          {open && isDeletableEntry(e) && <DeleteButton e={e} />}
          {toggle}
        </div>
      )}
    </li>
  )
}


/** Début et fin du jour `dateKey` (AAAA-MM-JJ, heure locale), en ISO pour `listEntries`. */
function dayBounds(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return { since: new Date(y, m - 1, d).toISOString(), until: new Date(y, m - 1, d, 23, 59, 59, 999).toISOString() }
}

/**
 * Une réponse par habitude et par jour : si deux existent, seule la dernière saisie est montrée (comme Ma journée).
 * Les habitudes n'ont pas d'heure : elles viennent après les saisies horodatées (POLISH-SIM-125, comme « Déjà noté »).
 */
function latestHabitsOnly(items, dateKey) {
  const answers = habitAnswers(items, dateKey)
  const kept = items.filter((e) => e.type !== HABIT_TYPE || answers.get(e.payload?.habit) === e)
  return [...kept.filter((e) => e.type !== HABIT_TYPE), ...kept.filter((e) => e.type === HABIT_TYPE)]
}

/**
 * Les saisies du jour `dateKey`, à placer sous les mesures du détail du jour de Tendances. Rien si le jour n'a aucune
 * saisie ni règles : le détail du jour garde ses courbes seules. Une lecture en échec ne montre rien. `read` : la
 * lecture des entrées (`listEntries` ; remplacée dans les tests de Tendances).
 */
export default function DayEntries({ dateKey, read = listEntries }) {
  const [entries, setEntries] = useState(null)
  const [editingWellbeing, setEditingWellbeing] = useState(null)
  const [editingMealId, setEditingMealId] = useState(null)
  const navigate = useNavigate()
  const redoMeal = useCallback((meal) => navigate('/food', { state: { redoMeal: meal } }), [navigate])
  // kcal des repas : table Ciqual chargée à la demande, liste recalculée à son arrivée
  const nutritionTable = useNutritionTable()
  useEffect(() => {
    let alive = true
    const load = () => Promise.resolve().then(() => read({ ...dayBounds(dateKey), limit: 5000 }))
      .then((list) => { if (alive) setEntries(list) })
      .catch(() => { if (alive) setEntries([]) })
    setEntries(null)
    setEditingMealId(null)
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [dateKey, read])
  // Règles et jour du cycle, lus à part (le jour du cycle remonte aux dernières règles) ; rien sans « Mon cycle » ni donnée
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
  const day = useMemo(
    () => (entries ? buildDailyJournal(entries).find((d) => d.dateKey === dateKey) ?? null : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, dateKey, nutritionTable],
  )
  const cycle = useMemo(() => (cycleOf ? cycleOf([dateKey]).get(dateKey) ?? null : null), [cycleOf, dateKey])
  const items = day ? latestHabitsOnly(day.items, dateKey) : []
  const hasCycle = Boolean(cycleLineParts(cycle) || cycle?.symptoms?.length || cycle?.cycleDay)
  if (!items.length && !hasCycle) return null
  const measuredScreen = day?.summary?.screenMinutes != null
  return (
    <section className="tdd-block day-entries" aria-label="Vos saisies">
      <h3 className="tdd-title">Vos saisies</h3>
      {cycle?.cycleDay && !cycle.period && (
        <p className="tdd-text day-entries-cycle"><Ordinal n={cycle.cycleDay} /> jour du cycle</p>
      )}
      <CycleLine info={cycle} dateKey={dateKey} />
      {items.length > 0 && (
        <ul className="entries-list">
          {groupCigarettes(items).map((e) => e.type === 'cigarette_group' ? (
            <CigaretteGroupRow key={e.id} group={e} />
          ) : (
            <EntryItem
              key={e.id}
              e={e}
              measuredScreen={measuredScreen}
              onEdit={setEditingWellbeing}
              editingMealId={editingMealId}
              onEditMeal={setEditingMealId}
              onRedoMeal={redoMeal}
            />
          ))}
        </ul>
      )}
      <WellbeingPrompt open={editingWellbeing !== null} entry={editingWellbeing} onClose={() => setEditingWellbeing(null)} />
    </section>
  )
}
