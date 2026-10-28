import { useState, useRef, useEffect, useMemo } from 'react'
import JournalTabs from '../components/JournalTabs'
import { useLocation, useNavigate } from 'react-router-dom'
import '../Food.css'
import { listEntries, createEntry } from '../storage/localHealthStorage'
import AiCreditsHint from '../components/AiCreditsHint'
import { aiPrivacyHint, analyzeMealPhoto, canAnalyzeMeals, MISSING_KEY_MESSAGE, needsAiConsent, rememberAiConsent } from '../services/mealAi'
import useDisclosure from '../hooks/useDisclosure'
import { shortFoodName } from '../utils/format'
import { groupMealsByDay, dayHeading } from '../services/dailyJournal'
import MealEditor from '../components/MealEditor'
import DeleteEntryButton from '../components/DeleteEntryButton'
import { isDeletableEntry } from '../utils/entries'
import { itemForStorage, mealKcal } from '../services/mealEditing'
import SavedMealEditor from '../components/SavedMealEditor'
import NewMealForm from '../components/NewMealForm'
import { frequentMeals, mealLabel } from '../services/quickMeals'
import LineIcon from '../components/LineIcon'
import MealFodmapLine from '../components/MealFodmapLine'
import { gutCardMode } from '../settings/onboarding'
import { appLocale } from '../i18n/locale.js'

/** Jours de repas affichés d'emblée, puis ajoutés à chaque « Voir les jours précédents ». */
const INITIAL_DAYS = 5
const MORE_DAYS = 7

function timeOf(at) {
  return new Date(at).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })
}

export default function Food() {
  const [disclosure, askConsent] = useDisclosure()
  // FODMAP par sous-groupe sur les cartes repas : seulement quand le ventre fait partie de l'objectif (POL-4)
  const [showFodmap] = useState(() => gutCardMode() !== 'hide')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [items, setItems] = useState([])
  const [savedId, setSavedId] = useState(null)
  const [recentMeals, setRecentMeals] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [visibleDays, setVisibleDays] = useState(INITIAL_DAYS)
  // Saisie sans photo : { title, dish?, items } ; quickSaved = confirmation après enregistrement
  const [quickMeal, setQuickMeal] = useState(null)
  const [quickSaved, setQuickSaved] = useState(false)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const loadRecent = async () => {
    try {
      const data = await listEntries({ type: 'food', limit: 100 })
      setRecentMeals(data)
    } catch {
      // Liste indisponible : la page reste utilisable pour analyser une photo
    }
  }

  useEffect(() => {
    loadRecent()
  }, [])

  const habits = useMemo(() => frequentMeals(recentMeals), [recentMeals])
  const mealDays = useMemo(() => groupMealsByDay(recentMeals), [recentMeals])

  const startQuickMeal = (meal) => {
    setQuickSaved(false)
    setEditingId(null)
    // nonce : un nouveau « Refaire » remplace le formulaire ouvert, même pour un repas au même nom
    setQuickMeal({ title: 'Nouveau repas', items: [], ...meal, nonce: Date.now() })
  }

  const redo = (payload) => startQuickMeal({
    title: `Refaire : ${mealLabel(payload)}`,
    dish: payload?.dish,
    items: payload?.items,
  })

  // « Refaire » depuis le tableau de bord : le repas arrive dans l'état de navigation, consommé une seule fois
  const location = useLocation()
  const navigate = useNavigate()
  const redoFromNav = location.state?.redoMeal
  useEffect(() => {
    if (!redoFromNav) return
    redo(redoFromNav)
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redoFromNav])

  const handleFile = (f) => {
    if (!f?.type?.startsWith('image/')) return
    setError(null)
    setResult(null)
    setSavedId(null)
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(f)
  }

  const onInputChange = (e) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('dragover')
    const f = e.dataTransfer?.files?.[0]
    if (f) handleFile(f)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('dragover')
  }

  const onDragLeave = (e) => {
    e.currentTarget.classList.remove('dragover')
  }

  const analyze = async () => {
    if (!file) return
    if (!canAnalyzeMeals()) {
      setError(MISSING_KEY_MESSAGE)
      return
    }
    if (needsAiConsent()) {
      if (!(await askConsent('ai_meal'))) return
      rememberAiConsent()
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setSavedId(null)
    try {
      const data = await analyzeMealPhoto(file)
      setResult(data)
      setItems(data.items || [])
    } catch (err) {
      setError(err.message || "Erreur lors de l’analyse.")
    } finally {
      setLoading(false)
    }
  }

  const saveMeal = async () => {
    const toSave = items.filter((it) => it.ingredient)
    if (!toSave.length) return
    setSaving(true)
    setError(null)
    try {
      const id = await createEntry({
        type: 'food',
        source: 'app_food',
        payload: {
          items: toSave.map(itemForStorage),
          provider: result.provider,
          ...(result.model ? { model: result.model } : {}),
          ...(result.dish ? { dish: result.dish } : {}),
        },
      })
      setSavedId(id)
      loadRecent()
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
    } catch (err) {
      setError(err.message || "Erreur lors de l’enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setItems([])
    setSavedId(null)
    setError(null)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  return (
    <section className="food-page">
      {disclosure}
      <JournalTabs />
      <h2 className="page-title">Repas</h2>

      <div
        className="upload-zone"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {/* Hidden input wired to camera (rear camera hint) */}
        <input
          ref={cameraInputRef}
          id="camera-upload"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onInputChange}
          aria-label="Prendre une photo"
          className="hidden-file-input"
        />
        {/* Hidden input wired to gallery (no capture attribute) */}
        <input
          ref={galleryInputRef}
          id="gallery-upload"
          type="file"
          accept="image/*"
          onChange={onInputChange}
          aria-label="Choisir depuis la galerie"
          className="hidden-file-input"
        />

        <div className="upload-actions">
          <label htmlFor="camera-upload" className="upload-btn upload-btn--primary">
            <LineIcon name="camera" /> Photo du repas
          </label>
          <label htmlFor="gallery-upload" className="upload-btn">
            <LineIcon name="image" /> Galerie
          </label>
          {!quickMeal && (
            <button
              type="button"
              className="upload-btn quick-meal-btn"
              onClick={() => startQuickMeal()}
              aria-label="Décrire ou saisir sans photo"
            >
              <LineIcon name="pen" /> Décrire
            </button>
          )}
        </div>
      </div>

      {!quickMeal && habits.length > 0 && (
        <div className="meal-habits">
          <h3 className="section-title">Repas habituels</h3>
          <ul className="meal-habits-list">
            {habits.map((h) => (
              <li key={h.key}>
                <button
                  type="button"
                  className="meal-habit"
                  onClick={() => redo({ dish: h.dish, items: h.items })}
                  aria-label={`Refaire ${h.label}${h.count > 1 ? ` (${h.count} fois)` : ''}`}
                >
                  <span className="meal-habit-name">{h.label}</span>
                  <span className="meal-habit-meta">
                    {h.kcal > 0 ? `≈ ${h.kcal.toLocaleString(appLocale())} kcal` : `${h.items.length} ingr.`}
                    {h.count > 1 && ` · ${h.count} fois`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {quickMeal && (
        <NewMealForm
          key={quickMeal.nonce}
          title={quickMeal.title}
          dish={quickMeal.dish}
          initialItems={quickMeal.items}
          onCancel={() => setQuickMeal(null)}
          onSaved={() => {
            setQuickMeal(null)
            setQuickSaved(true)
            loadRecent()
          }}
        />
      )}

      {quickSaved && !quickMeal && <p className="saved-msg quick-saved" role="status">✓ Repas enregistré</p>}

      {preview && (
        <div className="preview-wrap">
          <img src={preview} alt="Aperçu" />
        </div>
      )}

      {preview && !result && (
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={reset}>
            Annuler
          </button>
          <button type="button" className="btn" onClick={analyze} disabled={loading}>
            {loading ? 'Analyse…' : 'Analyser les ingrédients'}
          </button>
        </div>
      )}

      {preview && !result && (
        <>
          <AiCreditsHint />
          <p className="hint gemini-privacy">{aiPrivacyHint('photo')}</p>
        </>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Analyse en cours…</p>
        </div>
      )}

      {error && <div className="error-msg" role="alert">{error}</div>}

      {result && !loading && (
        <section className="results" aria-labelledby="results-title">
          <h2 id="results-title">{result.dish || 'Ingrédients détectés'}</h2>
          <div className="provider-tag">
            Analyse IA · une estimation
            {(result.model || result.provider) && (
              <details className="provider-details">
                <summary>détails</summary>
                <span>Modèle : {result.model || result.provider}</span>
              </details>
            )}
          </div>
          {result.items?.length > 0 ? (
            !savedId && (
              <p className="results-hint">
                Vérifiez les quantités avant d’enregistrer : l’estimation sur photo peut se
                tromper de plusieurs dizaines de grammes.
              </p>
            )
          ) : (
            <p className="results-hint">
              Aucun ingrédient reconnu. Ajoutez-les ci-dessous ou essayez une autre photo.
            </p>
          )}
          <MealEditor items={items} onChange={setItems} disabled={Boolean(savedId) || saving} />
          {/* Avant d'enregistrer : les FODMAP du repas tel que corrigé (N4), comme sur la carte enregistrée. */}
          {showFodmap && <MealFodmapLine items={items} />}
          <div className="actions">
            {savedId ? (
              <p className="saved-msg">✓ Repas enregistré</p>
            ) : (
              <button
                type="button"
                className="btn"
                onClick={saveMeal}
                disabled={saving || items.length === 0}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer ce repas'}
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={reset} style={{ flex: 1 }}>
              Nouvelle photo
            </button>
          </div>
        </section>
      )}

      <h3 className="section-title">Derniers repas enregistrés</h3>
      {recentMeals.length === 0 ? (
        <p className="empty-hint">Aucun repas enregistré pour l’instant.</p>
      ) : (
        <>
          {mealDays.slice(0, visibleDays).map((day) => {
            const { title, date } = dayHeading(day.dateKey)
            return (
              <section key={day.dateKey} className="meal-day" aria-label={`${title} ${date}`}>
                <h4 className="meal-day-title">
                  <span>{title} <span className="meal-day-date">{date}</span></span>
                  {/* Un seul repas : sa carte donne déjà l'estimation, le titre ne la redit pas. */}
                  {day.meals.length > 1 && (
                    <span className="meal-day-total">
                      {day.meals.length} repas
                      {day.kcal > 0 && ` · ≈ ${day.kcal.toLocaleString(appLocale())} kcal`}
                    </span>
                  )}
                </h4>
                <ul className="meals-list">
                  {day.meals.map((e) => (
                    <li key={e.id} className="meal-card">
                      <div className="meal-head">
                        <time className="meal-at" dateTime={e.at}>{timeOf(e.at)}</time>
                        {mealKcal(e.payload?.items) > 0 && (
                          <span className="meal-kcal">≈ {mealKcal(e.payload.items).toLocaleString(appLocale())} kcal</span>
                        )}
                      </div>
                      {e.payload?.dish && <p className="meal-dish">{e.payload.dish}</p>}
                      {editingId === e.id ? (
                        <SavedMealEditor
                          entry={e}
                          onCancel={() => setEditingId(null)}
                          onSaved={() => {
                            setEditingId(null)
                            loadRecent()
                          }}
                        />
                      ) : (
                        <div className="entry-card-row">
                          <ul className="meal-items inline-list">
                            {e.payload?.items?.slice(0, 6).map((item, i) => (
                              <li key={i} title={item.ingredient}>{shortFoodName(item.ingredient)}{'\u00a0'}: {item.quantity}</li>
                            ))}
                            {e.payload?.items?.length > 6 && (
                              <li className="meal-more">+{e.payload.items.length - 6}</li>
                            )}
                          </ul>
                          {e.payload?.items?.length > 0 && (
                            <div className="entry-edit">
                              <button
                                type="button"
                                className="entry-delete-btn"
                                onClick={() => redo(e.payload)}
                                aria-label="Refaire ce repas"
                              >
                                Refaire
                              </button>
                            </div>
                          )}
                          {isDeletableEntry(e) && (
                            <div className="entry-edit">
                              <button
                                type="button"
                                className="entry-delete-btn"
                                onClick={() => setEditingId(e.id)}
                                aria-label="Modifier ce repas"
                              >
                                Modifier
                              </button>
                            </div>
                          )}
                          {isDeletableEntry(e) && (
                            <DeleteEntryButton
                              entryId={e.id}
                              label="ce repas"
                              onDeleted={(id) => setRecentMeals((meals) => meals.filter((m) => m.id !== id))}
                            />
                          )}
                        </div>
                      )}
                      {showFodmap && editingId !== e.id && <MealFodmapLine items={e.payload?.items} />}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
          {mealDays.length > visibleDays && (
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
    </section>
  )
}
