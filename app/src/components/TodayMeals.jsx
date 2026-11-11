/**
 * « Mes repas du jour » (AUJ-5, revue design du 07/11) : la liste des repas d'aujourd'hui (heure, plat, kcal
 * estimées), chacun ouvrant Journal › Repas ; sans repas, « Aucun repas aujourd'hui » et un bouton qui ouvre
 * directement l'appareil photo (même geste que « Repas » du bandeau). Couleur du thème digestion et nutrition (pêche).
 */
import { Link } from 'react-router-dom'
import { localDateKey } from '../services/analysisEngine'
import { mealKcal, mealTitle, mealUncounted } from '../services/mealEditing'
import { appLocale } from '../i18n/locale.js'
import MealPhotoButton from './MealPhotoButton'
import LineIcon from './LineIcon'
import StripPlus from './StripPlus'
import './TodayMeals.css'
import { monoDigits } from '../utils/monoDigits'

/** kcal d'un repas ; « ≥ » quand un aliment n'est pas compté (POLISH-SIM-48). */
function MealKcal({ kcal, partial }) {
  const n = kcal.toLocaleString(appLocale())
  return (
    <span className="today-meal-kcal" aria-label={partial ? `au moins ${n} kcal` : undefined}>
      {partial ? '≥' : '≈'}&nbsp;{monoDigits(n)}&nbsp;kcal
    </span>
  )
}

const hhmm = (iso) => new Date(iso).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })

/**
 * @param {{ entries: object[], now?: Date }} props
 */
export default function TodayMeals({ entries, now }) {
  const today = localDateKey((now || new Date()).toISOString())
  const meals = (entries || [])
    .filter((e) => e?.type === 'food' && e.at && localDateKey(e.at) === today)
    .sort((a, b) => (a.at < b.at ? -1 : 1))
  return (
    <section className="today-card today-meals" data-tone="peach" aria-labelledby="today-meals-title">
      <h2 id="today-meals-title" className="today-meals-title">Mes repas du jour</h2>
      {meals.length ? (
        <ul className="today-meals-list">
          {meals.map((e) => {
            const kcal = mealKcal(e.payload?.items)
            return (
              <li key={e.id ?? e.at}>
                <Link to="/food" className="today-meal">
                  <span className="today-meal-time mono">{hhmm(e.at)}</span>
                  <span className="today-meal-name">{mealTitle(e)}</span>
                  {kcal > 0 && <MealKcal kcal={kcal} partial={mealUncounted(e.payload.items).length > 0} />}
                  <LineIcon name="chevron" size={18} className="today-meal-chevron" />
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
      {meals.length ? <StripPlus label="Ajouter un repas" /> : (
        <>
          <p className="today-meals-empty">Aucun repas aujourd’hui</p>
          <MealPhotoButton className="today-meals-add">
            <LineIcon name="camera" size={20} />
            <span>Photographier un repas</span>
          </MealPhotoButton>
        </>
      )}
    </section>
  )
}
