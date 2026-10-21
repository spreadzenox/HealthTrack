import { useState, useEffect, useMemo, useCallback } from 'react'
import JournalTabs from '../components/JournalTabs'
import { Link } from 'react-router-dom'
import { loadNutritionEntries } from '../services/nutritionData'
import { getBodyProfile, getLatestBodyComposition } from '../services/bodyProfile'
import { compareRecentIntake, formatNutrientAmount } from '../services/nutritionIntakeCompare'
import BodyProfileCard from '../components/BodyProfileCard'
import './Nutrition.css'

const STATUS_TEXT = {
  ok: 'atteint',
  partial: 'proche',
  low: 'bas',
  over: 'dépassé',
}

function NutrientBar({ row }) {
  const barClass = `nutrition-bar-${row.status}`
  const amount = `${formatNutrientAmount(row.perDay)} ${row.unit}/j`
  const reference = row.limit
    ? `max ${formatNutrientAmount(row.target)} ${row.unit}`
    : `obj. ${formatNutrientAmount(row.target)} ${row.unit}`

  return (
    <div className="nutrition-bar-row">
      <div className="nutrition-bar-head">
        <span className="nutrition-bar-label">{row.label}</span>
        <span className="nutrition-bar-value">
          <strong>{amount}</strong> · {reference}
        </span>
      </div>
      <div className="nutrition-bar-wrap">
        <div
          className={`nutrition-bar-fill ${barClass}`}
          style={{ width: `${row.barPct}%` }}
          role="progressbar"
          aria-valuenow={row.barPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${row.label} : ${row.pct} % ${row.limit ? 'de la limite' : 'de l’objectif'}, ${STATUS_TEXT[row.status]}`}
        />
      </div>
    </div>
  )
}

export default function Nutrition() {
  const [entries, setEntries] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // « Chargement… » seulement au premier affichage : une mise à jour (profil, repas) ne fait pas clignoter la page.
  const load = useCallback(async () => {
    try {
      const data = await loadNutritionEntries()
      setEntries(data)
      setProfile(await getBodyProfile(data))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const onUpdate = () => load()
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [load])

  const comparison = useMemo(() => {
    if (!profile) return null
    return compareRecentIntake(entries, profile)
  }, [entries, profile])

  const bodyComp = useMemo(() => getLatestBodyComposition(entries), [entries])

  if (loading) {
    return (
      <section className="food-page nutrition-page">
        <JournalTabs />
      <h2 className="page-title">Nutrition</h2>
        <p>Chargement…</p>
      </section>
    )
  }

  return (
    <section className="food-page nutrition-page">
      <JournalTabs />
      <h2 className="page-title">Nutrition</h2>

      <BodyProfileCard profile={profile} composition={bodyComp} onSaved={load} />

      {comparison && comparison.mealCount === 0 ? (
        <div className="nutrition-empty">
          <p>Aucun repas enregistré ces 7 derniers jours.</p>
          <p>
            <Link to="/food" className="btn">Ajouter un repas</Link>
          </p>
        </div>
      ) : comparison ? (
        <>
          <p className="nutrition-intro">
            Moyenne <strong>par jour saisi</strong>{'\u00a0· '}{comparison.periodLabel}{'\u00a0· '}
            {comparison.mealCount}{'\u00a0'}repas{'\u00a0· '}{comparison.loggedDays}{'\u00a0'}jour
            {comparison.loggedDays > 1 ? 's' : ''}
          </p>
          {/* Jours incomplets : le compte de repères atteints serait trompeur, l'avertissement le remplace */}
          {comparison.likelyIncomplete ? (
            <p className="nutrition-warning">
              ≈{'\u00a0'}{formatNutrientAmount(comparison.energyPerDay)} kcal/j pour
              ~{formatNutrientAmount(comparison.energyTarget)} visées : des repas manquent sans doute, apports sous-estimés.
            </p>
          ) : (
            <p className="nutrition-summary">
              <strong>{comparison.reachedCount}</strong> repère{comparison.reachedCount > 1 ? 's' : ''} atteint
              {comparison.reachedCount > 1 ? 's' : ''} sur {comparison.targetCount}
            </p>
          )}
          <div className="nutrition-legend" aria-hidden="true">
            <span><i className="nutrition-dot nutrition-bar-ok" /> atteint</span>
            <span><i className="nutrition-dot nutrition-bar-partial" /> proche (≥ 70 %)</span>
            <span><i className="nutrition-dot nutrition-bar-low" /> bas</span>
            <span><i className="nutrition-dot nutrition-bar-over" /> limite dépassée</span>
          </div>
          {comparison.groups.map((group) => (
            <div key={group.title}>
              <h3 className="nutrition-section-title">{group.title}</h3>
              {group.rows.map((row) => (
                <NutrientBar key={row.key} row={row} />
              ))}
            </div>
          ))}
          <p className="nutrition-footnote">
            Repères ANSES pour un adulte, ajustés à votre profil ; apports estimés (photos, portions).
            Ce n’est pas un diagnostic de carence : en cas de doute, parlez-en à un médecin ou à
            un·e diététicien·ne.
          </p>
        </>
      ) : null}
    </section>
  )
}
