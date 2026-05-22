import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listEntriesForAnalysis } from '../storage/localHealthStorage'
import { getBodyProfile, getLatestBodyComposition, computeBmi } from '../services/bodyProfile'
import { compareWeeklyIntake } from '../services/nutritionIntakeCompare'
import { computeDailyEnergyKcal } from '../services/nutrientReferenceIntakes'
import './Nutrition.css'

function NutrientBar({ row }) {
  const barClass =
    row.status === 'ok'
      ? 'nutrition-bar-ok'
      : row.status === 'over'
        ? 'nutrition-bar-over'
        : row.status === 'partial'
          ? 'nutrition-bar-partial'
          : 'nutrition-bar-low'

  return (
    <div className="nutrition-bar-row">
      <span className="nutrition-bar-label">{row.label}</span>
      <div className="nutrition-bar-wrap">
        <div
          className={`nutrition-bar-fill ${barClass}`}
          style={{ width: `${row.pct}%` }}
          role="progressbar"
          aria-valuenow={row.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${row.label} : ${row.pct}%`}
        />
      </div>
      <span className="nutrition-bar-value">
        {row.actual} / {row.weeklyTarget} {row.unit}
      </span>
    </div>
  )
}

const BODY_LABELS = {
  fatRatioPct: 'Masse grasse',
  fatMassKg: 'Graisse (kg)',
  muscleMassKg: 'Masse musculaire',
  boneMassKg: 'Masse osseuse',
  hydrationPct: 'Hydratation',
  bmrKcal: 'Métabolisme basal',
  visceralFatIndex: 'Graisse viscérale',
  vascularAgeYears: 'Âge vasculaire',
  standingHrBpm: 'FC debout',
  pwvMps: 'Vitesse d’onde de pouls',
}

function BodyCompositionCard({ payload }) {
  if (!payload) return null
  const items = Object.entries(BODY_LABELS)
    .filter(([key]) => payload[key] != null)
    .map(([key, label]) => ({ key, label, value: payload[key] }))

  if (items.length === 0) return null

  return (
    <div>
      <h3 className="nutrition-section-title">Dernière composition corporelle</h3>
      <div className="nutrition-body-grid">
        {items.map(({ key, label, value }) => (
          <div key={key} className="nutrition-body-item">
            <span>{label}</span>
            <strong>
              {value}
              {key.includes('Pct') ? ' %' : key.includes('Kcal') ? ' kcal' : key.includes('Years') ? ' ans' : key.includes('Bpm') ? ' bpm' : key.includes('Mps') ? ' m/s' : key.includes('Kg') ? ' kg' : ''}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Nutrition() {
  const [entries, setEntries] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listEntriesForAnalysis()
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
    return compareWeeklyIntake(entries, profile)
  }, [entries, profile])

  const bodyComp = useMemo(() => getLatestBodyComposition(entries), [entries])
  const bmi = profile ? computeBmi(profile.weightKg, profile.heightCm) : null
  const dailyKcal = profile ? computeDailyEnergyKcal(profile) : null

  if (loading) {
    return (
      <section className="food-page nutrition-page">
        <h2 className="page-title">Nutrition</h2>
        <p>Chargement…</p>
      </section>
    )
  }

  return (
    <section className="food-page nutrition-page">
      <h2 className="page-title">Nutrition</h2>
      <p className="nutrition-intro">
        Apports de la <strong>semaine en cours</strong> par rapport aux recommandations officielles
        (ANSES), personnalisées selon votre poids et votre taille.
      </p>

      <div className="nutrition-profile-card">
        <div>
          <strong>Poids :</strong> {profile.weightKg} kg
          {profile.weightAt && (
            <span className="nutrition-profile-hint">
              {' '}
              ({new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(profile.weightAt))})
            </span>
          )}
        </div>
        <div>
          <strong>Taille :</strong> {profile.heightCm} cm
        </div>
        {bmi != null && <div><strong>IMC :</strong> {bmi}</div>}
        {dailyKcal != null && <div><strong>Énergie recommandée :</strong> ~{dailyKcal} kcal/jour</div>}
        {profile.source === 'default' && (
          <p className="nutrition-profile-hint">
            Activez <Link to="/connectors">Health Connect</Link> (Withings doit y être connecté) pour
            personnaliser les objectifs avec votre poids et votre taille.
          </p>
        )}
      </div>

      {comparison && comparison.mealCount === 0 ? (
        <div className="nutrition-empty">
          <p>Aucun repas enregistré cette semaine.</p>
          <p>
            <Link to="/food" className="btn">Ajouter un repas</Link>
          </p>
        </div>
      ) : comparison ? (
        <>
          <p className="nutrition-intro">
            Période : {comparison.weekLabel} · {comparison.mealCount} repas · objectifs sur{' '}
            {comparison.elapsedDays} jour{comparison.elapsedDays > 1 ? 's' : ''}
          </p>
          <h3 className="nutrition-section-title">Vitamines & minéraux</h3>
          {comparison.rows.map((row) => (
            <NutrientBar key={row.key} row={row} />
          ))}
        </>
      ) : null}

      <BodyCompositionCard payload={bodyComp} />
    </section>
  )
}
